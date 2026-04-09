import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface DashboardData {
  driver: any;
  todayTrips: number;
  completedTrips: number;
  assignedBus: any;
  currentSchedule: any;
}

export default function DriverHomeScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [driverRes, scheduleRes] = await Promise.all([
        api.get('/mobile/driver/dashboard'),
        api.get('/mobile/driver/schedule/today'),
      ]);
      setData({
        driver: driverRes.data.driver,
        todayTrips: driverRes.data.todayTrips || 0,
        completedTrips: driverRes.data.completedTrips || 0,
        assignedBus: driverRes.data.assignedBus,
        currentSchedule: scheduleRes.data.current || null,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load dashboard.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleStatus = async () => {
    if (!data?.driver) return;
    const newStatus = data.driver.status === 'on-duty' ? 'off-duty' : 'on-duty';
    setStatusUpdating(true);
    try {
      await api.patch('/mobile/driver/status', { status: newStatus });
      setData((prev) => prev ? { ...prev, driver: { ...prev.driver, status: newStatus } } : prev);
      Toast.show({ type: 'success', text1: `Status changed to ${newStatus}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    );
  }

  const isOnDuty = data?.driver?.status === 'on-duty';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Day,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBadge, isOnDuty ? styles.onDuty : styles.offDuty]}
          onPress={toggleStatus}
          disabled={statusUpdating}
        >
          {statusUpdating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isOnDuty ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.statusText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#003087" />
          <Text style={styles.statNumber}>{data?.todayTrips}</Text>
          <Text style={styles.statLabel}>Today's Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{data?.completedTrips}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{data?.driver?.rating?.toFixed(1) || '—'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Assigned Bus */}
      {data?.assignedBus && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Bus</Text>
          <View style={styles.busInfo}>
            <Ionicons name="bus" size={32} color="#003087" />
            <View style={styles.busDetails}>
              <Text style={styles.busNumber}>{data.assignedBus.busNumber}</Text>
              <Text style={styles.busModel}>{data.assignedBus.model}</Text>
              <View style={[
                styles.busBadge,
                data.assignedBus.status === 'active' ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={styles.busBadgeText}>{data.assignedBus.status}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Current / Next Schedule */}
      {data?.currentSchedule && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Schedule</Text>
          <View style={styles.scheduleRow}>
            <Ionicons name="map-outline" size={20} color="#6B7280" />
            <Text style={styles.scheduleText}>
              {data.currentSchedule.route?.route_name || 'Route N/A'}
            </Text>
          </View>
          <View style={styles.scheduleRow}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.scheduleText}>
              {data.currentSchedule.departureTime} → {data.currentSchedule.arrivalTime}
            </Text>
          </View>
          <View style={[
            styles.scheduleBadge,
            data.currentSchedule.status === 'in-progress' ? styles.inProgressBadge : styles.scheduledBadge,
          ]}>
            <Text style={styles.scheduleBadgeText}>{data.currentSchedule.status}</Text>
          </View>
        </View>
      )}

      {!data?.assignedBus && !data?.currentSchedule && (
        <View style={styles.emptyCard}>
          <Ionicons name="information-circle-outline" size={40} color="#9CA3AF" />
          <Text style={styles.emptyText}>No schedule assigned for today.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#003087',
    padding: 20,
    paddingTop: 24,
  },
  greeting: { color: '#93C5FD', fontSize: 14 },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onDuty: { backgroundColor: '#10B981' },
  offDuty: { backgroundColor: '#6B7280' },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  busInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  busDetails: { flex: 1 },
  busNumber: { fontSize: 20, fontWeight: '700', color: '#003087' },
  busModel: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  busBadge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  activeBadge: { backgroundColor: '#D1FAE5' },
  inactiveBadge: { backgroundColor: '#FEE2E2' },
  busBadgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scheduleText: { fontSize: 15, color: '#374151', flex: 1 },
  scheduleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4 },
  inProgressBadge: { backgroundColor: '#DBEAFE' },
  scheduledBadge: { backgroundColor: '#FEF3C7' },
  scheduleBadgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
});
