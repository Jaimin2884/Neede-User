import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { sendLoginOtp } from '@/services/authApi';
import { logout, updateProfile, verifyOtp } from '@/store/slices/authSlice';
import type { UpdateProfileRequest } from '@/types/auth';

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const sendOtp = useCallback((mobile: string) => sendLoginOtp(mobile), []);

  const verifyOtpAction = useCallback(
    async (mobile: string, otp: string) => {
      const result = await dispatch(verifyOtp({ mobile, otp }));
      if (verifyOtp.rejected.match(result)) {
        throw new Error(
          typeof result.payload === 'string' ? result.payload : 'Invalid or expired OTP.'
        );
      }
    },
    [dispatch]
  );

  const updateProfileAction = useCallback(
    async (payload: UpdateProfileRequest) => {
      const result = await dispatch(updateProfile(payload));
      if (updateProfile.rejected.match(result)) {
        throw new Error(
          typeof result.payload === 'string' ? result.payload : 'Could not save profile changes.'
        );
      }
    },
    [dispatch]
  );

  const logoutAction = useCallback(async () => {
    await dispatch(logout());
  }, [dispatch]);

  return {
    ...auth,
    sendOtp,
    verifyOtp: verifyOtpAction,
    updateProfile: updateProfileAction,
    logout: logoutAction,
  };
}
