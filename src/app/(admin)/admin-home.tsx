import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type PendingEvent = {
  id: string;
  title: string;
  organizerName: string;
  createdAt: string;
};

type DashboardStats = {
  students: number;
  organizers: number;
  totalUsers: number;
  totalEvents: number;
  pendingApprovals: number;
  upcomingEvents: number;
  platformRating: number | null;
};

export default function AdminHome() {
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    organizers: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    upcomingEvents: 0,
    platformRating: null,
  });

  const [pendingEvents, setPendingEvents] = useState<
    PendingEvent[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setErrorMessage('');

      /*
       * Load all dashboard information from Supabase.
       *
       * We deliberately do not use any fixed/mock numbers here.
       */

      const now = new Date().toISOString();

      const [
        studentsResult,
        organizersResult,
        totalUsersResult,
        totalEventsResult,
        pendingResult,
        upcomingResult,
        ratingResult,
        pendingEventsResult,
      ] = await Promise.all([
        // Students
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student'),

        // Organizers
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'organizer'),

        // All users
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),

        // All events
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true }),

        // Pending approvals
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Upcoming approved events
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('start_at', now),

        // Platform feedback
        supabase
          .from('event_feedback')
          .select('rating'),

        // Real pending events
        supabase
          .from('events')
          .select(
            'id, title, organizer_id, created_at'
          )
          .eq('status', 'pending')
          .order('created_at', {
            ascending: false,
          })
          .limit(3),
      ]);

      // Check for query errors
      const queryResults = [
        studentsResult,
        organizersResult,
        totalUsersResult,
        totalEventsResult,
        pendingResult,
        upcomingResult,
        ratingResult,
        pendingEventsResult,
      ];

      const firstError = queryResults.find(
        (result) => result.error
      );

      if (firstError?.error) {
        throw firstError.error;
      }

      // Calculate platform rating from real feedback
      const feedbackRows =
        ratingResult.data ?? [];

      let platformRating: number | null = null;

      if (feedbackRows.length > 0) {
        const totalRating = feedbackRows.reduce(
          (sum, item) =>
            sum + Number(item.rating || 0),
          0
        );

        platformRating =
          totalRating / feedbackRows.length;
      }

      // Get pending events
      const rawPendingEvents =
        pendingEventsResult.data ?? [];

      let formattedPendingEvents: PendingEvent[] = [];

      if (rawPendingEvents.length > 0) {
        const organizerIds = [
          ...new Set(
            rawPendingEvents.map(
              (event) => event.organizer_id
            )
          ),
        ];

        const { data: organizerProfiles, error: organizerError } =
          await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', organizerIds);

        if (organizerError) {
          throw organizerError;
        }

        const organizerMap = new Map(
          (organizerProfiles ?? []).map(
            (profile) => [
              profile.id,
              profile.full_name,
            ]
          )
        );

        formattedPendingEvents =
          rawPendingEvents.map((event) => ({
            id: event.id,
            title: event.title,
            organizerName:
              organizerMap.get(event.organizer_id) ||
              'Unknown organizer',
            createdAt: event.created_at,
          }));
      }

      setStats({
        students: studentsResult.count ?? 0,
        organizers: organizersResult.count ?? 0,
        totalUsers: totalUsersResult.count ?? 0,
        totalEvents: totalEventsResult.count ?? 0,
        pendingApprovals:
          pendingResult.count ?? 0,
        upcomingEvents:
          upcomingResult.count ?? 0,
        platformRating,
      });

      setPendingEvents(formattedPendingEvents);
    } catch (error) {
      console.error(
        'Admin dashboard error:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatSubmittedTime = (
    dateString: string
  ) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Recently submitted';
    }

    return `Submitted ${date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    )}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
        />

        <Text style={styles.loadingText}>
          Loading admin overview...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.navy}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              ADMIN SPACE
            </Text>

            <Text style={styles.title}>
              Command Center
            </Text>

            <Text style={styles.subtitle}>
              Manage the campus events platform.
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={handleRefresh}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {/* Error */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color={colors.danger}
              />
            </View>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn't load some data
              </Text>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>

              <Pressable
                onPress={loadDashboard}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Main overview */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={colors.navy}
              />
            </View>

            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />

              <Text style={styles.heroBadgeText}>
                PLATFORM ACTIVE
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            People on the platform.
          </Text>

          <Text style={styles.heroDescription}>
            Review users, approve events, and monitor
            activity across Campus Events.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>
                {stats.students}
              </Text>

              <Text style={styles.heroLabel}>
                Students
              </Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>
                {stats.organizers}
              </Text>

              <Text style={styles.heroLabel}>
                Organizers
              </Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>
                {stats.totalEvents}
              </Text>

              <Text style={styles.heroLabel}>
                Events
              </Text>
            </View>
          </View>
        </View>

        {/* Platform overview */}
        <Text style={styles.sectionTitle}>
          Platform overview
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="people-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>
              {stats.totalUsers}
            </Text>

            <Text style={styles.statLabel}>
              Total users
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>
              {stats.pendingApprovals}
            </Text>

            <Text style={styles.statLabel}>
              Pending approvals
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>
              {stats.upcomingEvents}
            </Text>

            <Text style={styles.statLabel}>
              Upcoming events
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="star-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>
              {stats.platformRating !== null
                ? stats.platformRating.toFixed(1)
                : '—'}
            </Text>

            <Text style={styles.statLabel}>
              Platform rating
            </Text>
          </View>
        </View>

        {/* Pending approvals */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Pending event approvals
            </Text>

            <Text style={styles.sectionSubtitle}>
              Events waiting for Admin review
            </Text>
          </View>

          <Pressable
            onPress={() =>
              router.push('/event-approvals')
            }
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        {pendingEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={25}
                color={colors.success}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No pending approvals
            </Text>

            <Text style={styles.emptyText}>
              New organizer submissions will appear
              here for review.
            </Text>
          </View>
        ) : (
          pendingEvents.map((event) => (
            <Pressable
              key={event.id}
              style={({ pressed }) => [
                styles.approvalCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push('/event-approvals')
              }
            >
              <View style={styles.approvalIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={19}
                  color={colors.navy}
                />
              </View>

              <View style={styles.approvalInfo}>
                <Text
                  style={styles.approvalTitle}
                  numberOfLines={1}
                >
                  {event.title}
                </Text>

                <Text style={styles.approvalOrganizer}>
                  {event.organizerName}
                </Text>

                <Text style={styles.approvalTime}>
                  {formatSubmittedTime(
                    event.createdAt
                  )}
                </Text>
              </View>

              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>
                  Pending
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>
          Quick actions
        </Text>

        <View style={styles.actionsCard}>
          <AdminAction
            icon="people-outline"
            title="Manage users"
            subtitle="View students and organizers"
            onPress={() =>
              router.push('/users')
            }
          />

          <View style={styles.divider} />

          <AdminAction
            icon="checkmark-circle-outline"
            title="Review events"
            subtitle="Approve or reject submissions"
            onPress={() =>
              router.push('/event-approvals')
            }
          />

          <View style={styles.divider} />

          <AdminAction
            icon="bar-chart-outline"
            title="View analytics"
            subtitle="Monitor platform performance"
            onPress={() =>
              router.push('/analytics')
            }
          />
        </View>

        {/* Admin note */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.yellowDark}
            />
          </View>

          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              Admin access
            </Text>

            <Text style={styles.noteText}>
              Admins have platform-wide visibility and
              control. Students and organizers can only
              access the areas permitted for their role.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AdminAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.actionPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.navy}
        />
      </View>

      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    padding: 20,
    paddingTop: 58,
    paddingBottom: 110,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  title: {
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 17,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E9BABA',
  },

  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFE1E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorContent: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 3,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 7,
  },

  retryText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 19,
    marginBottom: 23,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#263653',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },

  heroBadgeText: {
    color: '#BFC6D4',
    fontSize: 8.5,
    fontWeight: '800',
  },

  heroTitle: {
    color: colors.white,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 17,
  },

  heroDescription: {
    color: '#AAB2C2',
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 5,
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#33415C',
  },

  heroStat: {
    flex: 1,
  },

  heroNumber: {
    color: colors.yellow,
    fontSize: 21,
    fontWeight: '800',
  },

  heroLabel: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#33415C',
    marginHorizontal: 8,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 11,
    marginBottom: 23,
  },

  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statNumber: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: '800',
  },

  statLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 3,
  },

  viewAll: {
    color: colors.navy,
    fontSize: 10.5,
    fontWeight: '800',
  },

  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardPressed: {
    opacity: 0.7,
  },

  approvalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  approvalInfo: {
    flex: 1,
    paddingRight: 6,
  },

  approvalTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  approvalOrganizer: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 3,
  },

  approvalTime: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: '#FFF5DD',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  pendingText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 23,
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },

  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginTop: 11,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  actionPressed: {
    opacity: 0.7,
  },

  actionIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  noteCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 17,
    padding: 13,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F0D99B',
  },

  noteIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  noteContent: {
    flex: 1,
  },

  noteTitle: {
    color: colors.navy,
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  noteText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
});