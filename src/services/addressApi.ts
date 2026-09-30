import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api';
import type { AddressPayload, UserAddress } from '@/types/address';
import type { ApiEnvelope } from '@/types/auth';

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readNullableString(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function readNullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function firstErrorMessage(errors: ApiEnvelope['errors']): string | null {
  if (!errors || Array.isArray(errors) || typeof errors !== 'object') {
    return null;
  }

  for (const value of Object.values(errors)) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (Array.isArray(value)) {
      const message = value.find((item) => typeof item === 'string' && item.trim());
      if (typeof message === 'string') {
        return message;
      }
    }
  }

  return null;
}

function assertSuccess<T>(response: ApiEnvelope<T>, fallback: string): T {
  if (!response.success) {
    throw new Error(firstErrorMessage(response.errors) || response.message || fallback);
  }

  if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw new Error(response.message || fallback);
  }

  return response.data;
}

export function readUserAddress(value: unknown): UserAddress {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Address missing from server response.');
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);

  if (!Number.isFinite(id)) {
    throw new Error('Address missing from server response.');
  }

  return {
    id,
    user_id: Number(row.user_id),
    label: String(row.label ?? 'Other'),
    custom_label: readNullableString(row.custom_label),
    receiver_name: String(row.receiver_name ?? ''),
    receiver_phone: String(row.receiver_phone ?? ''),
    complete_address: String(row.complete_address ?? ''),
    area: readNullableString(row.area),
    street: readNullableString(row.street),
    city: readNullableString(row.city),
    state: readNullableString(row.state),
    country: readNullableString(row.country),
    postal_code: readNullableString(row.postal_code),
    latitude: readNullableNumber(row.latitude),
    longitude: readNullableNumber(row.longitude),
    is_default: readBoolean(row.is_default),
    is_current_location: readBoolean(row.is_current_location),
    created_at: readNullableString(row.created_at),
    updated_at: readNullableString(row.updated_at),
  };
}

export async function getCustomerAddresses(): Promise<UserAddress[]> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ addresses: UserAddress[] }>>(ENDPOINTS.USER_ADDRESSES, {});
  const data = assertSuccess(response.data, 'Unable to load addresses.');
  const addresses = (data as { addresses?: unknown }).addresses;

  if (!Array.isArray(addresses)) {
    return [];
  }

  return addresses.map((item) => readUserAddress(item));
}

export async function createCustomerAddress(payload: AddressPayload): Promise<UserAddress> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ address: UserAddress }>>(
    ENDPOINTS.USER_ADDRESS_STORE,
    payload
  );
  const data = assertSuccess(response.data, 'Unable to save address.');

  return readUserAddress((data as { address?: unknown }).address);
}

export async function updateCustomerAddress(id: number, payload: AddressPayload): Promise<UserAddress> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ address: UserAddress }>>(
    ENDPOINTS.userAddressUpdate(id),
    payload
  );
  const data = assertSuccess(response.data, 'Unable to update address.');

  return readUserAddress((data as { address?: unknown }).address);
}

export async function deleteCustomerAddress(id: number): Promise<void> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope>(ENDPOINTS.userAddressDelete(id), {});

  if (!response.data.success) {
    throw new Error(firstErrorMessage(response.data.errors) || response.data.message || 'Unable to delete address.');
  }
}

export async function setDefaultCustomerAddress(id: number): Promise<UserAddress> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ address: UserAddress }>>(
    ENDPOINTS.userAddressDefault(id),
    {}
  );
  const data = assertSuccess(response.data, 'Unable to update default address.');

  return readUserAddress((data as { address?: unknown }).address);
}
