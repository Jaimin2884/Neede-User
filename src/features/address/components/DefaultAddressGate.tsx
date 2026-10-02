import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { AddressRequiredModal } from '@/features/address/components/AddressRequiredModal';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api/errors';
import { getCustomerAddresses, setDefaultCustomerAddress } from '@/features/address/api/addressApi';
import type { UserAddress } from '@/features/address/types/address';

function isAddressFormRoute(segments: readonly string[]) {
  return segments[0] === 'address-book' && segments[1] === 'form';
}

export function DefaultAddressGate() {
  const { isAuthenticated, isHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[] | null>(null);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const loadAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses(null);
      return;
    }

    try {
      const nextAddresses = await getCustomerAddresses();
      setAddresses(nextAddresses);
    } catch {
      setAddresses(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void loadAddresses();
  }, [isHydrated, loadAddresses, segments]);

  const hasDefault = addresses?.some((address) => address.is_default) ?? false;
  const onAddressForm = isAddressFormRoute(segments);
  const visible = Boolean(isAuthenticated && addresses && !hasDefault && !onAddressForm);

  const openAddAddress = () => {
    router.push({ pathname: '/address-book/form', params: { required: '1' } });
  };

  const selectAddress = async (address: UserAddress) => {
    if (selectingId !== null) {
      return;
    }

    setSelectingId(address.id);

    try {
      await setDefaultCustomerAddress(address.id);
      await loadAddresses();
    } catch (error) {
      Alert.alert('Update failed', getApiErrorMessage(error, 'Unable to select this address.'));
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <AddressRequiredModal
      visible={visible}
      addresses={addresses ?? []}
      selectingId={selectingId}
      onAddAddress={openAddAddress}
      onSelectAddress={(address) => {
        void selectAddress(address);
      }}
    />
  );
}
