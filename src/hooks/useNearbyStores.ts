import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getApiErrorMessage } from '@/services/api';
import { getNearbyStores } from '@/services/storeApi';
import type { StoreItem } from '@/types/home';

export function useNearbyStores() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);

    try {
      const nextStores = await getNearbyStores();
      setStores(nextStores);
      setError(null);
    } catch (loadError) {
      setStores([]);
      setError(getApiErrorMessage(loadError, 'Unable to load nearby stores.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStores();
    }, [loadStores])
  );

  return { stores, loading, error, reload: loadStores };
}
