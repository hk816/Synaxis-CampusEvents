import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type PendingFeedback = {
  event_id: string;
  event_title: string;
  event_end_at: string;
  category: string | null;
  location: string | null;
};

export default function FeedbackScreen() {
  const [feedbackItems, setFeedbackItems] = useState<PendingFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] =
    useState<PendingFeedback | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [identityMode, setIdentityMode] =
    useState<'identified' | 'anonymous'>('identified');

  const [submitting, setSubmitting] = useState(false);

  const loadPendingFeedback = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase.rpc(
        'get_my_pending_feedback'
      );

      if (error) {
        throw error;
      }

      setFeedbackItems((data ?? []) as PendingFeedback[]);
    } catch (error) {
      console.error('Feedback loading error:', error);

      Alert.alert(
        'Unable to load feedback',
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading feedback.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingFeedback();
  }, [loadPendingFeedback]);

  const openFeedbackForm = (event: PendingFeedback) => {
    setSelectedEvent(event);
    setRating(0);
    setComment('');
    setIdentityMode('identified');
  };

  const closeFeedbackForm = () => {
    if (submitting) return;

    setSelectedEvent(null);
    setRating(0);
    setComment('');
    setIdentityMode('identified');
  };

  const submitFeedback = async () => {
    if (!selectedEvent) {
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert(
        'Rating required',
        'Please select a rating from 1 to 5 stars.'
      );
      return;
    }

    if (!comment.trim()) {
      Alert.alert(
        'Comment required',
        'Please write a short comment about the event.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc(
        'submit_event_feedback',
        {
          p_event_id: selectedEvent.event_id,
          p_rating: rating,
          p_comment: comment.trim(),
          p_identity_mode: identityMode,
        }
      );

      if (error) {
        throw error;
      }

      Alert.alert(
        'Feedback Submitted',
        'Thank you! Your feedback has been recorded.',
        [
          {
            text: 'OK',
            onPress: async () => {
              setSelectedEvent(null);
              setRating(0);
              setComment('');
              setIdentityMode('identified');

              await loadPendingFeedback();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Feedback submission error:', error);

      Alert.alert(
        'Submission Failed',
        error instanceof Error
          ? error.message
          : 'Unable to submit feedback.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />

          <Text style={styles.loadingText}>
            Loading feedback...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =====================================================
   * FEEDBACK FORM
   * =====================================================
   */

  if (selectedEvent) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}

          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={closeFeedbackForm}
              disabled={submitting}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={colors.navy}
              />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                Give Feedback
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          {/* Event Card */}

          <View style={styles.eventHero}>
            <View style={styles.eventHeroIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={colors.navy}
              />
            </View>

            <Text style={styles.eventHeroTitle}>
              {selectedEvent.event_title}
            </Text>

            <View style={styles.eventHeroMeta}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#C5CBD7"
              />

              <Text style={styles.eventHeroMetaText}>
                {formatDate(selectedEvent.event_end_at)}
              </Text>
            </View>

            {selectedEvent.location ? (
              <View style={styles.eventHeroMeta}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#C5CBD7"
                />

                <Text
                  style={styles.eventHeroMetaText}
                  numberOfLines={1}
                >
                  {selectedEvent.location}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Rating */}

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>
              YOUR EXPERIENCE
            </Text>

            <Text style={styles.sectionTitle}>
              How would you rate this event?
            </Text>

            <View style={styles.ratingCard}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const selected = star <= rating;

                  return (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                      disabled={submitting}
                    >
                      <Ionicons
                        name={
                          selected
                            ? 'star'
                            : 'star-outline'
                        }
                        size={40}
                        color={
                          selected
                            ? colors.yellow
                            : colors.textMuted
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.ratingText}>
                {rating === 0
                  ? 'Tap a star to rate'
                  : getRatingText(rating)}
              </Text>
            </View>
          </View>

          {/* Comment */}

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>
              YOUR THOUGHTS
            </Text>

            <Text style={styles.sectionTitle}>
              Tell us more
            </Text>

            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="What did you like? What could be improved?"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              style={styles.commentInput}
              editable={!submitting}
            />

            <Text style={styles.characterCount}>
              {comment.length}/1000
            </Text>
          </View>

          {/* Identity */}

          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>
              PRIVACY
            </Text>

            <Text style={styles.sectionTitle}>
              How should your feedback appear?
            </Text>

            <Text style={styles.identityIntro}>
              Choose whether the organizer can see your name.
            </Text>

            {/* Identified */}

            <Pressable
              style={[
                styles.identityOption,
                identityMode === 'identified' &&
                  styles.identityOptionSelected,
              ]}
              onPress={() =>
                setIdentityMode('identified')
              }
              disabled={submitting}
            >
              <View
                style={[
                  styles.radio,
                  identityMode === 'identified' &&
                    styles.radioSelected,
                ]}
              >
                {identityMode === 'identified' ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>

              <View style={styles.identityIcon}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.navy}
                />
              </View>

              <View style={styles.identityContent}>
                <Text style={styles.identityTitle}>
                  Identified
                </Text>

                <Text style={styles.identityDescription}>
                  The organizer may see your name with
                  your feedback.
                </Text>
              </View>
            </Pressable>

            {/* Anonymous */}

            <Pressable
              style={[
                styles.identityOption,
                identityMode === 'anonymous' &&
                  styles.identityOptionSelected,
              ]}
              onPress={() =>
                setIdentityMode('anonymous')
              }
              disabled={submitting}
            >
              <View
                style={[
                  styles.radio,
                  identityMode === 'anonymous' &&
                    styles.radioSelected,
                ]}
              >
                {identityMode === 'anonymous' ? (
                  <View style={styles.radioDot} />
                ) : null}
              </View>

              <View style={styles.identityIcon}>
                <Ionicons
                  name="eye-off-outline"
                  size={20}
                  color={colors.navy}
                />
              </View>

              <View style={styles.identityContent}>
                <Text style={styles.identityTitle}>
                  Anonymous
                </Text>

                <Text style={styles.identityDescription}>
                  Your name will not be shown to the
                  organizer.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Privacy note */}

          <View style={styles.privacyNote}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.navy}
            />

            <Text style={styles.privacyText}>
              Anonymous feedback keeps your identity
              hidden from the event organizer.
            </Text>
          </View>

          {/* Submit */}

          <Pressable
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
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
                <Ionicons
                  name="send-outline"
                  size={19}
                  color={colors.navy}
                />

                <Text style={styles.submitButtonText}>
                  Submit Feedback
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * =====================================================
   * PENDING FEEDBACK LIST
   * =====================================================
   */

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}

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

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Feedback
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Page introduction */}

        <View style={styles.pageIntro}>
          <View style={styles.pageIntroIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={25}
              color={colors.navy}
            />
          </View>

          <View style={styles.pageIntroText}>
            <Text style={styles.pageTitle}>
              Your Feedback
            </Text>

            <Text style={styles.pageSubtitle}>
              Share your experience after completing
              a campus event.
            </Text>
          </View>
        </View>

        {/* Required notice */}

        {feedbackItems.length > 0 ? (
          <View style={styles.requiredNotice}>
            <View style={styles.noticeIcon}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={colors.warning}
              />
            </View>

            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Feedback required
              </Text>

              <Text style={styles.noticeText}>
                Please submit feedback for completed
                events before registering for another
                event.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Pending events */}

        {feedbackItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={31}
                color={colors.success}
              />
            </View>

            <Text style={styles.emptyTitle}>
              You're all caught up
            </Text>

            <Text style={styles.emptyText}>
              You don't have any completed events
              waiting for feedback.
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>
                Explore Events
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.listHeading}>
              Events awaiting feedback
            </Text>

            {feedbackItems.map((event) => (
              <Pressable
                key={event.event_id}
                style={styles.feedbackEventCard}
                onPress={() =>
                  openFeedbackForm(event)
                }
              >
                <View style={styles.feedbackEventIcon}>
                  <Ionicons
                    name="star-outline"
                    size={22}
                    color={colors.navy}
                  />
                </View>

                <View style={styles.feedbackEventContent}>
                  <Text
                    style={styles.feedbackEventTitle}
                    numberOfLines={2}
                  >
                    {event.event_title}
                  </Text>

                  <View style={styles.eventSmallInfo}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color={colors.textMuted}
                    />

                    <Text style={styles.eventSmallText}>
                      Completed ·{' '}
                      {formatDate(event.event_end_at)}
                    </Text>
                  </View>

                  {event.category ? (
                    <Text style={styles.categoryText}>
                      {event.category}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.arrowCircle}>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.navy}
                  />
                </View>
              </Pressable>
            ))}
          </>
        )}

        {/* Footer privacy note */}

        <View style={styles.bottomPrivacy}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={colors.navy}
          />

          <Text style={styles.bottomPrivacyText}>
            You control whether your feedback is
            identified or anonymous.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: string) {
  if (!value) {
    return 'Date unavailable';
  }

  return new Date(value).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
}

function getRatingText(rating: number) {
  switch (rating) {
    case 1:
      return 'Needs improvement';
    case 2:
      return 'Could be better';
    case 3:
      return 'It was okay';
    case 4:
      return 'Great experience';
    case 5:
      return 'Excellent experience';
    default:
      return 'Tap a star to rate';
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 55,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    color: colors.navy,
    fontSize: 19,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 42,
  },

  pageIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  pageIntroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  pageIntroText: {
    flex: 1,
  },

  pageTitle: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: '800',
  },

  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  requiredNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF5DD',
    borderWidth: 1,
    borderColor: '#F0DDAA',
    borderRadius: 16,
    padding: 13,
    marginBottom: 18,
  },

  noticeIcon: {
    marginRight: 9,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTitle: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },

  noticeText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },

  listHeading: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 11,
  },

  feedbackEventCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  feedbackEventIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFF5DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  feedbackEventContent: {
    flex: 1,
    paddingRight: 7,
  },

  feedbackEventTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },

  eventSmallInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  eventSmallText: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginLeft: 4,
  },

  categoryText: {
    color: colors.yellowDark,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
    textTransform: 'uppercase',
  },

  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    marginTop: 5,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },

  exploreButton: {
    backgroundColor: colors.navy,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 17,
  },

  exploreButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  bottomPrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1F6',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },

  bottomPrivacyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 15,
    marginLeft: 7,
  },

  eventHero: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 20,
    marginBottom: 25,
  },

  eventHeroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  eventHeroTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
  },

  eventHeroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  eventHeroMetaText: {
    color: '#C5CBD7',
    fontSize: 10.5,
    marginLeft: 6,
  },

  section: {
    marginBottom: 22,
  },

  sectionEyebrow: {
    color: colors.yellowDark,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 11,
  },

  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },

  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  starButton: {
    paddingHorizontal: 4,
  },

  ratingText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginTop: 8,
    fontWeight: '600',
  },

  commentInput: {
    minHeight: 135,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 14,
    color: colors.navy,
    fontSize: 12,
    lineHeight: 18,
  },

  characterCount: {
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },

  identityIntro: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginBottom: 10,
  },

  identityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 9,
  },

  identityOptionSelected: {
    borderColor: colors.yellowDark,
    backgroundColor: '#FFF9EA',
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  radioSelected: {
    borderColor: colors.yellowDark,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.yellowDark,
  },

  identityIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  identityContent: {
    flex: 1,
  },

  identityTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  identityDescription: {
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1F6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
  },

  privacyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 15,
    marginLeft: 7,
  },

  submitButton: {
    height: 53,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },
});