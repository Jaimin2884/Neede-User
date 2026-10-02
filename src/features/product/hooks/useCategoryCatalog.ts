import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getApiErrorMessage } from '@/services/api/errors';
import { getCategoryProducts } from '@/features/product/api/productApi';
import {
  defaultCategoryBrowseFilters,
  type CategoryBrowseFilters,
  type CategoryProduct,
  type CategorySubCategory,
  type ProductFilterOptions,
} from '@/features/product/types/product';

type LoadMode = 'initial' | 'products' | 'refresh';

const emptyFilters: ProductFilterOptions = { types: [], brands: [] };

export function useCategoryCatalog(categoryId: string, initialSubCategoryId: string) {
  const [categoryName, setCategoryName] = useState('');
  const [subCategories, setSubCategories] = useState<CategorySubCategory[]>([]);
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<ProductFilterOptions>(emptyFilters);
  const [filters, setFilters] = useState<CategoryBrowseFilters>(defaultCategoryBrowseFilters);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(initialSubCategoryId);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [needsAddress, setNeedsAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedRef = useRef(initialSubCategoryId);
  const filtersRef = useRef<CategoryBrowseFilters>(defaultCategoryBrowseFilters);
  const hasDataRef = useRef(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (subCategoryId: string, mode: LoadMode, nextFilters: CategoryBrowseFilters = filtersRef.current) => {
      const requestId = ++requestRef.current;

      if (mode === 'initial') {
        setLoading(true);
      } else if (mode === 'products') {
        setProducts([]);
        setProductsLoading(true);
      } else {
        setProductsLoading(true);
      }

      try {
        const listing = await getCategoryProducts(categoryId, subCategoryId, nextFilters);

        if (requestId !== requestRef.current) {
          return;
        }

        const nextSelected = listing.selectedSubCategoryId || subCategoryId;
        selectedRef.current = nextSelected;
        filtersRef.current = nextFilters;
        hasDataRef.current = true;
        setCategoryName(listing.categoryName);
        setSubCategories(listing.subCategories);
        setProducts(listing.products);
        setFilterOptions(listing.filters);
        setFilters(nextFilters);
        setSelectedSubCategoryId(nextSelected);
        setNeedsAddress(listing.needsAddress);
        setError(null);
      } catch (loadError) {
        if (requestId !== requestRef.current) {
          return;
        }

        if (mode !== 'refresh') {
          setProducts([]);
        }

        setError(getApiErrorMessage(loadError, 'Unable to load products.'));
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setProductsLoading(false);
        }
      }
    },
    [categoryId]
  );

  useFocusEffect(
    useCallback(() => {
      void load(selectedRef.current || initialSubCategoryId, hasDataRef.current ? 'refresh' : 'initial');
    }, [initialSubCategoryId, load])
  );

  const selectSubCategory = useCallback(
    (subCategoryId: string) => {
      if (!subCategoryId || subCategoryId === selectedRef.current) {
        return;
      }

      const nextFilters: CategoryBrowseFilters = {
        ...filtersRef.current,
        type: null,
        brandId: null,
      };
      selectedRef.current = subCategoryId;
      setSelectedSubCategoryId(subCategoryId);
      setFilters(nextFilters);
      void load(subCategoryId, 'products', nextFilters);
    },
    [load]
  );

  const applyFilters = useCallback(
    (nextFilters: CategoryBrowseFilters) => {
      const current = filtersRef.current;
      if (
        nextFilters.sort === current.sort &&
        nextFilters.type === current.type &&
        nextFilters.brandId === current.brandId
      ) {
        return;
      }

      setFilters(nextFilters);
      void load(selectedRef.current || initialSubCategoryId, 'products', nextFilters);
    },
    [initialSubCategoryId, load]
  );

  return {
    categoryName,
    subCategories,
    products,
    filterOptions,
    filters,
    selectedSubCategoryId,
    loading,
    productsLoading,
    needsAddress,
    error,
    selectSubCategory,
    applyFilters,
    reload: () => load(selectedRef.current || initialSubCategoryId, hasDataRef.current ? 'refresh' : 'initial'),
  };
}
