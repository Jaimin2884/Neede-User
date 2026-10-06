import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { DefaultAddressGate } from '@/features/address/components/DefaultAddressGate';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppDispatch } from '@/hooks/useAppSelector';
import { store } from '@/store';
import { setUnauthorizedHandler } from '@/services/api/client';
import { hydrateAuth, logout } from '@/store/slices/authSlice';
import { loadCart, resetCart } from '@/store/slices/cartSlice';
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

    const routeSegments = segments as readonly string[];
    const onAuthScreen = routeSegments[0] === 'auth';
    const onSplash = routeSegments.length === 0 || routeSegments[0] === 'index';

    if (!onAuthScreen && !onSplash) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  return null;
}

function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void dispatch(logout());
    });
    void dispatch(hydrateAuth());

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (isAuthenticated) {
      void dispatch(loadCart());
      return;
    }

    dispatch(resetCart());
  }, [dispatch, isAuthenticated, isHydrated]);

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
        <Stack.Screen
          name="product/id"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            animation: 'slide_from_bottom',
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
