import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';
import type {
  AuthUser,
  SendOtpResult,
  UpdateProfileRequest,
  UserAuthPayload,
} from '@/features/auth/types/auth';

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readAuthUser(user: unknown, fallbackMobile = ''): AuthUser {
  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    throw new Error('User profile missing from server response.');
  }

  const profile = user as Record<string, unknown>;
  const authUser: AuthUser = {
    id: Number(profile.id),
    name: profile.name == null ? null : String(profile.name),
    email: profile.email == null ? null : String(profile.email),
    mobile: String(profile.mobile ?? fallbackMobile),
    mobile_verified_at:
      profile.mobile_verified_at == null ? null : String(profile.mobile_verified_at),
  };

  if (!Number.isFinite(authUser.id) || !authUser.mobile) {
    throw new Error('User profile missing from server response.');
  }

  return authUser;
}

export async function sendLoginOtp(mobile: string): Promise<SendOtpResult> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<SendOtpResult>>(ENDPOINTS.USER_AUTH_SEND_OTP, {
    mobile,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Could not send OTP.');
  }

  const data = response.data.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(response.data.message || 'Could not send OTP.');
  }

  const payload = data as Record<string, unknown>;

  const otp = typeof payload.otp === 'string' ? payload.otp : '';
  if (!/^\d{4}$/.test(otp)) {
    throw new Error('OTP missing from server response.');
  }

  return {
    mobile: String(payload.mobile ?? mobile),
    otp,
    expiresIn: readPositiveNumber(payload.expires_in, 300),
    resendAfter: readPositiveNumber(payload.resend_after, 45),
  };
}

export async function verifyLoginOtp(mobile: string, otp: string): Promise<UserAuthPayload> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<UserAuthPayload>>(ENDPOINTS.USER_AUTH_VERIFY_OTP, {
    mobile,
    otp,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Invalid or expired OTP.');
  }

  const data = response.data.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Login response was incomplete.');
  }

  const payload = data as Record<string, unknown>;
  const token = typeof payload.token === 'string' ? payload.token.trim() : '';

  if (!token) {
    throw new Error('Auth token missing from server response.');
  }

  return {
    token,
    token_type: typeof payload.token_type === 'string' ? payload.token_type : 'Bearer',
    user: readAuthUser(payload.user, mobile),
  };
}

export async function fetchCurrentSession(): Promise<AuthUser> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ user: AuthUser }>>(
    ENDPOINTS.USER_SESSION,
    {},
    { timeout: 8000 }
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Session is not valid.');
  }

  const data = response.data.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Session response was incomplete.');
  }

  return readAuthUser((data as Record<string, unknown>).user);
}

export async function updateUserProfile(payload: UpdateProfileRequest): Promise<AuthUser> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ user: AuthUser }>>(ENDPOINTS.USER_PROFILE_UPDATE, {
    name: payload.name.trim(),
    email: payload.email.trim(),
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Could not save profile changes.');
  }

  const data = response.data.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Profile response was incomplete.');
  }

  return readAuthUser((data as Record<string, unknown>).user);
}
