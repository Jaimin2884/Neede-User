import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

export type DeliveryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type DeliveryMapProps = {
  region: DeliveryMapRegion;
  userCoords: { latitude: number; longitude: number } | null;
  onRegionChangeComplete: (region: DeliveryMapRegion) => void;
};

export function DeliveryMap({ region, onRegionChangeComplete }: DeliveryMapProps) {
  const [localRegion, setLocalRegion] = useState(region);

  useEffect(() => {
    setLocalRegion(region);
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  const nudge = (patch: Partial<DeliveryMapRegion>) => {
    const next = { ...localRegion, ...patch };
    setLocalRegion(next);
    onRegionChangeComplete(next);
  };

  return (
    <View style={styles.webMapFallback}>
      <Ionicons name="map-outline" size={42} color={colors.primary} />
      <Text style={styles.webMapTitle}>Delivery pin</Text>
      <Text style={styles.webMapCoords}>
        {localRegion.latitude.toFixed(6)}, {localRegion.longitude.toFixed(6)}
      </Text>
      <Text style={styles.webMapHint}>Move the pin to the exact delivery point</Text>
      <View style={styles.nudgeRow}>
        <Pressable style={styles.nudgeButton} onPress={() => nudge({ latitude: localRegion.latitude + 0.0008 })}>
          <Ionicons name="chevron-up" size={18} color={colors.primaryDark} />
        </Pressable>
        <View style={styles.nudgeMid}>
          <Pressable
            style={styles.nudgeButton}
            onPress={() => nudge({ longitude: localRegion.longitude - 0.0008 })}
          >
            <Ionicons name="chevron-back" size={18} color={colors.primaryDark} />
          </Pressable>
          <Pressable
            style={styles.nudgeButton}
            onPress={() => nudge({ longitude: localRegion.longitude + 0.0008 })}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
        <Pressable style={styles.nudgeButton} onPress={() => nudge({ latitude: localRegion.latitude - 0.0008 })}>
          <Ionicons name="chevron-down" size={18} color={colors.primaryDark} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#E0F2FE',
  },
  webMapTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  webMapCoords: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  webMapHint: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  nudgeRow: {
    marginTop: 18,
    alignItems: 'center',
    gap: 8,
  },
  nudgeMid: {
    flexDirection: 'row',
    gap: 48,
  },
  nudgeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
});
