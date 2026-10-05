import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

const CATEGORIES = [
  'Technology',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Competition',
  'Other',
];

export default function EditEventScreen() {
  const params = useLocalSearchParams<{
    eventId?: string;
    id?: string;
  }>();

  const eventId = String(params.eventId ?? params.id ?? '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing.');
      router.back();
      return;
    }

    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select(
          'id, organizer_id, title, description, category, location, start_at, end_at, capacity, image_url, status'
        )
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single();

      if (error) throw error;

      setTitle(data.title ?? '');
      setDescription(data.description ?? '');
      setCategory(data.category ?? '');
      setLocation(data.location ?? '');
      setStartAt(formatDateTimeForInput(data.start_at));
      setEndAt(formatDateTimeForInput(data.end_at));
      setCapacity(String(data.capacity ?? ''));
      setImageUrl(data.image_url ?? '');
    } catch (error: any) {
      console.error('Load edit event error:', error);

      Alert.alert(
        'Unable to load event',
        error?.message ?? 'The event could not be loaded.'
      );

      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (value: string) => {
    if (!value) return '';

    const date = new Date(value);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const parseDateTime = (value: string) => {
    const cleaned = value.trim();

    // Expected format: YYYY-MM-DD HH:mm
    const match = cleaned.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/
    );

    if (!match) return null;

    const [, year, month, day, hour, minute] = match;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );

    if (Number.isNaN(date.getTime())) return null;

    return date;
  };

  const validate = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter an event title.');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter an event description.');
      return false;
    }

    if (!category.trim()) {
      Alert.alert('Missing category', 'Please select a category.');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Missing location', 'Please enter the event location.');
      return false;
    }

    const startDate = parseDateTime(startAt);
    const endDate = parseDateTime(endAt);

    if (!startDate) {
      Alert.alert(
        'Invalid start date',
        'Use the format YYYY-MM-DD HH:mm.'
      );
      return false;
    }

    if (!endDate) {
      Alert.alert(
        'Invalid end date',
        'Use the format YYYY-MM-DD HH:mm.'
      );
      return false;
    }

    if (endDate <= startDate) {
      Alert.alert(
        'Invalid event time',
        'End date/time must be after the start date/time.'
      );
      return false;
    }

    const capacityNumber = Number(capacity);

    if (
      !capacity.trim() ||
      !Number.isInteger(capacityNumber) ||
      capacityNumber <= 0
    ) {
      Alert.alert(
        'Invalid capacity',
        'Capacity must be a positive whole number.'
      );
      return false;
    }

    return true;
  };

  const saveChanges = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login');
        return;
      }

      const startDate = parseDateTime(startAt);
      const endDate = parseDateTime(endAt);

      if (!startDate || !endDate) return;

      /*
       * This updates the SAME event using its existing UUID.
       * The backend RPC also verifies that the logged-in user
       * is the organizer of this event.
       */
      const { data, error } = await supabase.rpc('update_organizer_event', {
        p_event_id: eventId,
        p_title: title.trim(),
        p_description: description.trim(),
        p_category: category.trim(),
        p_location: location.trim(),
        p_start_at: startDate.toISOString(),
        p_end_at: endDate.toISOString(),
        p_capacity: Number(capacity),
        p_image_url: imageUrl.trim() || null,
      });

      if (error) throw error;

      if (!data) {
        throw new Error('The event could not be updated.');
      }

      Alert.alert(
        'Event updated',
        'Your event has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/organizer-event-details',
                params: { eventId },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Update event error:', error);

      Alert.alert(
        'Unable to update event',
        error?.message ?? 'Something went wrong while updating the event.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.navy}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Edit Event</Text>
          <Text style={styles.headerSubtitle}>
            Update your existing event
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={colors.yellowDark}
          />

          <Text style={styles.infoText}>
            You are editing the existing event. Changes will be saved to this
            event and will not create a new event.
          </Text>
        </View>

        <Field
          label="Event Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter event title"
        />

        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your event"
          multiline
          minHeight={120}
        />

        <Text style={styles.label}>Category</Text>

        <View style={styles.categoryContainer}>
          {CATEGORIES.map((item) => {
            const selected = category === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Enter event location"
        />

        <Field
          label="Start Date & Time"
          value={startAt}
          onChangeText={setStartAt}
          placeholder="YYYY-MM-DD HH:mm"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.helperText}>
          Example: 2026-09-18 10:00
        </Text>

        <Field
          label="End Date & Time"
          value={endAt}
          onChangeText={setEndAt}
          placeholder="YYYY-MM-DD HH:mm"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.helperText}>
          Example: 2026-09-18 16:00
        </Text>

        <Field
          label="Capacity"
          value={capacity}
          onChangeText={setCapacity}
          placeholder="Maximum number of students"
          keyboardType="number-pad"
        />

        <Field
          label="Image URL"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="Optional image URL"
          keyboardType="url"
          autoCapitalize="none"
        />

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={saveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.navy} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.navy}
                />
                <Text style={styles.saveButtonText}>
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  minHeight,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  minHeight?: number;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          minHeight ? { minHeight } : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 18,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4D8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 22,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    fontSize: 15,
    color: colors.text,
  },

  multilineInput: {
    paddingTop: 14,
    paddingBottom: 14,
  },

  helperText: {
    marginTop: -10,
    marginBottom: 18,
    fontSize: 12,
    color: colors.textMuted,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },

  categoryChipSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  categoryTextSelected: {
    color: colors.navy,
    fontWeight: '800',
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  saveButton: {
    flex: 1.4,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  disabledButton: {
    opacity: 0.65,
  },
});