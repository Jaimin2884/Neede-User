import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { images } from '@/constants/images';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { colors } from '@/theme/colors';

const SPLASH_DURATION_MS = 900;
const SPLASH_FADE_MS = 160;
const LOGO_WIDTH = 220;
const LOGO_HEIGHT = 57;
const TRACK_WIDTH = 80;

export default function SplashRoute() {
  const router = useRouter();
  const [progress] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const hasNavigated = useRef(false);
  const [animationDone, setAnimationDone] = useState(false);
  const { isAuthenticated, isHydrated } = useAuth();


  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH],
  });

  useEffect(() => {
    const loginBackground = Image.resolveAssetSource(images.loginBg);
    const appIcon = Image.resolveAssetSource(images.appIcon);
    if (loginBackground?.uri) {
      Image.prefetch(loginBackground.uri);
    }
    if (appIcon?.uri) {
      Image.prefetch(appIcon.uri);
    }

    SplashScreen.hideAsync().catch(() => {});

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }

      Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished: fadeFinished }) => {
        if (!fadeFinished || hasNavigated.current) {
          return;
        }

        setAnimationDone(true);
      });

    });

    return () => {
      animation.stop();
    };
  }, [opacity, progress]);

  useEffect(() => {
    if (!animationDone || !isHydrated || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;
    router.replace(isAuthenticated ? '/tabs' : '/auth/login');
  }, [animationDone, isAuthenticated, isHydrated, router]);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <View style={styles.content}>
        <Image source={images.logo} style={styles.logo} resizeMode="contain" fadeDuration={0} />
        <Text style={styles.tagline}>
          The freshness of precision,{'\n'}delivered.
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: fillWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashBackground,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginTop: 20,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressBarTrack: {
    width: TRACK_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
