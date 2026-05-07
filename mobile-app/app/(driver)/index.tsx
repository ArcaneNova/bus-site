import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AIInsights {
  demandLevel: string;   // low / medium / high / critical
  demandCount: number;
  delayMinutes: number;
  anomaly: boolean;
  nextStopDemand?: string;
}

export default function DriverHomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [passengerCount, setPassengerCount] = useState(0);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  const fetchDashboard = async () => {
    try {
      const [dashRes, schedRes] = await Promise.all([
        api.get('/mobile/driver/dashboard'),
        api.get('/mobile/driver/schedule/today'),
      ]);
      const d = dashRes.data;
      const s = schedRes.data;
      setData({
        driver: d.driver,
        todayTrips: d.todayTrips || 0,
        completedTrips: d.completedTrips || 0,
        assignedBus: d.assignedBus,
        currentSchedule: s.current || null,
        schedules: s.schedules || [],
      });

      // Fetch passenger count for current schedule
      if (s.current?._id) {
        try {
          const pRes = await api.get(`/mobile/driver/passengers?scheduleId=${s.current._id}`);
          setPassengerCount((pRes.data.bookings || []).filter((b: any) => b.status === 'confirmed').length);
        } catch {}
      }

      // Fetch AI insights (demand + delay prediction)
      try {
        const now = new Date();
        const [demandRes, delayRes] = await Promise.all([
          api.post('/ai/predict/demand', {
            route_id:  s.current?.route?._id ?? 'default',
            date:      now.toISOString().split('T')[0],
            hour:      now.getHours(),
            is_weekend: now.getDay() === 0 || now.getDay() === 6,
            is_holiday: false,
            weather:   'clear',
          }),
          api.post('/ai/predict/delay', {
            route_id:   s.current?.route?._id ?? 'default',
            hour:       now.getHours(),
            is_weekend: now.getDay() === 0 || now.getDay() === 6,
            weather:    'clear',
            passenger_load: passengerCount,
          }),
        ]);
        setAiInsights({
          demandLevel: demandRes.data.crowd_level ?? 'medium',
          demandCount: demandRes.data.predicted_demand ?? 0,
          delayMinutes: delayRes.data.predicted_delay_minutes ?? 0,
          anomaly: false,
          nextStopDemand: demandRes.data.crowd_label,
        });
      } catch {
        // AI service unavailable — skip gracefully
      }
    } catch {
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
      setData((prev: any) => prev ? { ...prev, driver: { ...prev.driver, status: newStatus } } : prev);
      Toast.show({ type: 'success', text1: `Status: ${newStatus}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status.' });
    } finally { setStatusUpdating(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#003087" /></View>;

  const isOnDuty = data?.driver?.status === 'on-duty';
  const pendingTrips = (data?.todayTrips || 0) - (data?.completedTrips || 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Good Day 👷</Text>
            <Text style={styles.heroName}>{user?.name}</Text>
            {data?.driver?.licenseNo && (
              <Text style={styles.heroLicense}>License: {data.driver.licenseNo}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.statusToggle, isOnDuty ? styles.onDuty : styles.offDuty]}
            onPress={toggleStatus}
            disabled={statusUpdating}
          >
            {statusUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <View style={[styles.toggleDot, isOnDuty ? styles.toggleDotOn : styles.toggleDotOff]} />
                <Text style={styles.statusToggleText}>{isOnDuty ? 'On Duty' : 'Off Duty'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{data?.todayTrips}</Text>
            <Text style={styles.heroStatLabel}>Trips Today</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatNum, { color: '#34D399' }]}>{data?.completedTrips}</Text>
            <Text style={styles.heroStatLabel}>Completed</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatNum, { color: '#FCD34D' }]}>{pendingTrips}</Text>
            <Text style={styles.heroStatLabel}>Pending</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatNum, { color: '#93C5FD' }]}>{data?.driver?.rating?.toFixed(1) || '—'}</Text>
            <Text style={styles.heroStatLabel}>Rating ⭐</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Active Trip', icon: 'navigate',      color: '#003087', bg: '#EFF6FF', onPress: () => router.push('/(driver)/active-trip') },
            { label: 'Passengers', icon: 'people',           color: '#FF6B00', bg: '#FFF7ED', badge: passengerCount > 0 ? passengerCount : undefined, onPress: () => router.push('/(driver)/passengers') },
            { label: 'Scan QR',    icon: 'qr-code',          color: '#059669', bg: '#ECFDF5', onPress: () => router.push('/(driver)/scan-qr') },
            { label: 'Schedule',   icon: 'calendar',          color: '#10B981', bg: '#F0FDF4', onPress: () => router.push('/(driver)/schedule') },
            { label: 'Earnings',   icon: 'stats-chart',       color: '#B45309', bg: '#FEF3C7', onPress: () => router.push('/(driver)/earnings') },
            { label: 'SOS',        icon: 'alert-circle',      color: '#EF4444', bg: '#FEF2F2', onPress: () => router.push('/(driver)/sos') },
            { label: 'Alerts',     icon: 'notifications',     color: '#F59E0B', bg: '#FFFBEB', onPress: () => router.push('/(driver)/alerts') },
            { label: 'Profile',    icon: 'person',            color: '#8B5CF6', bg: '#F5F3FF', onPress: () => router.push('/(driver)/profile') },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={a.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon as any} size={24} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              {a.badge !== undefined && a.badge > 0 && (
                <View style={styles.actionBadge}><Text style={styles.actionBadgeText}>{a.badge}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Insights Panel */}
      {aiInsights && (
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <View style={styles.aiHeaderLeft}>
              <Ionicons name="flash" size={18} color="#7C3AED" />
              <Text style={styles.aiCardTitle}>AI Insights</Text>
            </View>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>Live</Text></View>
          </View>
          <View style={styles.aiRow}>
            {/* Demand */}
            <View style={styles.aiItem}>
              <Text style={styles.aiItemLabel}>Expected Demand</Text>
              <Text style={[styles.aiItemValue, {
                color: aiInsights.demandLevel === 'critical' ? '#DC2626' :
                       aiInsights.demandLevel === 'high'     ? '#D97706' :
                       aiInsights.demandLevel === 'medium'   ? '#D97706' : '#059669',
              }]}>
                {aiInsights.demandCount > 0 ? `~${aiInsights.demandCount} pax` : aiInsights.demandLevel}
              </Text>
              <Text style={styles.aiItemSub}>
                {aiInsights.demandLevel === 'critical' ? '🔴 Packed' :
                 aiInsights.demandLevel === 'high'     ? '🟠 High crowd' :
                 aiInsights.demandLevel === 'medium'   ? '🟡 Moderate' : '🟢 Low crowd'}
              </Text>
            </View>
            <View style={styles.aiDivider} />
            {/* Delay */}
            <View style={styles.aiItem}>
              <Text style={styles.aiItemLabel}>Predicted Delay</Text>
              <Text style={[styles.aiItemValue, { color: aiInsights.delayMinutes > 5 ? '#EF4444' : '#059669' }]}>
                {aiInsights.delayMinutes > 0 ? `+${Math.round(aiInsights.delayMinutes)}m` : '✓ On time'}
              </Text>
              <Text style={styles.aiItemSub}>
                {aiInsights.delayMinutes > 5 ? 'Consider faster route' : 'Schedule looks good'}
              </Text>
            </View>
            <View style={styles.aiDivider} />
            {/* Anomaly */}
            <View style={styles.aiItem}>
              <Text style={styles.aiItemLabel}>Status</Text>
              <Text style={[styles.aiItemValue, { color: aiInsights.anomaly ? '#DC2626' : '#059669' }]}>
                {aiInsights.anomaly ? '⚠️ Alert' : '✓ Normal'}
              </Text>
              <Text style={styles.aiItemSub}>
                {aiInsights.anomaly ? 'Anomaly detected' : 'All clear'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Assigned Bus */}
      {data?.assignedBus && (
        <View style={styles.busCard}>
          <View style={styles.busCardHeader}>
            <Ionicons name="bus" size={20} color="#003087" />
            <Text style={styles.busCardTitle}>Assigned Bus</Text>
          </View>
          <View style={styles.busCardBody}>
            <View>
              <Text style={styles.busNumber}>{data.assignedBus.busNumber}</Text>
              <Text style={styles.busModel}>{data.assignedBus.model || 'Standard'}</Text>
            </View>
            <View style={[styles.busBadge, data.assignedBus.status === 'active' ? styles.busActive : styles.busInactive]}>
              <Text style={[styles.busBadgeText, { color: data.assignedBus.status === 'active' ? '#10B981' : '#EF4444' }]}>
                {data.assignedBus.status}
              </Text>
            </View>
          </View>
          {data.assignedBus.capacity && (
            <View style={styles.busCapRow}>
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text style={styles.busCapText}>Capacity: {data.assignedBus.capacity} seats</Text>
              {passengerCount > 0 && (
                <Text style={styles.busOccText}>• {passengerCount} booked</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Current Schedule */}
      {data?.currentSchedule ? (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <View style={styles.scheduleCardLeft}>
              <Ionicons name="time" size={20} color="#003087" />
              <Text style={styles.scheduleCardTitle}>Current Schedule</Text>
            </View>
            <View style={[styles.scheduleBadge,
              data.currentSchedule.status === 'in-progress' ? styles.inProgressBadge : styles.scheduledBadge
            ]}>
              <Text style={[styles.scheduleBadgeText,
                { color: data.currentSchedule.status === 'in-progress' ? '#1D4ED8' : '#92400E' }
              ]}>
                {data.currentSchedule.status}
              </Text>
            </View>
          </View>
          <Text style={styles.scheduleRoute}>
            {data.currentSchedule.route?.route_name || 'Route N/A'}
          </Text>
          <View style={styles.scheduleTimeRow}>
            <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
            <Text style={styles.scheduleTime}>
              {data.currentSchedule.departureTime} → {data.currentSchedule.arrivalTime}
            </Text>
          </View>
          <TouchableOpacity style={styles.startTripBtn} onPress={() => router.push('/(driver)/active-trip')}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.startTripBtnText}>
              {data.currentSchedule.status === 'in-progress' ? 'Continue Active Trip' : 'Start This Trip'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptySchedule}>
          <Ionicons name="calendar-outline" size={44} color="#D1D5DB" />
          <Text style={styles.emptyText}>No active schedule for today</Text>
        </View>
      )}

      {/* Today's Schedule List */}
      {data?.schedules?.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Today's Trips</Text>
          {data.schedules.map((s: any) => (
            <View key={s._id} style={styles.tripRow}>
              <View style={[styles.tripDot, {
                backgroundColor: s.status === 'completed' ? '#10B981' : s.status === 'in-progress' ? '#3B82F6' : '#D1D5DB'
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripRoute}>{s.route?.route_name || '—'}</Text>
                <Text style={styles.tripTime}>{s.departureTime} → {s.arrivalTime}</Text>
              </View>
              <Text style={[styles.tripStatus, {
                color: s.status === 'completed' ? '#10B981' : s.status === 'in-progress' ? '#3B82F6' : '#9CA3AF'
              }]}>
                {s.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#003087', paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroGreeting: { color: '#93C5FD', fontSize: 14 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  heroLicense: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  statusToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
  },
  onDuty: { backgroundColor: '#10B981' },
  offDuty: { backgroundColor: '#4B5563' },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleDotOn: { backgroundColor: '#fff' },
  toggleDotOff: { backgroundColor: '#9CA3AF' },
  statusToggleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 14,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroStatLabel: { color: '#93C5FD', fontSize: 10, textAlign: 'center' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30%',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    minWidth: 95,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' },
  actionBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: '#EF4444',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 18, alignItems: 'center',
  },
  actionBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  busCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  busCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  busCardTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  busCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  busNumber: { fontSize: 26, fontWeight: '800', color: '#003087' },
  busModel: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  busBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  busActive: { backgroundColor: '#D1FAE5' },
  busInactive: { backgroundColor: '#FEE2E2' },
  busBadgeText: { fontSize: 12, fontWeight: '700' },
  busCapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  busCapText: { fontSize: 12, color: '#9CA3AF' },
  busOccText: { fontSize: 12, color: '#FF6B00', fontWeight: '600' },
  scheduleCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#003087',
  },
  scheduleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scheduleCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleCardTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  scheduleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  inProgressBadge: { backgroundColor: '#DBEAFE' },
  scheduledBadge: { backgroundColor: '#FEF3C7' },
  scheduleBadgeText: { fontSize: 11, fontWeight: '700' },
  scheduleRoute: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  scheduleTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  scheduleTime: { fontSize: 14, color: '#6B7280' },
  startTripBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#003087', paddingVertical: 13, borderRadius: 12,
    shadowColor: '#003087', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  startTripBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptySchedule: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 32,
    alignItems: 'center', gap: 10,
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  tripRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  tripDot: { width: 10, height: 10, borderRadius: 5 },
  tripRoute: { fontSize: 13, fontWeight: '600', color: '#111827' },
  tripTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  tripStatus: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // AI Insights
  aiCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, shadowColor: '#7C3AED', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#7C3AED' },
  aiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiCardTitle:  { fontSize: 14, fontWeight: '700', color: '#374151' },
  aiBadge:      { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  aiBadgeText:  { fontSize: 11, fontWeight: '700', color: '#7C3AED' },
  aiRow:        { flexDirection: 'row' },
  aiItem:       { flex: 1, alignItems: 'center' },
  aiDivider:    { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 4 },
  aiItemLabel:  { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
  aiItemValue:  { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  aiItemSub:    { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
});
