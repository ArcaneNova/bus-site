import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Image, Alert, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const { width: SW, height: SH } = Dimensions.get('window');

interface StageWithFare {
  _id: string;
  seq: number;
  stage_name: string;
  fareFromHere: number;
  distanceKm: number;
}

interface BusInfo {
  _id: string;
  busNumber: string;
  busQrId: string;
  type: string;
  capacity: number;
}

interface ScanData {
  bus: BusInfo;
  route: { route_name: string; start_stage: string; end_stage: string } | null;
  schedule: { _id: string; departureTime: string; status: string } | null;
  currentStop: string | null;
  stages: StageWithFare[];
}

interface TicketResult {
  bookingRef: string;
  seatNumbers: string[];
  toStop: string;
  fare: number;
  status: string;
  expiresAt: string;
  busNumber: string;
  busType: string;
}

type Screen = 'scan' | 'info' | 'ticket';

export default function ScanToBoardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const [screen,       setScreen]      = useState<Screen>('scan');
  const [torch,        setTorch]       = useState(false);
  const [loadingBus,   setLoadingBus]  = useState(false);
  const [scanData,     setScanData]    = useState<ScanData | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<StageWithFare | null>(null);
  const [passengers,   setPassengers]  = useState(1);
  const [booking,      setBooking]     = useState(false);
  const [ticket,       setTicket]      = useState<TicketResult | null>(null);

  // Reset on mount
  useEffect(() => {
    scannedRef.current = false;
    setScreen('scan');
    setScanData(null);
    setSelectedDrop(null);
    setPassengers(1);
    setTicket(null);
  }, []);

  const fetchBusInfo = useCallback(async (busQrId: string) => {
    setLoadingBus(true);
    try {
      const res = await api.get(`/public/bus-scan/${busQrId}`);
      if (res.data.success) {
        setScanData(res.data);
        setScreen('info');
      } else {
        Toast.show({ type: 'error', text1: 'Bus not found for this QR.' });
        scannedRef.current = false;
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Could not fetch bus info.' });
      scannedRef.current = false;
    } finally { setLoadingBus(false); }
  }, []);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scannedRef.current || loadingBus) return;
    scannedRef.current = true;

    // Support both raw busQrId and full URL format
    let busQrId = data;
    try {
      const url = new URL(data);
      const parts = url.pathname.split('/');
      busQrId = parts[parts.length - 1] || data;
    } catch {}

    if (!busQrId) {
      Toast.show({ type: 'error', text1: 'Invalid QR code.' });
      scannedRef.current = false;
      return;
    }
    fetchBusInfo(busQrId);
  };

  const handleBook = async () => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Please login to continue.' });
      return;
    }
    if (!selectedDrop || !scanData) return;
    setBooking(true);
    try {
      const res = await api.post('/public/scan-book/mobile-book', {
        busQrId:      scanData.bus.busQrId,
        scheduleId:   scanData.schedule?._id,
        dropStageId:  selectedDrop._id,
        dropStageName: selectedDrop.stage_name,
        fare:         selectedDrop.fareFromHere,
        passengers,
      });
      setTicket(res.data.booking);
      setScreen('ticket');
      Toast.show({ type: 'success', text1: 'Seat confirmed! Show QR to driver.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.response?.data?.message || 'Booking failed. Try again.' });
    } finally { setBooking(false); }
  };

  const resetScan = () => {
    scannedRef.current = false;
    setScanData(null);
    setSelectedDrop(null);
    setPassengers(1);
    setTicket(null);
    setScreen('scan');
  };

  // ── TICKET SCREEN ────────────────────────────────────────────
  if (screen === 'ticket' && ticket) {
    const expiresMs = new Date(ticket.expiresAt).getTime() - Date.now();
    const expiresMins = Math.max(0, Math.round(expiresMs / 60000));
    const qrData = JSON.stringify({
      bookingRef: ticket.bookingRef,
      bus:        ticket.busNumber,
      to:         ticket.toStop,
      seats:      ticket.seatNumbers,
      expires:    ticket.expiresAt,
    });

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={[styles.ticketHeader, { backgroundColor: '#10B981' }]}>
          <Ionicons name="checkmark-circle" size={52} color="#fff" />
          <Text style={styles.ticketHeaderTitle}>Ticket Confirmed!</Text>
          <Text style={styles.ticketHeaderSub}>Seat reserved · Show QR to driver</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrBox}>
          <Image
            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}` }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        </View>

        {/* Ref */}
        <Text style={styles.ticketRef}>{ticket.bookingRef}</Text>
        <Text style={styles.ticketRefSub}>Booking Reference</Text>

        {/* Details */}
        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bus</Text>
            <Text style={styles.detailValue}>{ticket.busNumber} · {ticket.busType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Drop Stop</Text>
            <Text style={styles.detailValue}>{ticket.toStop}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>{passengers}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fare</Text>
            <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '900' }]}>₹{ticket.fare}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid For</Text>
            <Text style={[styles.detailValue, { color: expiresMins < 15 ? '#EF4444' : '#F59E0B' }]}>{expiresMins} min</Text>
          </View>
        </View>

        {/* Seat badges */}
        {ticket.seatNumbers.length > 0 && (
          <View style={styles.seatsBox}>
            <Text style={styles.seatsLabel}>Assigned Seats</Text>
            <View style={styles.seatBadges}>
              {ticket.seatNumbers.map(s => (
                <View key={s} style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.payHint}>Pay fare to conductor on boarding</Text>

        <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
          <Ionicons name="scan" size={18} color="#fff" />
          <Text style={styles.scanAgainText}>Scan Another Bus</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── BUS INFO / STOP SELECTOR ─────────────────────────────────
  if (screen === 'info' && scanData) {
    const totalFare = selectedDrop ? selectedDrop.fareFromHere * passengers : 0;

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.infoHeader}>
          <TouchableOpacity onPress={resetScan} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoHeaderBus}>{scanData.bus.busNumber}</Text>
            <Text style={styles.infoHeaderRoute} numberOfLines={1}>
              {scanData.route?.route_name || 'Route'} · {scanData.bus.type}
            </Text>
          </View>
          {scanData.schedule?.status === 'in-progress' && (
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {scanData.currentStop && (
          <View style={styles.currentStopBar}>
            <Ionicons name="location" size={14} color="#FF6B00" />
            <Text style={styles.currentStopText}>Now near: {scanData.currentStop}</Text>
          </View>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
          {/* Stop Selector */}
          <Text style={styles.sectionTitle}>Select Drop Stop</Text>
          {scanData.stages.length === 0 ? (
            <Text style={styles.noStops}>No stops available</Text>
          ) : (
            scanData.stages.map(s => (
              <TouchableOpacity
                key={s._id}
                style={[styles.stopRow, selectedDrop?._id === s._id && styles.stopRowActive]}
                onPress={() => setSelectedDrop(s)}
              >
                <View style={[styles.stopDot, { backgroundColor: selectedDrop?._id === s._id ? '#FF6B00' : '#D1D5DB' }]} />
                <Text style={[styles.stopName, selectedDrop?._id === s._id && { color: '#FF6B00', fontWeight: '700' }]}>
                  {s.stage_name}
                </Text>
                <Text style={[styles.stopFare, selectedDrop?._id === s._id && { color: '#FF6B00', fontWeight: '800' }]}>
                  ₹{s.fareFromHere}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {/* Passengers */}
          <Text style={styles.sectionTitle}>Passengers</Text>
          <View style={styles.passengerRow}>
            <TouchableOpacity style={styles.countBtn} onPress={() => setPassengers(p => Math.max(1, p - 1))}>
              <Text style={styles.countBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.countVal}>{passengers}</Text>
            <TouchableOpacity style={styles.countBtn} onPress={() => setPassengers(p => Math.min(6, p + 1))}>
              <Text style={styles.countBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.countMax}>max 6</Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        {selectedDrop && (
          <View style={styles.bottomBar}>
            <View style={styles.farePreview}>
              <Text style={styles.farePreviewLabel}>{selectedDrop.stage_name}</Text>
              <Text style={styles.farePreviewAmount}>₹{totalFare}</Text>
            </View>
            <TouchableOpacity
              style={[styles.bookBtn, booking && { opacity: 0.6 }]}
              onPress={handleBook}
              disabled={booking}
            >
              {booking
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="bus" size={18} color="#fff" /><Text style={styles.bookBtnText}>Confirm Seat</Text></>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── CAMERA SCAN SCREEN ────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="camera-outline" size={64} color="#D1D5DB" />
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permSub}>To scan the bus gate QR code, allow camera access.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={loadingBus ? undefined : handleBarcode}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top */}
        <View style={styles.overlayTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.overlayBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>Scan Bus QR</Text>
          <TouchableOpacity onPress={() => setTorch(t => !t)} style={styles.overlayBtn}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scan frame */}
        <View style={styles.frameWrapper}>
          <View style={styles.frame}>
            {/* Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          {loadingBus && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.loadingText}>Fetching bus info…</Text>
            </View>
          )}
        </View>

        {/* Bottom */}
        <View style={styles.overlayBottom}>
          <Text style={styles.overlayHint}>Point camera at the QR code on the bus gate</Text>
          <View style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={18} color="#FF6B00" />
            <Text style={styles.hintCardText}>Scan → Select Drop Stop → Confirm Seat → Pay Conductor</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const FRAME = SW * 0.65;
const CORNER = 28;
const CW = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  // Camera
  overlay: { flex: 1, justifyContent: 'space-between' },
  overlayTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  overlayTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  frameWrapper: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  frame: { width: FRAME, height: FRAME, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FF6B00' },
  cornerTL: { top: 0, left: 0, borderTopWidth: CW, borderLeftWidth: CW, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CW, borderRightWidth: CW, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CW, borderLeftWidth: CW, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CW, borderRightWidth: CW, borderBottomRightRadius: 6 },
  loadingOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, gap: 10 } as any,
  loadingText: { color: '#fff', fontSize: 13 },
  overlayBottom: {
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 24, paddingHorizontal: 20,
    alignItems: 'center', gap: 12,
  },
  overlayHint: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  hintCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12,
  },
  hintCardText: { color: '#FFE4CC', fontSize: 12, flex: 1, lineHeight: 18 },
  // Permission
  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
  permSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  permBtn: { backgroundColor: '#FF6B00', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Bus info screen
  infoHeader: {
    backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  infoHeaderBus: { color: '#fff', fontSize: 20, fontWeight: '800' },
  infoHeaderRoute: { color: '#FFE4CC', fontSize: 12, marginTop: 1 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  currentStopBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FED7AA' },
  currentStopText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  noStops: { color: '#9CA3AF', textAlign: 'center', marginTop: 24, fontSize: 14 },
  stopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stopRowActive: { borderColor: '#FF6B00', backgroundColor: '#FFF7ED' },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  stopName: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  stopFare: { fontSize: 15, color: '#6B7280', fontWeight: '700' },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, marginBottom: 8 },
  countBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  countBtnText: { fontSize: 22, fontWeight: '300', color: '#374151' },
  countVal: { fontSize: 24, fontWeight: '800', color: '#111827', minWidth: 32, textAlign: 'center' },
  countMax: { fontSize: 12, color: '#9CA3AF' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6',
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  farePreview: { flex: 1 },
  farePreviewLabel: { fontSize: 12, color: '#6B7280' },
  farePreviewAmount: { fontSize: 22, fontWeight: '900', color: '#111827' },
  bookBtn: { backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Ticket screen
  ticketHeader: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', gap: 8 },
  ticketHeaderTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  ticketHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  qrBox: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 2, borderBottomColor: '#F3F4F6', borderStyle: 'dashed' },
  qrImage: { width: 200, height: 200, borderRadius: 12 },
  ticketRef: { textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: 2, color: '#111827', marginTop: 16, fontFamily: 'monospace' },
  ticketRefSub: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginBottom: 16 },
  ticketDetails: { marginHorizontal: 16, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 14, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  detailLabel: { fontSize: 13, color: '#9CA3AF' },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  seatsBox: { marginHorizontal: 16, marginTop: 14, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14 },
  seatsLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  seatBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seatBadge: { backgroundColor: '#1D4ED8', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  seatBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: 'monospace' },
  payHint: { textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  scanAgainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF6B00', marginHorizontal: 20, marginTop: 8, paddingVertical: 14, borderRadius: 14 },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
