import type { CategoryProduct } from '@/features/product/types/product';

export type ProductSize = {
  id: string;
  name: string;
  unitLabel: string;
};

export type ProductImage = {
  variantId: string | null;
  imageUrl: string;
};

export type StoreOffer = {
  variantId: string;
  unitLabel: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
};

export type NearbyStoreOffer = {
  id: string;
  name: string;
  logoUrl?: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  distanceKm: number;
  deliveryMinutes: number;
  offers: StoreOffer[];
};

export type ProductDetail = {
  id: string;
  variantId: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  about: string;
  images: ProductImage[];
  variants: ProductSize[];
};

export type ProductDetailResult = {
  radiusKm: number;
  needsAddress: boolean;
  product: ProductDetail;
  stores: NearbyStoreOffer[];
  related: CategoryProduct[];
};
