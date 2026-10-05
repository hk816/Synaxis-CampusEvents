import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const categories = [
  'Technology',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

/**
 * Converts YYYY-MM-DD HH:MM into a local Date.
 *
 * We do this manually instead of using:
 * new Date("YYYY-MM-DD HH:MM")
 *
 * because string parsing can behave differently across
 * browsers, Android and JavaScript runtimes.
 */
function parseDateTime(value: string): Date | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  // Make sure JavaScript did not silently roll the date over.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

export default function CreateEventScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateEvent = async () => {
    // Required fields
    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !startAt.trim() ||
      !endAt.trim() ||
      !capacity.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all required fields.'
      );
      return;
    }

    // Capacity validation
    const capacityNumber = Number(capacity);

    if (
      !Number.isInteger(capacityNumber) ||
      capacityNumber <= 0
    ) {
      Alert.alert(
        'Invalid capacity',
        'Please enter a valid number greater than 0.'
      );
      return;
    }

    // Date/time validation
    const startDate = parseDateTime(startAt);
    const endDate = parseDateTime(endAt);

    if (!startDate || !endDate) {
      Alert.alert(
        'Invalid date/time',
        'Please use the exact format:\n\nYYYY-MM-DD HH:MM\n\nExample:\n2026-09-25 10:00'
      );
      return;
    }

    // End must be after start
    if (endDate <= startDate) {
      Alert.alert(
        'Invalid event timing',
        'End time must be after the start time.'
      );
      return;
    }

    setLoading(true);

    try {
      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          'Your session has expired. Please log in again.'
        );
      }

      // Create event in Supabase
      const { data, error } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          location: location.trim(),
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          capacity: capacityNumber,
          image_url: imageUrl.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Event created:', data);

      Alert.alert(
        'Event submitted',
        'Your event has been submitted successfully and is waiting for admin approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(organizer)/events');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Create event error:', error);

      Alert.alert(
        'Unable to create event',
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the event.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.navy}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              ORGANIZER SPACE
            </Text>

            <Text style={styles.title}>
              Create Event
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Submit your event for admin review and approval.
        </Text>

        {/* Event Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Event Information
          </Text>

          <Text style={styles.label}>
            Event Title *
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>
            Description *
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your event"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>
            Category *
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.categoryChip,
                  category === item &&
                    styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item &&
                      styles.categoryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Date & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Date & Location
          </Text>

          <Text style={styles.label}>
            Location *
          </Text>

          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Main Auditorium"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>
            Start Date & Time *
          </Text>

          <TextInput
            style={styles.input}
            value={startAt}
            onChangeText={setStartAt}
            placeholder="2026-09-25 10:00"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.helperText}>
            Format: YYYY-MM-DD HH:MM
          </Text>

          <Text style={styles.label}>
            End Date & Time *
          </Text>

          <TextInput
            style={styles.input}
            value={endAt}
            onChangeText={setEndAt}
            placeholder="2026-09-25 13:00"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.helperText}>
            Format: YYYY-MM-DD HH:MM
          </Text>
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Registration
          </Text>

          <Text style={styles.label}>
            Maximum Capacity *
          </Text>

          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            placeholder="e.g. 100"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <Text style={styles.helperText}>
            Students will be placed on the waitlist once the
            event reaches this capacity.
          </Text>
        </View>

        {/* Optional Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Event Image
          </Text>

          <Text style={styles.label}>
            Image URL
          </Text>

          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Optional image URL"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Approval Notice */}
        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={colors.yellowDark}
          />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Admin approval required
            </Text>

            <Text style={styles.noticeText}>
              Your event will remain pending until an admin
              reviews and approves it. Students will only see
              approved events.
            </Text>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.navy}
            />
          ) : (
            <>
              <Ionicons
                name="send-outline"
                size={19}
                color={colors.navy}
              />

              <Text style={styles.submitText}>
                Submit for Approval
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerText: {
    marginLeft: 14,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 2,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 8,
  },

  section: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 3,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 17,
    marginBottom: 7,
  },

  input: {
    minHeight: 50,
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.navy,
  },

  textArea: {
    minHeight: 115,
    paddingTop: 14,
  },

  categoryRow: {
    gap: 8,
    paddingTop: 5,
    paddingBottom: 2,
  },

  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryChipSelected: {
    backgroundColor: colors.yellow,
    borderColor: colors.yellow,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  categoryTextSelected: {
    color: colors.navy,
  },

  helperText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 5,
  },

  notice: {
    flexDirection: 'row',
    backgroundColor: '#FFF4D8',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EBD69C',
  },

  noticeContent: {
    flex: 1,
    marginLeft: 10,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },

  submitButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 8,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});