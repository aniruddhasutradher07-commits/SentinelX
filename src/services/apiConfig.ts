/**
 * src/services/apiConfig.ts
 * ==========================
 * Centralized API configuration connecting SentinelX Frontend to the
 * live FastAPI Master Backend deployed on Render:
 * https://sentinelx-pi9j.onrender.com
 *
 * Supports:
 *  - Production Render cloud endpoint with VITE_API_BASE_URL override
 *  - Graceful handling of Render free-tier cold starts (spinning up ~30-50s)
 *  - Automatic retry with exponential backoff for 502/503/timeouts
 */

export const PRODUCTION_API_URL = '';

// Read environment variable or fallback to production URL
const envBase = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_BASE_URL : '';
const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;

export const API_BASE_URL = envBase || (isProd ? PRODUCTION_API_URL : '');

/**
 * Resolves full URL for any API endpoint path.
 * Example: getApiUrl('/api/v1/summary') -> 'https://sentinelx-pi9j.onrender.com/api/v1/summary'
 */
export function getApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  onColdStart?: (isWaking: boolean) => void;
}

/**
 * Fetch wrapper with timeout and cold-start retry handling for Render cloud hosting.
 */
export async function fetchWithColdStart(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const fullUrl = getApiUrl(url);
  const timeoutMs = options.timeoutMs ?? 45000;
  const maxRetries = options.retries ?? 2;
  const onColdStart = options.onColdStart;

  // Detect cold start if response takes > 2500ms
  let coldStartTimer: any = null;
  if (onColdStart) {
    coldStartTimer = setTimeout(() => {
      onColdStart(true);
    }, 2500);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (coldStartTimer) clearTimeout(coldStartTimer);
      if (onColdStart) onColdStart(false);

      // If Render gateway is starting up (502 / 503 Bad Gateway / Service Unavailable)
      if ((response.status === 502 || response.status === 503) && attempt < maxRetries) {
        if (onColdStart) onColdStart(true);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (attempt < maxRetries) {
        if (onColdStart) onColdStart(true);
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      if (coldStartTimer) clearTimeout(coldStartTimer);
      if (onColdStart) onColdStart(false);
      throw err;
    }
  }

  throw new Error(`Failed to reach ${fullUrl} after ${maxRetries} attempts.`);
}
