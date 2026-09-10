import { corsHeaders } from '../_iyzico';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const payload = await context.request.json().catch(() => ({}));
    const orderId = payload.id || `LUM-${Date.now().toString().slice(-6)}`;

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        orderNumber: orderId,
        message: 'Sipariş başarıyla oluşturuldu.'
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
        error: err.message || 'Sipariş oluşturulamadı.'
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
