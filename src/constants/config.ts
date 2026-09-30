const rawApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? null;

/** Axios base URL. Laravel API routes are under `/api`. */
export const API_BASE_URL = rawApiUrl
  ? rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl}/api`
  : null;

export const ENCRYPTION_KEYS = {
  k1: process.env.EXPO_PUBLIC_ENCRYPTION_KEY_1 ?? '',
  k2: process.env.EXPO_PUBLIC_ENCRYPTION_KEY_2 ?? '',
  k3: process.env.EXPO_PUBLIC_ENCRYPTION_KEY_3 ?? '',
} as const;

export const OTP_LENGTH = 4;
export const DEFAULT_OTP_RESEND_SECONDS = 45;
