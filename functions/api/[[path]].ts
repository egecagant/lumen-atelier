import { corsHeaders } from './_iyzico';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequest(context: { request: Request; params: { path?: string[] } }) {
  const url = new URL(context.request.url);
  
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      service: "LUMEN L'atelier Cloudflare API Router",
      path: url.pathname,
      method: context.request.method
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
