import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Switch, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

interface StopAlarm {
  id: string;
  stopName: string;
  lat: number;
  lng: number;
  radius: number; // meters
  active: boolean;
}

interface BusAlarm {
  id: string;
  busId: string;
  busNumber: string;
  minutesThreshold: number;
  active: boolean;
  lastStatus?: string;
}

export default function AlarmsScreen() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const socket = useRef(connectSocket(accessToken || '')).current;

  const [stopAlarms, setStopAlarms] = useState<StopAlarm[]>([]);
  const [busAlarms, setBusAlarms] = useState<BusAlarm[]>([]);
  const [nearbyStops, setNearbyStops] = useState<any[]>([]);
  const [liveBuses, setLiveBuses] = useState<any[]>([]);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showBusModal, setShowBusModal] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(null);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'location' | 'bus'>('location');

  useEffect(() => {
    requestPermissions();
    fetchData();
    return () => { locationWatcher?.remove(); };
  }, []);

  useEffect(() => {
    socket.on('bus:location_update', (data: any) => {
      busAlarms.forEach(alarm => {
        if (!alarm.active || alarm.busId !== data.busId) return;
        if (currentLoc && data.latitude && data.longitude) {
          const dist = getDistanceKm(currentLoc.lat, currentLoc.lng, data.latitude, data.longitude) * 1000;
          const estMinutes = Math.round(dist / 500); // rough 30km/h estimate
          if (estMinutes <= alarm.minutesThreshold) {
            triggerBusAlarm(alarm, estMinutes);
          }
        }
      });
    });
    return () => { socket.off('bus:location_update'); };
  }, [busAlarms, currentLoc]);

  const requestPermissions = async () => {
    await Location.requestForegroundPermissionsAsync();
    await Notifications.requestPermissionsAsync();
  };

  const fetchData = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        const res = await api.get(`/stages/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}&radius=2000`);
        setNearbyStops(res.data.stages || []);
        startLocationWatch();
      }
      const busRes = await api.get('/tracking/live');
      setLiveBuses(busRes.data.positions || []);
    } catch {}
  };

  const startLocationWatch = async () => {
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 50 },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        setCurrentLoc({ lat: latitude, lng: longitude });
        checkStopAlarms(latitude, longitude);
      }
    );
    setLocationWatcher(sub);
  };

  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const checkStopAlarms = (lat: number, lng: number) => {
    stopAlarms.forEach(alarm => {
      if (!alarm.active) return;
      const dist = getDistanceKm(lat, lng, alarm.lat, alarm.lng) * 1000;
      if (dist <= alarm.radius) triggerStopAlarm(alarm, Math.round(dist));
    });
  };

  const triggerStopAlarm = async (alarm: StopAlarm, dist: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Stop Alarm!',
        body: `You are ${dist}m from ${alarm.stopName}!`,
        sound: 'default',
      },
      trigger: null,
    });
    setStopAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: false } : a));
    Toast.show({ type: 'success', text1: `📍 You reached ${alarm.stopName}!` });
  };

  const triggerBusAlarm = async (alarm: BusAlarm, minutes: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚌 Bus Arriving Soon!',
        body: `Bus ${alarm.busNumber} is approximately ${minutes} min away!`,
        sound: 'default',
      },
      trigger: null,
    });
    Toast.show({ type: 'success', text1: `Bus ${alarm.busNumber} is ~${minutes} min away!` });
  };

  const addStopAlarm = (stop: any) => {
    const alarm: StopAlarm = {
      id: `stop-${Date.now()}`,
      stopName: stop.stage_name,
      lat: stop.lat,
      lng: stop.lng,
      radius: 300,
      active: true,
    };
    setStopAlarms(prev => [...prev, alarm]);
    setShowStopModal(false);
    Toast.show({ type: 'success', text1: `Location alarm set for ${stop.stage_name}` });
  };

  const addBusAlarm = (bus: any) => {
    const alarm: BusAlarm = {
      id: `bus-${Date.now()}`,
      busId: bus.busId,
      busNumber: bus.busNumber || bus.busId,
      minutesThreshold: 5,
      active: true,
    };
    setBusAlarms(prev => [...prev, alarm]);
    socket.emit('passenger:track_bus', { busId: bus.busId });
    setShowBusModal(false);
    Toast.show({ type: 'success', text1: `Bus alarm set for ${alarm.busNumber}` });
  };

  const removeStopAlarm = (id: string) => setStopAlarms(prev => prev.filter(a => a.id !== id));
  const removeBusAlarm = (id: string) => setBusAlarms(prev => prev.filter(a => a.id !== id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alarms</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'location' && styles.tabActive]} onPress={() => setActiveTab('location')}>
          <Ionicons name="location" size={16} color={activeTab === 'location' ? '#FF6B00' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'location' && styles.tabTextActive]}>Location Alarm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'bus' && styles.tabActive]} onPress={() => setActiveTab('bus')}>
          <Ionicons name="bus" size={16} color={activeTab === 'bus' ? '#FF6B00' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'bus' && styles.tabTextActive]}>Bus Alarm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'location' ? (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Get notified when you're near a bus stop. Alarm triggers within 300m radius.</Text>
            </View>
            {stopAlarms.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No location alarms set</Text>
              </View>
            )}
            {stopAlarms.map(alarm => (
              <View key={alarm.id} style={styles.alarmCard}>
                <View style={[styles.alarmIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="location" size={22} color="#3B82F6" />
                </View>
                <View style={styles.alarmInfo}>
                  <Text style={styles.alarmName}>{alarm.stopName}</Text>
                  <Text style={styles.alarmSub}>Radius: {alarm.radius}m</Text>
                </View>
                <Switch
                  value={alarm.active}
                  onValueChange={v => setStopAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: v } : a))}
                  trackColor={{ true: '#FF6B00' }}
                />
                <TouchableOpacity onPress={() => removeStopAlarm(alarm.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowStopModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add Location Alarm</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Get notified when a tracked bus is approximately 5 minutes from your location.</Text>
            </View>
            {busAlarms.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="bus-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No bus alarms set</Text>
              </View>
            )}
            {busAlarms.map(alarm => (
              <View key={alarm.id} style={styles.alarmCard}>
                <View style={[styles.alarmIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="bus" size={22} color="#FF6B00" />
                </View>
                <View style={styles.alarmInfo}>
                  <Text style={styles.alarmName}>Bus {alarm.busNumber}</Text>
                  <Text style={styles.alarmSub}>Alert when ≤ {alarm.minutesThreshold} min away</Text>
                </View>
                <Switch
                  value={alarm.active}
                  onValueChange={v => setBusAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: v } : a))}
                  trackColor={{ true: '#FF6B00' }}
                />
                <TouchableOpacity onPress={() => removeBusAlarm(alarm.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowBusModal(true)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add Bus Alarm</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Stop Picker Modal */}
      <Modal visible={showStopModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearby Stops</Text>
              <TouchableOpacity onPress={() => setShowStopModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {nearbyStops.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No nearby stops found. Enable location.</Text>
                </View>
              ) : nearbyStops.map((stop, i) => (
                <TouchableOpacity key={i} style={styles.stopItem} onPress={() => addStopAlarm(stop)}>
                  <Ionicons name="location" size={18} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopName}>{stop.stage_name}</Text>
                    <Text style={styles.stopDist}>{stop.distance}m away</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color="#FF6B00" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bus Picker Modal */}
      <Modal visible={showBusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Live Buses</Text>
              <TouchableOpacity onPress={() => setShowBusModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {liveBuses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No live buses found.</Text>
                </View>
              ) : liveBuses.map((bus, i) => (
                <TouchableOpacity key={i} style={styles.stopItem} onPress={() => addBusAlarm(bus)}>
                  <Ionicons name="bus" size={18} color="#FF6B00" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stopName}>Bus {bus.busNumber || bus.busId}</Text>
                    <Text style={styles.stopDist}>{bus.routeName || 'Active'} • {bus.speed || 0} km/h</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color="#FF6B00" />
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
  header: {
    backgroundColor: '#FF6B00', flexDirection: 'row', alignItems: 'center',
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF6B00' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#FF6B00' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EFF6FF',
    padding: 12, borderRadius: 10, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  alarmCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  alarmIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  alarmInfo: { flex: 1 },
  alarmName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  alarmSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  deleteBtn: { padding: 6 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12,
    marginTop: 8, gap: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '65%', paddingBottom: 32 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stopItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  stopName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  stopDist: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
