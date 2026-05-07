import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { connectSocket } from '@/lib/socket';

const { width: SW } = Dimensions.get('window');

export default function PassengerHomeScreen() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  const socket = useRef(connectSocket(accessToken || '')).current;
  const mapRef = useRef<MapView>(null);

  const [quickSearch, setQuickSearch] = useState('');
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [liveBuses, setLiveBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fetchData = async () => {
    try {
      const routesRes = await api.get('/routes?limit=5');
      setPopularRoutes(routesRes.data.routes || []);

      const apiBase = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1`;
      fetch(`${apiBase}/public/stats`).then(r => r.json()).then(d => { if (d.success) setLiveStats(d.stats); }).catch(() => {});

      try {
        const liveRes = await api.get('/tracking/live');
        setLiveBuses(liveRes.data.positions || []);
      } catch {}

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        setUserLoc({ lat: latitude, lng: longitude });
        const nearbyRes = await api.get(`/stages/nearby?lat=${latitude}&lng=${longitude}&radius=1000`);
        setNearbyStops(nearbyRes.data.stages || []);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    socket.on('bus:location_update', (data: any) => {
      setLiveBuses(prev => {
        const idx = prev.findIndex(b => b.busId === data.busId || b.busId === data.bus);
        const updated = { ...data, busId: data.busId || data.bus, lat: data.latitude || data.lat, lng: data.longitude || data.lng };
        if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
        return [...prev, updated];
      });
    });
    return () => { socket.off('bus:location_update'); };
  }, []);

  const handleSearch = () => {
    if (quickSearch.trim()) router.push({ pathname: '/(passenger)/search', params: { q: quickSearch } });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const QUICK_ACTIONS = [
    { label: 'Find Route',  icon: 'search',        color: '#3B82F6', bg: '#EFF6FF', onPress: () => router.push('/(passenger)/search') },
    { label: 'Scan & Board', icon: 'scan',         color: '#FF6B00', bg: '#FFF7ED', onPress: () => router.push('/(passenger)/scan-board') },
    { label: 'My Tickets', icon: 'ticket',          color: '#8B5CF6', bg: '#F5F3FF', onPress: () => router.push('/(passenger)/bookings') },
    { label: 'Live Map',   icon: 'map',             color: '#F59E0B', bg: '#FFFBEB', onPress: () => router.push('/(passenger)/map') },
    { label: 'Alarms',     icon: 'alarm',           color: '#EF4444', bg: '#FFF1F2', onPress: () => router.push('/(passenger)/alarms') },
    { label: 'Report SOS', icon: 'shield-checkmark',color: '#DC2626', bg: '#FEE2E2', onPress: () => router.push('/(passenger)/sos') },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#FF6B00']} />}
      stickyHeaderIndices={[0]}
    >
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.heroSub}>Where are you going today?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(passenger)/notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Live stats pills */}
        {liveStats && (
          <View style={styles.statsPills}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>{liveStats.activeBuses ?? 0} live buses</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="map-outline" size={12} color="#fff" />
              <Text style={styles.pillText}>{liveStats.activeRoutes ?? 0} routes</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="people-outline" size={12} color="#fff" />
              <Text style={styles.pillText}>Active Network</Text>
            </View>
          </View>
        )}
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or stops..."
            placeholderTextColor="#9CA3AF"
            value={quickSearch}
            onChangeText={setQuickSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {quickSearch.length > 0 && (
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="arrow-forward-circle" size={24} color="#FF6B00" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={a.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live Map Section */}
      {showMap && Platform.OS !== 'web' && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Live Bus Map</Text>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Text style={styles.sectionLink}>Hide</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapCard}>
            <MapView
              ref={mapRef}
              style={styles.mapView}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: userLoc?.lat || 28.6139,
                longitude: userLoc?.lng || 77.209,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showsUserLocation
              showsTraffic
            >
              {liveBuses.map((bus, i) => (
                bus.lat && bus.lng ? (
                  <Marker
                    key={bus.busId || i}
                    coordinate={{ latitude: bus.lat, longitude: bus.lng }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => router.push({ pathname: '/(passenger)/track/[busId]', params: { busId: bus.busId } })}
                  >
                    <View style={styles.mapBusMarker}>
                      <Text style={{ fontSize: 20 }}>🚌</Text>
                    </View>
                  </Marker>
                ) : null
              ))}
              {nearbyStops.map((stop, i) => (
                stop.lat && stop.lng ? (
                  <Marker
                    key={`stop-${i}`}
                    coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.mapStopMarker}>
                      <View style={styles.mapStopDot} />
                    </View>
                  </Marker>
                ) : null
              ))}
            </MapView>
            <View style={styles.mapLegend}>
              <Text style={styles.mapLegendItem}>🚌 Live Bus</Text>
              <View style={styles.mapLegendStop}><View style={styles.mapStopDot} /></View>
              <Text style={styles.mapLegendItem}>Stop</Text>
            </View>
          </View>
        </View>
      )}

      {/* Live Buses Strip */}
      {liveBuses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Live Buses</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {liveBuses.slice(0, 8).map((bus, i) => (
              <TouchableOpacity
                key={bus.busId || i}
                style={styles.busPill}
                onPress={() => router.push({ pathname: '/(passenger)/track/[busId]', params: { busId: bus.busId } })}
              >
                <Text style={styles.busPillIcon}>🚌</Text>
                <View>
                  <Text style={styles.busPillNumber}>{bus.busNumber || bus.busId?.slice(-6) || 'Bus'}</Text>
                  <Text style={styles.busPillSpeed}>{bus.speed || 0} km/h</Text>
                </View>
                {bus.delay > 0 && <View style={styles.delayBadge}><Text style={styles.delayText}>+{bus.delay}m</Text></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Nearby Stops */}
      {nearbyStops.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Stops</Text>
          {nearbyStops.slice(0, 3).map((stop, i) => (
            <TouchableOpacity key={i} style={styles.stopCard}>
              <View style={styles.stopIconBox}>
                <Ionicons name="location" size={18} color="#FF6B00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopName}>{stop.stage_name}</Text>
                <Text style={styles.stopDist}>{stop.distance}m away</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Popular Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        {loading ? (
          <ActivityIndicator color="#FF6B00" style={{ marginTop: 12 }} />
        ) : popularRoutes.map(route => (
          <TouchableOpacity
            key={route._id}
            style={styles.routeCard}
            onPress={() => router.push({ pathname: '/(passenger)/route/[id]', params: { id: route._id } })}
          >
            <View style={styles.routeIconBox}>
              <Text style={{ fontSize: 20 }}>🚌</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeId}>{route.url_route_id}</Text>
              <Text style={styles.routeName} numberOfLines={1}>{route.route_name}</Text>
              <Text style={styles.routePath} numberOfLines={1}>{route.start_stage} → {route.end_stage}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => router.push('/(passenger)/scan-board')}
            >
              <Text style={styles.bookBtnText}>Scan</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: {
    backgroundColor: '#FF6B00',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: '#FFE4CC', fontSize: 14, marginTop: 2 },
  notifBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  statsPills: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 10 },
  sectionLink: { fontSize: 13, color: '#FF6B00', fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: (SW - 52) / 3,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  mapCard: { borderRadius: 14, overflow: 'hidden', height: 240 },
  mapView: { flex: 1 },
  mapBusMarker: { backgroundColor: '#fff', borderRadius: 20, padding: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  mapStopMarker: { alignItems: 'center' },
  mapStopDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#fff' },
  mapLegend: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapLegendItem: { fontSize: 11, color: '#374151' },
  mapLegendStop: { alignItems: 'center', justifyContent: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveIndicatorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  liveIndicatorText: { fontSize: 10, fontWeight: '800', color: '#EF4444' },
  busPill: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 120,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, position: 'relative',
  },
  busPillIcon: { fontSize: 24 },
  busPillNumber: { fontSize: 13, fontWeight: '700', color: '#111827' },
  busPillSpeed: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  delayBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  delayText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  stopCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stopIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  stopName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stopDist: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  routeIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  routeId: { fontSize: 11, color: '#FF6B00', fontWeight: '700' },
  routeName: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 1 },
  routePath: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  bookBtn: { backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#FED7AA' },
  bookBtnText: { color: '#FF6B00', fontSize: 12, fontWeight: '700' },
});
