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

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  capacity: number | null;
  status: string;
  created_at: string;
};

export default function OrganizerHomeScreen() {
  const [organizerName, setOrganizerName] = useState('Organizer');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadOrganizerHome();
    }, [])
  );

  const loadOrganizerHome = async () => {
    try {
      setLoading(true);

      // -----------------------------------------
      // Get logged-in organizer
      // -----------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      // -----------------------------------------
      // Load organizer profile
      // -----------------------------------------

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.role !== 'organizer') {
        if (profile.role === 'student') {
          router.replace('/');
        } else if (profile.role === 'admin') {
          router.replace('/admin-home');
        }

        return;
      }

      setOrganizerName(profile.full_name?.trim() || 'Organizer');

      // -----------------------------------------
      // Load organizer's REAL events
      // -----------------------------------------

      const { data: eventData, error: eventError } = await supabase
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
          status,
          created_at
          `
        )
        .eq('organizer_id', user.id)
        .order('start_at', {
          ascending: true,
        });

      if (eventError) {
        throw eventError;
      }

      const organizerEvents = eventData ?? [];

      setEvents(organizerEvents);
      setTotalEvents(organizerEvents.length);

      // -----------------------------------------
      // Calculate upcoming events
      // -----------------------------------------

      const now = new Date();

      const upcoming = organizerEvents.filter(
        (event) =>
          event.status === 'approved' &&
          new Date(event.start_at) >= now
      );

      setUpcomingEvents(upcoming.length);

      // -----------------------------------------
      // Calculate pending events
      // -----------------------------------------

      const pending = organizerEvents.filter(
        (event) => event.status === 'pending'
      );

      setPendingEvents(pending.length);

      // -----------------------------------------
      // Load participant count
      // Only registrations for this organizer's events
      // -----------------------------------------

      if (organizerEvents.length > 0) {
        const eventIds = organizerEvents.map((event) => event.id);

        const { count: participantCount, error: participantError } =
          await supabase
            .from('event_registrations')
            .select('id', {
              count: 'exact',
              head: true,
            })
            .in('event_id', eventIds)
            .eq('status', 'registered');

        if (participantError) {
          console.error(
            'Participant count error:',
            participantError
          );

          setParticipants(0);
        } else {
          setParticipants(participantCount ?? 0);
        }
      } else {
        setParticipants(0);
      }
    } catch (error) {
      console.error('Organizer home error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshHome = async () => {
    setRefreshing(true);
    await loadOrganizerHome();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return {
      day: date.toLocaleDateString('en-IN', {
        day: 'numeric',
      }),
      month: date.toLocaleDateString('en-IN', {
        month: 'short',
      }),
      weekday: date.toLocaleDateString('en-IN', {
        weekday: 'short',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending approval';

      case 'approved':
        return 'Approved';

      case 'rejected':
        return 'Rejected';

      case 'completed':
        return 'Completed';

      case 'cancelled':
        return 'Cancelled';

      case 'draft':
        return 'Draft';

      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.approvedBadge;

      case 'rejected':
        return styles.rejectedBadge;

      case 'completed':
        return styles.completedBadge;

      case 'cancelled':
        return styles.cancelledBadge;

      default:
        return styles.pendingBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.approvedBadgeText;

      case 'rejected':
        return styles.rejectedBadgeText;

      case 'completed':
        return styles.completedBadgeText;

      case 'cancelled':
        return styles.cancelledBadgeText;

      default:
        return styles.pendingBadgeText;
    }
  };

  const pendingEventList = events
    .filter((event) => event.status === 'pending')
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  const upcomingEventList = events
    .filter(
      (event) =>
        event.status === 'approved' &&
        new Date(event.start_at) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.start_at).getTime() -
        new Date(b.start_at).getTime()
    )
    .slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHome}
            tintColor={colors.yellowDark}
          />
        }
      >
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.spaceLabel}>
              ORGANIZER SPACE
            </Text>

            <Text style={styles.greeting}>
              {getGreeting()},
            </Text>

            <Text
              style={styles.organizerName}
              numberOfLines={1}
            >
              {organizerName} 👋
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              router.push('/organizer-notifications')
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {/* Overview */}

        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewEyebrow}>
                YOUR EVENTS
              </Text>

              <Text style={styles.overviewTitle}>
                Keep your campus moving.
              </Text>
            </View>

            <View style={styles.overviewIcon}>
              <Ionicons
                name="megaphone-outline"
                size={23}
                color={colors.navy}
              />
            </View>
          </View>

          <Text style={styles.overviewText}>
            Create events, manage registrations and keep
            participants informed from one place.
          </Text>
        </View>

        {/* Real Stats */}

        <View style={styles.statsRow}>
          <StatCard
            number={String(totalEvents)}
            label="Total Events"
            icon="calendar-outline"
          />

          <StatCard
            number={String(upcomingEvents)}
            label="Upcoming"
            icon="time-outline"
          />

          <StatCard
            number={String(participants)}
            label="Participants"
            icon="people-outline"
          />
        </View>

        {/* Create Event */}

        <Pressable
          style={styles.createButton}
          onPress={() =>
            router.push('/create-event')
          }
        >
          <View style={styles.createIcon}>
            <Ionicons
              name="add"
              size={23}
              color={colors.navy}
            />
          </View>

          <View style={styles.createContent}>
            <Text style={styles.createTitle}>
              Create a New Event
            </Text>

            <Text style={styles.createText}>
              Submit your event for admin approval.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={colors.navy}
          />
        </Pressable>

        {/* Pending Approval */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                NEEDS ATTENTION
              </Text>

              <Text style={styles.sectionTitle}>
                Event Approval
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {pendingEvents}{' '}
                {pendingEvents === 1
                  ? 'Pending'
                  : 'Pending'}
              </Text>
            </View>
          </View>

          {pendingEventList.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={27}
                  color={colors.success}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No events awaiting approval
              </Text>

              <Text style={styles.emptyText}>
                Events you submit will appear here until
                an admin reviews them.
              </Text>
            </View>
          ) : (
            pendingEventList.map((event) => {
              const date = formatDate(event.start_at);

              return (
                <Pressable
                  key={event.id}
                  style={styles.pendingCard}
                  onPress={() =>
                    router.push({
                      pathname: '/event-details',
                      params: {
                        eventId: event.id,
                      },
                    })
                  }
                >
                  <View style={styles.pendingIcon}>
                    <Ionicons
                      name="hourglass-outline"
                      size={21}
                      color={colors.navy}
                    />
                  </View>

                  <View style={styles.pendingContent}>
                    <Text
                      style={styles.pendingTitle}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>

                    <Text style={styles.pendingText}>
                      Submitted for admin review
                    </Text>

                    <Text style={styles.pendingDate}>
                      {date.day} {date.month} · {date.time}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Upcoming Events */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                YOUR CALENDAR
              </Text>

              <Text style={styles.sectionTitle}>
                Upcoming Events
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push('/events')
              }
            >
              <Text style={styles.seeAll}>
                See all
              </Text>
            </Pressable>
          </View>

          {upcomingEventList.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={27}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No approved upcoming events
              </Text>

              <Text style={styles.emptyText}>
                Once an admin approves your event, it
                will appear here.
              </Text>
            </View>
          ) : (
            upcomingEventList.map((event) => {
              const date = formatDate(event.start_at);

              return (
                <Pressable
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() =>
                    router.push({
                      pathname: '/event-details',
                      params: {
                        eventId: event.id,
                      },
                    })
                  }
                >
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>
                      {date.day}
                    </Text>

                    <Text style={styles.dateMonth}>
                      {date.month}
                    </Text>
                  </View>

                  <View style={styles.eventContent}>
                    <View style={styles.eventTopRow}>
                      <Text
                        style={styles.category}
                        numberOfLines={1}
                      >
                        {event.category ?? 'EVENT'}
                      </Text>

                      <View style={styles.approvedBadge}>
                        <Text
                          style={styles.approvedBadgeText}
                        >
                          APPROVED
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.eventTitle}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>

                    <View style={styles.eventInfo}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.textSecondary}
                      />

                      <Text style={styles.infoText}>
                        {date.weekday}, {date.time}
                      </Text>
                    </View>

                    <View style={styles.eventInfo}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
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
        </View>

        {/* Quick Actions */}

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            MANAGEMENT
          </Text>

          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>

          <View style={styles.quickGrid}>
            <QuickAction
              icon="people-outline"
              title="Participants"
              onPress={() =>
                router.push('/participants')
              }
            />

            <QuickAction
              icon="cube-outline"
              title="Resources"
              onPress={() =>
                router.push('/resources')
              }
            />

            <QuickAction
              icon="chatbubble-outline"
              title="Feedback"
              onPress={() =>
                router.push('/feedback')
              }
            />

            <QuickAction
              icon="bar-chart-outline"
              title="Analytics"
              onPress={() =>
                router.push('/organizer-analytics')
              }
            />
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

type StatCardProps = {
  number: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function StatCard({
  number,
  label,
  icon,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Ionicons
        name={icon}
        size={17}
        color={colors.yellowDark}
      />

      <Text style={styles.statNumber}>
        {number}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
};

function QuickAction({
  icon,
  title,
  onPress,
}: QuickActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.quickPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.navy}
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Ionicons
        name="arrow-forward"
        size={15}
        color={colors.textMuted}
      />
    </Pressable>
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  spaceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.yellowDark,
    marginBottom: 5,
  },

  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },

  organizerName: {
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  overviewCard: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 19,
    marginBottom: 13,
  },

  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  overviewEyebrow: {
    color: colors.yellow,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  overviewTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    maxWidth: 240,
  },

  overviewIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overviewText: {
    color: '#D8DDE7',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },

  statNumber: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 6,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderRadius: 17,
    padding: 13,
    marginBottom: 28,
  },

  createIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  createContent: {
    flex: 1,
  },

  createTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  createText: {
    color: colors.navy,
    opacity: 0.7,
    fontSize: 10,
    marginTop: 3,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionEyebrow: {
    color: colors.yellowDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
  },

  pendingBadge: {
    backgroundColor: '#FFF0D2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  pendingBadgeText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800',
  },

  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },

  pendingIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FFF0D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  pendingContent: {
    flex: 1,
  },

  pendingTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  pendingText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  pendingDate: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
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
    marginRight: 7,
  },

  eventTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 5,
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

  approvedBadge: {
    backgroundColor: '#E5F4EA',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  approvedBadgeText: {
    color: colors.success,
    fontSize: 7,
    fontWeight: '800',
  },

  rejectedBadge: {
    backgroundColor: '#FBE7E7',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  rejectedBadgeText: {
    color: colors.danger,
    fontSize: 7,
    fontWeight: '800',
  },

  completedBadge: {
    backgroundColor: '#E8EDF5',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  completedBadgeText: {
    color: colors.navy,
    fontSize: 7,
    fontWeight: '800',
  },

  cancelledBadge: {
    backgroundColor: '#FBE7E7',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },

  cancelledBadgeText: {
    color: colors.danger,
    fontSize: 7,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 10,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 270,
  },

  seeAll: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },

  quickCard: {
    width: '48%',
    minHeight: 82,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },

  quickPressed: {
    opacity: 0.7,
  },

  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  quickTitle: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 25,
  },
});