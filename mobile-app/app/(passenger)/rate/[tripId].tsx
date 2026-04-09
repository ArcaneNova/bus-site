import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '@/lib/api';

const STAR_LABELS = ['Terrible', 'Poor', 'OK', 'Good', 'Excellent'];
const FEEDBACK_TAGS = [
  'On Time', 'Late', 'Clean Bus', 'Crowded', 'Safe Driving',
  'Rash Driving', 'Friendly Driver', 'Rude Driver', 'AC Working', 'AC Not Working',
];

export default function TripRatingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

  const [overallRating,  setOverallRating]  = useState(0);
  const [driverRating,   setDriverRating]   = useState(0);
  const [comfortRating,  setComfortRating]  = useState(0);
  const [selectedTags,   setSelectedTags]   = useState<string[]>([]);
  const [comment,        setComment]        = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert('Rating required', 'Please give at least an overall rating.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/mobile/trips/${tripId}/rating`, {
        overallRating,
        driverRating:  driverRating  || null,
        comfortRating: comfortRating || null,
        tags:          selectedTags,
        comment:       comment.trim() || null,
      });
      Toast.show({ type: 'success', text1: 'Thank you!', text2: 'Your rating has been submitted.' });
      router.back();
    } catch {
      Toast.show({ type: 'error', text1: 'Submission failed', text2: 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <View style={styles.starSection}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starBtn}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={30}
              color={star <= value ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
        {value > 0 && (
          <Text style={styles.starHint}>{STAR_LABELS[value - 1]}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Trip</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tripIdRow}>
          <Ionicons name="bus-outline" size={20} color="#6B7280" />
          <Text style={styles.tripIdText}>Trip #{(tripId || '').slice(-8).toUpperCase()}</Text>
        </View>

        {/* Overall Rating */}
        <StarRow label="Overall Experience" value={overallRating} onChange={setOverallRating} />

        {/* Driver Rating */}
        <StarRow label="Driver Behaviour" value={driverRating} onChange={setDriverRating} />

        {/* Comfort Rating */}
        <StarRow label="Bus Comfort" value={comfortRating} onChange={setComfortRating} />
      </View>

      {/* Tags */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What stood out?</Text>
        <View style={styles.tagsWrap}>
          {FEEDBACK_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Comment */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Comments</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share your experience…"
          placeholderTextColor="#9CA3AF"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitText}>Submit Rating</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#FF6B00',
    flexDirection:   'row',
    alignItems:      'center',
    padding:         16,
    paddingTop:      48,
    gap:             12,
  },
  backBtn:     { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius:    12,
    padding:         16,
    margin:          16,
    marginBottom:    0,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    8,
    elevation:       2,
  },

  tripIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  tripIdText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  starSection:  { marginBottom: 20 },
  starLabel:    { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starBtn:      { padding: 2 },
  starHint:     { marginLeft: 8, fontSize: 13, color: '#6B7280', fontStyle: 'italic' },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       '#D1D5DB',
    backgroundColor:   '#F9FAFB',
  },
  tagSelected: {
    backgroundColor: '#FF6B00',
    borderColor:     '#FF6B00',
  },
  tagText:         { fontSize: 13, color: '#374151' },
  tagTextSelected: { color: '#fff', fontWeight: '600' },

  commentInput: {
    borderWidth:   1,
    borderColor:   '#E5E7EB',
    borderRadius:  8,
    padding:       12,
    fontSize:      14,
    color:         '#111827',
    minHeight:     100,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  submitBtn: {
    backgroundColor: '#FF6B00',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    margin:          16,
    marginTop:       20,
    paddingVertical: 16,
    borderRadius:    12,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  skipBtn: { alignItems: 'center', marginBottom: 8 },
  skipText: { color: '#9CA3AF', fontSize: 14 },
});
