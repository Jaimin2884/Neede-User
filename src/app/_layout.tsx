import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { DefaultAddressGate } from '@/features/address/components/DefaultAddressGate';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { store } from '@/store';
import { setUnauthorizedHandler } from '@/services/api/client';
import { hydrateAuth, logout } from '@/store/slices/authSlice';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  initialRouteName: 'index',
};

function AuthSessionGate() {
  const { isAuthenticated, isHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || isAuthenticated) {
      return;
    }

    const onAuthScreen = segments[0] === 'auth';
    const onSplash = segments.length === 0 || segments[0] === 'index';

    if (!onAuthScreen && !onSplash) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  return null;
}

function RootNavigator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void dispatch(logout());
    });
    void dispatch(hydrateAuth());

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [dispatch]);

  return (
    <>
      <StatusBar style="dark" />
      <AuthSessionGate />
      <DefaultAddressGate />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.splashBackground },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
        <Stack.Screen
          name="profile"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="address-book"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="category/id"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="store/id"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
