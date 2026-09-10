import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Iyzipay from 'iyzipay';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeApp as initAdminApp, cert, getApps as getAdminApps, App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import firebaseConfigData from './firebase-applet-config.json' with { type: 'json' };
import { generateGoogleMerchantXml } from './src/lib/googleMerchantFeed.ts';
import { MAINTENANCE_MODE } from './src/lib/maintenance.ts';
import { sendOrderConfirmationEmail, isResendConfigured } from './server/emailService.ts';

dotenv.config();

// Initialize Firebase Admin SDK for privileged server-side database access (bypasses client security rules)
let cachedDb: AdminFirestore | null = null;

function getDb(): AdminFirestore {
  if (cachedDb) return cachedDb;

  let adminApp: AdminApp;
  const existingApps = getAdminApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
  } else {
    let serviceAccount: any = null;
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawServiceAccount) {
      try {
        serviceAccount = typeof rawServiceAccount === 'string'
          ? JSON.parse(rawServiceAccount)
          : rawServiceAccount;
      } catch (parseErr) {
        console.error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT JSON parse hatası:', parseErr);
      }
    }

    if (serviceAccount && (serviceAccount.private_key || serviceAccount.client_email)) {
      adminApp = initAdminApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || firebaseConfigData.projectId
      });
      console.log(`[Firebase Admin] Service Account ile başlatıldı (${serviceAccount.client_email || serviceAccount.project_id})`);
    } else {
      // Fallback: Google Cloud Application Default Credentials (ADC) or project identifier
      adminApp = initAdminApp({
        projectId: firebaseConfigData.projectId
      });
      console.log(`[Firebase Admin] Varsayılan kimlik bilgileri (ADC/Proje: ${firebaseConfigData.projectId}) ile başlatıldı`);
    }
  }

  const databaseId = firebaseConfigData.firestoreDatabaseId;
  cachedDb = (databaseId && databaseId !== '(default)')
    ? getAdminFirestore(adminApp, databaseId)
    : getAdminFirestore(adminApp);

  console.log(`[Firebase Admin] Firestore bağlandı: Proje "${firebaseConfigData.projectId}", DB "${databaseId || '(default)'}"`);
  return cachedDb;
}

// Configured iyzico client
function getIyzipayClient(): Iyzipay {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL;

  if (!apiKey || !secretKey || !uri) {
    const missing: string[] = [];
    if (!apiKey) missing.push('IYZICO_API_KEY');
    if (!secretKey) missing.push('IYZICO_SECRET_KEY');
    if (!uri) missing.push('IYZICO_BASE_URL');
    throw new Error(
      `iyzico yapılandırma hatası: Zorunlu ortam değişkenleri eksik (${missing.join(', ')}). Lütfen ortam değişkenlerini tanımlayın.`
    );
  }

  if (process.env.NODE_ENV === 'production' && uri.toLowerCase().includes('sandbox')) {
    console.warn('[iyzico] BİLGİ: Üretim modunda (production) test/sandbox ortamı kullanılıyor.');
  }

  return new Iyzipay({
    apiKey,
    secretKey,
    uri
  });
}

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
  return 'musteri@lumenlatelier.com';
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

// In-memory store for pending checkout orders (token / conversationId / orderId -> order payload)
const pendingOrders = new Map<string, any>();

// Save pending order to both in-memory Map and Firestore pending_orders collection
async function savePendingOrder(keys: string[], data: any): Promise<void> {
  const validKeys = keys.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
  if (validKeys.length === 0) return;

  // 1. Update in-memory Map
  for (const k of validKeys) {
    pendingOrders.set(k, data);
  }

  // 2. Write to Firestore pending_orders collection via batch write
  try {
    const db = getDb();
    const batch = db.batch();
    const cleaned = cleanData({
      ...data,
      updatedAt: Date.now()
    });

    for (const k of validKeys) {
      const docRef = db.collection('pending_orders').doc(k);
      batch.set(docRef, cleaned);
    }

    await batch.commit();
  } catch (err) {
    console.error('[savePendingOrder] Firestore batch write error:', err);
  }
}

