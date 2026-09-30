import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { useAppDispatch } from '@/hooks/useAppSelector';
import { useAuth } from '@/hooks/useAuth';
import { store } from '@/store';
import { hydrateAuth } from '@/store/slices/authSlice';
import { colors } from '@/theme/colors';

function AuthSessionGate() {
  const { isAuthenticated, isHydrated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const isProtectedRoute =
      segments[0] === 'tabs' || segments[0] === 'profile' || segments[0] === 'address-book';

    if (!isAuthenticated && isProtectedRoute) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isHydrated, router, segments]);

  return null;
}

function RootNavigator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return (
    <>
      <StatusBar style="dark" />
      <AuthSessionGate />
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
