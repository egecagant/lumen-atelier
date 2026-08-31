import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Iyzipay from 'iyzipay';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfigData from './firebase-applet-config.json' with { type: 'json' };

dotenv.config();

// Initialize Firebase Admin SDK using Application Default Credentials (ADC)
let cachedAdminDb: Firestore | null = null;

function getAdminDb(): Firestore {
  if (cachedAdminDb) return cachedAdminDb;

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfigData.projectId || 'river-nomad-t5fd2';
    initializeApp({ projectId });
    console.log('[Firebase Admin] Initialized with Application Default Credentials');
  }

  const app = getApp();
  const databaseId = firebaseConfigData.firestoreDatabaseId;
  cachedAdminDb = (databaseId && databaseId !== '(default)')
    ? getFirestore(app, databaseId)
    : getFirestore(app);

  return cachedAdminDb;
}

// Lazy/Configured iyzico client
function getIyzipayClient(): Iyzipay {
  const apiKey = process.env.IYZICO_API_KEY || 'sandbox-api-key';
  const secretKey = process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key';
  const uri = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

  return new Iyzipay({
    apiKey,
    secretKey,
    uri
  });
}

// In-memory store for pending checkout orders (token / conversationId -> order payload)
const pendingOrders = new Map<string, any>();

// Email validator and sanitizer
function sanitizeEmail(...candidates: any[]): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim().toLowerCase();
      if (emailRegex.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return 'musteri@lumenatelier.com';
}

// Phone validator and sanitizer (format: +905XXXXXXXXX)
function sanitizePhone(...candidates: any[]): string {
  for (const c of candidates) {
    if (typeof c === 'string') {
      const digits = c.replace(/\D/g, '');
      if (digits.length === 10) {
        return `+90${digits}`;
      } else if (digits.length === 11 && digits.startsWith('0')) {
        return `+9${digits}`;
      } else if (digits.length === 12 && digits.startsWith('90')) {
        return `+${digits}`;
      } else if (digits.length >= 7) {
        return `+${digits}`;
      }
    }
  }
  return '+905320000000';
}

// Clean objects recursively by removing any undefined properties for Firestore
function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanData);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) cleaned[k] = cleanData(v);
    }
    return cleaned;
  }
  return obj;
}

// Text sanitizer to prevent empty strings
function sanitizeText(val: any, fallback: string): string {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  return fallback;
}

function getBaseAppUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const host = req.get('host') || 'localhost:3000';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${proto}://${host}`;
}

