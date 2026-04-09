import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Route } from '@/types';

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q || '');
  const [results, setResults] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (q) performSearch(q);
  }, []);

  const performSearch = async (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/routes?search=${encodeURIComponent(term.trim())}&limit=20`);
      setResults(res.data.routes || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderRoute = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => router.push({ pathname: '/(passenger)/route/[id]', params: { id: item._id } })}
    >
      <View style={styles.routeIconBox}>
        <Text style={styles.routeEmoji}>🚌</Text>
      </View>
      <View style={styles.routeInfo}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeId}>{item.url_route_id}</Text>
          <Text style={styles.stagesCount}>{item.total_stages} stops</Text>
        </View>
        <Text style={styles.routeName} numberOfLines={1}>{item.route_name}</Text>
        <Text style={styles.routePath} numberOfLines={1}>
          {item.start_stage} → {item.end_stage}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search route name or number..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => performSearch()}
            returnKeyType="search"
            autoFocus={!q}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => performSearch()}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderRoute}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Ionicons name="bus-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No routes found</Text>
                <Text style={styles.emptyText}>Try a different route number or name.</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Search for DTC bus routes</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  searchButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 10 },
  resultCard: {
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
  routeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeEmoji: { fontSize: 22 },
  routeInfo: { flex: 1 },
  routeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeId: { fontSize: 13, color: '#FF6B00', fontWeight: '700' },
  stagesCount: { fontSize: 12, color: '#9CA3AF' },
  routeName: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  routePath: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  empty: { alignItems: 'center', padding: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
