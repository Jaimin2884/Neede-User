import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getHomeCategories } from '@/features/home/api/homeApi';
import { getApiErrorMessage } from '@/services/api/errors';
import type { HomeCategorySection } from '@/features/home/types/home';

const PAGE_SIZE = 2;

export function useHomeCategories() {
  const [sections, setSections] = useState<HomeCategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const requestRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyPage = useCallback((page: number, hasNext: boolean) => {
    pageRef.current = page;
    hasMoreRef.current = hasNext;
    if (mountedRef.current) {
      setHasMore(hasNext);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    const requestId = ++requestRef.current;
    loadingMoreRef.current = false;
    if (mountedRef.current) {
      setLoading(true);
      setLoadingMore(false);
    }

    try {
      const result = await getHomeCategories({ page: 1, perPage: PAGE_SIZE });
      if (!mountedRef.current || requestId !== requestRef.current) {
        return;
      }
      setSections(result.sections);
      applyPage(result.page, result.hasMore);
      setError(null);
    } catch (loadError) {
      if (!mountedRef.current || requestId !== requestRef.current) {
        return;
      }
      setSections([]);
      applyPage(1, false);
      setError(getApiErrorMessage(loadError, 'Unable to load categories.'));
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [applyPage]);

  const loadMore = useCallback(async () => {
    if (!mountedRef.current || loadingMoreRef.current || !hasMoreRef.current) {
      return;
    }

    const requestId = requestRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const result = await getHomeCategories({ page: pageRef.current + 1, perPage: PAGE_SIZE });
      if (!mountedRef.current || requestId !== requestRef.current) {
        return;
      }

      setSections((current) => {
        const seen = new Set(current.map((section) => section.id));
        return [...current, ...result.sections.filter((section) => !seen.has(section.id))];
      });
      applyPage(result.page, result.hasMore);
    } catch {
      if (mountedRef.current && requestId === requestRef.current) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } finally {
      loadingMoreRef.current = false;
      if (mountedRef.current && requestId === requestRef.current) {
        setLoadingMore(false);
      }
    }
  }, [applyPage]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        void loadCategories();
      }, 0);

      return () => {
        clearTimeout(timer);
        requestRef.current += 1;
      };
    }, [loadCategories])
  );

  return { sections, loading, loadingMore, hasMore, error, loadMore, reload: loadCategories };
}
