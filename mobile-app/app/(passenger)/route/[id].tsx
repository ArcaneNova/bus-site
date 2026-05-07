import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';
import { Route, Stage } from '@/types';

interface RouteDetail extends Route {
  isFavourite?: boolean;
}

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [liveBuses, setLiveBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchRouteDetails();
  }, [id]);

  const fetchRouteDetails = async () => {
    try {
      console.log('[ROUTE DETAIL] Fetching route:', id);
      const routeRes = await api.get(`/routes/${id}`);
      const route = routeRes.data.route;
      console.log('[ROUTE DETAIL] Route loaded:', route.route_name, 'url_route_id:', route.url_route_id);
      
      // Use url_route_id to fetch stages, not the MongoDB _id
      const [stagesRes, busesRes] = await Promise.all([
        api.get(`/stages?routeId=${route.url_route_id}&limit=200`),
        api.get(`/tracking/route/${id}`),
      ]);
      
      console.log('[ROUTE DETAIL] Loaded successfully');
      setRoute(route);
      setStages(stagesRes.data.stages || []);
      setLiveBuses(busesRes.data.positions || []);
    } catch (error: any) {
      console.error('[ROUTE DETAIL ERROR]', {
        routeId: id,
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data,
      });
      Toast.show({ type: 'error', text1: `Failed to load route: ${error?.response?.data?.message || error?.message}` });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = async () => {
    if (!route) return;
    setToggling(true);
    try {
      if (route.isFavourite) {
        await api.delete(`/mobile/favourites/${id}`);
        setRoute({ ...route, isFavourite: false });
        Toast.show({ type: 'info', text1: 'Removed from favourites.' });
      } else {
        await api.post('/mobile/favourites', { refId: id, refModel: 'Route' });
        setRoute({ ...route, isFavourite: true });
        Toast.show({ type: 'success', text1: 'Added to favourites!' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update favourites.' });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.center}>
        <Text>Route not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Route Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.routeId}>{route.url_route_id}</Text>
          <Text style={styles.routeName}>{route.route_name}</Text>
          <Text style={styles.routePath}>{route.start_stage} → {route.end_stage}</Text>
        </View>
        <TouchableOpacity style={styles.favBtn} onPress={toggleFavourite} disabled={toggling}>
          <Ionicons
            name={route.isFavourite ? 'heart' : 'heart-outline'}
            size={24}
            color={route.isFavourite ? '#FCA5A5' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="location-outline" size={20} color="#FF6B00" />
          <Text style={styles.statValue}>{route.total_stages}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="bus-outline" size={20} color="#FF6B00" />
          <Text style={styles.statValue}>{liveBuses.length}</Text>
          <Text style={styles.statLabel}>Live Buses</Text>
        </View>
        {route.distance_km && (
          <View style={styles.stat}>
            <Ionicons name="map-outline" size={20} color="#FF6B00" />
            <Text style={styles.statValue}>{route.distance_km.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        )}
      </View>

      {/* Book This Route Banner */}
      <View style={styles.bookBanner}>
        <View style={styles.bookBannerLeft}>
          <Text style={styles.bookBannerTitle}>Ready to travel?</Text>
          <Text style={styles.bookBannerSub}>Reserve your seat on this route</Text>
        </View>
        <TouchableOpacity
          style={styles.bookNowBtn}
          onPress={() => router.push({ pathname: '/(passenger)/book/[scheduleId]', params: { scheduleId: 'any', routeId: id } })}
        >
          <Ionicons name="ticket-outline" size={16} color="#fff" />
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Live Buses */}
      {liveBuses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Buses</Text>
          {liveBuses.map((bus) => (
            <TouchableOpacity
              key={bus.busId}
              style={styles.busCard}
              onPress={() => router.push({ pathname: '/(passenger)/track/[busId]', params: { busId: bus.busId } })}
            >
              <View style={styles.busIcon}>
                <Text style={{ fontSize: 20 }}>🚌</Text>
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busNumber}>{bus.busNumber}</Text>
                <Text style={styles.busNext}>Next: {bus.nextStop || 'Unknown'}</Text>
                {bus.delay > 0 && <Text style={styles.busDelay}>⏱ {bus.delay} min late</Text>}
              </View>
              <View style={styles.busStatus}>
                <Text style={styles.busSpeed}>{bus.speed || 0} km/h</Text>
                <Ionicons name="navigate" size={20} color="#10B981" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stops List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Stops ({stages.length})</Text>
        {stages.map((stage, index) => (
          <View key={stage._id} style={styles.stopRow}>
            <View style={styles.stopTimeline}>
              <View style={[styles.stopDot, index === 0 ? styles.firstDot : index === stages.length - 1 ? styles.lastDot : styles.midDot]} />
              {index < stages.length - 1 && <View style={styles.stopLine} />}
            </View>
            <Text style={styles.stopName}>{stage.stage_name}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  bookBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FF6B00', marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    borderRadius: 14, padding: 14,
  },
  bookBannerLeft: { flex: 1 },
  bookBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bookBannerSub: { color: '#FFE4CC', fontSize: 12, marginTop: 2 },
  bookNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
  },
  bookNowText: { color: '#FF6B00', fontWeight: '800', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 48,
    gap: 10,
  },
  backBtn: { padding: 4, marginTop: 2 },
  headerContent: { flex: 1 },
  routeId: { color: '#FFE4CC', fontSize: 13, fontWeight: '700' },
  routeName: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 },
  routePath: { color: '#FFE4CC', fontSize: 13, marginTop: 4 },
  favBtn: { padding: 4, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  busCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  busIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  busInfo: { flex: 1 },
  busNumber: { fontSize: 15, fontWeight: '700', color: '#111827' },
  busNext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  busDelay: { fontSize: 12, color: '#EF4444', marginTop: 2 },
  busStatus: { alignItems: 'center', gap: 4 },
  busSpeed: { fontSize: 12, color: '#6B7280' },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  stopTimeline: { width: 24, alignItems: 'center' },
  stopDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  firstDot: { backgroundColor: '#10B981' },
  lastDot: { backgroundColor: '#EF4444' },
  midDot: { backgroundColor: '#D1D5DB', width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  stopLine: { width: 2, height: 28, backgroundColor: '#E5E7EB', marginLeft: -1 },
  stopName: { flex: 1, fontSize: 14, color: '#374151', paddingBottom: 16, marginLeft: 8 },
});
