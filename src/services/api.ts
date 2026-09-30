import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import * as ExpoCrypto from 'expo-crypto';

import { API_BASE_URL } from '@/constants/config';
import type { ApiEnvelope } from '@/types/auth';
import { decryptPayload, encryptPayload } from '@/utils/encryption';
import { getAuthToken } from '@/utils/storage';

type EncryptedRequestConfig = InternalAxiosRequestConfig & {
  skipEncryption?: boolean;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createNonce(): Promise<string> {
  const bytes = await ExpoCrypto.getRandomBytesAsync(16);
  return bytesToHex(bytes);
}

function maybeDecryptField(value: unknown): unknown {
  if (typeof value === 'string' && value.length > 0) {
    return decryptPayload(value);
  }

  return value;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL ?? undefined,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: EncryptedRequestConfig) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['X-Request-Time'] = String(Math.floor(Date.now() / 1000));
  config.headers['X-Request-Nonce'] = await createNonce();

  if (!config.skipEncryption && config.data !== undefined && config.data !== null) {
    const plaintext = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    config.data = { data: encryptPayload(plaintext) };
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiEnvelope;
    if (body && typeof body === 'object') {
      response.data = {
        ...body,
        data: maybeDecryptField(body.data),
        errors: maybeDecryptField(body.errors),
      };
    }

    return response;
  },
  (error: AxiosError<ApiEnvelope>) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      const body = error.response.data;
      error.response.data = {
        ...body,
        data: maybeDecryptField(body.data) as ApiEnvelope['data'],
        errors: maybeDecryptField(body.errors) as ApiEnvelope['errors'],
      };
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
