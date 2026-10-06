import { Alert } from 'react-native';

import { buildCartBill } from '@/features/cart/utils/bill';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { addToCart, setCartQuantity } from '@/store/slices/cartSlice';

export function useCart() {
  const dispatch = useAppDispatch();
  const lines = useAppSelector((state) => state.cart.lines);
  const suggestions = useAppSelector((state) => state.cart.suggestions);
  const maxStores = useAppSelector((state) => state.cart.maxStores);
  const bill = buildCartBill(lines);

  const quantityFor = (storeId: string | undefined, variantId: string) => {
    if (!storeId) {
      return 0;
    }

    return lines.find((line) => line.storeId === storeId && line.variantId === variantId)?.quantity ?? 0;
  };

  const add = async (storeId: string | undefined, variantId: string) => {
    const vendorId = Number(storeId);
    const variant = Number(variantId);

    if (!Number.isFinite(vendorId) || vendorId < 1 || !Number.isFinite(variant) || variant < 1) {
      return false;
    }

    const result = await dispatch(addToCart({ vendorId, variantId: variant }));
    if (addToCart.rejected.match(result)) {
      Alert.alert(
        'Cannot add to cart',
        typeof result.payload === 'string' ? result.payload : 'Could not add this product.'
      );
      return false;
    }

    return true;
  };

  const setQuantity = async (storeId: string, variantId: string, quantity: number) => {
    const result = await dispatch(
      setCartQuantity({
        vendorId: Number(storeId),
        variantId: Number(variantId),
        quantity: Math.max(0, quantity),
      })
    );

    if (setCartQuantity.rejected.match(result)) {
      Alert.alert('Cart', typeof result.payload === 'string' ? result.payload : 'Could not update the cart.');
      return false;
    }

    return true;
  };

  return {
    lines,
    suggestions,
    maxStores,
    bill,
    quantityFor,
    add,
    setQuantity,
  };
}
