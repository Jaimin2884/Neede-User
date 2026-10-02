import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

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

const androidGoogleRenderer = Platform.OS === 'android' ? 'LEGACY' : undefined;

export function DeliveryMap({ region, userCoords, onRegionChangeComplete }: DeliveryMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const skipNextRegionEvent = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    skipNextRegionEvent.current = true;
    mapRef.current?.animateToRegion(region, 350);
  }, [mapReady, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        googleRenderer={androidGoogleRenderer}
        mapType="standard"
        userInterfaceStyle="light"
        initialRegion={region}
        onRegionChangeComplete={(nextRegion) => {
          if (skipNextRegionEvent.current) {
            skipNextRegionEvent.current = false;
            return;
          }

          onRegionChangeComplete({
            latitude: nextRegion.latitude,
            longitude: nextRegion.longitude,
            latitudeDelta: nextRegion.latitudeDelta,
            longitudeDelta: nextRegion.longitudeDelta,
          });
        }}
        onMapReady={() => {
          setMapReady(true);
          mapRef.current?.animateToRegion(region, 250);
        }}
        onMapLoaded={() => setMapReady(true)}
        showsUserLocation={Boolean(userCoords)}
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        zoomControlEnabled={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor="#F5F7FA"
      />

      {!mapReady ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.centerPinOverlay}>
        <View style={styles.pinHead}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.pinStem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
    gap: 8,
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  centerPinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -14,
    marginTop: -40,
    alignItems: 'center',
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  pinStem: {
    width: 3,
    height: 14,
    backgroundColor: colors.primaryDark,
    marginTop: -2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
