import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface DriverProfile {
  licenseNumber: string;
  status: string;
  rating: number;
  totalTrips: number;
  assignedBus?: { busNumber: string; model: string };
}

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mobile/driver/profile')
      .then((res) => setProfile(res.data.driver))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.round(rating) ? 'star' : 'star-outline'}
        size={18}
        color="#F59E0B"
      />
    ));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'D'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#003087" />
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="bus" size={22} color="#003087" />
              <Text style={styles.statValue}>{profile?.totalTrips || 0}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ flexDirection: 'row' }}>
                {profile ? renderStars(profile.rating) : null}
              </View>
              <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Driver Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driver Information</Text>
            <InfoRow icon="card-outline" label="License Number" value={profile?.licenseNumber || '—'} />
            <InfoRow icon="ellipse" label="Status" value={profile?.status || '—'} />
            {profile?.assignedBus && (
              <InfoRow icon="bus-outline" label="Assigned Bus" value={`${profile.assignedBus.busNumber} (${profile.assignedBus.model})`} />
            )}
          </View>

          {/* Account Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>
            <InfoRow icon="mail-outline" label="Email" value={user?.email || '—'} />
            <InfoRow icon="shield-checkmark-outline" label="Role" value="Driver" />
          </View>
        </>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={18} color="#6B7280" style={{ width: 24 }} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { flex: 1, fontSize: 14, color: '#6B7280', marginLeft: 8 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827', maxWidth: '50%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#003087',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    gap: 6,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  email: { color: '#93C5FD', fontSize: 14 },
  phone: { color: '#BFDBFE', fontSize: 14 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
});
