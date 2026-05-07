import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const SOS_TYPES = [
  { key: 'breakdown', label: 'Bus Breakdown', icon: 'build-outline', color: '#F59E0B' },
  { key: 'accident', label: 'Accident', icon: 'car-crash', color: '#EF4444' },
  { key: 'medical', label: 'Medical Emergency', icon: 'medkit-outline', color: '#EF4444' },
  { key: 'other', label: 'Other Emergency', icon: 'alert-circle-outline', color: '#6B7280' },
];

export default function SOSScreen() {
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulseSOS = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const sendSOS = async () => {
    if (!selectedType) {
      Toast.show({ type: 'error', text1: 'Please select the type of emergency.' });
      return;
    }

    // Show confirmation on web, or use Alert on native
    if (Platform.OS === 'web') {
      setConfirming(true);
    } else {
      Alert.alert(
        '🚨 Send SOS Alert',
        `This will immediately alert all admins and dispatch support.\n\nType: ${selectedType}\n\nAre you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send SOS', style: 'destructive', onPress: () => doSendSOS() },
        ]
      );
    }
  };

  const doSendSOS = async () => {
    setConfirming(false);
    console.log('[SOS] Starting SOS submission:', selectedType);
    setSending(true);
    pulseSOS();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude = 28.6139;
      let longitude = 77.2090;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      console.log('[SOS] Location:', latitude, longitude);

      // Emit via socket (best effort)
      const socket = getSocket();
      console.log('[SOS] Emitting via socket');
      try {
        socket.emit('driver:sos', {
          type: selectedType,
          message: message || `${selectedType} emergency reported by driver`,
          latitude,
          longitude,
        });
        console.log('[SOS] Socket emit successful');
      } catch (socketError) {
        console.warn('[SOS] Socket emit failed:', socketError);
      }

      // Also create alert via REST API (main way)
      console.log('[SOS] Posting to /alerts endpoint');
      const res = await api.post('/alerts', {
        type: 'sos',  // Use 'sos' type, not the emergency type
        severity: 'critical',
        message: message || `SOS: ${selectedType} - Emergency alert from driver ${user?.name}`,
        details: {
          emergencyType: selectedType,
          latitude,
          longitude,
        },
      });

      console.log('[SOS] Response:', res.data);
      setSent(true);
      Toast.show({ type: 'success', text1: 'SOS sent! Help is on the way.' });
    } catch (error: any) {
      console.error('[SOS ERROR]', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        stack: error?.stack,
      });
      Toast.show({ type: 'error', text1: `Failed to send SOS: ${error?.response?.data?.message || error?.message || 'Unknown error'}` });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.sentContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        <Text style={styles.sentTitle}>SOS Sent!</Text>
        <Text style={styles.sentSub}>Admins and dispatch have been alerted.</Text>
        <Text style={styles.sentSub}>Help is on its way.</Text>
        <TouchableOpacity style={styles.resetButton} onPress={() => { setSent(false); setSelectedType(''); setMessage(''); }}>
          <Text style={styles.resetButtonText}>Send Another</Text>
        </TouchableOpacity>
        <Text style={styles.emergencyNote}>Emergency? Call 112</Text>
      </View>
    );
  }

  if (confirming) {
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmCard}>
          <Ionicons name="alert-circle" size={60} color="#EF4444" />
          <Text style={styles.confirmTitle}>Send SOS Alert?</Text>
          <Text style={styles.confirmMessage}>
            This will immediately alert all admins and dispatch support.
          </Text>
          <Text style={styles.confirmType}>Emergency Type: <Text style={styles.confirmTypeBold}>{selectedType}</Text></Text>
          
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelButton]} 
              onPress={() => setConfirming(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.sendButton]} 
              onPress={doSendSOS}
            >
              <Text style={styles.sendButtonText}>Send SOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} scrollEnabled={Platform.OS === 'web'}>
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={20} color="#92400E" />
        <Text style={styles.warningText}>Use only in genuine emergencies</Text>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.sosButton, sending && styles.sosButtonSending]}
            onPress={sendSOS}
            disabled={sending}
          >
            <Ionicons name="alert-circle" size={40} color="#fff" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.sosHint}>Tap to send emergency alert</Text>
      </View>

      {/* Emergency Type Selection */}
      <View style={styles.typeSection}>
        <Text style={styles.sectionTitle}>Emergency Type</Text>
        <View style={styles.typeGrid}>
          {SOS_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.typeCard, selectedType === type.key && { borderColor: type.color, borderWidth: 2 }]}
              onPress={() => setSelectedType(type.key)}
            >
              <Ionicons name={type.icon as any} size={24} color={type.color} />
              <Text style={styles.typeLabel}>{type.label}</Text>
              {selectedType === type.key && (
                <Ionicons name="checkmark-circle" size={18} color={type.color} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Additional Message */}
      <View style={styles.messageSection}>
        <Text style={styles.sectionTitle}>Additional Details (optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Describe the emergency..."
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.submitButton, !selectedType && styles.submitButtonDisabled]} 
        onPress={sendSOS}
        disabled={!selectedType || sending}
      >
        <Text style={styles.submitButtonText}>
          {sending ? 'Sending...' : 'Submit SOS Alert'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.emergencyNote}>For life-threatening emergencies, call 112 immediately.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  contentContainer: { paddingBottom: 32 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  warningText: { color: '#92400E', fontWeight: '600', fontSize: 14 },
  sosSection: { alignItems: 'center', paddingVertical: 32 },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  sosButtonSending: { backgroundColor: '#9CA3AF' },
  sosButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  sosHint: { color: '#9CA3AF', fontSize: 14, marginTop: 12 },
  typeSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    gap: 8,
  },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
  checkIcon: { position: 'absolute', top: 6, right: 6 },
  messageSection: { paddingHorizontal: 16, marginBottom: 16 },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  submitButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5, backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emergencyNote: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 8, paddingHorizontal: 16 },
  sentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  sentTitle: { fontSize: 28, fontWeight: '700', color: '#10B981' },
  sentSub: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  resetButton: {
    marginTop: 24,
    backgroundColor: '#003087',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 16, width: '100%', maxWidth: 400 },
  confirmTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  confirmMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  confirmType: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  confirmTypeBold: { fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  confirmButtonContainer: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  confirmButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E5E7EB' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  sendButton: { backgroundColor: '#DC2626' },
  sendButtonText: { color: '#fff', fontWeight: '600' },
});
