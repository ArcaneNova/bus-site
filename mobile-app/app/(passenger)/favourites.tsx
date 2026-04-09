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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

interface Favourite {
  _id: string;
  refId: {
    _id: string;
    route_name?: string;
    url_route_id?: string;
    start_stage?: string;
    end_stage?: string;
    stage_name?: string;
  };
  refModel: 'Route' | 'Stage';
}

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchFavourites = async () => {
    try {
      const res = await api.get('/mobile/favourites');
      setFavourites(res.data.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load favourites.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeFavourite = async (id: string, refId: string) => {
    try {
      await api.delete(`/mobile/favourites/${refId}`);
      setFavourites((prev) => prev.filter((f) => f._id !== id));
      Toast.show({ type: 'info', text1: 'Removed from favourites.' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to remove.' });
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const renderItem = ({ item }: { item: Favourite }) => {
    const isRoute = item.refModel === 'Route';
    const ref = item.refId;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isRoute && router.push({ pathname: '/(passenger)/route/[id]', params: { id: ref._id } })}
      >
        <View style={styles.cardIcon}>
          <Ionicons name={isRoute ? 'bus-outline' : 'location-outline'} size={22} color="#FF6B00" />
        </View>
        <View style={styles.cardInfo}>
          {isRoute ? (
            <>
              <Text style={styles.refId}>{ref.url_route_id}</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>{ref.route_name}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{ref.start_stage} → {ref.end_stage}</Text>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>{ref.stage_name}</Text>
              <Text style={styles.cardSub}>Bus Stop</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFavourite(item._id, ref._id)}
        >
          <Ionicons name="heart" size={22} color="#F43F5E" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favourites}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFavourites(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Favourites Yet</Text>
            <Text style={styles.emptyText}>
              Save your favourite routes and stops for quick access.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  refId: { fontSize: 12, color: '#FF6B00', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  removeBtn: { padding: 8 },
  empty: { alignItems: 'center', padding: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
