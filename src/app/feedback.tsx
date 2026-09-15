import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [identity, setIdentity] = useState<'identified' | 'anonymous'>(
    'identified'
  );

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert(
        'Rating required',
        'Please select a rating before submitting your feedback.'
      );
      return;
    }

    Alert.alert(
      'Feedback submitted',
      'Thank you for sharing your experience.',
      [
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

          <Text style={styles.headerTitle}>Feedback</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <View style={styles.starIcon}>
            <Ionicons
              name="star"
              size={24}
              color={colors.navy}
            />
          </View>

          <Text style={styles.eyebrow}>
            EVENT FEEDBACK
          </Text>

          <Text style={styles.title}>
            How was your experience?
          </Text>

          <Text style={styles.subtitle}>
            Your feedback helps organizers improve future
            campus events.
          </Text>
        </View>

        {/* Event */}
        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Ionicons
              name="calendar-outline"
              size={21}
              color={colors.navy}
            />
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventLabel}>
              EVENT
            </Text>

            <Text style={styles.eventTitle}>
              Student Leadership Meet
            </Text>

            <Text style={styles.eventDetails}>
              September 6 · Seminar Hall
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            YOUR RATING
          </Text>

          <Text style={styles.question}>
            How would you rate this event?
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={colors.yellowDark}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.ratingHint}>
            {rating === 0
              ? 'Tap a star to rate'
              : rating === 1
              ? 'Very poor'
              : rating === 2
              ? 'Needs improvement'
              : rating === 3
              ? 'Good'
              : rating === 4
              ? 'Very good'
              : 'Excellent'}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            YOUR THOUGHTS
          </Text>

          <Text style={styles.question}>
            Tell us more
          </Text>

          <TextInput
            style={styles.commentInput}
            placeholder="What did you like? What could be improved?"
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <Text style={styles.characterCount}>
            {comment.length}/500
          </Text>
        </View>

        {/* Identity */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            YOUR IDENTITY
          </Text>

          <Text style={styles.question}>
            How should your feedback be shared?
          </Text>

          {/* Identified */}
          <Pressable
            style={[
              styles.identityCard,
              identity === 'identified' &&
                styles.identityCardActive,
            ]}
            onPress={() => setIdentity('identified')}
          >
            <View
              style={[
                styles.radio,
                identity === 'identified' &&
                  styles.radioActive,
              ]}
            >
              {identity === 'identified' && (
                <View style={styles.radioDot} />
              )}
            </View>

            <View style={styles.identityContent}>
              <Text style={styles.identityTitle}>
                Identified
              </Text>

              <Text style={styles.identityText}>
                The organizer can see your name with this
                feedback.
              </Text>
            </View>
          </Pressable>

          {/* Anonymous */}
          <Pressable
            style={[
              styles.identityCard,
              identity === 'anonymous' &&
                styles.identityCardActive,
            ]}
            onPress={() => setIdentity('anonymous')}
          >
            <View
              style={[
                styles.radio,
                identity === 'anonymous' &&
                  styles.radioActive,
              ]}
            >
              {identity === 'anonymous' && (
                <View style={styles.radioDot} />
              )}
            </View>

            <View style={styles.identityContent}>
              <Text style={styles.identityTitle}>
                Anonymous
              </Text>

              <Text style={styles.identityText}>
                Your feedback is shared without revealing
                your identity to the organizer.
              </Text>
            </View>
          </Pressable>

          {/* Explanation */}
          <View style={styles.privacyNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={colors.navy}
            />

            <Text style={styles.privacyText}>
              You can choose whether the organizer sees
              your identity. Your choice applies to this
              feedback submission.
            </Text>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={[
            styles.submitButton,
            rating === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>
            Submit Feedback
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={colors.navy}
          />
        </Pressable>

        <Text style={styles.requiredText}>
          A rating is required to submit feedback.
        </Text>

        <View style={styles.bottomSpace} />
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 42,
  },

  intro: {
    alignItems: 'center',
    marginBottom: 24,
  },

  starIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 300,
  },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 28,
  },

  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  eventInfo: {
    flex: 1,
  },

  eventLabel: {
    color: colors.yellowDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },

  eventTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },

  eventDetails: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  section: {
    marginBottom: 27,
  },

  sectionLabel: {
    color: colors.yellowDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  question: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
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

  ratingHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },

  commentInput: {
    minHeight: 125,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },

  characterCount: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
  },

  identityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 9,
  },

  identityCardActive: {
    borderColor: colors.navy,
    backgroundColor: '#FCFBF6',
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    marginTop: 1,
  },

  radioActive: {
    borderColor: colors.navy,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.navy,
  },

  identityContent: {
    flex: 1,
  },

  identityTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  identityText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF6DF',
    borderRadius: 14,
    padding: 13,
    marginTop: 4,
  },

  privacyText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 8,
  },

  submitButton: {
    height: 53,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },

  requiredText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 8,
  },

  bottomSpace: {
    height: 25,
  },
});