import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function StudentFeedbackScreen() {
  const { eventId } = useLocalSearchParams<{
    eventId?: string;
  }>();

  const [eventTitle, setEventTitle] = useState('Event Feedback');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [identity, setIdentity] = useState<
    'identified' | 'anonymous'
  >('identified');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      if (!eventId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setEventTitle(data.title);
    } catch (error) {
      console.error('Load event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!eventId) {
      Alert.alert(
        'Error',
        'Event information is missing.'
      );
      return;
    }

    if (rating === 0) {
      Alert.alert(
        'Rating required',
        'Please select a rating from 1 to 5 stars.'
      );
      return;
    }

    if (!comment.trim()) {
      Alert.alert(
        'Comment required',
        'Please share your feedback before submitting.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Session expired',
          'Please log in again.'
        );
        router.replace('/login');
        return;
      }

      const { error } = await supabase
        .from('event_feedback')
        .insert({
          event_id: eventId,
          student_id: user.id,
          rating,
          comment: comment.trim(),
          identity,
        });

      if (error) throw error;

      Alert.alert(
        'Feedback submitted',
        'Thank you for sharing your feedback!',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        'Submit feedback error:',
        error
      );

      Alert.alert(
        'Unable to submit',
        error?.message ??
          'Something went wrong while submitting your feedback.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.navy}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Feedback
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="star-outline"
              size={28}
              color={colors.navy}
            />
          </View>

          <Text style={styles.title}>
            How was your experience?
          </Text>

          <Text style={styles.eventTitle}>
            {eventTitle}
          </Text>

          <Text style={styles.subtitle}>
            Your feedback helps organizers improve
            future events.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            RATE YOUR EXPERIENCE
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={
                    star <= rating
                      ? 'star'
                      : 'star-outline'
                  }
                  size={38}
                  color={
                    star <= rating
                      ? colors.yellow
                      : colors.textMuted
                  }
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.ratingText}>
            {rating === 0
              ? 'Select a rating'
              : `${rating} out of 5`}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            YOUR FEEDBACK
          </Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholder="Tell us about your experience..."
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            FEEDBACK IDENTITY
          </Text>

          <Text style={styles.identityHelp}>
            Choose whether the organizer can see your
            identity with this feedback.
          </Text>

          <Pressable
            style={[
              styles.identityOption,
              identity === 'identified' &&
                styles.identitySelected,
            ]}
            onPress={() =>
              setIdentity('identified')
            }
          >
            <View style={styles.radio}>
              {identity === 'identified' && (
                <View style={styles.radioInner} />
              )}
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Identified
              </Text>

              <Text style={styles.optionText}>
                The organizer can see that this feedback
                came from you.
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.identityOption,
              identity === 'anonymous' &&
                styles.identitySelected,
            ]}
            onPress={() =>
              setIdentity('anonymous')
            }
          >
            <View style={styles.radio}>
              {identity === 'anonymous' && (
                <View style={styles.radioInner} />
              )}
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Anonymous
              </Text>

              <Text style={styles.optionText}>
                Your identity will be hidden from the
                organizer.
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.submitButton,
            submitting && styles.disabledButton,
          ]}
          onPress={submitFeedback}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator
              color={colors.navy}
            />
          ) : (
            <>
              <Text style={styles.submitText}>
                Submit Feedback
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.navy}
              />
            </>
          )}
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    height: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 22,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.yellowDark,
    marginTop: 6,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 310,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.textSecondary,
    marginBottom: 13,
  },

  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },

  starButton: {
    padding: 2,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 9,
  },

  textArea: {
    minHeight: 125,
    borderRadius: 12,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    fontSize: 13,
    lineHeight: 19,
    color: colors.navy,
  },

  identityHelp: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  identityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 9,
  },

  identitySelected: {
    borderColor: colors.yellowDark,
    backgroundColor: '#FFF8E8',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.navy,
  },

  optionContent: {
    flex: 1,
    marginLeft: 10,
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },

  optionText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 3,
  },

  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
  },

  disabledButton: {
    opacity: 0.7,
  },

  submitText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});