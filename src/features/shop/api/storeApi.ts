import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api/client';
import type { CategoryProduct } from '@/features/product/types/product';
import type { StoreCatalogCategory, StoreCatalogSubCategory, StoreItem, StoreProfile } from '@/features/shop/types/shop';
import type { ApiEnvelope } from '@/types/common';
import { resolveMediaUrl } from '@/utils/media';

const NEARBY_RADIUS_KM = 3;

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`;
  }

  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function formatEta(km: number): string {
  const start = Math.max(8, Math.round(8 + km * 4));
  return `${start}-${start + 5} mins`;
}

function logoText(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || 'ST';
}

function readStore(value: unknown): StoreItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();
  const distanceKm = Number(row.distance_km);

  if (!Number.isFinite(id) || !name || !Number.isFinite(distanceKm) || distanceKm > NEARBY_RADIUS_KM) {
    return null;
  }

  const isOpen = row.is_open === true || row.is_open === 1 || row.is_open === '1';
  const imageUrl = resolveMediaUrl(row.image) || resolveMediaUrl(row.logo);
  const logoUrl = resolveMediaUrl(row.logo);
  const tagline = String(row.tagline ?? '').trim();

  return {
    id: String(id),
    name,
    rating: null,
    distance: formatDistance(distanceKm),
    time: formatEta(distanceKm),
    tag: isOpen ? 'OPEN' : 'CLOSED',
    isOpen,
    imageUrl: imageUrl || undefined,
    logoUrl: logoUrl || undefined,
    tagline: tagline || undefined,
    logoText: logoText(name),
  };
}

function readCatalogProduct(value: unknown): CategoryProduct | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();
  const price = Number(row.price);

  if (!Number.isFinite(id) || !name || !Number.isFinite(price)) {
    return null;
  }

  const mrpValue = Number(row.mrp);
  const discount = Number(row.discount_percent);
  const imageUrl = resolveMediaUrl(row.image);

  return {
    id: String(id),
    name,
    imageUrl: imageUrl || undefined,
    unitLabel: String(row.unit_label ?? '').trim(),
    price,
    mrp: Number.isFinite(mrpValue) && mrpValue > price ? mrpValue : null,
    discountPercent: Number.isFinite(discount) ? Math.max(0, Math.round(discount)) : 0,
    unitPriceLabel: String(row.unit_price_label ?? '').trim(),
  };
}

function readCatalogSubCategory(value: unknown): StoreCatalogSubCategory | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const productCount = Number(row.product_count);
  if (!Number.isFinite(productCount) || productCount < 1) {
    return null;
  }

  const imageUrl = resolveMediaUrl(row.image);

  return {
    id: String(id),
    name,
    imageUrl: imageUrl || undefined,
    productCount,
  };
}

function readCatalogCategory(value: unknown): StoreCatalogCategory | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const subCategories = Array.isArray(row.sub_categories)
    ? row.sub_categories.flatMap((item) => {
        const subCategory = readCatalogSubCategory(item);
        return subCategory ? [subCategory] : [];
      })
    : [];

  if (subCategories.length === 0) {
    return null;
  }

  return {
    id: String(id),
    name,
    subCategories,
  };
}

function readStoreProfile(value: unknown): StoreProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();
  const distanceKm = Number(row.distance_km);

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const imageUrl = resolveMediaUrl(row.image);
  const logoUrl = resolveMediaUrl(row.logo);
  const isOpen = row.is_open === true || row.is_open === 1 || row.is_open === '1';

  return {
    id: String(id),
    name,
    tagline: String(row.tagline ?? '').trim(),
    city: String(row.city ?? '').trim(),
    distance: Number.isFinite(distanceKm) ? formatDistance(distanceKm) : '',
    time: Number.isFinite(distanceKm) ? formatEta(distanceKm) : '',
    isOpen,
    imageUrl: imageUrl || undefined,
    logoUrl: logoUrl || undefined,
  };
}

export type StoreProductPage = {
  products: CategoryProduct[];
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
  needsAddress: boolean;
};

export type StoreCatalogPreview = {
  subCategoryId: string;
  page: StoreProductPage;
};

export type StoreCatalogResult = {
  store: StoreProfile | null;
  categories: StoreCatalogCategory[];
  preview: StoreCatalogPreview | null;
  needsAddress: boolean;
};

function readProductPage(data: Record<string, unknown>): StoreProductPage {
  const products = Array.isArray(data.products)
    ? data.products.flatMap((item) => {
        const product = readCatalogProduct(item);
        return product ? [product] : [];
      })
    : [];
  const page = Number(data.page);
  const perPage = Number(data.per_page);
  const total = Number(data.total);

  return {
    products,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: Number.isFinite(perPage) && perPage > 0 ? perPage : products.length,
    total: Number.isFinite(total) && total >= 0 ? total : products.length,
    hasMore: data.has_more === true,
    needsAddress: data.needs_address === true,
  };
}

export async function getStoreCatalog(vendorId: string): Promise<StoreCatalogResult> {
  ensureApiConfigured();

  const id = Number(vendorId);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('Store not found.');
  }

  const response = await api.post<
    ApiEnvelope<{
      store?: unknown;
      categories?: unknown;
      preview?: unknown;
      needs_address?: unknown;
    }>
  >(ENDPOINTS.USER_STORE_CATALOG, {
    vendor_id: id,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load this store.');
  }

  const payload = response.data.data;
  const data = payload && !Array.isArray(payload) ? payload : {};
  const categories = Array.isArray(data.categories)
    ? data.categories.flatMap((item) => {
        const category = readCatalogCategory(item);
        return category ? [category] : [];
      })
    : [];
  const previewRow =
    data.preview && typeof data.preview === 'object' && !Array.isArray(data.preview)
      ? (data.preview as Record<string, unknown>)
      : null;
  const previewId = Number(previewRow?.sub_category_id);
  const preview = previewRow && Number.isFinite(previewId) && previewId > 0
    ? { subCategoryId: String(previewId), page: readProductPage(previewRow) }
    : null;

  return {
    store: readStoreProfile(data.store),
    categories,
    preview,
    needsAddress: data.needs_address === true,
  };
}

export async function getStoreProducts(
  vendorId: string,
  options: { subCategoryId?: string; query?: string; page?: number; perPage?: number }
): Promise<StoreProductPage> {
  ensureApiConfigured();

  const id = Number(vendorId);
  const subCategoryId = Number(options.subCategoryId);
  const page = options.page ?? 1;
  const query = options.query?.trim() ?? '';

  if (!Number.isFinite(id) || id < 1) {
    throw new Error('Store not found.');
  }

  const response = await api.post<ApiEnvelope<Record<string, unknown>>>(ENDPOINTS.USER_STORE_PRODUCTS, {
    vendor_id: id,
    sub_category_id: Number.isFinite(subCategoryId) && subCategoryId > 0 ? subCategoryId : undefined,
    q: query || undefined,
    page,
    per_page: options.perPage ?? 8,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load products.');
  }

  const payload = response.data.data;
  const data = payload && !Array.isArray(payload) ? payload : {};

  return readProductPage(data);
}

export async function getNearbyStores(): Promise<StoreItem[]> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<{ stores?: unknown }>>(ENDPOINTS.USER_STORES_NEARBY, {});

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load nearby stores.');
  }

  const payload = response.data.data;
  const stores = payload && !Array.isArray(payload) ? payload.stores : undefined;
  if (!Array.isArray(stores)) {
    return [];
  }

  return stores.flatMap((item) => {
    const store = readStore(item);
    return store ? [store] : [];
  });
}
