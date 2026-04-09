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
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface PassengerStats {
  favouritesCount: number;
  tripsCount: number;
}

export default function PassengerProfileScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<PassengerStats>({ favouritesCount: 0, tripsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mobile/passenger/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#FF6B00" />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={22} color="#F43F5E" />
            <Text style={styles.statValue}>{stats.favouritesCount}</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bus" size={22} color="#FF6B00" />
            <Text style={styles.statValue}>{stats.tripsCount}</Text>
            <Text style={styles.statLabel}>Trips Tracked</Text>
          </View>
        </View>
      )}

      {/* Account Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <InfoRow icon="person-outline" label="Name" value={user?.name || '—'} />
        <InfoRow icon="mail-outline" label="Email" value={user?.email || '—'} />
        {user?.phone && <InfoRow icon="call-outline" label="Phone" value={user.phone} />}
        <InfoRow icon="shield-checkmark-outline" label="Role" value="Passenger" />
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Information</Text>
        <InfoRow icon="information-circle-outline" label="Version" value="1.0.0" />
        <InfoRow icon="business-outline" label="Provider" value="Delhi Transport Corporation" />
        <InfoRow icon="globe-outline" label="Backend" value="SmartDTC API v1" />
      </View>

      {/* Logout */}
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
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { flex: 1, fontSize: 14, color: '#6B7280', marginLeft: 8 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827', maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    gap: 6,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  email: { color: '#FFE4CC', fontSize: 14 },
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
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
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
