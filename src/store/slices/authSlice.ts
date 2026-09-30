import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { getApiErrorMessage } from '@/services/api';
import { updateUserProfile, verifyLoginOtp } from '@/services/authApi';
import type { AuthUser, UpdateProfileRequest } from '@/types/auth';
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from '@/utils/storage';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const [token, user] = await Promise.all([getAuthToken(), getStoredUser()]);
  return { token, user };
});

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ mobile, otp }: { mobile: string; otp: string }, { rejectWithValue }) => {
    try {
      const result = await verifyLoginOtp(mobile, otp);
      await saveAuthSession(result.token, result.user);
      return result.user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Invalid or expired OTP.'));
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload: UpdateProfileRequest, { rejectWithValue }) => {
    try {
      const user = await updateUserProfile(payload);
      const token = await getAuthToken();

      if (!token) {
        return rejectWithValue('Session expired. Please log in again.');
      }

      await saveAuthSession(token, user);
      return user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Could not save profile changes.'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearAuthSession();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.user = action.payload.token ? action.payload.user : null;
        state.isAuthenticated = Boolean(action.payload.token && action.payload.user);
        state.isHydrated = true;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.isHydrated = true;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export default authSlice.reducer;
