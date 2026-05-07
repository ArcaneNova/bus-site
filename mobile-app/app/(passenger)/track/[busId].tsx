import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const { width: SW, height: SH } = Dimensions.get('window');

interface BusInfo {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  nextStop: string;
  delay: number;
  speed: number;
  lat: number;
  lng: number;
  recordedAt: string;
}

interface Stage { seq: number; stage_name: string; lat: number; lng: number; }

export default function BusTrackerScreen() {
  const { busId } = useLocalSearchParams<{ busId: string }>();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const socket = useRef(connectSocket(accessToken || '')).current;

  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [followBus, setFollowBus] = useState(true);

  useEffect(() => {
    fetchBusInfo();
    socket.emit('passenger:track_bus', { busId });
    socket.on('bus:position', (data: any) => {
      if (data.busId !== busId && data.bus !== busId) return;
      setBusInfo(prev => prev ? {
        ...prev,
        lat: data.latitude || data.lat,
        lng: data.longitude || data.lng,
        speed: data.speed || 0,
        nextStop: data.nextStop || prev.nextStop,
        delay: data.delay || 0,
        recordedAt: new Date().toISOString(),
      } : prev);
      setConnected(true);
      if (followBus && mapRef.current && data.latitude) {
        mapRef.current.animateToRegion({
          latitude: data.latitude || data.lat,
          longitude: data.longitude || data.lng,
          latitudeDelta: 0.01, longitudeDelta: 0.01,
        }, 800);
      }
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => { socket.off('bus:position'); socket.off('connect'); socket.off('disconnect'); };
  }, [busId]);

  const fetchBusInfo = async () => {
    try {
      const res = await api.get(`/tracking/bus/${busId}`);
      const pos = res.data.position;
      if (pos) {
        const lat = pos.location?.coordinates ? pos.location.coordinates[1] : (pos.lat || 28.6139);
        const lng = pos.location?.coordinates ? pos.location.coordinates[0] : (pos.lng || 77.209);
        setBusInfo({
          busId: pos.bus || pos.busId || busId,
          busNumber: pos.busInfo?.busNumber || pos.busNumber || 'Bus',
          routeId: pos.route || pos.routeId || '',
          routeName: pos.routeInfo?.route_name || pos.routeName || '',
          nextStop: pos.nextStage?.stage_name || pos.nextStop || 'Unknown',
          delay: pos.delay_minutes || pos.delay || 0,
          speed: pos.speed || 0,
          lat, lng,
          recordedAt: pos.timestamp || pos.recordedAt || new Date().toISOString(),
        });
        const routeId = pos.route || pos.routeId;
        if (routeId) {
          const sr = await api.get(`/stages?routeId=${routeId}&limit=100`);
          setStages((sr.data.stages || []).filter((s: any) => s.lat && s.lng));
        }
      }
    } catch {}
    finally { setLoading(false); }
  };

  const getTimeSince = (d: string) => {
    if (!d) return 'Unknown';
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B00" /></View>;
  if (!busInfo) return (
    <View style={styles.center}>
      <Ionicons name="bus-outline" size={60} color="#D1D5DB" />
      <Text style={styles.noDataText}>Bus not currently active</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const routeCoords = stages.map(s => ({ latitude: s.lat, longitude: s.lng }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.busNumber}>Bus {busInfo.busNumber}</Text>
          <Text style={styles.routeName} numberOfLines={1}>{busInfo.routeName}</Text>
        </View>
        <View style={[styles.livePill, connected ? styles.liveGreen : styles.liveGray]}>
          <View style={[styles.liveDot, { backgroundColor: connected ? '#10B981' : '#9CA3AF' }]} />
          <Text style={styles.liveText}>{connected ? 'LIVE' : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={[styles.mapContainer, mapExpanded && { height: SH * 0.65 }]}>
        {Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={{ latitude: busInfo.lat, longitude: busInfo.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
            showsUserLocation
            showsTraffic
          >
            {/* Route polyline */}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeColor="#3B82F6" strokeWidth={3} lineDashPattern={[0]} />
            )}
            {/* Stop markers */}
            {stages.map((s, i) => (
              <Marker key={i} coordinate={{ latitude: s.lat, longitude: s.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.stopMarker}>
                  <View style={[styles.stopDot, i === 0 ? styles.firstDot : i === stages.length - 1 ? styles.lastDot : styles.midDot]} />
                </View>
              </Marker>
            ))}
            {/* Bus marker */}
            <Marker
              coordinate={{ latitude: busInfo.lat, longitude: busInfo.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.busMarker}>
                <Text style={styles.busMarkerIcon}>🚌</Text>
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.webMapFallback}>
            <Ionicons name="map" size={48} color="#D1D5DB" />
            <Text style={styles.webMapText}>Map available on mobile app</Text>
            <Text style={styles.webMapCoords}>📍 {busInfo.lat.toFixed(4)}°N, {Math.abs(busInfo.lng).toFixed(4)}°E</Text>
          </View>
        )}
        {/* Expand toggle */}
        <TouchableOpacity style={styles.expandBtn} onPress={() => setMapExpanded(e => !e)}>
          <Ionicons name={mapExpanded ? 'contract' : 'expand'} size={18} color="#374151" />
        </TouchableOpacity>
        {/* Follow toggle */}
        <TouchableOpacity style={[styles.followBtn, followBus && styles.followBtnActive]} onPress={() => setFollowBus(f => !f)}>
          <Ionicons name="navigate" size={16} color={followBus ? '#fff' : '#374151'} />
          <Text style={[styles.followText, followBus && { color: '#fff' }]}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="speedometer-outline" size={20} color="#3B82F6" />
          <Text style={styles.statValue}>{busInfo.speed}</Text>
          <Text style={styles.statLabel}>km/h</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={20} color={busInfo.delay > 0 ? '#EF4444' : '#10B981'} />
          <Text style={[styles.statValue, { color: busInfo.delay > 0 ? '#EF4444' : '#10B981' }]}>
            {busInfo.delay > 0 ? `+${busInfo.delay}` : '0'}
          </Text>
          <Text style={styles.statLabel}>{busInfo.delay > 0 ? 'min late' : 'On Time'}</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="location-outline" size={20} color="#F59E0B" />
          <Text style={styles.statValue} numberOfLines={1}>{busInfo.nextStop.split(' ').slice(0, 2).join(' ')}</Text>
          <Text style={styles.statLabel}>Next Stop</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="refresh-outline" size={20} color="#6B7280" />
          <Text style={styles.statValue}>{getTimeSince(busInfo.recordedAt)}</Text>
          <Text style={styles.statLabel}>Updated</Text>
        </View>
      </View>

      {/* Detail Card */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Trip Details</Text>
        {[
          { label: 'Bus Number', value: busInfo.busNumber },
          { label: 'Route', value: busInfo.routeName || '—' },
          { label: 'Next Stop', value: busInfo.nextStop },
          { label: 'Connection', value: connected ? '✓ Live' : '✗ Offline', color: connected ? '#10B981' : '#EF4444' },
        ].map((row, i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{row.label}</Text>
            <Text style={[styles.detailValue, row.color ? { color: row.color } : {}]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  busNumber: { color: '#fff', fontSize: 18, fontWeight: '700' },
  routeName: { color: '#FFE4CC', fontSize: 12, marginTop: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  liveGreen: { backgroundColor: 'rgba(16,185,129,0.2)' },
  liveGray: { backgroundColor: 'rgba(107,114,128,0.2)' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  mapContainer: { height: SH * 0.38, position: 'relative' },
  expandBtn: {
    position: 'absolute', top: 10, right: 10, backgroundColor: '#fff',
    borderRadius: 8, padding: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  followBtn: {
    position: 'absolute', bottom: 10, right: 10, backgroundColor: '#fff',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  followBtnActive: { backgroundColor: '#FF6B00' },
  followText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  stopMarker: { alignItems: 'center', justifyContent: 'center' },
  stopDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  firstDot: { backgroundColor: '#10B981' },
  lastDot: { backgroundColor: '#EF4444' },
  midDot: { backgroundColor: '#3B82F6' },
  busMarker: { backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  busMarkerIcon: { fontSize: 24 },
  webMapFallback: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', gap: 8 },
  webMapText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  webMapCoords: { fontSize: 13, color: '#9CA3AF' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10,
    alignItems: 'center', gap: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
  detailCard: {
    backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  detailTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '55%', textAlign: 'right' },
  noDataText: { fontSize: 16, color: '#6B7280' },
  backButton: { backgroundColor: '#FF6B00', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  backButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
