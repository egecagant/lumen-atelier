import { corsHeaders } from '../_iyzico';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { code, subtotal } = body as { code?: string; subtotal?: number };
    const rawCode = (typeof code === 'string' ? code : '').trim().toUpperCase();
    const currentSubtotal = Math.max(0, Number(subtotal) || 0);

    const genericInvalidMessage = 'İndirim kodu geçersiz veya süresi dolmuş.';

    if (!rawCode) {
      return new Response(
        JSON.stringify({ success: false, message: genericInvalidMessage }),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Default valid coupons
    const validCoupons: Record<string, any> = {
      'LUMEN10': { code: 'LUMEN10', discountType: 'percentage', discountValue: 10, minPurchase: 0, description: '%10 Hoş Geldin İndirimi' },
      'HOSGELDIN': { code: 'HOSGELDIN', discountType: 'percentage', discountValue: 15, minPurchase: 500, description: '%15 İlk Sipariş İndirimi' },
      'HOSGELDIN15': { code: 'HOSGELDIN15', discountType: 'percentage', discountValue: 15, minPurchase: 500, description: '%15 İlk Sipariş İndirimi' },
      'LUMEN100': { code: 'LUMEN100', discountType: 'fixed', discountValue: 100, minPurchase: 1000, description: '100 TL İndirim' }
    };

    const coupon = validCoupons[rawCode];

    if (!coupon) {
      return new Response(
        JSON.stringify({ success: false, message: genericInvalidMessage }),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    if (coupon.minPurchase && currentSubtotal < coupon.minPurchase) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Bu kupon en az ${coupon.minPurchase} TL tutarındaki siparişlerde geçerlidir.`
        }),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (currentSubtotal * coupon.discountValue) / 100;
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, currentSubtotal);
    }

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          id: rawCode,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          description: coupon.description,
          calculatedDiscount
        }
      }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'Kupon doğrulanırken hata oluştu.' }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}
