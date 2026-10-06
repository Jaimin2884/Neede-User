import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { addCartItem, fetchCart, updateCartItem, type CartResponse } from '@/features/cart/api/cartApi';
import type { CartLine } from '@/features/cart/types/cart';
import type { CategoryProduct } from '@/features/product/types/product';
import { getApiErrorMessage } from '@/services/api/errors';

type CartState = {
  lines: CartLine[];
  suggestions: CategoryProduct[];
  maxStores: number;
  loading: boolean;
};

const initialState: CartState = {
  lines: [],
  suggestions: [],
  maxStores: 2,
  loading: false,
};

function applyCart(state: CartState, action: { payload: CartResponse }) {
  state.lines = action.payload.items;
  state.suggestions = action.payload.suggestions;
  state.maxStores = action.payload.maxStores;
  state.loading = false;
}

export const loadCart = createAsyncThunk('cart/load', async (_, { rejectWithValue }) => {
  try {
    return await fetchCart();
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, 'Unable to load your cart.'));
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async (
    payload: { vendorId: number; variantId: number; quantity?: number },
    { rejectWithValue }
  ) => {
    try {
      return await addCartItem(payload.vendorId, payload.variantId, payload.quantity ?? 1);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Could not add this product.'));
    }
  }
);

export const setCartQuantity = createAsyncThunk(
  'cart/update',
  async (
    payload: { vendorId: number; variantId: number; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      return await updateCartItem(payload.vendorId, payload.variantId, payload.quantity);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Could not update the cart.'));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart(state) {
      state.lines = [];
      state.suggestions = [];
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadCart.fulfilled, applyCart)
      .addCase(loadCart.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addToCart.fulfilled, applyCart)
      .addCase(setCartQuantity.fulfilled, applyCart);
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
