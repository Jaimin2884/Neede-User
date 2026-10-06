import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';
import type {
  CategoryBrowseFilters,
  CategoryProduct,
  CategoryProductListing,
  CategorySubCategory,
  ProductBrandOption,
  ProductFilterOptions,
  ProductSort,
} from '@/features/product/types/product';
import { parseCategoryProduct } from '@/features/product/api/parseProduct';
import { resolveMediaUrl } from '@/utils/media';

const SORTS: ProductSort[] = ['name_asc', 'name_desc', 'price_asc', 'price_desc'];

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readSubCategory(value: unknown): CategorySubCategory | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const imageUrl = resolveMediaUrl(row.image);

  return {
    id: String(id),
    name,
    imageUrl: imageUrl || undefined,
  };
}

function readProduct(value: unknown): CategoryProduct | null {
  return parseCategoryProduct(value);
}

function readBrand(value: unknown): ProductBrandOption | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();

  if (!Number.isFinite(id) || id < 1 || !name) {
    return null;
  }

  return { id: String(id), name };
}

function readFilters(value: unknown): ProductFilterOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { types: [], brands: [] };
  }

  const row = value as Record<string, unknown>;
  const types = Array.isArray(row.types)
    ? row.types
        .map((item) => String(item ?? '').trim())
        .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index)
    : [];
  const brands = Array.isArray(row.brands)
    ? row.brands.flatMap((item) => {
        const brand = readBrand(item);
        return brand ? [brand] : [];
      })
    : [];

  return { types, brands };
}

export async function getCategoryProducts(
  categoryId: string,
  subCategoryId: string | undefined,
  filters: CategoryBrowseFilters
): Promise<CategoryProductListing> {
  ensureApiConfigured();

  const category = Number(categoryId);
  const subCategory = Number(subCategoryId);
  const brandId = Number(filters.brandId);
  const sort = SORTS.includes(filters.sort) ? filters.sort : 'name_asc';

  if (!Number.isFinite(category) || category < 1) {
    throw new Error('Category not found.');
  }

  const response = await api.post<
    ApiEnvelope<{
      category?: unknown;
      sub_categories?: unknown;
      selected_sub_category_id?: unknown;
      products?: unknown;
      filters?: unknown;
      needs_address?: unknown;
    }>
  >(ENDPOINTS.USER_CATEGORY_PRODUCTS, {
    category_id: category,
    sub_category_id: Number.isFinite(subCategory) && subCategory > 0 ? subCategory : undefined,
    sort,
    type: filters.type?.trim() || undefined,
    brand_id: Number.isFinite(brandId) && brandId > 0 ? brandId : undefined,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load products.');
  }

  const payload = response.data.data;
  const data = payload && !Array.isArray(payload) ? payload : {};
  const categoryRow =
    data.category && typeof data.category === 'object' && !Array.isArray(data.category)
      ? (data.category as Record<string, unknown>)
      : {};
  const subCategories = Array.isArray(data.sub_categories)
    ? data.sub_categories.flatMap((item) => {
        const subCategoryItem = readSubCategory(item);
        return subCategoryItem ? [subCategoryItem] : [];
      })
    : [];
  const products = Array.isArray(data.products)
    ? data.products.flatMap((item) => {
        const product = readProduct(item);
        return product ? [product] : [];
      })
    : [];
  const selectedId = Number(data.selected_sub_category_id);

  return {
    categoryId: String(categoryRow.id ?? categoryId),
    categoryName: String(categoryRow.name ?? '').trim(),
    selectedSubCategoryId: Number.isFinite(selectedId) && selectedId > 0 ? String(selectedId) : '',
    subCategories,
    products,
    filters: readFilters(data.filters),
    needsAddress: data.needs_address === true,
  };
}
