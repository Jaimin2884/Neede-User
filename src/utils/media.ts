import { API_BASE_URL } from '@/constants/config';

/** Turn a stored relative path (uploads/...) into a public URL. */
export function resolveMediaUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const rawValue = value.trim();
  if (!rawValue) {
    return '';
  }

  if (/^(https?:|file:|content:|data:|blob:)/i.test(rawValue)) {
    return rawValue;
  }

  if (!API_BASE_URL) {
    return rawValue;
  }

  const appBaseUrl = API_BASE_URL.replace(/\/+$/, '').replace(/\/api(?:\/v\d+)?$/i, '');
  const cleanPath = rawValue
    .replace(/\\/g, '/')
    .replace(/^public\//i, '')
    .replace(/^\/+/, '');

  return `${appBaseUrl}/${cleanPath}`;
}
