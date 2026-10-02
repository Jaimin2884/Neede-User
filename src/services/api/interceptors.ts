import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as ExpoCrypto from 'expo-crypto';

import type { ApiEnvelope } from '@/types/common';
import { decryptPayload, encryptPayload } from '@/utils/encryption';
import { getAuthToken } from '@/services/storage';

import { isUnauthenticatedError } from './errors';

type EncryptedRequestConfig = InternalAxiosRequestConfig & {
  skipEncryption?: boolean;
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

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

export function attachApiInterceptors(api: AxiosInstance): void {
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

      if (isUnauthenticatedError(error)) {
        unauthorizedHandler?.();
      }

      return Promise.reject(error);
    }
  );
}
