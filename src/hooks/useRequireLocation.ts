import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

type LocationBlockReason = 'services_off' | 'permission_denied';

type LocationPrompt = {
  reason: LocationBlockReason;
  title: string;
  message: string;
  actionLabel: string;
  canAskAgain: boolean;
};

const SERVICES_OFF_PROMPT: LocationPrompt = {
  reason: 'services_off',
  title: 'Turn On Location',
  message: 'Location must be turned on to use this app. Please turn on your device location.',
  actionLabel: 'Turn On',
  canAskAgain: false,
};

function permissionDeniedPrompt(canAskAgain: boolean): LocationPrompt {
  return {
    reason: 'permission_denied',
    title: 'Location Required',
    message: 'Location access is required to use this app. Please allow location permission.',
    actionLabel: canAskAgain ? 'Allow' : 'Open Settings',
    canAskAgain,
  };
}

/** Returns true when the prompt finished in-app and location should be checked again. */
async function openDeviceLocationSettings(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('unsatisfied device settings')) {
        return true;
      }

      try {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        return false;
      } catch {
        await Linking.openSettings();
        return false;
      }
    }
  }

  await Linking.openSettings();
  return false;
}

export function useRequireLocation() {
  const [prompt, setPrompt] = useState<LocationPrompt | null>(null);
  const promptRef = useRef<LocationPrompt | null>(null);
  const checkingRef = useRef(false);
  const pendingRecheckRef = useRef(false);
  const hasAutoRequestedRef = useRef(false);

  promptRef.current = prompt;

  const refreshLocationAccess = useCallback(async (requestPermission: boolean) => {
    if (checkingRef.current) {
      pendingRecheckRef.current = true;
      return;
    }

    checkingRef.current = true;

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setPrompt((current) => (current?.reason === 'services_off' ? current : SERVICES_OFF_PROMPT));
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      const shouldRequest =
        requestPermission &&
        !hasAutoRequestedRef.current &&
        permission.status !== 'granted' &&
        permission.canAskAgain;

      if (shouldRequest) {
        hasAutoRequestedRef.current = true;
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status === 'granted') {
        setPrompt(null);
        return;
      }

      const nextPrompt = permissionDeniedPrompt(permission.canAskAgain);
      setPrompt((current) =>
        current?.reason === nextPrompt.reason && current.canAskAgain === nextPrompt.canAskAgain
          ? current
          : nextPrompt
      );
    } catch {
      // Location APIs can be unavailable outside a device build.
    } finally {
      checkingRef.current = false;
      if (pendingRecheckRef.current) {
        pendingRecheckRef.current = false;
        void refreshLocationAccess(false);
      }
    }
  }, []);

  const enableLocation = useCallback(async () => {
    const currentPrompt = promptRef.current;
    if (!currentPrompt || checkingRef.current) {
      return;
    }

    if (currentPrompt.reason === 'services_off') {
      const recheckNow = await openDeviceLocationSettings();
      if (recheckNow) {
        await refreshLocationAccess(false);
      }
      return;
    }

    if (currentPrompt.canAskAgain) {
      checkingRef.current = true;
      let granted = false;
      try {
        const requested = await Location.requestForegroundPermissionsAsync();
        granted = requested.status === 'granted';
        if (!granted) {
          setPrompt(permissionDeniedPrompt(requested.canAskAgain));
        }
      } catch {
        setPrompt(permissionDeniedPrompt(false));
      } finally {
        checkingRef.current = false;
        pendingRecheckRef.current = false;
      }

      if (granted) {
        setPrompt(null);
        await refreshLocationAccess(false);
      }
      return;
    }

    await Linking.openSettings();
  }, [refreshLocationAccess]);

  useEffect(() => {
    if (!prompt) {
      return;
    }

    const interval = setInterval(() => {
      void refreshLocationAccess(false);
    }, 800);

    return () => {
      clearInterval(interval);
    };
  }, [prompt, refreshLocationAccess]);

  useFocusEffect(
    useCallback(() => {
      void refreshLocationAccess(true);

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          void refreshLocationAccess(false);
        }
      });

      return () => {
        subscription.remove();
      };
    }, [refreshLocationAccess])
  );

  return { prompt, enableLocation };
}
