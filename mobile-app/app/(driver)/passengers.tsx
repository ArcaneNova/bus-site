import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

interface Passenger {
  _id: string;
  bookingRef: string;
  user: { name: string; email: string; phone?: string };
  boardingStop: string;
  dropStop: string;
  passengers: number;
  seatPreference: string;
  status: 'confirmed' | 'cancelled' | 'boarded' | 'completed' | 'pending';
  createdAt: string;
}

interface ScheduleOption { _id: string; departureTime: string; arrivalTime: string; route?: { route_name: string }; }

const STATUS_COLOR: Record<string, string> = {
  confirmed: '#10B981', pending: '#F59E0B', completed: '#6B7280', cancelled: '#EF4444', boarded: '#3B82F6',
};
const STATUS_BG: Record<string, string> = {
  confirmed: '#D1FAE5', pending: '#FEF3C7', completed: '#F3F4F6', cancelled: '#FEE2E2', boarded: '#DBEAFE',
};

export default function PassengerManifestScreen() {
  const router = useRouter();
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/mobile/driver/schedule/today');
      const scheds = res.data.schedules || [];
      setSchedules(scheds);
      if (scheds.length > 0 && !selectedSchedule) {
        setSelectedSchedule(scheds[0]._id);
      }
    } catch {}
  };

  const fetchPassengers = useCallback(async (schedId?: string) => {
    const id = schedId || selectedSchedule;
    try {
      const res = await api.get(`/mobile/driver/passengers${id ? `?scheduleId=${id}` : ''}`);
      setPassengers(res.data.bookings || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load passenger list.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSchedule]);

  useEffect(() => {
    fetchSchedules().then(() => fetchPassengers());
  }, []);

  useEffect(() => {
    if (selectedSchedule) fetchPassengers(selectedSchedule);
  }, [selectedSchedule]);

  const markBoarded = async (p: Passenger) => {
    try {
      await api.patch(`/mobile/bookings/${p._id}`, { status: 'boarded' });
      setPassengers(prev => prev.map(x => x._id === p._id ? { ...x, status: 'boarded' } : x));
      Toast.show({ type: 'success', text1: `${p.user?.name} marked as boarded` });
      setSelectedPassenger(null);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status.' });
    }
  };

  const currentSched = schedules.find(s => s._id === selectedSchedule);
  const filtered = passengers.filter(p => {
    const matchSearch = !searchText ||
      p.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.bookingRef?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.boardingStop?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const confirmed = passengers.filter(p => p.status === 'confirmed').length;
  const boarded = passengers.filter(p => p.status === 'boarded').length;
  const totalPax = passengers.reduce((s, p) => s + (p.passengers || 1), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Passenger Manifest</Text>
          {currentSched && (
            <Text style={styles.headerSub}>
              {currentSched.route?.route_name || 'Route'} • {currentSched.departureTime} → {currentSched.arrivalTime}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/(driver)/scan-qr')} style={[styles.schedulePickerBtn, { marginRight: 4, backgroundColor: 'rgba(5,150,105,0.25)' }]}>
          <Ionicons name="qr-code-outline" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSchedulePicker(true)} style={styles.schedulePickerBtn}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{passengers.length}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{confirmed}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#3B82F6' }]}>{boarded}</Text>
          <Text style={styles.statLabel}>Boarded</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{totalPax}</Text>
          <Text style={styles.statLabel}>Total Pax</Text>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ref, stop..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
        {['all', 'confirmed', 'boarded', 'cancelled', 'pending'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filterStatus === f && styles.filterChipActive]} onPress={() => setFilterStatus(f)}>
            <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#003087" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPassengers(); }} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No passengers found</Text>
              <Text style={styles.emptySub}>{passengers.length === 0 ? 'No bookings for this schedule.' : 'Try adjusting your search.'}</Text>
            </View>
          ) : filtered.map((p, idx) => (
            <TouchableOpacity key={p._id} style={styles.passengerCard} onPress={() => setSelectedPassenger(p)}>
              {/* Card header */}
              <View style={styles.cardTop}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{p.user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.passengerName}>{p.user?.name || 'Unknown'}</Text>
                  <Text style={styles.passengerEmail} numberOfLines={1}>{p.user?.email || '—'}</Text>
                </View>
                <View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[p.status] || '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[p.status] || '#6B7280' }]}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.seqBadge}>#{idx + 1}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Trip info */}
              <View style={styles.tripInfo}>
                <View style={styles.tripStop}>
                  <View style={[styles.stopDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.tripStopText} numberOfLines={1}>{p.boardingStop || '—'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#D1D5DB" />
                <View style={styles.tripStop}>
                  <View style={[styles.stopDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.tripStopText} numberOfLines={1}>{p.dropStop || '—'}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="bookmark-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>{p.bookingRef}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>{p.passengers} pax</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="storefront-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.metaText}>{p.seatPreference || 'Any'} seat</Text>
                </View>
              </View>

              {/* Quick board button for confirmed */}
              {p.status === 'confirmed' && (
                <TouchableOpacity style={styles.boardBtn} onPress={() => markBoarded(p)}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#003087" />
                  <Text style={styles.boardBtnText}>Mark Boarded</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedPassenger} animationType="slide" transparent>
        {selectedPassenger && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Passenger Details</Text>
                <TouchableOpacity onPress={() => setSelectedPassenger(null)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.modalAvatarRow}>
                  <View style={[styles.avatarBox, { width: 56, height: 56, borderRadius: 28 }]}>
                    <Text style={[styles.avatarText, { fontSize: 22 }]}>{selectedPassenger.user?.name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={[styles.passengerName, { fontSize: 18 }]}>{selectedPassenger.user?.name}</Text>
                    <Text style={styles.passengerEmail}>{selectedPassenger.user?.email}</Text>
                    {selectedPassenger.user?.phone && <Text style={styles.passengerEmail}>{selectedPassenger.user?.phone}</Text>}
                  </View>
                </View>

                <View style={styles.modalDivider} />

                {[
                  { label: 'Booking Ref', value: selectedPassenger.bookingRef, bold: true },
                  { label: 'Status', value: selectedPassenger.status },
                  { label: 'Boarding Stop', value: selectedPassenger.boardingStop || '—' },
                  { label: 'Drop-off Stop', value: selectedPassenger.dropStop || '—' },
                  { label: 'Passengers', value: `${selectedPassenger.passengers}` },
                  { label: 'Seat Preference', value: selectedPassenger.seatPreference || 'Any' },
                ].map((row, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={[styles.detailValue, row.bold && { fontWeight: '800', letterSpacing: 0.5 }]}>{row.value}</Text>
                  </View>
                ))}

                {selectedPassenger.status === 'confirmed' && (
                  <TouchableOpacity style={styles.fullBoardBtn} onPress={() => markBoarded(selectedPassenger)}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.fullBoardBtnText}>Mark as Boarded</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* Schedule Picker Modal */}
      <Modal visible={showSchedulePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Schedule</Text>
              <TouchableOpacity onPress={() => setShowSchedulePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {schedules.length === 0 ? (
                <Text style={styles.emptySub}>No schedules for today.</Text>
              ) : schedules.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.scheduleItem, selectedSchedule === s._id && styles.scheduleItemActive]}
                  onPress={() => { setSelectedSchedule(s._id); setShowSchedulePicker(false); }}
                >
                  <Ionicons name="time-outline" size={18} color={selectedSchedule === s._id ? '#003087' : '#9CA3AF'} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scheduleTime, selectedSchedule === s._id && { color: '#003087' }]}>
                      {s.departureTime} → {s.arrivalTime}
                    </Text>
                    {s.route && <Text style={styles.scheduleRoute}>{s.route.route_name}</Text>}
                  </View>
                  {selectedSchedule === s._id && <Ionicons name="checkmark-circle" size={20} color="#003087" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  header: {
    backgroundColor: '#003087', flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#93C5FD', fontSize: 12, marginTop: 2 },
  schedulePickerBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },
  statsBar: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  searchArea: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  filterRow: { flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: '#003087' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  passengerCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarBox: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#003087',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  passengerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  passengerEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-end', marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  seqBadge: { fontSize: 10, color: '#D1D5DB', fontWeight: '600', textAlign: 'right' },
  cardDivider: { height: 1, backgroundColor: '#F9FAFB', marginBottom: 10 },
  tripInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tripStop: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stopDot: { width: 8, height: 8, borderRadius: 4 },
  tripStopText: { flex: 1, fontSize: 12, color: '#374151', fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  boardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 10, backgroundColor: '#EFF6FF',
    paddingVertical: 8, borderRadius: 10,
  },
  boardBtnText: { fontSize: 13, fontWeight: '700', color: '#003087' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  fullBoardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#003087', paddingVertical: 14, borderRadius: 12, marginTop: 20,
  },
  fullBoardBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9FAFB',
  },
  scheduleItemActive: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  scheduleTime: { fontSize: 15, fontWeight: '600', color: '#374151' },
  scheduleRoute: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
