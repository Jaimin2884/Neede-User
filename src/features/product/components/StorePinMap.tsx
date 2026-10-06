import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

type StorePinMapProps = {
  latitude: number;
  longitude: number;
};

export function StorePinMap({ latitude, longitude }: StorePinMapProps) {
  return (
    <View
      style={styles.fallback}
      accessibilityLabel={`Store location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
    >
      <Ionicons name="location" size={28} color={colors.discountBadge} />
      <View style={styles.dot} />
      <View style={styles.coords}>
        <Ionicons name="navigate" size={12} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#D9EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(27, 115, 179, 0.12)',
  },
  coords: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
