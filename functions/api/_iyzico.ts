// Cloudflare Edge Helper for iyzico API using Web Crypto API

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export function getIyzicoConfig(env?: Record<string, any>): IyzicoConfig {
  const apiKey = (env?.IYZICO_API_KEY || 'sandbox-gZz2xJX8pKYeFsaTn3jTY0BCSf8Paa93').trim();
  const secretKey = (env?.IYZICO_SECRET_KEY || 'sandbox-rXLaQ1RHVvYqCbWwUNXL3a1mnVOcUOjs').trim();
  const baseUrl = (env?.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim().replace(/\/+$/, '');

  return { apiKey, secretKey, baseUrl };
}

export async function signIyzicoRequest(
  config: IyzicoConfig,
  path: string,
  bodyObj: any
): Promise<{ headers: Record<string, string>; bodyString: string }> {
  const randomString = Date.now().toString() + Math.random().toString(36).slice(2, 8);
  const bodyString = JSON.stringify(bodyObj);

  // Web Crypto HMAC-SHA256
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(config.secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payloadToSign = randomString + path + bodyString;
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(payloadToSign)
  );

  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const authParams = `apiKey:${config.apiKey}&randomKey:${randomString}&signature:${signatureHex}`;
  const authHeader = `IYZWSv2 ${btoa(authParams)}`;

  return {
    headers: {
      'Content-Type': 'application/json',
      'x-iyzi-rnd': randomString,
      'x-iyzi-client-version': 'iyzipay-node-2.0.69',
      'Authorization': authHeader
    },
    bodyString
  };
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-iyzi-rnd'
  };
}
