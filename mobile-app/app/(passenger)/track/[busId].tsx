import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const { height } = Dimensions.get('window');

interface BusInfo {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  nextStop: string;
  delay: number;
  speed: number;
  coordinates: [number, number];
  recordedAt: string;
}

interface Stage {
  seq:        number;
  stage_name: string;
  lat:        number;
  lng:        number;
}

export default function BusTrackerScreen() {
  const { busId } = useLocalSearchParams<{ busId: string }>();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [busInfo,   setBusInfo]   = useState<BusInfo | null>(null);
  const [stages,    setStages]    = useState<Stage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [connected, setConnected] = useState(false);
  const mapRef = useRef<MapView>(null);
  const socket = useRef(connectSocket(accessToken || '')).current;

  useEffect(() => {
    fetchBusInfo();

    // Join socket room for this bus
    socket.emit('passenger:track_bus', { busId });

    socket.on('bus:position', (data: any) => {
      if (data.busId === busId) {
        setBusInfo((prev) => prev ? {
          ...prev,
          coordinates: [data.latitude, data.longitude],
          speed: data.speed || 0,
          nextStop: data.nextStop || prev.nextStop,
          delay: data.delay || 0,
          recordedAt: new Date().toISOString(),
        } : prev);
        setConnected(true);
      }
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('bus:position');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [busId]);

  const fetchBusInfo = async () => {
    try {
      const res = await api.get(`/tracking/bus/${busId}`);
      const pos = res.data.position;
      if (pos) {
        setBusInfo({
          busId:       pos.bus || pos.busId,
          busNumber:   pos.busInfo?.busNumber || pos.busNumber || 'Unknown',
          routeId:     pos.route || pos.routeId,
          routeName:   pos.routeInfo?.route_name || pos.routeName || '',
          nextStop:    pos.nextStage?.stage_name || pos.nextStop || 'Unknown',
          delay:       pos.delay_minutes || pos.delay || 0,
          speed:       pos.speed || 0,
          coordinates: pos.location?.coordinates
            ? [pos.location.coordinates[1], pos.location.coordinates[0]]
            : [28.6139, 77.2090],
          recordedAt:  pos.timestamp || pos.recordedAt,
        });

        // Load stages for route polyline
        const routeId = pos.route || pos.routeId;
        if (routeId) {
          const stagesRes = await api.get(`/stages?routeId=${routeId}&limit=100`);
          setStages((stagesRes.data.stages || []).filter((s: any) => s.lat && s.lng));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getTimeSince = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!busInfo) {
    return (
      <View style={styles.center}>
        <Ionicons name="bus-outline" size={60} color="#D1D5DB" />
        <Text style={styles.noDataText}>Bus not found or not currently active.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [lat, lng] = busInfo.coordinates;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.busNumber}>{busInfo.busNumber}</Text>
          <Text style={styles.routeName}>{busInfo.routeName}</Text>
        </View>
        <View style={[styles.liveIndicator, connected ? styles.liveGreen : styles.liveGray]}>
          <View style={[styles.liveDot, connected ? styles.liveDotGreen : styles.liveDotGray]} />
          <Text style={styles.liveText}>{connected ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* Live Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        showsUserLocation
        showsMyLocationButton
      >
        {stages.length > 1 && (
          <Polyline
            coordinates={stages.map(s => ({ latitude: s.lat, longitude: s.lng }))}
            strokeColor="#FF6B00"
            strokeWidth={3}
          />
        )}
        {stages.map((s, i) => (
          <Marker
            key={s.seq}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={`${s.seq}. ${s.stage_name}`}
            pinColor={i === 0 ? '#10B981' : i === stages.length - 1 ? '#EF4444' : '#6B7280'}
          />
        ))}
        <Marker coordinate={{ latitude: lat, longitude: lng }} title={busInfo.busNumber} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.busMarker}>
            <Ionicons name="bus" size={20} color="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={22} color="#FF6B00" />
            <Text style={styles.statValue}>{busInfo.speed} km/h</Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color={busInfo.delay > 0 ? '#EF4444' : '#10B981'} />
            <Text style={[styles.statValue, { color: busInfo.delay > 0 ? '#EF4444' : '#10B981' }]}>
              {busInfo.delay > 0 ? `+${busInfo.delay} min` : 'On Time'}
            </Text>
            <Text style={styles.statLabel}>Delay</Text>
          </View>
        </View>

        <View style={styles.nextStopCard}>
          <Ionicons name="location" size={22} color="#FF6B00" />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextStopLabel}>Next Stop</Text>
            <Text style={styles.nextStopName}>{busInfo.nextStop}</Text>
          </View>
          <Text style={styles.updatedText}>{getTimeSince(busInfo.recordedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F9FAFB' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  noDataText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  backButton:     { backgroundColor: '#FF6B00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backButtonText: { color: '#fff', fontWeight: '700' },
  header: {
    backgroundColor: '#FF6B00',
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    paddingTop:      48,
    gap:             12,
  },
  headerContent: { flex: 1 },
  busNumber: { color: '#fff', fontSize: 20, fontWeight: '700' },
  routeName: { color: '#FFE4CC', fontSize: 13, marginTop: 2 },
  liveIndicator: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      12,
    gap:               4,
  },
  liveGreen:    { backgroundColor: 'rgba(16,185,129,0.2)' },
  liveGray:     { backgroundColor: 'rgba(156,163,175,0.2)' },
  liveDot:      { width: 6, height: 6, borderRadius: 3 },
  liveDotGreen: { backgroundColor: '#10B981' },
  liveDotGray:  { backgroundColor: '#9CA3AF' },
  liveText:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  map:          { flex: 1, minHeight: height * 0.42 },
  busMarker: {
    backgroundColor: '#003087',
    borderRadius:    20,
    padding:         6,
    borderWidth:     2,
    borderColor:     '#fff',
  },
  infoSection:  { backgroundColor: '#fff', padding: 14 },
  statsGrid:    { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex:            1,
    backgroundColor: '#F9FAFB',
    borderRadius:    10,
    padding:         12,
    alignItems:      'center',
    gap:             4,
  },
  statValue:   { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel:   { fontSize: 11, color: '#6B7280' },
  nextStopCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFF7ED',
    borderRadius:    10,
    padding:         12,
    gap:             10,
  },
  nextStopLabel: { fontSize: 11, color: '#9CA3AF' },
  nextStopName:  { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  updatedText:   { fontSize: 11, color: '#9CA3AF' },
});
