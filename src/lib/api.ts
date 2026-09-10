/**
 * API configuration and utility helpers.
 * Supports configurable VITE_API_BASE_URL for decoupled deployments (e.g. Cloudflare Pages/Worker frontend -> Backend).
 */

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const RAW_API_BASE = (metaEnv?.VITE_API_BASE_URL || '').trim();
// Remove trailing slash if present
export const API_BASE_URL = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE;

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function formatApiErrorMessage(err: any): string {
  if (!err) return 'Bilinmeyen bir hata oluştu.';
  const msg = typeof err === 'string' ? err : (err.message || String(err));
  
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return 'Ödeme sunucusuyla iletişim kurulamadı (405 / Bağlantı hatası). Sitenizin Cloudflare Pages üzerinde API arka uç fonksiyonlarının (functions/) devreye girmesi için projenin en güncel kodlarla yeniden dağıtılması (deploy) gerekmektedir.';
  }
  
  return msg;
}
