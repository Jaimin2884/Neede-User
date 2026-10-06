import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type StorePinMapProps = {
  latitude: number;
  longitude: number;
};

export function StorePinMap({ latitude, longitude }: StorePinMapProps) {
  return (
    <View style={styles.wrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        liteMode
        pointerEvents="none"
      >
        <Marker coordinate={{ latitude, longitude }} pinColor="#E23744" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
});
