import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { parseCategoryProduct } from '@/features/product/api/parseProduct';
import type {
  NearbyStoreOffer,
  ProductDetail,
  ProductDetailResult,
  ProductImage,
  ProductSize,
  StoreOffer,
} from '@/features/product/types/productDetail';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';
import { resolveMediaUrl } from '@/utils/media';

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readSize(value: unknown): ProductSize | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const unitLabel = String(row.unit_label ?? '').trim();

  if (!Number.isFinite(id) || id < 1) {
    return null;
  }

  return {
    id: String(id),
    name: String(row.name ?? unitLabel).trim() || unitLabel,
    unitLabel,
  };
}

function readImage(value: unknown): ProductImage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const imageUrl = resolveMediaUrl(row.image);
  if (!imageUrl) {
    return null;
  }

  const variantId = Number(row.variant_id);

  return {
    variantId: Number.isFinite(variantId) && variantId > 0 ? String(variantId) : null,
    imageUrl,
  };
}

function readOffer(value: unknown): StoreOffer | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const variantId = Number(row.variant_id);
  const price = Number(row.price);

  if (!Number.isFinite(variantId) || variantId < 1 || !Number.isFinite(price)) {
    return null;
  }

  const mrp = Number(row.mrp);
  const discount = Number(row.discount_percent);

  return {
    variantId: String(variantId),
    unitLabel: String(row.unit_label ?? '').trim(),
    price,
    mrp: Number.isFinite(mrp) && mrp > price ? mrp : null,
    discountPercent: Number.isFinite(discount) ? Math.max(0, Math.round(discount)) : 0,
  };
}

function readStore(value: unknown): NearbyStoreOffer | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  const distanceKm = Number(row.distance_km);

  if (!Number.isFinite(id) || id < 1 || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const offers = Array.isArray(row.offers)
    ? row.offers.flatMap((item) => {
        const offer = readOffer(item);
        return offer ? [offer] : [];
      })
    : [];

  if (offers.length === 0) {
    return null;
  }

  const logoUrl = resolveMediaUrl(row.logo);
  const minutes = Number(row.delivery_minutes);

  return {
    id: String(id),
    name,
    logoUrl: logoUrl || undefined,
    city: String(row.city ?? '').trim(),
    address: String(row.address ?? '').trim(),
    latitude,
    longitude,
    isOpen: row.is_open === true || row.is_open === 1 || row.is_open === '1',
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
    deliveryMinutes: Number.isFinite(minutes) ? Math.max(12, Math.round(minutes)) : 12,
    offers,
  };
}

function readProduct(value: unknown): ProductDetail | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const variantId = Number(row.variant_id);
  const name = String(row.name ?? '').trim();

  if (!Number.isFinite(id) || id < 1 || !Number.isFinite(variantId) || variantId < 1 || !name) {
    return null;
  }

  const variants = Array.isArray(row.variants)
    ? row.variants.flatMap((item) => {
        const size = readSize(item);
        return size ? [size] : [];
      })
    : [];
  const images = Array.isArray(row.images)
    ? row.images.flatMap((item) => {
        const image = readImage(item);
        return image ? [image] : [];
      })
    : [];

  return {
    id: String(id),
    variantId: String(variantId),
    name,
    brand: String(row.brand ?? '').trim(),
    category: String(row.category ?? '').trim(),
    subCategory: String(row.sub_category ?? '').trim(),
    about: String(row.about ?? '').trim(),
    images,
    variants,
  };
}

export async function getProductDetail(variantId: string): Promise<ProductDetailResult> {
  ensureApiConfigured();

  const variant = Number(variantId);
  if (!Number.isFinite(variant) || variant < 1) {
    throw new Error('Product not found.');
  }

  const response = await api.post<
    ApiEnvelope<{
      radius_km?: unknown;
      needs_address?: unknown;
      product?: unknown;
      stores?: unknown;
      related?: unknown;
    }>
  >(ENDPOINTS.USER_PRODUCT_DETAIL, { variant_id: variant });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load this product.');
  }

  const payload = response.data.data;
  const data = payload && !Array.isArray(payload) ? payload : {};
  const product = readProduct(data.product);

  if (!product) {
    throw new Error('Product not found.');
  }

  const radius = Number(data.radius_km);

  return {
    radiusKm: Number.isFinite(radius) && radius > 0 ? radius : 3,
    needsAddress: data.needs_address === true,
    product,
    stores: Array.isArray(data.stores)
      ? data.stores.flatMap((item) => {
          const store = readStore(item);
          return store ? [store] : [];
        })
      : [],
    related: Array.isArray(data.related)
      ? data.related.flatMap((item) => {
          const related = parseCategoryProduct(item);
          return related ? [related] : [];
        })
      : [],
  };
}
