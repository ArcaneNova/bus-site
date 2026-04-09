import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  registerBackgroundGpsTask,
  startBackgroundGps,
  stopBackgroundGps,
} from '@/lib/backgroundGps';

// Register the background task definition at module load time
registerBackgroundGpsTask();

interface ActiveSchedule {
  _id: string;
  route: { _id: string; route_name: string };
  bus: { _id: string; busNumber: string };
  departureTime: string;
  arrivalTime: string;
  status: string;
}

interface StopInfo {
  seq: number;
  stage_name: string;
  arrived: boolean;
}

export default function ActiveTripScreen() {
  const { user, accessToken } = useAuthStore();
  const [schedule, setSchedule] = useState<ActiveSchedule | null>(null);
  const [stops, setStops] = useState<StopInfo[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripEnded, setTripEnded] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [incidentType, setIncidentType] = useState('delay');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidents, setIncidents] = useState<{type: string; note: string; time: string}[]>([]);
  const startTime = useRef<Date>(new Date());

  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const socket = useRef(connectSocket(accessToken || '')).current;

  useEffect(() => {
    fetchActiveSchedule();
    return () => { stopTracking(); };
  }, []);

  const fetchActiveSchedule = async () => {
    try {
      const res = await api.get('/mobile/driver/schedule/active');
      if (res.data.schedule) {
        setSchedule(res.data.schedule);
        const stopsRes = await api.get(`/stages?routeId=${res.data.schedule.route._id}&limit=100`);
        setStops(stopsRes.data.data?.map((s: any) => ({ seq: s.seq, stage_name: s.stage_name, arrived: false })) || []);
      }
    } catch {
      Toast.show({ type: 'info', text1: 'No active trip found.' });
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for GPS tracking.');
      return;
    }
    if (!schedule) return;

    // Start trip in DB
    try {
      const res = await api.post('/mobile/driver/trip/start', { scheduleId: schedule._id });
      if (res.data.trip?._id) setTripId(res.data.trip._id);
    } catch {}

    startTime.current = new Date();
    socket.emit('driver:trip_started', {
      scheduleId: schedule._id,
      busId: schedule.bus._id,
      routeId: schedule.route._id,
    });

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
      (loc) => {
        const { latitude, longitude, speed: spd, heading } = loc.coords;
        setSpeed(Math.round((spd || 0) * 3.6));
        socket.emit('driver:gps_update', {
          busId: schedule.bus._id,
          routeId: schedule.route._id,
          lat: latitude,
          lng: longitude,
          latitude,
          longitude,
          speed: Math.round((spd || 0) * 3.6),
          heading: heading || 0,
        });
      }
    );
    await startBackgroundGps(schedule.bus._id, schedule.route._id);
    setTracking(true);
    Toast.show({ type: 'success', text1: 'GPS tracking started.' });
  };

  const stopTracking = () => {
    locationSub.current?.remove();
    locationSub.current = null;
    stopBackgroundGps();
    setTracking(false);
  };

  const endTrip = async () => {
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip', style: 'destructive',
        onPress: async () => {
          stopTracking();
          const elapsed = Math.round((Date.now() - startTime.current.getTime()) / 60000);
          const stopsCompleted = stops.filter(s => s.arrived).length;

          if (tripId) {
            try {
              await api.post('/mobile/driver/trip/end', {
                tripId,
                stopsCompleted,
                distanceCovered: 0,
                avgSpeed: speed,
                incidents,
              });
            } catch {}
          }

          socket.emit('driver:trip_ended', {
            scheduleId: schedule?._id,
            busId: schedule?.bus._id,
            stopsCompleted,
            durationMinutes: elapsed,
          });

          setTripEnded(true);
          Toast.show({ type: 'success', text1: `Trip completed! ${stopsCompleted} stops served.` });
        },
      },
    ]);
  };

  const reportIncident = () => {
    const incident = { type: incidentType, note: incidentNote, time: new Date().toLocaleTimeString() };
    setIncidents(prev => [...prev, incident]);
    socket.emit('driver:incident', {
      busId: schedule?.bus._id,
      routeId: schedule?.route._id,
      ...incident,
    });
    setIncidentNote('');
    setShowIncident(false);
    Toast.show({ type: 'success', text1: `Incident reported: ${incidentType}` });
  };

  const markArrived = () => {
    if (!schedule || currentStopIndex >= stops.length) return;
    const stop = stops[currentStopIndex];

    socket.emit('driver:arrived_stop', {
      busId: schedule.bus._id,
      routeId: schedule.route._id,
      stopSeq: stop.seq,
      stopName: stop.stage_name,
    });

    setStops((prev) =>
      prev.map((s, i) => (i === currentStopIndex ? { ...s, arrived: true } : s))
    );
    setCurrentStopIndex((prev) => Math.min(prev + 1, stops.length - 1));
    Toast.show({ type: 'success', text1: `Arrived at ${stop.stage_name}` });
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.center}>
        <Ionicons name="bus-outline" size={60} color="#D1D5DB" />
        <Text style={styles.noTripText}>No active trip assigned.</Text>
        <Text style={styles.noTripSub}>Check your schedule for upcoming trips.</Text>
      </View>
    );
  }

  if (tripEnded) {
    const stopsCompleted = stops.filter(s => s.arrived).length;
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#10B981" />
        <Text style={styles.noTripText}>Trip Completed!</Text>
        <View style={styles.tripSummaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stops Completed</Text>
            <Text style={styles.summaryValue}>{stopsCompleted}/{stops.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Incidents Reported</Text>
            <Text style={styles.summaryValue}>{incidents.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{schedule.route.route_name}</Text>
          </View>
        </View>
        <Text style={styles.noTripSub}>Great work! Your trip has been recorded.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Trip Info */}
      <View style={styles.tripHeader}>
        <Text style={styles.routeName}>{schedule.route.route_name}</Text>
        <Text style={styles.busNumber}>Bus: {schedule.bus.busNumber}</Text>
        <Text style={styles.timing}>
          {schedule.departureTime} → {schedule.arrivalTime}
        </Text>
        <View style={styles.stopProgressBar}>
          <View style={[styles.stopProgressFill, { width: `${Math.round((stops.filter(s => s.arrived).length / Math.max(stops.length, 1)) * 100)}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>
          {stops.filter(s => s.arrived).length}/{stops.length} stops completed
        </Text>
      </View>

      {/* GPS Control */}
      <View style={styles.gpsCard}>
        <View style={styles.speedRow}>
          <Ionicons name="speedometer-outline" size={24} color="#003087" />
          <Text style={styles.speedText}>{speed} km/h</Text>
        </View>

        <TouchableOpacity
          style={[styles.gpsButton, tracking ? styles.stopButton : styles.startButton]}
          onPress={tracking ? stopTracking : startTracking}
        >
          <Ionicons name={tracking ? 'stop-circle' : 'navigate'} size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.gpsButtonText}>
            {tracking ? 'Stop GPS Tracking' : 'Start GPS Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mark Stop Arrived */}
      {stops.length > 0 && (
        <View style={styles.stopCard}>
          <Text style={styles.stopCardTitle}>Next Stop</Text>
          <Text style={styles.currentStop}>
            {stops[currentStopIndex]?.stage_name || 'End of Route'}
          </Text>
          <Text style={styles.stopProgress}>
            Stop {currentStopIndex + 1} of {stops.length}
          </Text>
          <TouchableOpacity
            style={[styles.arrivedButton, !tracking && styles.disabledButton]}
            onPress={markArrived}
            disabled={!tracking || currentStopIndex >= stops.length}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.arrivedButtonText}>Mark Arrived</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stops List */}
      <View style={styles.stopsListCard}>
        <Text style={styles.stopCardTitle}>All Stops</Text>
        {stops.map((stop, index) => (
          <View key={stop.seq} style={styles.stopRow}>
            <View style={[
              styles.stopDot,
              stop.arrived ? styles.arrivedDot : index === currentStopIndex ? styles.currentDot : styles.pendingDot,
            ]} />
            <Text style={[styles.stopName, stop.arrived && styles.arrivedStopName]}>
              {stop.seq}. {stop.stage_name}
            </Text>
            {stop.arrived && <Ionicons name="checkmark" size={16} color="#10B981" />}
          </View>
        ))}
      </View>

      {/* Incident Reporting */}
      {tracking && (
        <View style={styles.incidentCard}>
          <Text style={styles.stopCardTitle}>⚠️ Report an Incident</Text>
          {incidents.length > 0 && (
            <Text style={styles.incidentCount}>{incidents.length} incident(s) this trip</Text>
          )}
          {showIncident ? (
            <View>
              <View style={styles.incidentTypeRow}>
                {['delay', 'breakdown', 'accident', 'overcrowding'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setIncidentType(t)}
                    style={[styles.incidentChip, incidentType === t && styles.incidentChipActive]}>
                    <Text style={[styles.incidentChipText, incidentType === t && styles.incidentChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.incidentInput}
                placeholder="Describe the incident..."
                placeholderTextColor="#9CA3AF"
                value={incidentNote}
                onChangeText={setIncidentNote}
                multiline
              />
              <View style={styles.incidentActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowIncident(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitIncidentBtn} onPress={reportIncident}>
                  <Text style={styles.submitIncidentBtnText}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.reportIncidentBtn} onPress={() => setShowIncident(true)}>
              <Ionicons name="warning-outline" size={18} color="#fff" />
              <Text style={styles.gpsButtonText}>  Report Incident</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* End Trip Button */}
      {tracking && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <TouchableOpacity style={styles.endTripButton} onPress={endTrip}>
            <Ionicons name="flag" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.endTripButtonText}>End Trip</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  noTripText: { fontSize: 18, fontWeight: '700', color: '#374151' },
  noTripSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Trip Completed Screen
  tripSummaryBox: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, width: '100%', marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#111827', maxWidth: '55%', textAlign: 'right' },

  tripHeader: { backgroundColor: '#003087', padding: 20 },
  routeName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  busNumber: { color: '#93C5FD', fontSize: 14, marginTop: 4 },
  timing: { color: '#BFDBFE', fontSize: 14, marginTop: 2 },

  // Progress Bar
  stopProgressBar: { height: 6, backgroundColor: '#1D4ED8', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  stopProgressFill: { height: '100%', backgroundColor: '#34D399', borderRadius: 3 },
  progressLabel: { color: '#93C5FD', fontSize: 12, marginTop: 4 },

  gpsCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  speedText: { fontSize: 24, fontWeight: '700', color: '#003087' },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 10 },
  startButton: { backgroundColor: '#003087' },
  stopButton: { backgroundColor: '#EF4444' },
  gpsButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  stopCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  stopCardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  currentStop: { fontSize: 20, fontWeight: '700', color: '#111827' },
  stopProgress: { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  arrivedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10 },
  disabledButton: { backgroundColor: '#D1D5DB' },
  arrivedButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  stopsListCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  arrivedDot: { backgroundColor: '#10B981' },
  currentDot: { backgroundColor: '#003087' },
  pendingDot: { backgroundColor: '#D1D5DB' },
  stopName: { flex: 1, fontSize: 14, color: '#374151' },
  arrivedStopName: { color: '#10B981', textDecorationLine: 'line-through' },

  // Incident Reporting
  incidentCard: {
    backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  incidentCount: { fontSize: 12, color: '#9A3412', marginBottom: 8 },
  incidentTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  incidentChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#E5E7EB' },
  incidentChipActive: { backgroundColor: '#F97316' },
  incidentChipText: { fontSize: 12, color: '#374151', textTransform: 'capitalize' },
  incidentChipTextActive: { color: '#fff', fontWeight: '700' },
  incidentInput: {
    borderWidth: 1, borderColor: '#FED7AA', borderRadius: 8, padding: 10,
    fontSize: 14, color: '#111827', minHeight: 60, backgroundColor: '#fff', marginBottom: 10,
  },
  incidentActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  submitIncidentBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#F97316', alignItems: 'center' },
  submitIncidentBtnText: { color: '#fff', fontWeight: '700' },
  reportIncidentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 10, marginTop: 4 },

  // End Trip
  endTripButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#DC2626', paddingVertical: 16, borderRadius: 12, marginTop: 4,
    shadowColor: '#DC2626', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  endTripButtonText: { color: '#fff', fontWeight: '700', fontSize: 18 },
});
