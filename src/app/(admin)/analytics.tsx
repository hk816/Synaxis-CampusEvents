import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type MonthlyRegistration = {
  month: string;
  registrations: number;
};

type EventPerformance = {
  id: string;
  title: string;
  participants: number;
  capacity: number;
  rating: number | null;
};

type AnalyticsData = {
  total_events: number;
  total_users: number;
  total_registrations: number;
  average_rating: number | null;
  students: number;
  organizers: number;
  upcoming_events: number;
  pending_approvals: number;
  monthly_registrations: MonthlyRegistration[];
  event_performance: EventPerformance[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  total_events: 0,
  total_users: 0,
  total_registrations: 0,
  average_rating: null,
  students: 0,
  organizers: 0,
  upcoming_events: 0,
  pending_approvals: 0,
  monthly_registrations: [],
  event_performance: [],
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] =
    useState<AnalyticsData>(EMPTY_ANALYTICS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('You must be logged in.');
        }

        const { data, error: rpcError } =
          await supabase.rpc(
            'get_admin_analytics'
          );

        if (rpcError) {
          throw rpcError;
        }

        let result: any = data;

        // Supabase may return a JSON object
        // or a single-row array depending on
        // the generated client response.
        if (Array.isArray(result)) {
          result = result[0];
        }

        if (!result) {
          setAnalytics(EMPTY_ANALYTICS);
          return;
        }

        setAnalytics({
          total_events:
            Number(result.total_events ?? 0),

          total_users:
            Number(result.total_users ?? 0),

          total_registrations:
            Number(
              result.total_registrations ?? 0
            ),

          average_rating:
            result.average_rating === null ||
            result.average_rating === undefined
              ? null
              : Number(result.average_rating),

          students:
            Number(result.students ?? 0),

          organizers:
            Number(result.organizers ?? 0),

          upcoming_events:
            Number(result.upcoming_events ?? 0),

          pending_approvals:
            Number(result.pending_approvals ?? 0),

          monthly_registrations:
            Array.isArray(
              result.monthly_registrations
            )
              ? result.monthly_registrations.map(
                  (item: any) => ({
                    month: String(
                      item.month ?? ''
                    ),
                    registrations: Number(
                      item.registrations ?? 0
                    ),
                  })
                )
              : [],

          event_performance:
            Array.isArray(
              result.event_performance
            )
              ? result.event_performance.map(
                  (item: any) => ({
                    id: String(
                      item.id ?? ''
                    ),
                    title: String(
                      item.title ?? 'Untitled Event'
                    ),
                    participants: Number(
                      item.participants ?? 0
                    ),
                    capacity: Number(
                      item.capacity ?? 0
                    ),
                    rating:
                      item.rating === null ||
                      item.rating === undefined
                        ? null
                        : Number(item.rating),
                  })
                )
              : [],
        });
      } catch (err: any) {
        console.error(
          'Admin analytics error:',
          err
        );

        setError(
          err?.message ||
            'Unable to load analytics.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxRegistrations = Math.max(
    ...analytics.monthly_registrations.map(
      item => item.registrations
    ),
    1
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.yellowDark}
        />

        <Text style={styles.loadingText}>
          Loading analytics...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadAnalytics(true)
            }
            tintColor={colors.yellowDark}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Analytics
            </Text>

            <Text style={styles.subtitle}>
              Platform performance overview
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={25}
              color={colors.navy}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.danger}
            />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn't load analytics
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          </View>
        ) : null}

        {/* MAIN STATS */}

        <View style={styles.grid}>
          <StatCard
            icon="calendar-outline"
            label="Total Events"
            value={analytics.total_events}
          />

          <StatCard
            icon="people-outline"
            label="Total Users"
            value={analytics.total_users}
          />

          <StatCard
            icon="person-outline"
            label="Students"
            value={analytics.students}
          />

          <StatCard
            icon="briefcase-outline"
            label="Organizers"
            value={analytics.organizers}
          />

          <StatCard
            icon="ticket-outline"
            label="Registrations"
            value={
              analytics.total_registrations
            }
          />

          <StatCard
            icon="star-outline"
            label="Average Rating"
            value={
              analytics.average_rating === null
                ? '—'
                : analytics.average_rating.toFixed(1)
            }
          />
        </View>

        {/* EVENT STATUS */}

        <SectionTitle title="Event Overview" />

        <View style={styles.statusCard}>
          <StatusRow
            icon="calendar-outline"
            label="Upcoming Events"
            value={analytics.upcoming_events}
          />

          <View style={styles.divider} />

          <StatusRow
            icon="time-outline"
            label="Pending Approvals"
            value={analytics.pending_approvals}
          />

          <View style={styles.divider} />

          <StatusRow
            icon="people-outline"
            label="Active Registrations"
            value={
              analytics.total_registrations
            }
          />
        </View>

        {/* MONTHLY REGISTRATIONS */}

        <SectionTitle title="Registration Trends" />

        <View style={styles.chartCard}>
          {analytics.monthly_registrations.length ===
          0 ? (
            <View style={styles.emptyChart}>
              <Ionicons
                name="bar-chart-outline"
                size={35}
                color={colors.textMuted}
              />

              <Text style={styles.emptyTitle}>
                No registration data yet
              </Text>

              <Text style={styles.emptyText}>
                Registration activity will appear
                here as students register for events.
              </Text>
            </View>
          ) : (
            <View style={styles.chart}>
              {analytics.monthly_registrations.map(
                (item, index) => {
                  const height =
                    Math.max(
                      (item.registrations /
                        maxRegistrations) *
                        145,
                      item.registrations > 0
                        ? 8
                        : 3
                    );

                  return (
                    <View
                      key={`${item.month}-${index}`}
                      style={styles.barColumn}
                    >
                      <Text
                        style={styles.barValue}
                      >
                        {item.registrations}
                      </Text>

                      <View
                        style={[
                          styles.bar,
                          {
                            height,
                          },
                        ]}
                      />

                      <Text
                        style={styles.monthLabel}
                      >
                        {item.month}
                      </Text>
                    </View>
                  );
                }
              )}
            </View>
          )}
        </View>

        {/* EVENT PERFORMANCE */}

        <SectionTitle title="Event Performance" />

        <View style={styles.performanceCard}>
          {analytics.event_performance.length ===
          0 ? (
            <View style={styles.emptyPerformance}>
              <Ionicons
                name="calendar-clear-outline"
                size={32}
                color={colors.textMuted}
              />

              <Text style={styles.emptyTitle}>
                No event performance data
              </Text>
            </View>
          ) : (
            analytics.event_performance.map(
              (event, index) => {
                const percentage =
                  event.capacity > 0
                    ? Math.min(
                        Math.round(
                          (event.participants /
                            event.capacity) *
                            100
                        ),
                        100
                      )
                    : 0;

                return (
                  <View
                    key={event.id}
                    style={[
                      styles.eventPerformance,
                      index <
                        analytics
                          .event_performance
                          .length -
                          1 &&
                        styles.performanceBorder,
                    ]}
                  >
                    <View style={styles.eventTopRow}>
                      <View style={styles.eventNameBox}>
                        <Text
                          style={styles.eventTitle}
                          numberOfLines={2}
                        >
                          {event.title}
                        </Text>

                        <Text
                          style={styles.eventParticipants}
                        >
                          {event.participants} /
                          {event.capacity} participants
                        </Text>
                      </View>

                      <View style={styles.ratingBox}>
                        <Ionicons
                          name="star"
                          size={15}
                          color={colors.yellowDark}
                        />

                        <Text
                          style={styles.ratingText}
                        >
                          {event.rating === null
                            ? '—'
                            : event.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.progressBackground}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.capacityText}>
                      {percentage}% capacity filled
                    </Text>
                  </View>
                );
              }
            )
          )}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.navy}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text style={styles.sectionTitle}>
      {title}
    </Text>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statusRow}>
      <View style={styles.statusLeft}>
        <View style={styles.statusIcon}>
          <Ionicons
            name={icon}
            size={19}
            color={colors.navy}
          />
        </View>

        <Text style={styles.statusLabel}>
          {label}
        </Text>
      </View>

      <Text style={styles.statusValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    padding: 20,
    paddingTop: 28,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: colors.navy,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#E9BABA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },

  errorContent: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  statCard: {
    width: '48%',
    minHeight: 145,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    marginTop: 14,
    fontSize: 25,
    fontWeight: '800',
    color: colors.navy,
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F1F3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  statusValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chart: {
    height: 205,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 20,
  },

  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
  },

  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 5,
  },

  bar: {
    width: 25,
    maxHeight: 145,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: colors.yellow,
  },

  monthLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },

  emptyChart: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  emptyPerformance: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eventPerformance: {
    padding: 16,
  },

  performanceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  eventNameBox: {
    flex: 1,
    paddingRight: 12,
  },

  eventTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: colors.navy,
  },

  eventParticipants: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },

  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7DE',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  progressBackground: {
    height: 8,
    marginTop: 14,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#ECE9E0',
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.yellow,
  },

  capacityText: {
    marginTop: 6,
    fontSize: 10,
    color: colors.textMuted,
  },

  footerSpace: {
    height: 30,
  },
});