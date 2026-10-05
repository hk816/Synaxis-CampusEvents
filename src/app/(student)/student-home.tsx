import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
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
  description: string | null;
  category: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  capacity: number | null;
  image_url: string | null;
};

export default function StudentHomeScreen() {
  const [studentName, setStudentName] =
    useState('Student');

  const [events, setEvents] = useState<EventItem[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [])
  );

  const loadHome = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'full_name, role, profile_completed'
        )
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.role !== 'student') {
        if (profile.role === 'organizer') {
          router.replace('/organizer-home');
        } else if (profile.role === 'admin') {
          router.replace('/admin-home');
        }

        return;
      }

      setStudentName(
        profile.full_name?.trim() || 'Student'
      );

      /*
       * HOME PAGE EVENTS
       *
       * Keep approved events visible while:
       * - upcoming
       * - currently live
       *
       * Remove them only after their end time.
       *
       * Ordering by start_at automatically moves
       * the remaining/new events upward.
       */
      const now = new Date().toISOString();

      const {
        data: eventData,
        error: eventError,
      } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          category,
          location,
          start_at,
          end_at,
          capacity,
          image_url
        `)
        .eq('status', 'approved')
        .gt('end_at', now)
        .order('start_at', {
          ascending: true,
        })
        .limit(6);

      if (eventError) {
        throw eventError;
      }

      setEvents(eventData ?? []);
    } catch (error) {
      console.error(
        'Student home error:',
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshHome = async () => {
    setRefreshing(true);
    await loadHome();
  };

  const openEvent = (eventId: string) => {
    router.push({
      pathname: '/event-details',
      params: {
        eventId,
      },
    });
  };

  const formatDate = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    return {
      day: date.toLocaleDateString(
        'en-IN',
        {
          day: 'numeric',
        }
      ),

      month: date.toLocaleDateString(
        'en-IN',
        {
          month: 'short',
        }
      ),

      weekday: date.toLocaleDateString(
        'en-IN',
        {
          weekday: 'short',
        }
      ),

      time: date.toLocaleTimeString(
        'en-IN',
        {
          hour: 'numeric',
          minute: '2-digit',
        }
      ),
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 17) {
      return 'Good afternoon';
    }

    return 'Good evening';
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHome}
            tintColor={colors.yellowDark}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              CAMPUS EVENTS
            </Text>

            <Text style={styles.greeting}>
              {getGreeting()},
            </Text>

            <Text
              style={styles.studentName}
              numberOfLines={1}
            >
              {studentName} 👋
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              router.push('/notifications')
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {/* QUICK ACTIONS */}

        <View style={styles.actions}>
          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push('/explore')
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="search-outline"
                size={21}
                color={colors.navy}
              />
            </View>

            <Text style={styles.actionTitle}>
              Explore
            </Text>

            <Text style={styles.actionSubtitle}>
              Find events
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push('/my-events')
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="calendar-outline"
                size={21}
                color={colors.navy}
              />
            </View>

            <Text style={styles.actionTitle}>
              My Events
            </Text>

            <Text style={styles.actionSubtitle}>
              Your registrations
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push('/favorites')
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="heart-outline"
                size={21}
                color={colors.navy}
              />
            </View>

            <Text style={styles.actionTitle}>
              Favorites
            </Text>

            <Text style={styles.actionSubtitle}>
              Saved events
            </Text>
          </Pressable>
        </View>

        {/* UPCOMING / LIVE EVENTS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              DISCOVER
            </Text>

            <Text style={styles.sectionTitle}>
              Upcoming events
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push('/explore')
            }
          >
            <Text style={styles.seeAll}>
              See all
            </Text>
          </Pressable>
        </View>

        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No upcoming events
            </Text>

            <Text style={styles.emptyText}>
              New approved campus events will
              appear here.
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() =>
                router.push('/explore')
              }
            >
              <Text
                style={
                  styles.exploreButtonText
                }
              >
                Explore Events
              </Text>
            </Pressable>
          </View>
        ) : (
          events.map((event) => {
            const date = formatDate(
              event.start_at
            );

            return (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() =>
                  openEvent(event.id)
                }
              >
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>
                    {date.day}
                  </Text>

                  <Text
                    style={styles.dateMonth}
                  >
                    {date.month}
                  </Text>
                </View>

                <View
                  style={styles.eventContent}
                >
                  <View
                    style={styles.eventTopRow}
                  >
                    <Text
                      style={styles.category}
                      numberOfLines={1}
                    >
                      {event.category ??
                        'EVENT'}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={
                        colors.textMuted
                      }
                    />
                  </View>

                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>

                  <View
                    style={styles.eventInfo}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.infoText}
                    >
                      {date.weekday},{' '}
                      {date.time}
                    </Text>
                  </View>

                  <View
                    style={styles.eventInfo}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={
                        colors.textSecondary
                      }
                    />

                    <Text
                      style={styles.infoText}
                      numberOfLines={1}
                    >
                      {event.location ??
                        'Location TBA'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Stay connected with your campus.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginBottom: 7,
  },

  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },

  studentName: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.navy,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 28,
  },

  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
  },

  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  actionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  actionSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 2,
  },

  seeAll: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.yellowDark,
    marginBottom: 2,
  },

  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    marginBottom: 11,
    flexDirection: 'row',
  },

  dateBox: {
    width: 55,
    height: 63,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    lineHeight: 24,
  },

  dateMonth: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.navy,
    textTransform: 'uppercase',
  },

  eventContent: {
    flex: 1,
  },

  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  category: {
    flex: 1,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.yellowDark,
    textTransform: 'uppercase',
  },

  eventTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
    marginBottom: 6,
  },

  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  infoText: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 5,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 260,
  },

  exploreButton: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 11,
    marginTop: 15,
  },

  exploreButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },

  footerText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});