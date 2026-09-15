import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_at: string;
  end_at: string;
  capacity: number;
  status: string;
};

type RegistrationItem = {
  id: string;
  event_id: string;
  status: string;
  registered_at: string;
  cancelled_at: string | null;
  event: EventItem | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyEventsScreen() {
  const [registrations, setRegistrations] = useState<
    RegistrationItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRegistrations([]);
        return;
      }

      const {
        data: registrationData,
        error: registrationError,
      } = await supabase
        .from('event_registrations')
        .select(
          `
          id,
          event_id,
          status,
          registered_at,
          cancelled_at
        `
        )
        .eq('student_id', user.id)
        .order('registered_at', {
          ascending: false,
        });

      if (registrationError) {
        throw registrationError;
      }

      if (
        !registrationData ||
        registrationData.length === 0
      ) {
        setRegistrations([]);
        return;
      }

      const eventIds = registrationData.map(
        (item) => item.event_id
      );

      const {
        data: eventData,
        error: eventError,
      } = await supabase
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
          status
        `
        )
        .in('id', eventIds);

      if (eventError) {
        throw eventError;
      }

      const eventMap = new Map(
        (eventData ?? []).map((event) => [
          event.id,
          event as EventItem,
        ])
      );

      const combined: RegistrationItem[] =
        registrationData.map((registration) => ({
          id: registration.id,
          event_id: registration.event_id,
          status: registration.status,
          registered_at: registration.registered_at,
          cancelled_at: registration.cancelled_at,
          event:
            eventMap.get(registration.event_id) ??
            null,
        }));

      setRegistrations(combined);
    } catch (error) {
      console.error(
        'Load my events error:',
        error
      );

      setRegistrations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMyEvents();
    }, [])
  );

  const renderEvent = ({
    item,
  }: {
    item: RegistrationItem;
  }) => {
    if (!item.event) {
      return null;
    }

    const event = item.event;

    const isCancelled =
      item.status === 'cancelled';

    const isCompleted =
      new Date(event.end_at) < new Date();

    return (
      <Pressable
        style={[
          styles.card,
          isCancelled && styles.cancelledCard,
        ]}
        onPress={() =>
          router.push({
            pathname: '/event-details',
            params: {
              eventId: event.id,
            },
          })
        }
      >
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isCancelled
                ? styles.cancelledBadge
                : isCompleted
                ? styles.completedBadge
                : styles.registeredBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCancelled
                  ? styles.cancelledText
                  : isCompleted
                  ? styles.completedText
                  : styles.registeredText,
              ]}
            >
              {isCancelled
                ? 'CANCELLED'
                : isCompleted
                ? 'COMPLETED'
                : 'REGISTERED'}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>
          {event.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {formatDate(event.start_at)} ·{' '}
            {formatTime(event.start_at)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {event.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.viewText}>
            View Event
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </View>

        {isCompleted && !isCancelled && (
          <Pressable
            style={styles.feedbackButton}
            onPress={(e) => {
              e.stopPropagation();

              router.push({
                pathname: '/student-feedback',
                params: {
                  eventId: event.id,
                },
              });
            }}
          >
            <Ionicons
              name="star-outline"
              size={17}
              color={colors.navy}
            />

            <Text style={styles.feedbackText}>
              Give Feedback
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          STUDENT SPACE
        </Text>

        <Text style={styles.title}>
          My Events
        </Text>

        <Text style={styles.subtitle}>
          Events you have registered for.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />

          <Text style={styles.loadingText}>
            Loading your events...
          </Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            registrations.length === 0 &&
              styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMyEvents();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No registered events
              </Text>

              <Text style={styles.emptyText}>
                Explore campus events and register for
                something you are interested in.
              </Text>

              <Pressable
                style={styles.exploreButton}
                onPress={() =>
                  router.push(
                    '/(student)/explore'
                  )
                }
              >
                <Text style={styles.exploreText}>
                  Explore Events
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 15,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  list: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelledCard: {
    opacity: 0.72,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  registeredBadge: {
    backgroundColor: '#E2F2E9',
  },

  completedBadge: {
    backgroundColor: '#E9EAF0',
  },

  cancelledBadge: {
    backgroundColor: '#FBE5E5',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  registeredText: {
    color: colors.success,
  },

  completedText: {
    color: colors.textSecondary,
  },

  cancelledText: {
    color: colors.danger,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 13,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  feedbackButton: {
    height: 43,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  feedbackText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7,
  },

  exploreButton: {
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },

  exploreText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});