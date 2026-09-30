import * as ExpoCrypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

import { ENCRYPTION_KEYS } from '@/constants/config';

const CIPHER_MODE = CryptoJS.mode.CBC;
const CIPHER_PADDING = CryptoJS.pad.Pkcs7;
const MIN_LAYER_BYTES = 32;

function requireKeys(): [CryptoJS.lib.WordArray, CryptoJS.lib.WordArray, CryptoJS.lib.WordArray] {
  const raw = [ENCRYPTION_KEYS.k1, ENCRYPTION_KEYS.k2, ENCRYPTION_KEYS.k3];

  return raw.map((value, index) => {
    if (!value) {
      throw new Error(`Encryption key K${index + 1} is missing.`);
    }

    const decoded = CryptoJS.enc.Base64.parse(value);
    if (decoded.sigBytes !== 32) {
      throw new Error(`Encryption key K${index + 1} must Base64-decode to exactly 32 bytes.`);
    }

    return decoded;
  }) as [CryptoJS.lib.WordArray, CryptoJS.lib.WordArray, CryptoJS.lib.WordArray];
}

/** Secure IV via expo-crypto — crypto-js WordArray.random() fails in React Native. */
function randomIv(): CryptoJS.lib.WordArray {
  const bytes = ExpoCrypto.getRandomBytes(16);
  const words: number[] = [];

  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0
    );
  }

  return CryptoJS.lib.WordArray.create(words, 16);
}

function encryptLayer(payload: string, key: CryptoJS.lib.WordArray): string {
  const iv = randomIv();
  const encrypted = CryptoJS.AES.encrypt(payload, key, {
    iv,
    mode: CIPHER_MODE,
    padding: CIPHER_PADDING,
  });

  return CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext));
}

function decryptLayer(payload: string, key: CryptoJS.lib.WordArray): string {
  const binary = CryptoJS.enc.Base64.parse(payload);

  if (binary.sigBytes < MIN_LAYER_BYTES) {
    throw new Error('Invalid encrypted payload encoding or length.');
  }

  const iv = CryptoJS.lib.WordArray.create(binary.words.slice(0, 4), 16);
  const ciphertext = CryptoJS.lib.WordArray.create(binary.words.slice(4), binary.sigBytes - 16);
  const decrypted = CryptoJS.AES.decrypt({ ciphertext } as CryptoJS.lib.CipherParams, key, {
    iv,
    mode: CIPHER_MODE,
    padding: CIPHER_PADDING,
  });

  const plain = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plain) {
    throw new Error('Decryption failed.');
  }

  return plain;
}

/**
 * Encrypt K1 → K2 → K3 (matches Neede-API TripleEncryptionService).
 */
export function encryptPayload(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const keys = requireKeys();
  let payload = typeof value === 'string' ? value : JSON.stringify(value);

  for (const key of keys) {
    payload = encryptLayer(payload, key);
  }

  return payload;
}

/**
 * Decrypt K3 → K2 → K1. Returns parsed JSON when possible.
 */
export function decryptPayload(payload: string): unknown {
  if (!payload) {
    return null;
  }

  const keys = requireKeys();
  let current = payload;

  for (let i = keys.length - 1; i >= 0; i -= 1) {
    current = decryptLayer(current, keys[i]);
  }

  try {
    return JSON.parse(current);
  } catch {
    return current;
  }
}
