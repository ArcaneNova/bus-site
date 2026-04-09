import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

interface ScheduleItem {
  _id: string;
  route: { route_name: string; start_stage: string; end_stage: string };
  bus: { busNumber: string };
  date: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#FEF3C7',
  'in-progress': '#DBEAFE',
  completed: '#D1FAE5',
  cancelled: '#FEE2E2',
};

const STATUS_TEXT: Record<string, string> = {
  scheduled: '#92400E',
  'in-progress': '#1D4ED8',
  completed: '#065F46',
  cancelled: '#991B1B',
};

export default function DriverScheduleScreen() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/mobile/driver/schedule');
      setSchedules(res.data.schedules || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load schedule.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.route?.route_name || 'Unknown Route'}</Text>
          <Text style={styles.routeStops}>
            {item.route?.start_stage} → {item.route?.end_stage}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={[styles.statusText, { color: STATUS_TEXT[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {format(new Date(item.date), 'dd MMM yyyy')}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.departureTime} – {item.arrivalTime}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="bus-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.bus?.busNumber}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={schedules}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No schedules found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  routeInfo: { flex: 1, marginRight: 8 },
  routeName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  routeStops: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  detailsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#374151' },
  empty: { alignItems: 'center', padding: 48, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },
});
