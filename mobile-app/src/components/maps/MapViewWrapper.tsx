import { Platform, View, Text, StyleSheet } from 'react-native';

// Platform-specific imports
let MapViewComponent: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const mapsModule = require('react-native-maps');
  MapViewComponent = mapsModule.default;
  Marker = mapsModule.Marker;
  Polyline = mapsModule.Polyline;
  PROVIDER_GOOGLE = mapsModule.PROVIDER_GOOGLE;
}

// Web fallback component
function MapViewWeb(props: any) {
  const { coordinates } = props;
  const [lat, lng] = coordinates || [28.6139, 77.2090];
  
  return (
    <View style={styles.webMapContainer}>
      <View style={styles.webMapContent}>
        <Text style={styles.webMapText}>📍 Map View</Text>
        <Text style={styles.webMapCoords}>
          Location: {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </Text>
        <Text style={styles.webMapNote}>
          Full map view unavailable on web. Use mobile app for interactive map.
        </Text>
      </View>
    </View>
  );
}

const MapView = Platform.OS === 'web' ? MapViewWeb : MapViewComponent;

export { MapView, Marker, Polyline, PROVIDER_GOOGLE };

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapContent: {
    alignItems: 'center',
    padding: 16,
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  webMapCoords: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  webMapNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
