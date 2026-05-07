import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

interface VerifiedBooking {
  bookingRef: string;
  status: string;
  passengers: number;
  boardingStop: string;
  dropStop: string;
  seatNumbers: string[];
  seatPreference: string;
  user?: { name: string; email: string; phone?: string };
  route?: { route_name: string };
  schedule?: { departureTime: string; arrivalTime: string };
}

type ScanState = 'scanning' | 'verifying' | 'success' | 'error' | 'already';

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState<VerifiedBooking | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (cooldownRef.current || scanState !== 'scanning') return;
    cooldownRef.current = true;

    let ref: string | null = null;
    try {
      const parsed = JSON.parse(data);
      ref = parsed.ref ?? null;
    } catch {
      ref = data.trim(); // plain text ref
    }

    if (!ref) {
      Toast.show({ type: 'error', text1: 'Invalid QR code' });
      setTimeout(() => { cooldownRef.current = false; }, 2000);
      return;
    }

    Vibration.vibrate(100);
    setScanState('verifying');

    try {
      const res = await api.post('/mobile/driver/verify-qr', { bookingRef: ref });
      setBooking(res.data.booking);
      setMessage(res.data.message);
      setScanState(res.data.alreadyBoarded ? 'already' : 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed';
      setBooking(err.response?.data?.booking || null);
      setMessage(msg);
      setScanState('error');
    }
  };

  const resetScan = () => {
    setBooking(null);
    setMessage('');
    setScanState('scanning');
    cooldownRef.current = false;
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
        <Text style={styles.permText}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={64} color="#D1D5DB" />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permText}>Allow camera to scan passenger QR codes</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Passenger QR</Text>
        <TouchableOpacity onPress={() => setTorchOn(t => !t)} style={styles.torchBtn}>
          <Ionicons name={torchOn ? 'flashlight' : 'flashlight-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Camera / Result area */}
      {scanState === 'scanning' || scanState === 'verifying' ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanState === 'scanning' ? handleBarcode : undefined}
            enableTorch={torchOn}
          />
          {/* Scan overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {scanState === 'verifying' && (
                <View style={styles.verifyingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.verifyingText}>Verifying…</Text>
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>
              {scanState === 'verifying' ? 'Checking booking…' : 'Point camera at passenger QR ticket'}
            </Text>
          </View>
        </View>
      ) : (
        /* Result Card */
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {/* Status banner */}
          <View style={[styles.resultBanner,
            scanState === 'success' ? styles.bannerSuccess :
            scanState === 'already' ? styles.bannerWarning :
            styles.bannerError
          ]}>
            <Ionicons
              name={
                scanState === 'success' ? 'checkmark-circle' :
                scanState === 'already' ? 'information-circle' :
                'close-circle'
              }
              size={36}
              color="#fff"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {scanState === 'success' ? '✅ Verified & Boarded' :
                 scanState === 'already' ? '⚠️ Already Boarded' :
                 '❌ Verification Failed'}
              </Text>
              <Text style={styles.bannerMsg}>{message}</Text>
            </View>
          </View>

          {booking && (
            <View style={styles.bookingCard}>
              {/* Passenger */}
              {booking.user && (
                <View style={styles.passengerRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {booking.user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerName}>{booking.user.name}</Text>
                    <Text style={styles.passengerEmail}>{booking.user.email}</Text>
                    {booking.user.phone && <Text style={styles.passengerEmail}>{booking.user.phone}</Text>}
                  </View>
                  <View style={[styles.statusBadge,
                    booking.status === 'boarded' ? styles.statusBoarded :
                    booking.status === 'confirmed' ? styles.statusConfirmed :
                    styles.statusCancelled
                  ]}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              {/* Booking ref */}
              <View style={styles.refRow}>
                <Ionicons name="bookmark" size={14} color="#9CA3AF" />
                <Text style={styles.refText}>{booking.bookingRef}</Text>
              </View>

              {/* Route */}
              {booking.route && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Route</Text>
                  <Text style={styles.detailValue}>{booking.route.route_name}</Text>
                </View>
              )}

              {/* Stops */}
              <View style={styles.stopsRow}>
                <View style={styles.stopItem}>
                  <View style={[styles.stopDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.stopText} numberOfLines={1}>{booking.boardingStop || '—'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#D1D5DB" />
                <View style={styles.stopItem}>
                  <View style={[styles.stopDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.stopText} numberOfLines={1}>{booking.dropStop || '—'}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{booking.passengers} pax</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="storefront-outline" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{booking.seatPreference || 'Any'} seat</Text>
                </View>
              </View>

              {/* Assigned seats */}
              {(booking.seatNumbers || []).length > 0 && (
                <View style={styles.seatSection}>
                  <Text style={styles.seatSectionLabel}>Assigned Seats</Text>
                  <View style={styles.seatBadges}>
                    {booking.seatNumbers.map(s => (
                      <View key={s} style={styles.seatBadge}>
                        <Text style={styles.seatBadgeText}>Seat {s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Ionicons name="qr-code-outline" size={18} color="#003087" />
              <Text style={styles.scanAgainText}>Scan Next Passenger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtnBottom} onPress={() => router.back()}>
              <Text style={styles.backBtnBottomText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', gap: 12, padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#003087', gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  torchBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10 },

  // Camera
  cameraContainer: { flex: 1, position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 260, height: 260,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#60A5FA', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  verifyingText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scanHint: {
    color: '#fff', fontSize: 13, fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginTop: 28, textAlign: 'center',
  },

  // Result
  resultContainer: { backgroundColor: '#F9FAFB', flexGrow: 1, padding: 16, paddingBottom: 40 },
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 16 },
  bannerSuccess: { backgroundColor: '#059669' },
  bannerWarning: { backgroundColor: '#D97706' },
  bannerError:   { backgroundColor: '#DC2626' },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bannerMsg:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  bookingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 16,
  },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#1D4ED8' },
  passengerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  passengerEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBoarded:   { backgroundColor: '#DBEAFE' },
  statusConfirmed: { backgroundColor: '#D1FAE5' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  refText: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#374151', fontFamily: 'monospace' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 12, color: '#9CA3AF' },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#374151', maxWidth: '60%', textAlign: 'right' },
  stopsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stopItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  stopText: { fontSize: 12, fontWeight: '500', color: '#374151', flex: 1 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  seatSection: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10 },
  seatSectionLabel: { fontSize: 11, color: '#3B82F6', fontWeight: '600', marginBottom: 8 },
  seatBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seatBadge: { backgroundColor: '#1D4ED8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  seatBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Permissions
  permTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  permText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  permBtn: { backgroundColor: '#003087', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Actions
  actions: { gap: 10 },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  scanAgainText: { color: '#003087', fontWeight: '700', fontSize: 15 },
  backBtnBottom: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  backBtnBottomText: { fontWeight: '600', fontSize: 15, color: '#374151' },
});