// Load pending order: first check Map, if not found then read from Firestore doc by doc
async function loadPendingOrder(...keys: (string | undefined | null)[]): Promise<any | null> {
  const validKeys = keys.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
  if (validKeys.length === 0) return null;

  // 1. Check in-memory map first
  for (const k of validKeys) {
    const memData = pendingOrders.get(k);
    if (memData) {
      return memData;
    }
  }

  // 2. Check Firestore doc by doc
  try {
    const db = getDb();
    for (const k of validKeys) {
      const docSnap = await db.collection('pending_orders').doc(k).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        // Also populate in-memory map for fast subsequent access
        pendingOrders.set(k, data);
        return data;
      }
    }
  } catch (err) {
    console.error('[loadPendingOrder] Firestore read error:', err);
  }

  return null;
}

// Clear pending order from both in-memory Map and Firestore
async function clearPendingOrder(...keys: (string | undefined | null)[]): Promise<void> {
  const validKeys = keys.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
  if (validKeys.length === 0) return;

  // 1. Delete from in-memory map
  for (const k of validKeys) {
    pendingOrders.delete(k);
  }

  // 2. Delete from Firestore pending_orders collection
  try {
    const db = getDb();
    const batch = db.batch();
    for (const k of validKeys) {
      const docRef = db.collection('pending_orders').doc(k);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (err) {
    console.error('[clearPendingOrder] Firestore delete error:', err);
  }
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

// Server-authoritative fallback catalogue if Firestore has not finished seeding
const DEFAULT_PRODUCTS_CATALOG: Record<string, { name: string; price: number; images: string[]; active: boolean; stockStatus?: string }> = {
  'astronot-kozmik-cocuk-masa-lambasi': {
    name: 'Astronot Kozmik Çocuk Masa Lambası',
    price: 345,
    images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80'],
    active: true,
    stockStatus: 'in_stock'
  },
  'nero-marquina-mermer-pirinc-heykelsi-lamba': {
    name: 'Nero Marquina Mermer & Pirinç Heykelsi Lamba',
    price: 1890,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'],
    active: true,
    stockStatus: 'in_stock'
  },
  'amber-glow-ufleme-cam-sarkit-avize': {
    name: 'Amber Glow Üfleme Cam Sarkıt Avize',
    price: 1420,
    images: ['https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80'],
    active: true,
    stockStatus: 'in_stock'
  }
};

// Helper for server-side verification of items and coupons against Firestore
async function verifyOrderSecurity(items: any[], discountCode?: string, paymentMethod?: string) {
  const db = getDb();

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

    let productData: any = null;
    try {
      const productDoc = await db.collection('products').doc(productId).get();
      if (productDoc.exists) {
        productData = productDoc.data();
      } else {
        const querySnap = await db.collection('products').where('slug', '==', productId).get();
        if (!querySnap.empty) {
          productData = querySnap.docs[0].data();
        }
      }
    } catch (fetchErr) {
      console.warn(`[verifyOrderSecurity] Firestore product fetch warning for "${productId}":`, fetchErr);
    }

    if (!productData) {
      // Check server-side authoritative default catalog
      const fallback = DEFAULT_PRODUCTS_CATALOG[productId];
      if (fallback) {
        productData = fallback;
      } else {
        throw new Error(`"${productId}" kimlikli ürün veritabanında bulunamadı veya satıştan kaldırılmış.`);
      }
    }

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

    try {
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
    } catch (couponErr) {
      console.warn(`[verifyOrderSecurity] Firestore coupon fetch warning:`, couponErr);
    }

    // Built-in store coupon fallbacks
    if (!couponData) {
      if (rawCouponCode === 'LUMEN10') {
        couponData = { code: 'LUMEN10', discountType: 'percentage', discountValue: 10, active: true, description: '%10 Hoş Geldin İndirimi' };
        couponId = 'LUMEN10';
      } else if (rawCouponCode === 'HOSGELDIN' || rawCouponCode === 'HOSGELDIN15') {
        couponData = { code: 'HOSGELDIN', discountType: 'percentage', discountValue: 15, active: true, description: '%15 İlk Sipariş İndirimi' };
        couponId = 'HOSGELDIN';
      }
    }

    if (!couponData) {
      throw new Error(`"${rawCouponCode}" indirim kodu bulunamadı veya geçerli değil.`);
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

  // Security headers with helmet
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration allowing Cloudflare frontend domain and local/cloud-run environments
  const allowedOrigins = [
    'https://lumenlatelier.com',
    'https://www.lumenlatelier.com',
    'https://lumenatelier.com',
    'https://www.lumenatelier.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.ai.studio') ||
        origin.endsWith('.web.app') ||
        origin.endsWith('.firebaseapp.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));

  // Rate limiters for checkout and payment requests
  const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, errorMessage: 'Kısa süre içinde çok fazla ödeme isteği gönderildi. Lütfen birkaç dakika bekleyiniz.' }
  });

  // Rate limiter for coupon code verification (10 requests per minute per IP)
  const couponValidateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Çok fazla indirim kodu denemesi yaptınız. Lütfen 1 dakika sonra tekrar deneyin.'
    }
  });

  // Coupon Validation Endpoint (evaluates coupon via Admin SDK without leaking other codes)
  app.post('/api/coupons/validate', couponValidateLimiter, async (req, res) => {
    try {
      const { code, subtotal } = req.body || {};
      const rawCode = (typeof code === 'string' ? code : '').trim().toUpperCase();
      const currentSubtotal = Math.max(0, Number(subtotal) || 0);

      const genericInvalidMessage = 'İndirim kodu geçersiz veya süresi dolmuş.';

      if (!rawCode) {
        return res.json({
          success: false,
          message: genericInvalidMessage
        });
      }

      const db = getDb();
      let couponData: any = null;
      let couponId: string = '';

      try {
        const directCouponDoc = await db.collection('coupons').doc(rawCode).get();
        if (directCouponDoc.exists) {
          couponData = directCouponDoc.data();
          couponId = directCouponDoc.id;
        } else {
          const couponQuerySnap = await db.collection('coupons').where('code', '==', rawCode).get();
          if (!couponQuerySnap.empty) {
            couponData = couponQuerySnap.docs[0].data();
            couponId = couponQuerySnap.docs[0].id;
          }
        }
      } catch (couponErr) {
        console.warn(`[Coupon Validate] Firestore query warning for "${rawCode}":`, couponErr);
      }

      // Hardcoded fallback coupons if not yet seeded in Firestore
      if (!couponData) {
        if (rawCode === 'LUMEN10') {
          couponData = { code: 'LUMEN10', discountType: 'percentage', discountValue: 10, active: true, description: '%10 Hoş Geldin İndirimi' };
          couponId = 'LUMEN10';
        } else if (rawCode === 'HOSGELDIN' || rawCode === 'HOSGELDIN15') {
          couponData = { code: 'HOSGELDIN', discountType: 'percentage', discountValue: 15, active: true, description: '%15 İlk Sipariş İndirimi' };
          couponId = 'HOSGELDIN';
        }
      }

      // If coupon does not exist, return generic message without revealing code existence
      if (!couponData) {
        return res.json({
          success: false,
          message: genericInvalidMessage
        });
      }

      // Check if inactive
      if (couponData.active === false) {
        return res.json({
          success: false,
          message: genericInvalidMessage
        });
      }

      // Check expiration
      if (couponData.expiresAt && Number(couponData.expiresAt) < Date.now()) {
        return res.json({
          success: false,
          message: genericInvalidMessage
        });
      }

      // Check usage limit
      if (couponData.usageLimit && (couponData.usageCount || 0) >= Number(couponData.usageLimit)) {
        return res.json({
          success: false,
          message: genericInvalidMessage
        });
      }

      // Check minimum order amount
      if (couponData.minOrderAmount && currentSubtotal < Number(couponData.minOrderAmount)) {
        return res.json({
          success: false,
          message: `Bu indirim kodu en az ${Number(couponData.minOrderAmount).toLocaleString('tr-TR')} TL tutarındaki sepetlerde geçerlidir.`
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (couponData.discountType === 'percentage') {
        discountAmount = (currentSubtotal * Number(couponData.discountValue)) / 100;
        if (couponData.maxDiscountAmount && discountAmount > Number(couponData.maxDiscountAmount)) {
          discountAmount = Number(couponData.maxDiscountAmount);
        }
      } else {
        discountAmount = Math.min(Number(couponData.discountValue), currentSubtotal);
      }
      discountAmount = Math.round(discountAmount);

      const desc = couponData.discountType === 'percentage'
        ? `%${couponData.discountValue} İndirim`
        : `${Number(couponData.discountValue).toLocaleString('tr-TR')} TL İndirim`;

      return res.json({
        success: true,
        message: `Tebrikler! "${couponData.code}" kodu başarıyla uygulandı (${desc}).`,
        coupon: {
          id: couponId || couponData.code,
          code: couponData.code,
          description: couponData.description || '',
          discountType: couponData.discountType || 'percentage',
          discountValue: Number(couponData.discountValue) || 0,
          minOrderAmount: couponData.minOrderAmount ? Number(couponData.minOrderAmount) : undefined,
          maxDiscountAmount: couponData.maxDiscountAmount ? Number(couponData.maxDiscountAmount) : undefined
        },
        discountAmount
      });
    } catch (err: any) {
      console.error('[Coupon Validate] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'İndirim kodu doğrulanırken bir hata oluştu.'
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LUMEN L\'atelier Engine',
      hasApiKey: !!process.env.IYZICO_API_KEY,
      hasResendKey: isResendConfigured(),
      fromEmail: process.env.RESEND_FROM_EMAIL || 'LUMEN <siparis@lumenlatelier.com>',
      time: new Date().toISOString()
    });
  });

  // Admin test email endpoint to check Resend configuration
  app.post('/api/admin/resend/test', async (req, res) => {
    try {
      const targetEmail = req.body?.email || 'egecagant@gmail.com';
      if (!isResendConfigured()) {
        return res.status(400).json({
          success: false,
          configured: false,
          message: 'RESEND_API_KEY ortam değişkeni tanımlı değil. Lütfen Settings/Secrets veya .env dosyasına RESEND_API_KEY ekleyin.'
        });
      }

      const dummyOrder = {
        id: 'LUM-TEST-' + Math.floor(1000 + Math.random() * 9000),
        customerName: 'Test Alıcısı (Yönetici)',
        customerEmail: targetEmail,
        customerPhone: '0537 267 53 86',
        total: 1890,
        subtotal: 1890,
        shipping: 0,
        paymentMethod: 'iyzico',
        status: 'paid',
        createdAt: Date.now(),
        items: [
          {
            title: 'Nero Marquina Mermer & Pirinç Heykelsi Lamba (Test)',
            quantity: 1,
            price: 1890,
            selectedColor: 'Doğal Siyah Mermer'
          }
        ],
        address: {
          fullName: 'Test Alıcısı',
          addressDetail: 'Yenimahalle Mah. Teyyareci Sadık Sok. No:50 A',
          district: 'Bakırköy',
          city: 'İstanbul',
          phone: '0537 267 53 86'
        }
      };

      const result = await sendOrderConfirmationEmail(dummyOrder as any);
      return res.json({
        success: result.success,
        configured: true,
        targetEmail,
        result
      });
    } catch (testErr: any) {
      return res.status(500).json({
        success: false,
        error: testErr.message || 'E-posta testi sırasında hata oluştu'
      });
    }
  });

  // Google Merchant Center & Google Shopping XML Feed Endpoint
  const handleGoogleMerchantFeed = async (req: express.Request, res: express.Response) => {
    try {
      const baseUrl = getBaseAppUrl(req);
      let productsList: any[] = [];

      try {
        const db = getDb();
        const snap = await db.collection('products').get();
        if (!snap.empty) {
          snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.active !== false) {
              productsList.push({
                id: docSnap.id,
                ...data
              });
            }
          });
        }
      } catch (dbErr) {
        console.warn('[Google Merchant Feed] Firestore fetch warning, falling back to default catalogue:', dbErr);
      }

      // If database is empty or still initializing, provide default live catalogue
      if (productsList.length === 0) {
        productsList = [
          {
            id: 'astronot-kozmik-cocuk-masa-lambasi',
            name: 'Astronot Kozmik Çocuk Masa Lambası',
            slug: 'astronot-kozmik-cocuk-masa-lambasi',
            description: 'Yumuşak silikon doku ve sıcak LED ışık teknolojisi ile çocukların uyku ve ders saatlerine eşlik eden büyülü bir tasarım. Ayarlanabilir kask vizörü ve nefes alan gece modu ile karanlık korkusuna son verir.',
            shortDescription: 'Göz korumalı sıcak LED, 3 kademeli gece lambası modu.',
            price: 345,
            compareAtPrice: 420,
            categoryName: 'Çocuk Masa Lambası',
            images: [
              'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80'
            ],
            stockStatus: 'in_stock',
            stockQuantity: 18,
            material: 'Mat Reçine, BPA-Free Yumuşak Silikon, Optik Akrilik'
          },
          {
            id: 'nero-marquina-mermer-pirinc-heykelsi-lamba',
            name: 'Nero Marquina Mermer & Pirinç Heykelsi Lamba',
            slug: 'nero-marquina-mermer-pirinc-heykelsi-lamba',
            description: 'İspanya’dan ithal tek parça damarlı Nero Marquina siyah mermer blok üzerine oturtulmuş fırçalanmış masif pirinç silindir. Yaşam alanlarında sanatsal bir odak noktası oluşturur.',
            shortDescription: 'Doğal siyah mermer gövde, fırçalanmış pirinç başlık.',
            price: 1890,
            compareAtPrice: 2250,
            categoryName: 'Dekoratif Lamba',
            images: [
              'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80'
            ],
            stockStatus: 'in_stock',
            stockQuantity: 6,
            material: 'Doğal Nero Marquina Mermer, Masif Pirinç'
          },
          {
            id: 'amber-glow-ufleme-cam-sarkit-avize',
            name: 'Amber Glow Üfleme Cam Sarkıt Avize',
            slug: 'amber-glow-ufleme-cam-sarkit-avize',
            description: 'Bal rengi organik formlu zarif amber cam kubbe ve antrasit detaylar. Işığı homojen yayarak yemek masası ve salonlarda davetkar bir sıcaklık yaratır.',
            shortDescription: 'Organik formlu zarif amber cam, antrasit askı aparatı.',
            price: 1420,
            categoryName: 'Aydınlatma',
            images: [
              'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
            ],
            stockStatus: 'in_stock',
            stockQuantity: 12,
            material: 'Bohemya Amber Camı, Mat Siyah Çelik'
          },
          {
            id: 'sombre-mantar-dokunmatik-kablosuz-masa-lambasi',
            name: 'Sombre Mantar Dokunmatik Kablosuz Masa Lambası',
            slug: 'sombre-mantar-dokunmatik-kablosuz-masa-lambasi',
            description: 'Kablosuz özgürlük sunan şarjlı taşınabilir masa lambası. 3 kademeli dokunmatik hassasiyet, IP54 su sıçramalarına dayanıklılık ve 18 saate kadar kesintisiz çalışma performansı.',
            shortDescription: 'Taşınabilir şarjlı lamba, 3 seviyeli dokunmatik karartma.',
            price: 580,
            compareAtPrice: 690,
            categoryName: 'Masa Lambaları',
            images: [
              'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=80',
              'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80'
            ],
            stockStatus: 'in_stock',
            stockQuantity: 24,
            material: 'Eloksallı Bronz Alüminyum, Buzlu Difüzör'
          }
        ];
      }

      const xmlContent = generateGoogleMerchantXml(productsList, baseUrl);

      if (req.query.download === '1' || req.query.download === 'true') {
        res.setHeader('Content-Disposition', 'attachment; filename="google-merchant-lumen.xml"');
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.send(xmlContent);
    } catch (feedErr: any) {
      console.error('[Google Merchant Feed] Error generating XML:', feedErr);
      res.status(500).type('text/plain').send('Google Merchant feed generation error: ' + feedErr.message);
    }
  };

  app.get('/api/feeds/google-merchant.xml', handleGoogleMerchantFeed);
  app.get('/feeds/google-merchant.xml', handleGoogleMerchantFeed);
  app.get('/google-merchant.xml', handleGoogleMerchantFeed);

  // JSON summary of feed for diagnostic testing
  app.get('/api/feeds/google-merchant.json', async (req, res) => {
    try {
      const baseUrl = getBaseAppUrl(req);
      const db = getDb();
      const snap = await db.collection('products').get();
      const productsList: any[] = [];
      snap.forEach(docSnap => {
        productsList.push({ id: docSnap.id, ...docSnap.data() });
      });

      res.json({
        status: 'ok',
        count: productsList.length,
        feedUrl: `${baseUrl}/api/feeds/google-merchant.xml`,
        products: productsList
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 1. Direct Server-Side Order Creation (e.g. Bank Transfer / EFT)
  // Securely creates orders via Firebase Web SDK with validated order payload
  app.post('/api/orders/create', paymentLimiter, async (req, res) => {
    try {
      const {
        items = [],
        customerName = 'LUMEN Müşterisi',
        customerEmail = 'musteri@lumenlatelier.com',
        customerPhone = '+905320000000',
        address = {},
        discountCode = '',
        paymentMethod = 'bank_transfer',
        userId = 'guest',
        notes = '',
        marketingConsent = false,
        marketingConsentAt,
        contractsAcceptedAt
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
        marketingConsent: Boolean(marketingConsent),
        marketingConsentAt: marketingConsent ? (marketingConsentAt || Date.now()) : undefined,
        contractsAcceptedAt: contractsAcceptedAt || Date.now(),
        createdAt: Date.now()
      };

      const cleanPayload = cleanData(newOrder);
      const db = getDb();
      await db.collection('orders').doc(orderId).set(cleanPayload);

      console.log(`[Orders] Order ${orderId} successfully created with total ${serverTotal} TL`);

      // Asynchronously send order confirmation email via Resend (never blocks response)
      sendOrderConfirmationEmail(cleanPayload as any).catch((mailErr) => {
        console.error(`[Resend] Order ${orderId} email sending error:`, mailErr);
      });

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
  app.post('/api/iyzico/initialize', paymentLimiter, async (req, res) => {
    try {
      const {
        items = [],
        customerName = 'LUMEN Müşterisi',
        customerEmail = 'musteri@lumenlatelier.com',
        customerPhone = '+905320000000',
        address = {},
        discountCode = '',
        appliedCoupon = null,
        userId = 'guest',
        notes = '',
        marketingConsent = false,
        marketingConsentAt,
        contractsAcceptedAt,
        frontendOrigin
      } = req.body;

      // Extract client frontend URL (supports Cloudflare custom domains / Pages)
      let clientFrontendUrl = '';
      if (frontendOrigin && typeof frontendOrigin === 'string' && frontendOrigin.startsWith('http')) {
        clientFrontendUrl = frontendOrigin.replace(/\/+$/, '');
      } else if (req.get('origin') && req.get('origin')!.startsWith('http')) {
        clientFrontendUrl = req.get('origin')!.replace(/\/+$/, '');
      } else if (req.get('referer') && req.get('referer')!.startsWith('http')) {
        try {
          const refUrl = new URL(req.get('referer')!);
          clientFrontendUrl = refUrl.origin;
        } catch {}
      }

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

      // In iyzico API:
      // 'price' is the undiscounted total of the basket (sum of all basketItems[].price).
      // 'paidPrice' is the final amount to be charged to the customer after discounts.
      // The sum of basketItems[].price MUST strictly equal 'price'.
      const originalBasketSum = Math.max(serverTotal, serverSubtotal + serverShipping);
      const priceStr = originalBasketSum.toFixed(2);
      const paidPriceStr = serverTotal.toFixed(2);

      // Prepare basket items from trusted items ensuring total matches priceStr exactly
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
      const basketItems = expandedItems.map((it, i) => {
        let itemPrice: number;
        if (i === expandedItems.length - 1) {
          itemPrice = Math.max(0.01, +(originalBasketSum - runningSum).toFixed(2));
        } else {
          itemPrice = +it.price.toFixed(2);
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
        frontendUrl: clientFrontendUrl || undefined,
        notes,
        marketingConsent: Boolean(marketingConsent),
        marketingConsentAt: marketingConsent ? (marketingConsentAt || Date.now()) : undefined,
        contractsAcceptedAt: contractsAcceptedAt || Date.now(),
        createdAt: Date.now()
      };

      await savePendingOrder([conversationId, orderId], pendingOrderData);

      iyzipay.checkoutFormInitialize.create(iyzicoRequest, async (err: any, result: any) => {
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
          await savePendingOrder([result.token], pendingOrderData);
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
        const fallbackBase = getBaseAppUrl(req);
        return res.redirect(`${fallbackBase}/order-success?status=failed&error=Geçersiz+ödeme+anahtarı`);
      }

      const iyzipay = getIyzipayClient();

      iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        token
      }, async (err: any, result: any) => {
        // Load pending order to retrieve frontend redirect URL & items
        const cachedOrder = await loadPendingOrder(token, result?.conversationId || conversationId, result?.basketId);
        const redirectBase = (cachedOrder?.frontendUrl && typeof cachedOrder.frontendUrl === 'string' && cachedOrder.frontendUrl.startsWith('http'))
          ? cachedOrder.frontendUrl.replace(/\/+$/, '')
          : getBaseAppUrl(req);

        if (err || !result || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
          console.error('iyzico payment verification failed:', err || result);
          const errorMsg = result?.errorMessage || 'Ödeme doğrulanamadı veya iptal edildi.';
          return res.redirect(`${redirectBase}/order-success?status=failed&error=${encodeURIComponent(errorMsg)}&token=${token}`);
        }

        // Verified SUCCESSFUL payment!
        const orderDataMissing = !cachedOrder;

        if (orderDataMissing) {
          console.error(
            `[iyzico CRITICAL] Sipariş verisi bulunamadı! Ödeme başarıyla alındı ancak sepet/adres bilgisi eşleştirilemedi. ` +
            `PaymentId: ${result.paymentId}, Token: ${token}, ConversationId: ${result.conversationId || conversationId}, ` +
            `BasketId: ${result.basketId}, PaidPrice: ${result.paidPrice || result.price}, BuyerEmail: ${result.buyerEmail}`
          );
        }

        const orderId = result.basketId || cachedOrder?.id || (`LUM-` + Math.floor(100000 + Math.random() * 900000));
        const paidAmount = parseFloat(result.paidPrice || result.price || (cachedOrder?.total || 0));

        const finalOrder = {
          id: orderId,
          userId: cachedOrder?.userId || 'guest',
          customerEmail: cachedOrder?.customerEmail || result.buyerEmail || '',
          customerName: cachedOrder?.customerName || `${result.buyerName || ''} ${result.buyerSurname || ''}`.trim() || '',
          customerPhone: cachedOrder?.customerPhone || result.buyerGsmNumber || '',
          address: cachedOrder?.address || {
            fullName: cachedOrder?.customerName || `${result.buyerName || ''} ${result.buyerSurname || ''}`.trim() || '',
            phone: cachedOrder?.customerPhone || result.buyerGsmNumber || '',
            email: cachedOrder?.customerEmail || result.buyerEmail || '',
            addressLine: result.shippingAddress?.address || '',
            city: result.shippingAddress?.city || '',
            district: '',
            postalCode: result.shippingAddress?.zipCode || '',
            country: result.shippingAddress?.country || ''
          },
          items: cachedOrder?.items || [],
          subtotal: cachedOrder?.subtotal || paidAmount,
          discountCode: cachedOrder?.discountCode,
          discountAmount: cachedOrder?.discountAmount,
          appliedCoupon: cachedOrder?.appliedCoupon,
          shipping: cachedOrder?.shipping || 0,
          total: paidAmount,
          status: orderDataMissing ? 'paid_needs_review' : 'paid',
          needsReview: orderDataMissing || undefined,
          paymentMethod: 'iyzico',
          iyzicoPaymentId: result.paymentId || '',
          iyzicoToken: token,
          notes: cachedOrder?.notes,
          adminNote: orderDataMissing
            ? `DİKKAT: Sipariş sepet/adres detayları kayboldu (pending order bulunamadı)! iyzico 3D Secure Başarılı. Kart: ${result.cardFamily || ''} (${result.cardType || ''}) - Taksit: ${result.installment || 1} - Ödeme No: ${result.paymentId || ''}`
            : `iyzico 3D Secure Başarılı. Kart: ${result.cardFamily || ''} (${result.cardType || ''}) - Taksit: ${result.installment || 1} - Ödeme No: ${result.paymentId || ''}`,
          createdAt: Date.now()
        };

        // Write order to Firestore using Firebase Admin SDK
        try {
          const db = getDb();
          const cleanPayload = cleanData(finalOrder);
          await db.collection('orders').doc(orderId).set(cleanPayload);
          console.log(`[iyzico] Order ${orderId} successfully saved to Firestore with status '${finalOrder.status}'`);

          // Asynchronously send order confirmation email via Resend
          sendOrderConfirmationEmail(cleanPayload as any).catch((mailErr) => {
            console.error(`[Resend] iyzico order ${orderId} email sending error:`, mailErr);
          });
        } catch (dbErr) {
          console.error('[iyzico] Firestore write error on callback:', dbErr);
        }

        // Cleanup pending order from Map and Firestore
        await clearPendingOrder(token, result.conversationId, result.basketId);

        return res.redirect(`${redirectBase}/order-success?status=success&orderId=${orderId}&token=${token}&paymentId=${result.paymentId || ''}`);
      });

    } catch (cbErr: any) {
      console.error('iyzico callback exception:', cbErr);
      const fallbackBase = getBaseAppUrl(req);
      res.redirect(`${fallbackBase}/order-success?status=failed&error=${encodeURIComponent(cbErr.message || 'Ödeme işlenirken beklenmeyen bir hata oluştu.')}`);
    }
  });

  // 4. Status verification API for client polling/fetching
  app.get('/api/iyzico/order-status/:orderId', async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const db = getDb();
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

    if (MAINTENANCE_MODE) {
      app.use((req, res, next) => {
        // Only target HTML page requests, not API endpoints or static assets
        if (req.method === 'GET' && !req.path.startsWith('/api') && req.headers.accept?.includes('text/html')) {
          res.status(503);
          res.set('Retry-After', '3600');
        }
        next();
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (MAINTENANCE_MODE) {
        res.status(503);
        res.set('Retry-After', '3600');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LUMEN] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
