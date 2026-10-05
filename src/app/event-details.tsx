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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../components/AppToast';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type EventData = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  capacity: number | null;
  image_url: string | null;
  status: string;
};

export default function EventDetailsScreen() {
  const { showToast } = useToast();

  const { eventId } = useLocalSearchParams<{
    eventId?: string;
  }>();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [registrationStatus, setRegistrationStatus] =
    useState<'registered' | 'waitlisted' | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      if (!eventId) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          category,
          location,
          start_at,
          end_at,
          capacity,
          image_url,
          status
        `
        )
        .eq('id', eventId)
        .single();

      if (error) throw error;

      setEvent(data);

      if (!user) return;

      const { data: favorite } = await supabase
        .from('event_favorites')
        .select('id')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .maybeSingle();

      setIsFavorite(!!favorite);

      const { data: registration } = await supabase
        .from('event_registrations')
        .select('status')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .eq('status', 'registered')
        .maybeSingle();

      if (registration) {
        setRegistrationStatus('registered');
        return;
      }

      const { data: waitlist } = await supabase
        .from('event_waitlist')
        .select('status')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .eq('status', 'waiting')
        .maybeSingle();

      if (waitlist) {
        setRegistrationStatus('waitlisted');
      }
    } catch (error) {
      console.error('Load event error:', error);

      Alert.alert(
        'Unable to load event',
        'The event could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!eventId) return;

    try {
      setActionLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please log in to save events.'
        );
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('event_favorites')
          .delete()
          .eq('event_id', eventId)
          .eq('student_id', user.id);

        if (error) throw error;

        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('event_favorites')
          .insert({
            event_id: eventId,
            student_id: user.id,
          });

        if (error) throw error;

        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error(
        'Favorite error:',
        error
      );

      Alert.alert(
        'Unable to update favorite',
        error?.message ??
          'Something went wrong.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const registerForEvent = async () => {
    if (!eventId) return;

    try {
      setActionLoading(true);

      const { data, error } = await supabase.rpc(
        'register_for_event',
        {
          p_event_id: eventId,
        }
      );

      if (error) throw error;

      const result = data as {
        status?: string;
        message?: string;
      };

      if (result.status === 'registered') {
        setRegistrationStatus('registered');

        showToast(
          result.message ??
            'You are registered for this event.',
          'success'
        );
      } else if (result.status === 'waitlisted') {
        setRegistrationStatus('waitlisted');

        showToast(
          result.message ??
            'The event is full. You have been added to the waitlist.',
          'info'
        );
      } else {
        showToast(
          result.message ??
            'Your registration could not be completed.',
          'warning'
        );
      }
    } catch (error: any) {
      console.error(
        'Registration error:',
        error
      );

      Alert.alert(
        'Unable to register',
        error?.message ??
          'Something went wrong.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const cancelRegistration = async () => {
    if (!eventId) return;

    Alert.alert(
      'Cancel registration?',
      'Are you sure you want to cancel your registration?',
      [
        {
          text: 'Keep',
          style: 'cancel',
        },
        {
          text: 'Cancel registration',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);

              const { data, error } =
                await supabase.rpc(
                  'cancel_event_registration',
                  {
                    p_event_id: eventId,
                  }
                );

              if (error) throw error;

              const result = data as {
                promoted?: boolean;
                message?: string;
              };

              setRegistrationStatus(null);

              showToast(
                result.message ??
                  'Your registration has been cancelled.',
                'success'
              );
            } catch (error: any) {
              console.error(
                'Cancel registration error:',
                error
              );

              Alert.alert(
                'Unable to cancel',
                error?.message ??
                  'Something went wrong.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
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

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Event not found
          </Text>

          <Pressable
            style={styles.backAction}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);

  const dateText = startDate.toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const timeText = `${startDate.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  )} – ${endDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.circleButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={colors.navy}
          />
        </Pressable>

        <Pressable
          style={styles.circleButton}
          onPress={toggleFavorite}
          disabled={actionLoading}
        >
          <Ionicons
            name={
              isFavorite
                ? 'heart'
                : 'heart-outline'
            }
            size={22}
            color={
              isFavorite
                ? colors.danger
                : colors.navy
            }
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category ?? 'EVENT'}
            </Text>
          </View>

          <Text style={styles.title}>
            {event.title}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            text={dateText}
          />

          <InfoRow
            icon="time-outline"
            text={timeText}
          />

          <InfoRow
            icon="location-outline"
            text={
              event.location ??
              'Location to be announced'
            }
          />

          {event.capacity !== null && (
            <InfoRow
              icon="people-outline"
              text={`${event.capacity} seats`}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ABOUT THIS EVENT
          </Text>

          <Text style={styles.description}>
            {event.description ||
              'No description available for this event.'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              registrationStatus ===
                'registered'
                ? styles.registeredIcon
                : styles.waitlistIcon,
            ]}
          >
            <Ionicons
              name={
                registrationStatus ===
                'registered'
                  ? 'checkmark'
                  : 'time-outline'
              }
              size={20}
              color={colors.navy}
            />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {registrationStatus ===
              'registered'
                ? 'You are registered'
                : registrationStatus ===
                    'waitlisted'
                  ? 'You are on the waitlist'
                  : 'Registration open'}
            </Text>

            <Text style={styles.statusDescription}>
              {registrationStatus ===
              'registered'
                ? 'Your seat is reserved for this event.'
                : registrationStatus ===
                    'waitlisted'
                  ? 'You will be notified if a seat becomes available.'
                  : 'Register now to reserve your place.'}
            </Text>
          </View>
        </View>

        {registrationStatus ===
        'registered' ? (
          <Pressable
            style={styles.cancelButton}
            onPress={cancelRegistration}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator
                color={colors.danger}
              />
            ) : (
              <Text style={styles.cancelText}>
                Cancel Registration
              </Text>
            )}
          </Pressable>
        ) : registrationStatus ===
          'waitlisted' ? (
          <View style={styles.waitlistButton}>
            <Text style={styles.waitlistButtonText}>
              On Waitlist
            </Text>
          </View>
        ) : (
          <Pressable
            style={styles.registerButton}
            onPress={registerForEvent}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator
                color={colors.navy}
              />
            ) : (
              <>
                <Text style={styles.registerText}>
                  Register for Event
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.navy}
                />
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.navy}
        />
      </View>

      <Text style={styles.infoText}>
        {text}
      </Text>
    </View>
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
    padding: 25,
  },

  topBar: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  hero: {
    paddingTop: 10,
    paddingBottom: 20,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.yellow,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
  },

  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 0.8,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.navy,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.textSecondary,
    marginBottom: 9,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  registeredIcon: {
    backgroundColor: '#E2F2E9',
  },

  waitlistIcon: {
    backgroundColor: '#FFF0D4',
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },

  statusDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 3,
  },

  registerButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  registerText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },

  cancelButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FBE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },

  waitlistButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  waitlistButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.warning,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 15,
  },

  backAction: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
});