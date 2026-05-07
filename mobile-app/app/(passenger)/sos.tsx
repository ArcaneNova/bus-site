/**
 * Passenger Safety Report / SOS Screen
 *
 * Passengers can report:
 *  - Overcrowding  (AI demand anomaly correlation)
 *  - Driver behaviour
 *  - Harassment / safety threat
 *  - Medical emergency on bus
 *  - Bus breakdown (as witness)
 *
 * Uses socket "passenger:sos" + POST /api/v1/alerts/passenger-sos
 */

import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Platform, Animated, Vibration,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

// ─── Report types ─────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    key: 'overcrowding',
    label: 'Overcrowding',
    icon: 'people-outline',
    color: '#D97706',
    bg: '#FEF3C7',
    desc: 'Bus dangerously over-capacity',
  },
  {
    key: 'driver_behaviour',
    label: 'Driver Behaviour',
    icon: 'person-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'Rash driving, abuse or misconduct',
  },
  {
    key: 'harassment',
    label: 'Harassment / Threat',
    icon: 'shield-outline',
    color: '#DC2626',
    bg: '#FEE2E2',
    desc: 'Personal safety concern on board',
  },
  {
    key: 'medical',
    label: 'Medical Emergency',
    icon: 'medkit-outline',
    color: '#DC2626',
    bg: '#FEE2E2',
    desc: 'Passenger needs medical help',
  },
  {
    key: 'breakdown',
    label: 'Bus Breakdown',
    icon: 'build-outline',
    color: '#F59E0B',
    bg: '#FEF3C7',
    desc: 'Bus is stuck / broken down',
  },
  {
    key: 'other',
    label: 'Other Issue',
    icon: 'alert-circle-outline',
    color: '#6B7280',
    bg: '#F3F4F6',
    desc: 'Any other concern',
  },
] as const;

