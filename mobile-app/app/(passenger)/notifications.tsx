import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

interface Alert {
  _id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isResolved: boolean;
  createdAt: string;
  route?: { route_name: string };
}

const sevColor: Record<string, string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const sevBg: Record<string, string> = {
  info: '#EFF6FF',
  warning: '#FFFBEB',
  critical: '#FEF2F2',
};

const sevIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle',
  warning: 'warning',
  critical: 'alert-circle',
};

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

export default function NotificationsScreen() {
  const { accessToken } = useAuthStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/public/alerts?limit=50');
      setAlerts(res.data.alerts ?? []);
    } catch {
      try {
        // fallback if public endpoint doesn't exist
        const res = await api.get('/alerts?isResolved=false&limit=50');
        setAlerts(res.data.alerts ?? []);
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const socket = connectSocket(accessToken || '');
    socket.on('alert:new', (a: Alert) => {
      setAlerts(prev => [a, ...prev]);
    });
    socket.on('alert:resolved', ({ alertId }: { alertId: string }) => {
      setAlerts(prev => prev.filter(a => a._id !== alertId));
    });
    return () => {
      socket.off('alert:new');
      socket.off('alert:resolved');
    };
  }, [fetchAlerts]);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  const FILTERS = [
    { key: 'all',      label: 'All',      count: alerts.length },
    { key: 'critical', label: '🔴 Critical', count: alerts.filter(a => a.severity === 'critical').length },
    { key: 'warning',  label: '🟡 Warning',  count: alerts.filter(a => a.severity === 'warning').length },
    { key: 'info',     label: '🔵 Info',     count: alerts.filter(a => a.severity === 'info').length },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{alerts.filter(a => a.severity === 'critical').length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label} {f.count > 0 && `(${f.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B00" size="large" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You're all caught up! Pull to refresh.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(true); }} />}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: sevBg[item.severity] ?? '#F9FAFB' }]}>
              <View style={[styles.iconBox, { backgroundColor: sevColor[item.severity] + '20' }]}>
                <Ionicons name={sevIcon[item.severity] ?? 'alert-circle'} size={22} color={sevColor[item.severity]} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={[styles.severityPill, { backgroundColor: sevColor[item.severity] }]}>
                    <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.typeTag}>{item.type}</Text>
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {item.route && (
                  <Text style={styles.routeTag}>🚌 {item.route.route_name}</Text>
                )}
                {item.isResolved && (
                  <View style={styles.resolvedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.resolvedText}>Resolved</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF6B00', padding: 20, paddingTop: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', flex: 1 },
  badge: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#FF6B00' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#FF6B00' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterChipTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row', gap: 12, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  severityPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  severityText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  typeTag: { fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  time: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  message: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  routeTag: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  resolvedText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
