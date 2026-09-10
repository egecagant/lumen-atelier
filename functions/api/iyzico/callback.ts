import { getIyzicoConfig, signIyzicoRequest } from '../_iyzico';

export async function onRequestPost(context: { request: Request; env: Record<string, any> }) {
  const requestUrl = new URL(context.request.url);
  const origin = requestUrl.origin;

  try {
    let token = '';
    let conversationId = '';

    const contentType = context.request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await context.request.formData();
      token = (formData.get('token') as string) || '';
      conversationId = (formData.get('conversationId') as string) || '';
    } else if (contentType.includes('application/json')) {
      const json = await context.request.json().catch(() => ({}));
      token = json.token || '';
      conversationId = json.conversationId || '';
    } else {
      const text = await context.request.text();
      const params = new URLSearchParams(text);
      token = params.get('token') || '';
      conversationId = params.get('conversationId') || '';
    }

    if (!token) {
      return Response.redirect(`${origin}/siparis-onay?status=failed&error=${encodeURIComponent('Geçersiz ödeme anahtarı')}`, 303);
    }

    const config = getIyzicoConfig(context.env);
    const endpointPath = '/payment/iyzipos/checkoutform/auth/ecom/detail';

    const retrievePayload = {
      locale: 'tr',
      conversationId: conversationId || `CONV_${Date.now()}`,
      token
    };

    const { headers: iyzicoHeaders, bodyString } = await signIyzicoRequest(config, endpointPath, retrievePayload);

    const iyzicoResponse = await fetch(`${config.baseUrl}${endpointPath}`, {
      method: 'POST',
      headers: iyzicoHeaders,
      body: bodyString
    });

    const result = await iyzicoResponse.json();

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      const errorMsg = result.errorMessage || 'Ödeme onaylanamadı veya iptal edildi.';
      return Response.redirect(`${origin}/siparis-onay?status=failed&error=${encodeURIComponent(errorMsg)}&token=${token}`, 303);
    }

    // Success!
    const orderId = result.basketId || `LUM-${Date.now().toString().slice(-6)}`;
    const paymentId = result.paymentId || '';
    
    return Response.redirect(
      `${origin}/siparis-onay/${orderId}?status=success&paymentId=${encodeURIComponent(paymentId)}&token=${encodeURIComponent(token)}`,
      303
    );
  } catch (err: any) {
    return Response.redirect(
      `${origin}/siparis-onay?status=failed&error=${encodeURIComponent(err.message || 'Ödeme işlenirken teknik bir hata oluştu')}`,
      303
    );
  }
}

export async function onRequestGet(context: { request: Request }) {
  const requestUrl = new URL(context.request.url);
  const token = requestUrl.searchParams.get('token') || '';
  return Response.redirect(`${requestUrl.origin}/siparis-onay?status=review&token=${encodeURIComponent(token)}`, 303);
}
