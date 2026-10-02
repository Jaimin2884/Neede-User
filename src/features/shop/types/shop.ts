import type { ImageSourcePropType } from 'react-native';

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
  logoUrl?: string;
  tagline?: string;
  logoText: string;
};

export type StoreProfile = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  distance: string;
  time: string;
  isOpen: boolean;
  imageUrl?: string;
  logoUrl?: string;
};

export type StoreCatalogSubCategory = {
  id: string;
  name: string;
  imageUrl?: string;
  productCount: number;
};

export type StoreCatalogCategory = {
  id: string;
  name: string;
  subCategories: StoreCatalogSubCategory[];
};
