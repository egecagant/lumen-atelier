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