type ReportKey = typeof REPORT_TYPES[number]['key'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PassengerSOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [selected, setSelected]   = useState<ReportKey | null>(null);
  const [busNumber, setBusNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [confirming, setConfirming] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleSend = () => {
    if (!selected) {
      Toast.show({ type: 'error', text1: 'Please select the type of report' });
      return;
    }
    if (Platform.OS === 'web') {
      setConfirming(true);
    } else {
      Alert.alert(
        '📢 Send Safety Report?',
        `Report type: ${REPORT_TYPES.find(r => r.key === selected)?.label}\nThis will be sent to the control room immediately.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Report', style: 'destructive', onPress: doSend },
        ]
      );
    }
  };

  const doSend = async () => {
    setConfirming(false);
    setSending(true);
    pulse();
    Vibration.vibrate([100, 50, 100]);

    let latitude = 28.6139;
    let longitude = 77.209;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        latitude  = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
    } catch {}

    try {
      await api.post('/alerts/passenger-sos', {
        type:      selected,
        busNumber: busNumber.trim() || undefined,
        routeName: routeName.trim() || undefined,
        message:   message.trim() || undefined,
        latitude,
        longitude,
      });

      // Also emit via socket for real-time admin alert
      const socket = getSocket();
      if (socket) {
        socket.emit('passenger:sos', {
          type:      selected,
          busNumber: busNumber.trim(),
          latitude,
          longitude,
          userId:    user?._id,
          userName:  user?.name,
          message:   message.trim(),
        });
      }

      setSent(true);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send report. Please call 1800-XXX-XXXX.' });
    } finally {
      setSending(false);
    }
  };

  // ── Sent confirmation screen ──
  if (sent) {
    return (
      <View style={styles.sentContainer}>
        <View style={styles.sentIcon}>
          <Ionicons name="checkmark-circle" size={72} color="#059669" />
        </View>
        <Text style={styles.sentTitle}>Report Sent!</Text>
        <Text style={styles.sentSubtitle}>
          Your report has been received by the control room.{'\n'}
          Help is on the way. Stay safe.
        </Text>
        <View style={styles.sentInfo}>
          <Text style={styles.sentInfoLabel}>Report Type</Text>
          <Text style={styles.sentInfoValue}>
            {REPORT_TYPES.find(r => r.key === selected)?.label}
          </Text>
        </View>
        <View style={styles.emergencyCallBox}>
          <Ionicons name="call-outline" size={18} color="#DC2626" />
          <Text style={styles.emergencyCallText}>Emergency: 112</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedType = REPORT_TYPES.find(r => r.key === selected);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Safety Report</Text>
          <Text style={styles.headerSubtitle}>Report an issue on your bus</Text>
        </View>
      </View>

      {/* Emergency call strip */}
      <View style={styles.emergencyStrip}>
        <Ionicons name="call-outline" size={16} color="#DC2626" />
        <Text style={styles.emergencyStripText}>
          Life-threatening emergency? Call <Text style={{ fontWeight: '800' }}>112</Text>
        </Text>
      </View>

      <View style={styles.inner}>

        {/* Step 1 — Select type */}
        <Text style={styles.stepLabel}>1. What are you reporting?</Text>
        <View style={styles.typeGrid}>
          {REPORT_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.key}
              style={[
                styles.typeCard,
                { borderColor: selected === rt.key ? rt.color : '#E5E7EB' },
                selected === rt.key && { backgroundColor: rt.bg },
              ]}
              onPress={() => setSelected(rt.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIconBox, { backgroundColor: selected === rt.key ? rt.bg : '#F9FAFB' }]}>
                <Ionicons name={rt.icon as any} size={22} color={rt.color} />
              </View>
              <Text style={[styles.typeLabel, selected === rt.key && { color: rt.color }]}>
                {rt.label}
              </Text>
              <Text style={styles.typeDesc} numberOfLines={2}>{rt.desc}</Text>
              {selected === rt.key && (
                <View style={[styles.typeCheck, { backgroundColor: rt.color }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2 — Bus info */}
        <Text style={styles.stepLabel}>2. Bus details (optional but helpful)</Text>
        <View style={styles.inputRow}>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <Ionicons name="bus-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Bus number e.g. DL-423"
              placeholderTextColor="#9CA3AF"
              value={busNumber}
              onChangeText={setBusNumber}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <Ionicons name="git-branch-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Route e.g. 423"
              placeholderTextColor="#9CA3AF"
              value={routeName}
              onChangeText={setRouteName}
            />
          </View>
        </View>

        {/* Step 3 — Message */}
        <Text style={styles.stepLabel}>3. Describe the situation</Text>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Add details to help the control room respond faster…"
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
          <Text style={styles.noteText}>
            Your GPS location and name will be shared with the control room to dispatch help quickly.
          </Text>
        </View>

        {/* Send button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.sendBtn, !selected && styles.sendBtnDisabled,
              selectedType && { backgroundColor: selectedType.color }]}
            onPress={handleSend}
            disabled={!selected || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#fff" />
                <Text style={styles.sendBtnText}>Send Safety Report</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Confirm modal (web fallback) */}
        {confirming && (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Send Report?</Text>
              <Text style={styles.confirmBody}>
                Type: {selectedType?.label}{'\n'}This alerts the control room immediately.
              </Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirming(false)}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmSend, { backgroundColor: selectedType?.color ?? '#EF4444' }]}
                  onPress={doSend}
                >
                  <Text style={styles.confirmSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content:   { paddingBottom: 60 },

  header:       { backgroundColor: '#DC2626', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: {},
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSubtitle:{ color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  emergencyStrip:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  emergencyStripText: { fontSize: 13, color: '#DC2626' },

  inner: { padding: 16, gap: 8 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8, marginBottom: 8 },

  typeGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  typeCard:  { width: '47%', borderRadius: 16, borderWidth: 2, padding: 12, backgroundColor: '#fff', position: 'relative' },
  typeIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 3 },
  typeDesc:  { fontSize: 11, color: '#9CA3AF', lineHeight: 15 },
  typeCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  inputRow:  { flexDirection: 'row', gap: 10, marginBottom: 4 },
  inputBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  input:     { flex: 1, fontSize: 13, color: '#111827' },

  textAreaBox:{ backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 4, minHeight: 90 },
  textArea:   { fontSize: 13, color: '#111827', minHeight: 80 },

  noteBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 8 },
  noteText:   { fontSize: 12, color: '#1D4ED8', flex: 1, lineHeight: 18 },

  sendBtn:     { backgroundColor: '#DC2626', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Confirm modal
  confirmOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  confirmBox:    { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: 300 },
  confirmTitle:  { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  confirmBody:   { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  confirmBtns:   { flexDirection: 'row', gap: 12 },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  confirmSend:   { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmSendText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Sent screen
  sentContainer: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 32 },
  sentIcon:      { width: 120, height: 120, borderRadius: 60, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  sentTitle:     { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 10 },
  sentSubtitle:  { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  sentInfo:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sentInfoLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  sentInfoValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emergencyCallBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 24 },
  emergencyCallText: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  doneBtn:   { backgroundColor: '#059669', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
