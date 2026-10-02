export type ProductSort = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

export type ProductBrandOption = {
  id: string;
  name: string;
};

export type ProductFilterOptions = {
  types: string[];
  brands: ProductBrandOption[];
};

export type CategoryBrowseFilters = {
  sort: ProductSort;
  type: string | null;
  brandId: string | null;
};

export type CategorySubCategory = {
  id: string;
  name: string;
  imageUrl?: string;
};

export type CategoryProduct = {
  id: string;
  name: string;
  imageUrl?: string;
  unitLabel: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
  unitPriceLabel: string;
};

export type CategoryProductListing = {
  categoryId: string;
  categoryName: string;
  selectedSubCategoryId: string;
  subCategories: CategorySubCategory[];
  products: CategoryProduct[];
  filters: ProductFilterOptions;
  needsAddress: boolean;
};

export const defaultCategoryBrowseFilters: CategoryBrowseFilters = {
  sort: 'name_asc',
  type: null,
  brandId: null,
};
