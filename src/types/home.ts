import type { ImageSourcePropType } from 'react-native';

export type BannerItem = {
  id: string;
  tag: string;
  subtag?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  image: ImageSourcePropType;
  bgTint?: string;
};

export type StoreItem = {
  id: string;
  name: string;
  rating: number | null;
  distance: string;
  time: string;
  tag: string;
  isOpen?: boolean;
  image?: ImageSourcePropType;
  imageUrl?: string;
  logoText: string;
};

export type DealItem = {
  id: string;
  title: string;
  weight: string;
  price: number;
  originalPrice: number;
  discount: string;
  image: ImageSourcePropType;
};

export type CategoryItem = {
  id: string;
  name: string;
  image?: ImageSourcePropType;
  remoteImageUrl?: string;
  iconFallback?: string;
  badge?: string;
  categoryId?: string;
};

export type HomeCategorySection = {
  id: string;
  name: string;
  items: CategoryItem[];
};
