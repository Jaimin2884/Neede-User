import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { images } from '@/constants/images';
import { colors } from '@/theme/colors';

type AuthScaffoldProps = {
  topOverlay?: ReactNode;
  children: ReactNode;
};

export function AuthScaffold({ topOverlay, children }: AuthScaffoldProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isWideScreen = screenWidth >= 600;
  const sheetTop = screenHeight * (isWideScreen ? 0.46 : 0.6);

  return (
    <View style={styles.container}>
      <View style={styles.bgContainer}>
        <Image source={images.loginBg} style={styles.bgImage} resizeMode="cover" fadeDuration={0} />
      </View>

      {topOverlay}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: sheetTop }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCard, isWideScreen && styles.contentCardWide]}>
            <View style={styles.formContent}>
              <View style={styles.logoCardContainer}>
                <Image source={images.appIcon} style={styles.appIcon} resizeMode="contain" fadeDuration={0} />
              </View>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgContainer: {
    width: '100%',
    height: '80%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  contentCardWide: {
    flex: 0,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 32,
  },
  formContent: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
  },
  logoCardContainer: {
    alignSelf: 'center',
    marginTop: -36,
    width: 72,
    height: 72,
    backgroundColor: colors.primary,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  appIcon: {
    width: 72,
    height: 72,
  },
});
