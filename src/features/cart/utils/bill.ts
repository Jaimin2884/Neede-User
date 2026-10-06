import type { CartLine } from '@/features/cart/types/cart';

export const FREE_DELIVERY_MIN = 199;
export const DELIVERY_FEE = 40;
export const HANDLING_FEE = 12;

export type CartBill = {
  itemCount: number;
  storeCount: number;
  itemTotal: number;
  sellingTotal: number;
  productDiscount: number;
  deliveryFee: number;
  handlingFee: number;
  total: number;
  saved: number;
  freeDelivery: boolean;
};

export function buildCartBill(lines: CartLine[]): CartBill {
  let itemCount = 0;
  let itemTotal = 0;
  let sellingTotal = 0;
  const stores = new Set<string>();

  lines.forEach((line) => {
    const listed = line.mrp != null && line.mrp > line.price ? line.mrp : line.price;
    itemCount += line.quantity;
    itemTotal += listed * line.quantity;
    sellingTotal += line.price * line.quantity;
    stores.add(line.storeId);
  });

  const productDiscount = Math.max(0, Math.round((itemTotal - sellingTotal) * 100) / 100);
  const freeDelivery = sellingTotal >= FREE_DELIVERY_MIN && sellingTotal > 0;
  const deliveryFee = itemCount === 0 || freeDelivery ? 0 : DELIVERY_FEE;
  const handlingFee = itemCount === 0 ? 0 : HANDLING_FEE;
  const deliverySaved = freeDelivery ? DELIVERY_FEE : 0;
  const total = Math.max(0, Math.round((sellingTotal + deliveryFee + handlingFee) * 100) / 100);

  return {
    itemCount,
    storeCount: stores.size,
    itemTotal: roundMoney(itemTotal),
    sellingTotal: roundMoney(sellingTotal),
    productDiscount,
    deliveryFee,
    handlingFee,
    total,
    saved: roundMoney(productDiscount + deliverySaved),
    freeDelivery,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
