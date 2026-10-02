import type { UserAddress } from '@/features/address/types/address';

export function displayAddressLabel(address: Pick<UserAddress, 'label' | 'custom_label'>): string {
  if (address.label === 'Other' && address.custom_label) {
    return address.custom_label;
  }

  return address.label || 'Other';
}

export function formatAddressPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return phone;
}
