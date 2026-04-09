import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { Alert } from '@/types';

const SEVERITY_CONFIG = {
  low:      { color: '#10B981', bg: '#ECFDF5', icon: 'information-circle-outline' as const },
  medium:   { color: '#F59E0B', bg: '#FFFBEB', icon: 'warning-outline'            as const },
  high:     { color: '#F97316', bg: '#FFF7ED', icon: 'alert-circle-outline'       as const },
  critical: { color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle'               as const },
};

const TYPE_LABEL: Record<string, string> = {
  delay:        'Delay',
  breakdown:    'Breakdown',
  accident:     'Accident',
  'route-change': 'Route Change',
  overcrowding: 'Overcrowding',
  traffic:      'Traffic',
  sos:          'SOS',
};

export default function DriverAlertsScreen() {
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts?limit=30&isResolved=false');
      setAlerts(res.data.alerts || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load alerts.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const socket = getSocket();

    socket.on('alert:new', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
      Toast.show({
        type: alert.severity === 'critical' ? 'error' : 'info',
        text1: `${alert.severity.toUpperCase()}: ${TYPE_LABEL[alert.type] || alert.type}`,
        text2: alert.message,
        visibilityTime: 6000,
      });
    });

    socket.on('admin:alert_resolved', ({ alertId }: { alertId: string }) => {
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    });

    return () => {
      socket.off('alert:new');
      socket.off('admin:alert_resolved');
    };
  }, []);

  const renderAlert = ({ item }: { item: Alert }) => {
    const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>
              {TYPE_LABEL[item.type] || item.type}
            </Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {item.route && (
            <Text style={styles.meta}>
              Route: {(item.route as any)?.route_name || (item.route as any)?._id?.toString().slice(-6)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
      <Text style={styles.emptyTitle}>All Clear!</Text>
      <Text style={styles.emptySub}>No active alerts for your route.</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
      </View>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  return (
    <View style={styles.container}>
      {/* Summary banner */}
      {criticalCount > 0 && (
        <View style={styles.criticalBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={styles.criticalText}>
            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require attention
          </Text>
        </View>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        renderItem={renderAlert}
        ListEmptyComponent={EmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAlerts(); }}
            colors={['#003087']}
          />
        }
        contentContainerStyle={alerts.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticalBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  criticalText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
