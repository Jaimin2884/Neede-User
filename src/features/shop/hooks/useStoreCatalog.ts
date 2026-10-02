import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/services/api/errors';
import { getStoreCatalog, getStoreProducts } from '@/features/shop/api/storeApi';
import type { StoreCatalogCategory, StoreProfile } from '@/features/shop/types/shop';
import type { CategoryProduct } from '@/features/product/types/product';

export type SubCategoryPageState = {
  products: CategoryProduct[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
};

function emptyPage(): SubCategoryPageState {
  return {
    products: [],
    page: 0,
    hasMore: true,
    loading: false,
    loaded: false,
  };
}

export function useStoreCatalog(vendorId: string) {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [categories, setCategories] = useState<StoreCatalogCategory[]>([]);
  const [pages, setPages] = useState<Record<string, SubCategoryPageState>>({});
  const [loading, setLoading] = useState(true);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pagesRef = useRef<Record<string, SubCategoryPageState>>({});
  const inflight = useRef(new Set<string>());

  const remember = useCallback((subCategoryId: string, next: SubCategoryPageState) => {
    pagesRef.current = { ...pagesRef.current, [subCategoryId]: next };
    setPages((current) => ({ ...current, [subCategoryId]: next }));
  }, []);

  const fetchPage = useCallback(
    async (subCategoryId: string, page: number) => {
      const key = `${subCategoryId}:${page}`;
      if (!vendorId || inflight.current.has(key)) {
        return;
      }

      const existing = pagesRef.current[subCategoryId] ?? emptyPage();
      if (page === 1 && (existing.loaded || existing.loading)) {
        return;
      }
      if (page > 1 && (existing.loading || !existing.loaded || !existing.hasMore || existing.page + 1 !== page)) {
        return;
      }

      inflight.current.add(key);
      remember(subCategoryId, { ...existing, loading: true });

      try {
        const result = await getStoreProducts(vendorId, { subCategoryId, page, perPage: 8 });
        const current = pagesRef.current[subCategoryId] ?? emptyPage();
        const mergedProducts = page === 1 ? result.products : [...current.products, ...result.products];
        const seen = new Set<string>();
        const products = mergedProducts.filter((product) => {
          if (seen.has(product.id)) {
            return false;
          }
          seen.add(product.id);
          return true;
        });

        remember(subCategoryId, {
          products,
          page: result.page,
          hasMore: result.hasMore,
          loading: false,
          loaded: true,
        });
      } catch {
        const current = pagesRef.current[subCategoryId] ?? emptyPage();
        remember(subCategoryId, { ...current, loading: false });
      } finally {
        inflight.current.delete(key);
      }
    },
    [remember, vendorId]
  );

  const ensureProducts = useCallback(
    (subCategoryId: string) => {
      const existing = pagesRef.current[subCategoryId];
      if (!existing || !existing.loaded) {
        void fetchPage(subCategoryId, 1);
        return;
      }

      if (!existing.loading && existing.hasMore) {
        void fetchPage(subCategoryId, existing.page + 1);
      }
    },
    [fetchPage]
  );

  const load = useCallback(async () => {
    if (!vendorId) {
      setLoading(false);
      setError('Store not found.');
      return;
    }

    setLoading(true);
    pagesRef.current = {};
    setPages({});
    inflight.current.clear();

    try {
      const result = await getStoreCatalog(vendorId);
      setStore(result.store);
      setCategories(result.categories);
      setNeedsAddress(result.needsAddress);
      setError(null);

      if (result.preview) {
        const previewState: SubCategoryPageState = {
          products: result.preview.page.products,
          page: result.preview.page.page,
          hasMore: result.preview.page.hasMore,
          loading: false,
          loaded: true,
        };
        pagesRef.current = { [result.preview.subCategoryId]: previewState };
        setPages(pagesRef.current);
      }
    } catch (loadError) {
      setStore(null);
      setCategories([]);
      pagesRef.current = {};
      setPages({});
      setError(getApiErrorMessage(loadError, 'Unable to load this store.'));
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    store,
    categories,
    pages,
    loading,
    needsAddress,
    error,
    ensureProducts,
    reload: load,
  };
}
