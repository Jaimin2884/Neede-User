export type CartLine = {
  id: string;
  storeId: string;
  storeName: string;
  variantId: string;
  productId: string;
  name: string;
  imageUrl?: string;
  unitLabel: string;
  price: number;
  mrp: number | null;
  discountPercent: number;
  quantity: number;
};

export type CartSnapshot = {
  maxStores: number;
  storeCount: number;
  items: CartLine[];
};
