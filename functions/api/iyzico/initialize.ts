import { getIyzicoConfig, signIyzicoRequest, corsHeaders } from '../_iyzico';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  try {
    const config = getIyzicoConfig(context.env);
    const body = await context.request.json().catch(() => ({}));

    const {
      items = [],
      customerName = '',
      customerEmail = '',
      customerPhone = '',
      address = {},
      subtotal = 0,
      discountAmount = 0,
      appliedCoupon,
      shipping = 0,
      total = 0,
      userId = 'guest',
      notes = '',
      frontendOrigin
    } = body as any;

    const requestUrl = new URL(context.request.url);
    const origin = (frontendOrigin && typeof frontendOrigin === 'string' && frontendOrigin.startsWith('http'))
      ? frontendOrigin.replace(/\/+$/, '')
      : requestUrl.origin;

    const orderId = `LUM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const conversationId = `CONV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const parsedTotal = parseFloat(total);
    const finalTotal = (!isNaN(parsedTotal) && parsedTotal > 0)
      ? parsedTotal
      : Math.max(1, (subtotal - discountAmount + shipping));

    const priceStr = finalTotal.toFixed(2);
    const paidPriceStr = priceStr;

    // Buyer details
    const nameParts = (customerName || address.fullName || 'Misafir Müşteri').trim().split(/\s+/);
    const buyerName = nameParts[0] || 'Misafir';
    const buyerSurname = nameParts.slice(1).join(' ') || 'Müşteri';
    const cleanPhone = (customerPhone || address.phone || '+905555555555').replace(/[^+\d]/g, '') || '+905555555555';
    const cleanEmail = (customerEmail || address.email || 'musteri@lumenlatelier.com').trim();
    const cleanCity = address.city || 'İstanbul';
    const cleanCountry = address.country || 'Türkiye';
    const cleanAddress = address.addressLine || 'LUMEN Adres';
    const cleanZip = address.postalCode || '34000';

    // Basket items
    const basketItems: any[] = [];
    if (Array.isArray(items) && items.length > 0) {
      let runningSum = 0;
      const validItems = items.filter((it: any) => it && (it.productName || it.name));

      validItems.forEach((it: any, index: number) => {
        const isLast = index === validItems.length - 1;
        const itemPrice = isLast
          ? Math.max(0.01, +(finalTotal - runningSum).toFixed(2))
          : Math.max(0.01, +(it.price || finalTotal / validItems.length).toFixed(2));
        
        runningSum += itemPrice;

        basketItems.push({
          id: String(it.productId || it.id || `ITEM_${index + 1}`),
          name: String(it.productName || it.name || 'LUMEN Aydınlatma Tasarımı').slice(0, 50),
          category1: 'Aydınlatma',
          category2: 'Tasarım Lamba',
          itemType: 'PHYSICAL',
          price: itemPrice.toFixed(2)
        });
      });
    }

    if (basketItems.length === 0) {
      basketItems.push({
        id: 'LUM_ITEM_DEFAULT',
        name: "LUMEN L'atelier Özel Tasarım Aydınlatma",
        category1: 'Aydınlatma',
        category2: 'Tasarım Lamba',
        itemType: 'PHYSICAL',
        price: paidPriceStr
      });
    }

    const callbackUrl = `${origin}/api/iyzico/callback`;

    const iyzicoPayload = {
      locale: 'tr',
      conversationId,
      price: priceStr,
      paidPrice: paidPriceStr,
      currency: 'TRY',
      basketId: orderId,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9, 12],
      buyer: {
        id: userId !== 'guest' ? `USER_${userId}` : `GUEST_${Date.now()}`,
        name: buyerName,
        surname: buyerSurname,
        gsmNumber: cleanPhone,
        email: cleanEmail,
        identityNumber: '11111111110',
        registrationAddress: cleanAddress,
        ip: context.request.headers.get('cf-connecting-ip') || '85.105.123.45',
        city: cleanCity,
        country: cleanCountry,
        zipCode: cleanZip
      },
      shippingAddress: {
        contactName: `${buyerName} ${buyerSurname}`.trim(),
        city: cleanCity,
        country: cleanCountry,
        address: cleanAddress,
        zipCode: cleanZip
      },
      billingAddress: {
        contactName: address.companyName || `${buyerName} ${buyerSurname}`.trim(),
        city: cleanCity,
        country: cleanCountry,
        address: cleanAddress,
        zipCode: cleanZip
      },
      basketItems
    };

    const endpointPath = '/payment/iyzipos/checkoutform/initialize/auth/ecom';
    const { headers: iyzicoHeaders, bodyString } = await signIyzicoRequest(config, endpointPath, iyzicoPayload);

    const iyzicoResponse = await fetch(`${config.baseUrl}${endpointPath}`, {
      method: 'POST',
      headers: iyzicoHeaders,
      body: bodyString
    });

    const result = await iyzicoResponse.json();

    if (result.status !== 'success') {
      return new Response(
        JSON.stringify({
          success: false,
          errorMessage: result.errorMessage || 'iyzico oturumu başlatılamadı.',
          errorCode: result.errorCode
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        conversationId,
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        tokenExpireTime: result.tokenExpireTime,
        paymentPageUrl: result.paymentPageUrl,
        payWithIyzicoPageUrl: result.payWithIyzicoPageUrl
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        errorMessage: err.message || 'Ödeme oturumu başlatılırken bir hata oluştu.'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