// Helper for server-side verification of items and coupons against Firestore
async function verifyOrderSecurity(items: any[], discountCode?: string, paymentMethod?: string) {
  const db = getAdminDb();

  // 1. Validate and fetch products
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Sepetinizde ürün bulunamadı.');
  }

  const trustedItems: Array<{
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
  }> = [];

  for (const item of items) {
    const productId = item.productId || item.id || item.product?.id;
    if (!productId || typeof productId !== 'string') {
      throw new Error('Geçersiz ürün bilgisi tespit edildi.');
    }

    const quantity = Math.floor(Number(item.quantity) || 0);
    if (quantity <= 0) {
      throw new Error('Geçersiz ürün adedi tespit edildi.');
    }

    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new Error(`"${productId}" kimlikli ürün veritabanında bulunamadı veya satıştan kaldırılmış.`);
    }

    const productData = productDoc.data() || {};
    if (productData.stockStatus === 'out_of_stock' || productData.active === false) {
      throw new Error(`"${productData.name || productId}" ürünü stokta tükenmiş veya satışa kapalıdır.`);
    }

    const serverPrice = Number(productData.price);
    if (isNaN(serverPrice) || serverPrice <= 0) {
      throw new Error(`"${productData.name || productId}" ürünü için geçerli bir fiyat tanımlanmamış.`);
    }

    const productImage = (Array.isArray(productData.images) && productData.images[0])
      ? productData.images[0]
      : (typeof item.productImage === 'string' ? item.productImage : 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80');

    trustedItems.push({
      productId,
      productName: productData.name || 'LUMEN Atelier Tasarım Lamba',
      productImage,
      price: serverPrice,
      quantity
    });
  }

  // 2. Recompute subtotal
  const serverSubtotal = trustedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  if (serverSubtotal <= 0) {
    throw new Error('Hesaplanan sepet tutarı geçersiz.');
  }

  // 3. Re-fetch and verify coupon
  let serverDiscountAmount = 0;
  let verifiedAppliedCoupon: any = null;
  const rawCouponCode = (discountCode || '').trim().toUpperCase();

  if (rawCouponCode) {
    let couponData: any = null;
    let couponId: string = '';

    const directCouponDoc = await db.collection('coupons').doc(rawCouponCode).get();
    if (directCouponDoc.exists) {
      couponData = directCouponDoc.data();
      couponId = directCouponDoc.id;
    } else {
      const couponQuerySnap = await db.collection('coupons').where('code', '==', rawCouponCode).get();
      if (!couponQuerySnap.empty) {
        couponData = couponQuerySnap.docs[0].data();
        couponId = couponQuerySnap.docs[0].id;
      }
    }

    if (!couponData) {
      throw new Error(`"${rawCouponCode}" indirim kodu veritabanında bulunamadı veya geçerli değil.`);
    }

    if (couponData.active === false) {
      throw new Error(`"${rawCouponCode}" indirim kodu şu an aktif değil.`);
    }

    if (couponData.expiresAt && Number(couponData.expiresAt) < Date.now()) {
      throw new Error(`"${rawCouponCode}" indirim kodunun geçerlilik süresi sona ermiştir.`);
    }

    if (couponData.usageLimit && Number(couponData.usageCount || 0) >= Number(couponData.usageLimit)) {
      throw new Error(`"${rawCouponCode}" indirim kodunun kullanım limiti dolmuştur.`);
    }

    if (couponData.minOrderAmount && serverSubtotal < Number(couponData.minOrderAmount)) {
      throw new Error(`"${rawCouponCode}" indirim kodu en az ${Number(couponData.minOrderAmount).toLocaleString('tr-TR')} TL tutarındaki siparişlerde geçerlidir.`);
    }

    const discountType = couponData.discountType || 'percentage';
    const discountValue = Number(couponData.discountValue) || 0;
    let discount = 0;

    if (discountType === 'percentage') {
      discount = (serverSubtotal * discountValue) / 100;
      if (couponData.maxDiscountAmount && discount > Number(couponData.maxDiscountAmount)) {
        discount = Number(couponData.maxDiscountAmount);
      }
    } else {
      discount = Math.min(discountValue, serverSubtotal);
    }

    serverDiscountAmount = Math.round(discount);
    verifiedAppliedCoupon = {
      id: couponId,
      code: rawCouponCode,
      discountType,
      discountValue,
      description: couponData.description || ''
    };
  }

  // 4. Payment method discount (e.g. 5% extra discount for Havale / EFT)
  let paymentMethodDiscount = 0;
  if (paymentMethod === 'bank_transfer') {
    paymentMethodDiscount = Math.round(serverSubtotal * 0.05);
  }

  // 5. Recompute shipping
  // Rule: Free insured shipping over 5,000 TL, otherwise 250 TL
  const serverShipping = serverSubtotal >= 5000 || serverSubtotal === 0 ? 0 : 250;

  // 6. Compute final trusted total
  const serverTotal = Math.max(1, Math.round((serverSubtotal - serverDiscountAmount - paymentMethodDiscount + serverShipping) * 100) / 100);

  return {
    trustedItems,
    serverSubtotal,
    serverDiscountAmount,
    verifiedAppliedCoupon,
    paymentMethodDiscount,
    serverShipping,
    serverTotal
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares for API parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LUMEN Atelier Payment & Server Engine',
      iyzicoBaseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
      hasApiKey: !!process.env.IYZICO_API_KEY,
      time: new Date().toISOString()
    });
  });

  // 1. Direct Server-Side Order Creation (e.g. Bank Transfer / EFT)
  // Securely creates orders via Firebase Admin SDK, bypassing client creation permissions
  app.post('/api/orders/create', async (req, res) => {
    try {
      const {
        items = [],
        customerName = 'LUMEN Müşterisi',
        customerEmail = 'musteri@lumenatelier.com',
        customerPhone = '+905320000000',
        address = {},
        discountCode = '',
        paymentMethod = 'bank_transfer',
        userId = 'guest',
        notes = ''
      } = req.body;

      const {
        trustedItems,
        serverSubtotal,
        serverDiscountAmount,
        verifiedAppliedCoupon,
        paymentMethodDiscount,
        serverShipping,
        serverTotal
      } = await verifyOrderSecurity(items, discountCode, paymentMethod);

      const orderId = 'LUM-' + Math.floor(100000 + Math.random() * 900000);
      const cleanEmail = sanitizeEmail(customerEmail, address.email);
      const cleanPhone = sanitizePhone(customerPhone, address.phone);
      const buyerFullName = sanitizeText(customerName || address.fullName, 'Müşteri');
      const cleanAddressLine = sanitizeText(address.addressLine, 'Belirtilmedi');
      const cleanCity = sanitizeText(address.city, 'İstanbul');
      const cleanDistrict = sanitizeText(address.district, '');
      const cleanPostalCode = sanitizeText(address.postalCode, '34000');
      const cleanCountry = sanitizeText(address.country, 'Türkiye');

      const newOrder = {
        id: orderId,
        userId: userId || 'guest',
        customerEmail: cleanEmail,
        customerName: buyerFullName,
        customerPhone: cleanPhone,
        address: {
          ...address,
          fullName: buyerFullName,
          email: cleanEmail,
          phone: cleanPhone,
          addressLine: cleanAddressLine,
          city: cleanCity,
          district: cleanDistrict,
          postalCode: cleanPostalCode,
          country: cleanCountry
        },
        items: trustedItems,
        subtotal: serverSubtotal,
        discountCode: verifiedAppliedCoupon?.code || undefined,
        discountAmount: serverDiscountAmount > 0 ? serverDiscountAmount : undefined,
        appliedCoupon: verifiedAppliedCoupon || undefined,
        paymentMethodDiscount: paymentMethodDiscount > 0 ? paymentMethodDiscount : undefined,
        shipping: serverShipping,
        total: serverTotal,
        status: 'processing',
        paymentMethod,
        bankTransferReference: paymentMethod === 'bank_transfer' ? 'LUM-EFT-' + Math.floor(100000 + Math.random() * 900000) : undefined,
        notes: notes || address.orderNote || undefined,
        createdAt: Date.now()
      };

      const cleanPayload = cleanData(newOrder);
      const db = getAdminDb();
      await db.collection('orders').doc(orderId).set(cleanPayload);

      console.log(`[Orders] Order ${orderId} successfully created via Admin SDK with total ${serverTotal} TL`);

      return res.json({
        success: true,
        orderId,
        order: newOrder
      });
    } catch (err: any) {
      console.error('Order creation error:', err);
      return res.status(400).json({
        success: false,
        errorMessage: err.message || 'Sipariş oluşturulurken bir hata oluştu.'
      });
    }
  });

  // 2. Initialize iyzico Checkout Form with Server-Side Trusted Price & Coupon Verification
  app.post('/api/iyzico/initialize', async (req, res) => {
    try {
      const {
        items = [],
        customerName = 'LUMEN Müşterisi',
        customerEmail = 'musteri@lumenatelier.com',
        customerPhone = '+905320000000',
        address = {},
        discountCode = '',
        appliedCoupon = null,
        userId = 'guest',
        notes = ''
      } = req.body;

      const codeToVerify = discountCode || appliedCoupon?.code || '';
      const {
        trustedItems,
        serverSubtotal,
        serverDiscountAmount,
        verifiedAppliedCoupon,
        serverShipping,
        serverTotal
      } = await verifyOrderSecurity(items, codeToVerify, 'iyzico');

      const iyzipay = getIyzipayClient();
      const baseUrl = getBaseAppUrl(req);

      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderId = `LUM-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

      const cleanEmail = sanitizeEmail(customerEmail, address.email);
      const cleanPhone = sanitizePhone(customerPhone, address.phone);
      const buyerFullName = sanitizeText(customerName || address.fullName, 'Müşteri');
      const cleanAddressLine = sanitizeText(address.addressLine, 'Nişantaşı, Abdi İpekçi Cad. No: 12');
      const cleanCity = sanitizeText(address.city, 'İstanbul');
      const cleanDistrict = sanitizeText(address.district, 'Şişli');
      const cleanPostalCode = sanitizeText(address.postalCode, '34367');
      const cleanCountry = sanitizeText(address.country, 'Türkiye');

      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.socket.remoteAddress || 
                       '85.105.123.45';

      const nameParts = buyerFullName.split(' ').filter(Boolean);
      const buyerName = nameParts[0] || 'Müşteri';
      const buyerSurname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Çağan';

      const paidPriceStr = serverTotal.toFixed(2);
      const priceStr = Math.max(serverTotal, serverSubtotal + serverShipping).toFixed(2);

      // Prepare basket items from trusted items ensuring total matches exactly
      const expandedItems: Array<{ id: string; name: string; price: number }> = [];
      trustedItems.forEach((item, idx) => {
        for (let q = 0; q < item.quantity; q++) {
          expandedItems.push({
            id: `${item.productId}_${idx}_${q}`,
            name: item.productName.substring(0, 100),
            price: item.price
          });
        }
      });

      if (serverShipping > 0) {
        expandedItems.push({
          id: 'LUM_SHIPPING',
          name: 'Sigortalı Ahşap Sandık Kargo',
          price: serverShipping
        });
      }

      let runningSum = 0;
      const sumOriginal = expandedItems.reduce((acc, it) => acc + it.price, 0);
      const basketItems = expandedItems.map((it, i) => {
        let itemPrice: number;
        if (i === expandedItems.length - 1) {
          itemPrice = Math.max(0.01, +(serverTotal - runningSum).toFixed(2));
        } else {
          const ratio = sumOriginal > 0 ? it.price / sumOriginal : 1 / expandedItems.length;
          itemPrice = +(serverTotal * ratio).toFixed(2);
          if (itemPrice <= 0) itemPrice = 0.01;
          runningSum += itemPrice;
        }

        return {
          id: it.id,
          name: it.name,
          category1: 'Aydınlatma',
          category2: 'Tasarım Lamba',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: itemPrice.toFixed(2)
        };
      });

      const callbackUrl = `${baseUrl}/api/iyzico/callback`;

      const iyzicoRequest = {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        price: priceStr,
        paidPrice: paidPriceStr,
        currency: Iyzipay.CURRENCY.TRY,
        basketId: orderId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9, 12],
        buyer: {
          id: userId !== 'guest' ? `USER_${userId}` : `GUEST_${Date.now()}`,
          name: buyerName,
          surname: buyerSurname,
          gsmNumber: cleanPhone,
          email: cleanEmail,
          identityNumber: '11111111110',
          registrationAddress: cleanAddressLine,
          ip: clientIp,
          city: cleanCity,
          country: cleanCountry,
          zipCode: cleanPostalCode
        },
        shippingAddress: {
          contactName: buyerFullName,
          city: cleanCity,
          country: cleanCountry,
          address: cleanAddressLine,
          zipCode: cleanPostalCode
        },
        billingAddress: {
          contactName: address.companyName || buyerFullName,
          city: cleanCity,
          country: cleanCountry,
          address: cleanAddressLine,
          zipCode: cleanPostalCode
        },
        basketItems
      };

      // Save server-computed pending order details in memory
      const pendingOrderData = {
        id: orderId,
        userId,
        customerEmail: cleanEmail,
        customerName: buyerFullName,
        customerPhone: cleanPhone,
        address: {
          ...address,
          fullName: buyerFullName,
          email: cleanEmail,
          phone: cleanPhone,
          addressLine: cleanAddressLine,
          city: cleanCity,
          district: cleanDistrict,
          postalCode: cleanPostalCode,
          country: cleanCountry
        },
        items: trustedItems,
        subtotal: serverSubtotal,
        discountCode: verifiedAppliedCoupon?.code || undefined,
        discountAmount: serverDiscountAmount > 0 ? serverDiscountAmount : undefined,
        appliedCoupon: verifiedAppliedCoupon || undefined,
        shipping: serverShipping,
        total: serverTotal,
        status: 'pending_payment',
        paymentMethod: 'iyzico',
        notes,
        createdAt: Date.now()
      };

      pendingOrders.set(conversationId, pendingOrderData);
      pendingOrders.set(orderId, pendingOrderData);

      iyzipay.checkoutFormInitialize.create(iyzicoRequest, (err: any, result: any) => {
        if (err || (result && result.status !== 'success')) {
          console.error('iyzico initialization error:', err || result);
          const errorMsg = result?.errorMessage || err?.message || 'iyzico ödeme formu başlatılamadı.';
          return res.status(400).json({
            success: false,
            errorMessage: errorMsg,
            result
          });
        }

        if (result.token) {
          pendingOrders.set(result.token, pendingOrderData);
        }

        return res.json({
          success: true,
          status: result.status,
          token: result.token,
          paymentPageUrl: result.paymentPageUrl,
          checkoutFormContent: result.checkoutFormContent,
          conversationId,
          orderId
        });
      });

    } catch (error: any) {
      console.error('iyzico init route exception:', error);
      res.status(400).json({
        success: false,
        errorMessage: error.message || 'Ödeme oturumu açılırken sunucu hatası oluştu.'
      });
    }
  });

  // 3. Callback endpoint called by iyzico after customer enters card details / 3D secure
  app.post('/api/iyzico/callback', async (req, res) => {
    try {
      const token = req.body?.token;
      const conversationId = req.body?.conversationId;

      if (!token) {
        return res.redirect('/order-success?status=failed&error=Geçersiz+ödeme+anahtarı');
      }

      const iyzipay = getIyzipayClient();

      iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        token
      }, async (err: any, result: any) => {
        if (err || !result || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
          console.error('iyzico payment verification failed:', err || result);
          const errorMsg = result?.errorMessage || 'Ödeme doğrulanamadı veya iptal edildi.';
          return res.redirect(`/order-success?status=failed&error=${encodeURIComponent(errorMsg)}&token=${token}`);
        }

        // Verified SUCCESSFUL payment!
        const cachedOrder = pendingOrders.get(token) || 
                            pendingOrders.get(result.conversationId) || 
                            pendingOrders.get(result.basketId);

        const orderId = result.basketId || cachedOrder?.id || (`LUM-` + Math.floor(100000 + Math.random() * 900000));
        const paidAmount = parseFloat(result.paidPrice || result.price || (cachedOrder?.total || 0));

        const finalOrder = {
          id: orderId,
          userId: cachedOrder?.userId || 'guest',
          customerEmail: cachedOrder?.customerEmail || result.buyerEmail || '',
          customerName: cachedOrder?.customerName || `${result.buyerName || ''} ${result.buyerSurname || ''}`.trim() || 'Müşteri',
          customerPhone: cachedOrder?.customerPhone || '',
          address: cachedOrder?.address || {
            fullName: cachedOrder?.customerName || 'Müşteri',
            phone: cachedOrder?.customerPhone || '',
            email: cachedOrder?.customerEmail || '',
            addressLine: result.shippingAddress?.address || 'Belirtilmedi',
            city: result.shippingAddress?.city || 'İstanbul',
            district: '',
            postalCode: result.shippingAddress?.zipCode || '',
            country: result.shippingAddress?.country || 'Türkiye'
          },
          items: cachedOrder?.items || [
            {
              productId: 'prod_iyzico',
              productName: 'LUMEN Atelier Aydınlatma',
              productImage: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80',
              price: paidAmount,
              quantity: 1
            }
          ],
          subtotal: cachedOrder?.subtotal || paidAmount,
          discountCode: cachedOrder?.discountCode,
          discountAmount: cachedOrder?.discountAmount,
          appliedCoupon: cachedOrder?.appliedCoupon,
          shipping: cachedOrder?.shipping || 0,
          total: paidAmount,
          status: 'paid', // Status is PAID only upon verified success
          paymentMethod: 'iyzico',
          iyzicoPaymentId: result.paymentId || '',
          iyzicoToken: token,
          notes: cachedOrder?.notes,
          adminNote: `iyzico 3D Secure Başarılı. Kart: ${result.cardFamily || ''} (${result.cardType || ''}) - Taksit: ${result.installment || 1} - Ödeme No: ${result.paymentId || ''}`,
          createdAt: Date.now()
        };

        // Write order to Firestore using Admin SDK
        try {
          const db = getAdminDb();
          const cleanPayload = cleanData(finalOrder);
          await db.collection('orders').doc(orderId).set(cleanPayload);
          console.log(`[iyzico] Order ${orderId} successfully saved to Firestore with status 'paid' via Admin SDK`);
        } catch (dbErr) {
          console.error('[iyzico] Firestore write error on callback:', dbErr);
        }

        // Cleanup pending memory
        pendingOrders.delete(token);
        if (result.conversationId) pendingOrders.delete(result.conversationId);
        if (result.basketId) pendingOrders.delete(result.basketId);

        return res.redirect(`/order-success?status=success&orderId=${orderId}&token=${token}&paymentId=${result.paymentId || ''}`);
      });

    } catch (cbErr: any) {
      console.error('iyzico callback exception:', cbErr);
      res.redirect(`/order-success?status=failed&error=${encodeURIComponent(cbErr.message || 'Ödeme işlenirken beklenmeyen bir hata oluştu.')}`);
    }
  });

  // 4. Status verification API for client polling/fetching
  app.get('/api/iyzico/order-status/:orderId', async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const db = getAdminDb();
      const orderSnap = await db.collection('orders').doc(orderId).get();
      if (orderSnap.exists) {
        return res.json({ found: true, order: orderSnap.data() });
      }
      return res.json({ found: false });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LUMEN] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
