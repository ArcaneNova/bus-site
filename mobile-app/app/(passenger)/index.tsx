import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { NearbyStop, Route } from '@/types';

export default function PassengerHomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState('');
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStats, setLiveStats] = useState<{ activeRoutes?: number; activeBuses?: number } | null>(null);

  const fetchData = async () => {
    try {
      // Popular routes
      const routesRes = await api.get('/routes?limit=5');
      setPopularRoutes(routesRes.data.routes || []);

      // Live stats from public API
      const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      fetch(`${apiBase}/public/stats`).then(r => r.json()).then(d => { if (d.success) setLiveStats(d.stats); }).catch(() => {});

      // Nearby stops if location granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const nearbyRes = await api.get(
          `/stages/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}&radius=1000`
        );
        setNearbyStops(nearbyRes.data.stages || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickSearch = () => {
    if (quickSearch.trim()) {
      router.push({ pathname: '/(passenger)/search', params: { q: quickSearch } });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Where are you going today?</Text>
          {liveStats && (
            <View style={styles.statsRow}>
              <Text style={styles.statsPill}>🚌 {liveStats.activeBuses ?? '—'} live buses</Text>
              <Text style={styles.statsPill}>🗺️ {liveStats.activeRoutes ?? '—'} routes</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/(passenger)/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>


      {/* Quick Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or stops..."
            placeholderTextColor="#9CA3AF"
            value={quickSearch}
            onChangeText={setQuickSearch}
            onSubmitEditing={handleQuickSearch}
            returnKeyType="search"
          />
          {quickSearch.length > 0 && (
            <TouchableOpacity onPress={handleQuickSearch}>
              <Ionicons name="arrow-forward-circle" size={24} color="#FF6B00" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(passenger)/search')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="search" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.actionText}>Find Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(passenger)/favourites')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFF1F2' }]}>
            <Ionicons name="heart" size={22} color="#F43F5E" />
          </View>
          <Text style={styles.actionText}>Favourites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="locate" size={22} color="#22C55E" />
          </View>
          <Text style={styles.actionText}>Nearby Stops</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Stops */}
      {nearbyStops.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Stops</Text>
          {nearbyStops.slice(0, 4).map((stop) => (
            <TouchableOpacity key={stop._id} style={styles.stopCard}>
              <View style={styles.stopIcon}>
                <Ionicons name="location" size={18} color="#FF6B00" />
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.stage_name}</Text>
                <Text style={styles.stopDistance}>{stop.distance}m away</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Popular Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        {loading ? (
          <ActivityIndicator color="#FF6B00" style={{ marginTop: 16 }} />
        ) : (
          popularRoutes.map((route) => (
            <TouchableOpacity
              key={route._id}
              style={styles.routeCard}
              onPress={() => router.push({ pathname: '/(passenger)/route/[id]', params: { id: route._id } })}
            >
              <View style={styles.routeIconBox}>
                <Text style={styles.routeIcon}>🚌</Text>
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeId}>{route.url_route_id}</Text>
                <Text style={styles.routeName} numberOfLines={1}>{route.route_name}</Text>
                <Text style={styles.routeStops} numberOfLines={1}>
                  {route.start_stage} → {route.end_stage}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
  },
  greeting: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#FFE4CC', fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statsPill: { fontSize: 11, color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },

  searchSection: { padding: 16, backgroundColor: '#FF6B00', paddingTop: 0 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  stopIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stopDistance: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  routeIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  routeIcon: { fontSize: 20 },
  routeInfo: { flex: 1 },
  routeId: { fontSize: 12, color: '#FF6B00', fontWeight: '700' },
  routeName: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  routeStops: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
