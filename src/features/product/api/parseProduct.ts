import type { CategoryProduct } from '@/features/product/types/product';
import { resolveMediaUrl } from '@/utils/media';

export function parseCategoryProduct(value: unknown): CategoryProduct | null {
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
  const productId = Number(row.product_id);
  const storeId = Number(row.vendor_id);
  const storeName = String(row.store_name ?? '').trim();

  return {
    id: String(id),
    productId: Number.isFinite(productId) && productId > 0 ? String(productId) : undefined,
    storeId: Number.isFinite(storeId) && storeId > 0 ? String(storeId) : undefined,
    storeName: storeName || undefined,
    name,
    imageUrl: imageUrl || undefined,
    unitLabel: String(row.unit_label ?? '').trim(),
    price,
    mrp: Number.isFinite(mrpValue) && mrpValue > price ? mrpValue : null,
    discountPercent: Number.isFinite(discount) ? Math.max(0, Math.round(discount)) : 0,
    unitPriceLabel: String(row.unit_price_label ?? '').trim(),
  };
}
