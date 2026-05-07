import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

type SeatPref = 'window' | 'aisle' | 'any';

interface Stage {
  _id: string;
  stage_name: string;
  seq: number;
}

interface ScheduleInfo {
  _id: string;
  departureTime: string;
  arrivalTime: string;
  route: { _id: string; route_name: string; start_stage: string; end_stage: string };
  bus: { busNumber: string; capacity: number };
}

const SEAT_PREFS: { key: SeatPref; label: string; icon: string; desc: string }[] = [
  { key: 'window', label: 'Window', icon: '🪟', desc: 'Enjoy the view' },
  { key: 'aisle', label: 'Aisle', icon: '🚶', desc: 'Easy access' },
  { key: 'any', label: 'Any Seat', icon: '🎲', desc: 'No preference' },
];

export default function BookingScreen() {
  const { scheduleId, routeId } = useLocalSearchParams<{ scheduleId: string; routeId: string }>();
  const router = useRouter();

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<any>(null);

  const [passengers, setPassengers] = useState(1);
  const [seatPref, setSeatPref] = useState<SeatPref>('any');
  const [boardingStop, setBoardingStop] = useState('');
  const [dropStop, setDropStop] = useState('');
  const [showBoardingPicker, setShowBoardingPicker] = useState(false);
  const [showDropPicker, setShowDropPicker] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [scheduleId, routeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const isAny = !scheduleId || scheduleId === 'any';

      // Load schedule only if a real scheduleId is provided
      const schedRes = !isAny ? await api.get(`/schedule/${scheduleId}`).catch(() => null) : null;

      // If we got a schedule, use its routeId for stages
      const resolvedRouteId = routeId ||
        schedRes?.data?.schedule?.route?._id ||
        schedRes?.data?.schedule?.route;

      const stagesRes = resolvedRouteId
        ? await api.get(`/stages?routeId=${resolvedRouteId}&limit=200`).catch(() => null)
        : null;

      if (schedRes?.data?.schedule) {
        const sch = schedRes.data.schedule;
        setSchedule(sch);
        if (!boardingStop) setBoardingStop(sch.route?.start_stage || '');
        if (!dropStop) setDropStop(sch.route?.end_stage || '');
      } else if (isAny && routeId) {
        // No scheduleId — try to load any upcoming schedule for this route to show context
        const upcomingRes = await api.get(`/schedule?routeId=${routeId}&status=scheduled&limit=1`).catch(() => null);
        const upcoming = upcomingRes?.data?.schedules?.[0];
        if (upcoming) {
          setSchedule(upcoming);
          if (!boardingStop) setBoardingStop(upcoming.route?.start_stage || '');
          if (!dropStop) setDropStop(upcoming.route?.end_stage || '');
        }
      }

      if (stagesRes?.data?.stages?.length) {
        setStages(stagesRes.data.stages);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load booking details.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!boardingStop || !dropStop) {
      Alert.alert('Missing Info', 'Please select boarding and drop-off stops.');
      return;
    }
    setBooking(true);
    try {
      const realScheduleId = scheduleId && scheduleId !== 'any' ? scheduleId : schedule?._id;
      const res = await api.post('/mobile/passenger/booking', {
        scheduleId: realScheduleId || undefined,
        routeId: routeId || schedule?.route?._id || undefined,
        passengers,
        boardingStop,
        dropStop,
        seatPreference: seatPref,
        notes,
      });
      setBooked(res.data.booking);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Booking failed.' });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (booked) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#10B981" />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSub}>Your seat has been reserved successfully.</Text>

        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketBrand}>SmartDTC</Text>
            <View style={styles.ticketRefBox}>
              <Text style={styles.ticketRefLabel}>Booking Ref</Text>
              <Text style={styles.ticketRef}>{booked.bookingRef}</Text>
            </View>
          </View>
          <View style={styles.ticketDivider} />
          <View style={styles.ticketRow}>
            <Ionicons name="bus-outline" size={18} color="#FF6B00" />
            <Text style={styles.ticketText}>{schedule?.route?.route_name || 'Route'}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Ionicons name="location-outline" size={18} color="#10B981" />
            <Text style={styles.ticketText}>{booked.boardingStop} → {booked.dropStop}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Ionicons name="people-outline" size={18} color="#6B7280" />
            <Text style={styles.ticketText}>{booked.passengers} Passenger{booked.passengers > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.ticketText}>
              {schedule?.departureTime || '—'} → {schedule?.arrivalTime || '—'}
            </Text>
          </View>
          <View style={styles.ticketRow}>
            <Ionicons name="storefront-outline" size={18} color="#6B7280" />
            <Text style={styles.ticketText}>Seat: {booked.seatPreference || 'Any'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(passenger)/bookings')}>
          <Text style={styles.doneBtnText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(passenger)/')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Book a Seat</Text>
          {schedule && (
            <Text style={styles.headerSub}>{schedule.route?.route_name}</Text>
          )}
        </View>
      </View>

      {schedule && (
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <Ionicons name="bus" size={20} color="#FF6B00" />
            <Text style={styles.scheduleText}>Bus {schedule.bus?.busNumber}</Text>
            <View style={styles.scheduleTimeBadge}>
              <Text style={styles.scheduleTime}>{schedule.departureTime} → {schedule.arrivalTime}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Passengers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of Passengers</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, passengers <= 1 && styles.counterBtnDisabled]}
            onPress={() => setPassengers(p => Math.max(1, p - 1))}
            disabled={passengers <= 1}
          >
            <Ionicons name="remove" size={20} color={passengers <= 1 ? '#D1D5DB' : '#111827'} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{passengers}</Text>
          <TouchableOpacity
            style={[styles.counterBtn, passengers >= 6 && styles.counterBtnDisabled]}
            onPress={() => setPassengers(p => Math.min(6, p + 1))}
            disabled={passengers >= 6}
          >
            <Ionicons name="add" size={20} color={passengers >= 6 ? '#D1D5DB' : '#111827'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Boarding Stop */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Boarding Stop</Text>
        <TouchableOpacity style={styles.stopPicker} onPress={() => setShowBoardingPicker(true)}>
          <Ionicons name="location" size={18} color="#10B981" />
          <Text style={styles.stopPickerText}>{boardingStop || 'Select boarding stop...'}</Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Drop Stop */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Drop-off Stop</Text>
        <TouchableOpacity style={styles.stopPicker} onPress={() => setShowDropPicker(true)}>
          <Ionicons name="location" size={18} color="#EF4444" />
          <Text style={styles.stopPickerText}>{dropStop || 'Select drop-off stop...'}</Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Seat Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seat Preference</Text>
        <View style={styles.prefRow}>
          {SEAT_PREFS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.prefCard, seatPref === p.key && styles.prefCardActive]}
              onPress={() => setSeatPref(p.key)}
            >
              <Text style={styles.prefIcon}>{p.icon}</Text>
              <Text style={[styles.prefLabel, seatPref === p.key && styles.prefLabelActive]}>{p.label}</Text>
              <Text style={[styles.prefDesc, seatPref === p.key && styles.prefDescActive]}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any special requirements..."
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={200}
        />
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryValue}>{schedule?.route?.route_name || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>From</Text>
          <Text style={styles.summaryValue}>{boardingStop || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>To</Text>
          <Text style={styles.summaryValue}>{dropStop || '—'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passengers</Text>
          <Text style={styles.summaryValue}>{passengers}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Seat</Text>
          <Text style={styles.summaryValue}>{seatPref}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, booking && styles.confirmBtnDisabled]}
        onPress={confirmBooking}
        disabled={booking}
      >
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="ticket-outline" size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={{ height: 40 }} />

      {/* Boarding Stop Picker Modal */}
      <Modal visible={showBoardingPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Boarding Stop</Text>
              <TouchableOpacity onPress={() => setShowBoardingPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {stages.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.stageItem, boardingStop === s.stage_name && styles.stageItemActive]}
                  onPress={() => { setBoardingStop(s.stage_name); setShowBoardingPicker(false); }}
                >
                  <Ionicons name="ellipse" size={10} color={boardingStop === s.stage_name ? '#10B981' : '#D1D5DB'} />
                  <Text style={[styles.stageName, boardingStop === s.stage_name && styles.stageNameActive]}>{s.stage_name}</Text>
                  {boardingStop === s.stage_name && <Ionicons name="checkmark" size={18} color="#10B981" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Drop Stop Picker Modal */}
      <Modal visible={showDropPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Drop-off Stop</Text>
              <TouchableOpacity onPress={() => setShowDropPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {stages.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.stageItem, dropStop === s.stage_name && styles.stageItemActive]}
                  onPress={() => { setDropStop(s.stage_name); setShowDropPicker(false); }}
                >
                  <Ionicons name="ellipse" size={10} color={dropStop === s.stage_name ? '#EF4444' : '#D1D5DB'} />
                  <Text style={[styles.stageName, dropStop === s.stage_name && styles.stageNameActive]}>{s.stage_name}</Text>
                  {dropStop === s.stage_name && <Ionicons name="checkmark" size={18} color="#EF4444" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerSub: { color: '#FFE4CC', fontSize: 13, marginTop: 2 },
  scheduleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  scheduleTimeBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  scheduleTime: { fontSize: 12, color: '#FF6B00', fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  counterBtnDisabled: { borderColor: '#F3F4F6' },
  counterValue: { fontSize: 28, fontWeight: '700', color: '#111827', minWidth: 32, textAlign: 'center' },
  stopPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stopPickerText: { flex: 1, fontSize: 15, color: '#374151' },
  prefRow: { flexDirection: 'row', gap: 10 },
  prefCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  prefCardActive: { borderColor: '#FF6B00', backgroundColor: '#FFF7ED' },
  prefIcon: { fontSize: 24 },
  prefLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  prefLabelActive: { color: '#FF6B00' },
  prefDesc: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },
  prefDescActive: { color: '#F97316' },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: { fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  stageItemActive: { backgroundColor: '#F0FDF4' },
  stageName: { flex: 1, fontSize: 14, color: '#374151' },
  stageNameActive: { color: '#111827', fontWeight: '600' },
  // Success screen
  successContainer: { alignItems: 'center', padding: 24, paddingTop: 60 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#6B7280', marginBottom: 32, textAlign: 'center' },
  ticketCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ticketBrand: { fontSize: 20, fontWeight: '900', color: '#FF6B00' },
  ticketRefBox: { alignItems: 'flex-end' },
  ticketRefLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase' },
  ticketRef: { fontSize: 18, fontWeight: '700', color: '#111827' },
  ticketDivider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ticketText: { fontSize: 14, color: '#374151', flex: 1 },
  doneBtn: {
    width: '100%', backgroundColor: '#FF6B00', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginBottom: 12,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeBtn: {
    width: '100%', backgroundColor: '#F3F4F6', paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
  },
  homeBtnText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
