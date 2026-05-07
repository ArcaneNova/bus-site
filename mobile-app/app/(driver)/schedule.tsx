import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import api from '@/lib/api';

interface ScheduleItem {
  _id: string;
  route: { route_name: string; start_stage: string; end_stage: string };
  bus: { busNumber: string; model?: string };
  date: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  'scheduled':   { bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' },
  'in-progress': { bg: '#DBEAFE', text: '#1D4ED8', icon: 'navigate' },
  'completed':   { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle' },
  'cancelled':   { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle-outline' },
};

const DATE_TABS = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE');
}

export default function DriverScheduleScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchSchedules = async () => {
    try {
      // Fetch all schedules for next 7 days
      const from = format(new Date(), 'yyyy-MM-dd');
      const to = format(addDays(new Date(), 6), 'yyyy-MM-dd');
      const res = await api.get(`/mobile/driver/schedule/range?from=${from}&to=${to}`);
      const all = res.data.schedules || [];
      setAllSchedules(all);
      filterByDate(all, selectedDate);
    } catch {
      // Fallback: load today only
      try {
        const res = await api.get('/mobile/driver/schedule');
        const today = res.data.schedules || [];
        setAllSchedules(today);
        setSchedules(today);
      } catch {
        Toast.show({ type: 'error', text1: 'Failed to load schedule.' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterByDate = (all: ScheduleItem[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSchedules(all.filter(s => s.date?.startsWith(dateStr)));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    filterByDate(allSchedules, date);
  };

  const statusStyle = (s: string) => STATUS_STYLE[s] || STATUS_STYLE['scheduled'];

  const todayCount = allSchedules.filter(s => s.date?.startsWith(format(new Date(), 'yyyy-MM-dd'))).length;
  const completedCount = allSchedules.filter(s => s.status === 'completed').length;
  const inProgressCount = allSchedules.filter(s => s.status === 'in-progress').length;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#003087" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <Text style={styles.headerSub}>{allSchedules.length} trips this week</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNum}>{todayCount}</Text>
            <Text style={styles.headerStatLabel}>Today</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNum, { color: '#34D399' }]}>{completedCount}</Text>
            <Text style={styles.headerStatLabel}>Done</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNum, { color: '#60A5FA' }]}>{inProgressCount}</Text>
            <Text style={styles.headerStatLabel}>Active</Text>
          </View>
        </View>
      </View>

      {/* Date Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateTabs}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 10 }}
      >
        {DATE_TABS.map((date, i) => {
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const dayStr = format(date, 'yyyy-MM-dd');
          const dayCount = allSchedules.filter(s => s.date?.startsWith(dayStr)).length;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.dateTab, isSelected && styles.dateTabActive]}
              onPress={() => handleDateChange(date)}
            >
              <Text style={[styles.dateTabDay, isSelected && styles.dateTabTextActive]}>
                {getDayLabel(date)}
              </Text>
              <Text style={[styles.dateTabNum, isSelected && styles.dateTabTextActive]}>
                {format(date, 'd')}
              </Text>
              {dayCount > 0 && (
                <View style={[styles.dateTabBadge, isSelected && styles.dateTabBadgeActive]}>
                  <Text style={[styles.dateTabBadgeText, isSelected && { color: '#003087' }]}>
                    {dayCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Schedule List */}
      <FlatList
        data={schedules}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No trips scheduled</Text>
            <Text style={styles.emptyText}>
              {isToday(selectedDate) ? 'You have no trips for today.' : `No trips on ${format(selectedDate, 'EEEE, MMM d')}.`}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const st = statusStyle(item.status);
          return (
            <View style={[styles.card, item.status === 'in-progress' && styles.cardActive]}>
              {/* Timeline connector */}
              {index < schedules.length - 1 && <View style={styles.timelineLine} />}
              <View style={styles.timelineDot}>
                <Ionicons name={st.icon as any} size={16} color={st.text} />
              </View>

              <View style={styles.cardBody}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeName} numberOfLines={1}>{item.route?.route_name || 'Unknown Route'}</Text>
                    <Text style={styles.routeStops} numberOfLines={1}>
                      {item.route?.start_stage} → {item.route?.end_stage}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status.replace('-', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{item.departureTime} – {item.arrivalTime}</Text>
                  </View>
                  <View style={styles.meta}>
                    <Ionicons name="bus-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{item.bus?.busNumber || '—'}</Text>
                  </View>
                  {item.bus?.model && (
                    <View style={styles.meta}>
                      <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{item.bus.model}</Text>
                    </View>
                  )}
                </View>

                {/* Action buttons */}
                {item.status === 'in-progress' && (
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => router.push('/(driver)/active-trip')}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.continueBtnText}>Continue Active Trip</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'scheduled' && isToday(selectedDate) && (
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => router.push('/(driver)/active-trip')}
                  >
                    <Ionicons name="play-circle-outline" size={16} color="#003087" />
                    <Text style={styles.startBtnText}>Start Trip</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#003087',
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#93C5FD', fontSize: 13, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 16 },
  headerStat: { alignItems: 'center' },
  headerStatNum: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerStatLabel: { color: '#93C5FD', fontSize: 10 },
  dateTabs: { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dateTab: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 12, minWidth: 56, gap: 2,
  },
  dateTabActive: { backgroundColor: '#003087' },
  dateTabDay: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
  dateTabNum: { fontSize: 18, fontWeight: '800', color: '#374151' },
  dateTabTextActive: { color: '#fff' },
  dateTabBadge: {
    backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2,
  },
  dateTabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dateTabBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  listContent: { padding: 16, paddingBottom: 32, gap: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 0,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 2, flexDirection: 'row',
    overflow: 'visible',
  },
  cardActive: { borderWidth: 1.5, borderColor: '#3B82F6' },
  timelineDot: {
    width: 36, alignItems: 'center', paddingTop: 16,
    backgroundColor: '#F9FAFB', borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
  },
  timelineLine: {
    position: 'absolute', left: 17, bottom: -12, width: 2, height: 12, backgroundColor: '#E5E7EB', zIndex: 1,
  },
  cardBody: { flex: 1, padding: 14, paddingLeft: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  routeName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  routeStops: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#003087', paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: 10, marginTop: 12, alignSelf: 'flex-start',
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, marginTop: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  startBtnText: { color: '#003087', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
});
