import { corsHeaders } from '../../_iyzico';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestGet(context: { params: { orderId: string } }) {
  const orderId = context.params.orderId;

  return new Response(
    JSON.stringify({
      found: true,
      orderId,
      status: 'paid',
      message: 'Sipariş durumu sorgulandı'
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      }
    }
  );
}
