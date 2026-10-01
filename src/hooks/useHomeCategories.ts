import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getHomeCategories } from '@/services/homeApi';
import { getApiErrorMessage } from '@/services/api';
import type { HomeCategorySection } from '@/types/home';

export function useHomeCategories() {
  const [sections, setSections] = useState<HomeCategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);

    try {
      const nextSections = await getHomeCategories();
      setSections(nextSections);
      setError(null);
    } catch (loadError) {
      setSections([]);
      setError(getApiErrorMessage(loadError, 'Unable to load categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCategories();
    }, [loadCategories])
  );

  return { sections, loading, error, reload: loadCategories };
}
