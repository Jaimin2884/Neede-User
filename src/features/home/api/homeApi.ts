import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api/client';
import type { ApiEnvelope } from '@/types/common';
import type { CategoryItem, HomeCategorySection } from '@/features/home/types/home';
import { resolveMediaUrl } from '@/utils/media';

function ensureApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('API address is not configured.');
  }
}

function readSubCategory(value: unknown, categoryId: string): CategoryItem | null {
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
    categoryId,
    remoteImageUrl: imageUrl || undefined,
    iconFallback: 'basket-outline',
  };
}

function readSection(value: unknown): HomeCategorySection | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = Number(row.id);
  const name = String(row.name ?? '').trim();
  const subCategories = Array.isArray(row.sub_categories) ? row.sub_categories : [];

  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const categoryId = String(id);
  const items = subCategories.flatMap((item) => {
    const subCategory = readSubCategory(item, categoryId);
    return subCategory ? [subCategory] : [];
  });

  if (items.length === 0) {
    return null;
  }

  return {
    id: categoryId,
    name,
    items,
  };
}

export type HomeCategoriesPage = {
  sections: HomeCategorySection[];
  page: number;
  hasMore: boolean;
};

export async function getHomeCategories(options?: {
  page?: number;
  perPage?: number;
}): Promise<HomeCategoriesPage> {
  ensureApiConfigured();

  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 2;

  const response = await api.post<
    ApiEnvelope<{ categories?: unknown; page?: unknown; has_more?: unknown }>
  >(ENDPOINTS.USER_HOME_CATEGORIES, {
    page,
    per_page: perPage,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to load home categories.');
  }

  const payload = response.data.data;
  const categories = payload && !Array.isArray(payload) ? payload.categories : undefined;
  const responsePage = payload && !Array.isArray(payload) ? Number(payload.page) : page;
  const sections = Array.isArray(categories)
    ? categories.flatMap((item) => {
        const section = readSection(item);
        return section ? [section] : [];
      })
    : [];

  return {
    sections,
    page: Number.isFinite(responsePage) && responsePage > 0 ? responsePage : page,
    hasMore: Boolean(payload && !Array.isArray(payload) && payload.has_more),
  };
}
