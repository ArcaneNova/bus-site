import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

interface Ticket {
  _id: string;
  bookingRef: string;
  busNumber?: string;
  busType?: string;
  toStop: string;
  dropStop?: string;
  passengers: number;
  seatNumbers: string[];
  status: 'confirmed' | 'boarded' | 'completed' | 'cancelled';
  fare: number;
  expiresAt?: string;
  createdAt: string;
  paymentMode?: string;
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  confirmed: { label: 'Active',    color: '#FF6B00', bg: '#FFF7ED', icon: 'checkmark-circle' },
  boarded:   { label: 'Boarded',   color: '#3B82F6', bg: '#DBEAFE', icon: 'bus' },
  completed: { label: 'Completed', color: '#6B7280', bg: '#F3F4F6', icon: 'flag' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
};

type Filter = 'all' | 'confirmed' | 'boarded' | 'completed' | 'cancelled';

export default function MyTicketsScreen() {
  const router = useRouter();
  const [tickets,    setTickets]    = useState<Ticket[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<Filter>('all');
  const [showTicket, setShowTicket] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('/mobile/passenger/bookings');
      setTickets(res.data.bookings || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load tickets.' });
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, []);

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const getExpiry = (t: Ticket) => {
    if (!t.expiresAt) return null;
    return Math.max(0, Math.round((new Date(t.expiresAt).getTime() - Date.now()) / 60000));
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF6B00" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{tickets.length}</Text></View>
      </View>

      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
        {(['all', 'confirmed', 'boarded', 'completed', 'cancelled'] as Filter[]).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : STATUS[f]?.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTickets(); }} />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100, paddingTop: 4 }}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySub}>Scan the QR code on the bus gate to get a ticket</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(passenger)/scan-board' as any)}>
              <Ionicons name="scan" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Scan a Bus</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map(t => {
            const cfg = STATUS[t.status] || STATUS.confirmed;
            const expMins = getExpiry(t);
            const stop = t.toStop || t.dropStop || '—';
            return (
              <View key={t._id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardRef}>{t.bookingRef}</Text>
                    {t.busNumber && <Text style={styles.cardBus}>Bus {t.busNumber} · {t.busType || 'Non-AC'}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.routeRow}>
                  <Ionicons name="location" size={16} color="#EF4444" />
                  <Text style={styles.routeStop} numberOfLines={1}>Drop: {stop}</Text>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <Ionicons name="people-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>{t.passengers} pax</Text>
                  </View>
                  <View style={styles.meta}>
                    <Ionicons name="wallet-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>₹{t.fare}</Text>
                  </View>
                  {expMins !== null && t.status === 'confirmed' && (
                    <View style={styles.meta}>
                      <Ionicons name="time-outline" size={13} color={expMins < 15 ? '#EF4444' : '#F59E0B'} />
                      <Text style={[styles.metaText, { color: expMins < 15 ? '#EF4444' : '#F59E0B', fontWeight: '700' }]}>
                        {expMins}m left
                      </Text>
                    </View>
                  )}
                </View>

                {t.seatNumbers?.length > 0 && (
                  <View style={styles.seatsRow}>
                    {t.seatNumbers.map(s => (
                      <View key={s} style={styles.seatTag}>
                        <Text style={styles.seatTagText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {(t.status === 'confirmed' || t.status === 'boarded') && (
                  <TouchableOpacity style={styles.showQrBtn} onPress={() => setShowTicket(t)}>
                    <Ionicons name="qr-code" size={15} color="#FF6B00" />
                    <Text style={styles.showQrText}>Show QR to Driver</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating scan button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(passenger)/scan-board' as any)}>
        <Ionicons name="scan" size={26} color="#fff" />
      </TouchableOpacity>

      {/* QR Modal */}
      <Modal visible={!!showTicket} animationType="slide" transparent onRequestClose={() => setShowTicket(null)}>
        {showTicket && (() => {
          const expMins = getExpiry(showTicket);
          const qrData = JSON.stringify({
            bookingRef: showTicket.bookingRef,
            bus:        showTicket.busNumber,
            to:         showTicket.toStop || showTicket.dropStop,
            seats:      showTicket.seatNumbers,
            expires:    showTicket.expiresAt,
          });
          return (
            <View style={styles.modalOverlay}>
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.sheetTitle}>🎟️ Board Ticket</Text>
                    <Text style={styles.sheetSub}>{showTicket.busNumber ? `Bus ${showTicket.busNumber}` : 'Scan-to-Board'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowTicket(null)} style={styles.sheetCloseBtn}>
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.perf}>
                  <View style={styles.perfL} />
                  <View style={styles.perfLine} />
                  <View style={styles.perfR} />
                </View>
                <View style={styles.qrBox}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.sheetRef}>{showTicket.bookingRef}</Text>
                <Text style={styles.sheetRefSub}>Booking Reference</Text>
                <View style={styles.detailsGrid}>
                  {[
                    { label: 'Drop Stop',   value: showTicket.toStop || showTicket.dropStop || '—' },
                    { label: 'Passengers',  value: String(showTicket.passengers) },
                    { label: 'Fare',        value: `₹${showTicket.fare}` },
                    { label: 'Valid',       value: expMins !== null ? `${expMins} min` : 'See ticket' },
                  ].map((d, i) => (
                    <View key={i} style={styles.detailCell}>
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <Text style={styles.detailValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>
                {showTicket.seatNumbers?.length > 0 && (
                  <View style={styles.sheetSeats}>
                    <Text style={styles.sheetSeatsLabel}>Assigned Seats</Text>
                    <View style={styles.sheetSeatBadges}>
                      {showTicket.seatNumbers.map(s => (
                        <View key={s} style={styles.sheetSeatBadge}>
                          <Text style={styles.sheetSeatBadgeText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <Text style={styles.sheetHint}>Show QR to driver · Pay fare to conductor on board</Text>
                <TouchableOpacity style={styles.sheetCloseRow} onPress={() => setShowTicket(null)}>
                  <Text style={styles.sheetCloseRowText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, gap: 10 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '800' },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  filterBar: { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipActive: { backgroundColor: '#FF6B00' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: '#FF6B00', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardRef: { fontSize: 17, fontWeight: '900', color: '#111827', letterSpacing: 1, fontFamily: 'monospace' },
  cardBus: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  routeStop: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  seatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  seatTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  seatTagText: { color: '#1D4ED8', fontWeight: '800', fontSize: 12, fontFamily: 'monospace' },
  showQrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FED7AA' },
  showQrText: { color: '#FF6B00', fontWeight: '700', fontSize: 13 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FF6B00', width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF6B00', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36, overflow: 'hidden' },
  sheetHeader: { backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sheetSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sheetCloseBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  perf: { flexDirection: 'row', alignItems: 'center', height: 20 },
  perfL: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F9FAFB', marginLeft: -10 },
  perfLine: { flex: 1, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#E5E7EB' },
  perfR: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F9FAFB', marginRight: -10 },
  qrBox: { alignItems: 'center', paddingVertical: 16 },
  qrImage: { width: 190, height: 190, borderRadius: 12 },
  sheetRef: { textAlign: 'center', fontSize: 20, fontWeight: '900', letterSpacing: 2, color: '#111827', fontFamily: 'monospace' },
  sheetRefSub: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginBottom: 12 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 12 },
  detailCell: { width: '47%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  detailLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sheetSeats: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12 },
  sheetSeatsLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
  sheetSeatBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sheetSeatBadge: { backgroundColor: '#FF6B00', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8 },
  sheetSeatBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: 'monospace' },
  sheetHint: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', paddingHorizontal: 24, marginBottom: 12 },
  sheetCloseRow: { marginHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  sheetCloseRowText: { fontWeight: '700', fontSize: 15, color: '#374151' },
});
