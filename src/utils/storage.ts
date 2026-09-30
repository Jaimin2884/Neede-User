import * as SecureStore from 'expo-secure-store';

import type { AuthUser } from '@/types/auth';

const TOKEN_KEY = 'neede_user_token';
const USER_KEY = 'neede_user_profile';
const LEGACY_ACTIVITY_KEY = 'neede_user_last_activity';
const LEGACY_EXPIRES_AT_KEY = 'neede_user_token_expires_at';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

async function deleteIfPresent(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore a missing key.
  }
}

export async function saveAuthSession(token: string, user: AuthUser): Promise<void> {
  if (!token.trim()) {
    throw new Error('Cannot save an empty auth token.');
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token, secureStoreOptions);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), secureStoreOptions);
  await deleteIfPresent(LEGACY_ACTIVITY_KEY);
  await deleteIfPresent(LEGACY_EXPIRES_AT_KEY);

  const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (savedToken !== token) {
    throw new Error('Failed to persist auth token locally.');
  }
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.mobile !== 'string' || typeof parsed.id !== 'number') {
      return null;
    }

    return {
      ...parsed,
      name: parsed.name ?? null,
      email: parsed.email ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await deleteIfPresent(TOKEN_KEY);
  await deleteIfPresent(USER_KEY);
  await deleteIfPresent(LEGACY_ACTIVITY_KEY);
  await deleteIfPresent(LEGACY_EXPIRES_AT_KEY);
}
