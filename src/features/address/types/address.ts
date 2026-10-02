export type AddressLabel = 'Home' | 'Work' | 'Hotel' | 'Other';

export type UserAddress = {
  id: number;
  user_id: number;
  label: string;
  custom_label: string | null;
  receiver_name: string;
  receiver_phone: string;
  complete_address: string;
  area: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  is_current_location: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type AddressPayload = {
  label: AddressLabel;
  custom_label?: string | null;
  receiver_name: string;
  receiver_phone: string;
  complete_address: string;
  area?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
  is_current_location?: boolean;
};
