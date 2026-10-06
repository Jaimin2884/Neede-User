import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { parseCategoryProduct } from '@/features/product/api/parseProduct';
import type { CartLine, CartSnapshot } from '@/features/cart/types/cart';
import type { CategoryProduct } from '@/features/product/types/product';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';
import { resolveMediaUrl } from '@/utils/media';

export type CartResponse = CartSnapshot & {
  suggestions: CategoryProduct[];
};

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readLine(value: unknown): CartLine | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const storeId = Number(row.vendor_id);
  const variantId = Number(row.variant_id);
  const productId = Number(row.product_id);
  const price = Number(row.price);
  const quantity = Number(row.quantity);
  const name = String(row.name ?? '').trim();
  const storeName = String(row.store_name ?? '').trim();

  if (
    !Number.isFinite(id) ||
    !Number.isFinite(storeId) ||
    storeId < 1 ||
    !Number.isFinite(variantId) ||
    !name ||
    !Number.isFinite(price) ||
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    return null;
  }

  const mrp = Number(row.mrp);
  const discount = Number(row.discount_percent);
  const imageUrl = resolveMediaUrl(row.image);

  return {
    id: String(id),
    storeId: String(storeId),
    storeName: storeName || 'Store',
    variantId: String(variantId),
    productId: Number.isFinite(productId) ? String(productId) : '',
    name,
    imageUrl: imageUrl || undefined,
    unitLabel: String(row.unit_label ?? '').trim(),
    price,
    mrp: Number.isFinite(mrp) && mrp > price ? mrp : null,
    discountPercent: Number.isFinite(discount) ? Math.max(0, Math.round(discount)) : 0,
    quantity,
  };
}

function readCart(data: unknown): CartResponse {
  const row = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const maxStores = Number(row.max_stores);
  const storeCount = Number(row.store_count);

  return {
    maxStores: Number.isFinite(maxStores) && maxStores > 0 ? maxStores : 2,
    storeCount: Number.isFinite(storeCount) ? storeCount : 0,
    items: Array.isArray(row.items)
      ? row.items.flatMap((item) => {
          const line = readLine(item);
          return line ? [line] : [];
        })
      : [],
    suggestions: Array.isArray(row.suggestions)
      ? row.suggestions.flatMap((item) => {
          const product = parseCategoryProduct(item);
          return product ? [product] : [];
        })
      : [],
  };
}

async function postCart(endpoint: string, body: Record<string, unknown>): Promise<CartResponse> {
  ensureApiConfigured();

  const response = await api.post<ApiEnvelope<unknown>>(endpoint, body);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to update the cart.');
  }

  return readCart(response.data.data);
}

export function fetchCart(): Promise<CartResponse> {
  return postCart(ENDPOINTS.USER_CART, {});
}

export function addCartItem(vendorId: number, variantId: number, quantity = 1): Promise<CartResponse> {
  return postCart(ENDPOINTS.USER_CART_ADD, {
    vendor_id: vendorId,
    variant_id: variantId,
    quantity,
  });
}

export function updateCartItem(vendorId: number, variantId: number, quantity: number): Promise<CartResponse> {
  return postCart(ENDPOINTS.USER_CART_UPDATE, {
    vendor_id: vendorId,
    variant_id: variantId,
    quantity,
  });
}
