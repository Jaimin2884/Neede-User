import { API_BASE_URL } from '@/constants/config';
import { ENDPOINTS } from '@/constants/endpoints';
import { api } from '@/services/api';
import type { StoreItem } from '@/types/home';
import type { ApiEnvelope } from '@/types/auth';
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

  return {
    id: String(id),
    name,
    rating: null,
    distance: formatDistance(distanceKm),
    time: formatEta(distanceKm),
    tag: isOpen ? 'OPEN' : 'CLOSED',
    isOpen,
    imageUrl: imageUrl || undefined,
    logoText: logoText(name),
  };
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
