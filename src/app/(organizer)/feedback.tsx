import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type FeedbackRow = {
  id: string;
  event_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  identity_mode: 'identified' | 'anonymous';
  submitted_at: string;
};

type EventRow = {
  id: string;
  title: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type FeedbackItem = {
  id: string;
  event: string;
  rating: number;
  comment: string;
  student: string;
  anonymous: boolean;
  date: string;
};

const filters = [
  'All',
  '5 Stars',
  '4 Stars',
  '3 Stars',
  '2 Stars',
  '1 Star',
];

export default function OrganizerFeedback() {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadFeedback = useCallback(async () => {
    try {
      setErrorMessage('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'Your session has expired. Please log in again.'
        );
      }

      /*
       * REAL FEEDBACK
       *
       * RLS controls which feedback an organizer can see.
       * The organizer can only access feedback belonging
       * to their own events.
       */

      const {
        data: feedbackRows,
        error: feedbackError,
      } = await supabase
        .from('event_feedback')
        .select(
          `
          id,
          event_id,
          student_id,
          rating,
          comment,
          identity_mode,
          submitted_at
        `
        )
        .order('submitted_at', {
          ascending: false,
        });

      if (feedbackError) {
        throw feedbackError;
      }

      if (!feedbackRows || feedbackRows.length === 0) {
        setFeedbackData([]);
        return;
      }

      const rows = feedbackRows as FeedbackRow[];

      /*
       * Get event names.
       */

      const eventIds = [
        ...new Set(rows.map((item) => item.event_id)),
      ];

      const {
        data: events,
        error: eventsError,
      } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      if (eventsError) {
        throw eventsError;
      }

      /*
       * Only request student profiles for IDENTIFIED
       * feedback.
       *
       * Anonymous student IDs are deliberately not
       * used to fetch/display their profile.
       */

      const identifiedStudentIds = [
        ...new Set(
          rows
            .filter(
              (item) =>
                item.identity_mode === 'identified'
            )
            .map((item) => item.student_id)
        ),
      ];

      let profiles: ProfileRow[] = [];

      if (identifiedStudentIds.length > 0) {
        const {
          data: profileRows,
          error: profilesError,
        } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', identifiedStudentIds);

        if (profilesError) {
          throw profilesError;
        }

        profiles = (profileRows ??
          []) as ProfileRow[];
      }

      const eventMap = new Map<string, string>();

      ((events ?? []) as EventRow[]).forEach(
        (event) => {
          eventMap.set(event.id, event.title);
        }
      );

      const profileMap = new Map<
        string,
        string | null
      >();

      profiles.forEach((profile) => {
        profileMap.set(
          profile.id,
          profile.full_name
        );
      });

      const mappedFeedback: FeedbackItem[] =
        rows.map((item) => {
          const anonymous =
            item.identity_mode === 'anonymous';

          return {
            id: item.id,

            event:
              eventMap.get(item.event_id) ??
              'Event',

            rating: item.rating,

            comment:
              item.comment ??
              'No written comment provided.',

            student: anonymous
              ? 'Anonymous Student'
              : profileMap.get(item.student_id) ??
                'Identified Student',

            anonymous,

            date: formatDate(
              item.submitted_at
            ),
          };
        });

      setFeedbackData(mappedFeedback);
    } catch (error) {
      console.error(
        'Organizer feedback error:',
        error
      );

      setFeedbackData([]);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load feedback.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Reload whenever the Organizer Feedback
   * screen becomes active.
   */

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
    }, [loadFeedback])
  );

  const refreshFeedback = () => {
    setRefreshing(true);
    loadFeedback();
  };

  /*
   * REAL STATISTICS
   */

  const averageRating =
    feedbackData.length > 0
      ? feedbackData.reduce(
          (sum, item) =>
            sum + item.rating,
          0
        ) / feedbackData.length
      : 0;

  const fiveStarCount =
    feedbackData.filter(
      (item) => item.rating === 5
    ).length;

  const anonymousCount =
    feedbackData.filter(
      (item) => item.anonymous
    ).length;

  /*
   * SEARCH + FILTER
   */

  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      let matchesRating = true;

      if (activeFilter !== 'All') {
        const selectedRating = Number(
          activeFilter.charAt(0)
        );

        matchesRating =
          item.rating === selectedRating;
      }

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return matchesRating;
      }

      const matchesSearch =
        item.event
          .toLowerCase()
          .includes(query) ||
        item.comment
          .toLowerCase()
          .includes(query) ||
        (!item.anonymous &&
          item.student
            .toLowerCase()
            .includes(query));

      return (
        matchesRating &&
        matchesSearch
      );
    });
  }, [
    feedbackData,
    activeFilter,
    search,
  ]);

  /*
   * RATING DISTRIBUTION
   */

  const getRatingCount = (
    rating: number
  ) => {
    return feedbackData.filter(
      (item) =>
        item.rating === rating
    ).length;
  };

  const getRatingPercentage = (
    rating: number
  ) => {
    if (feedbackData.length === 0) {
      return 0;
    }

    return (
      (getRatingCount(rating) /
        feedbackData.length) *
      100
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
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

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFeedback}
            tintColor={colors.yellowDark}
          />
        }
      >
        {/* =========================================
            HEADER
        ========================================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              ORGANIZER SPACE
            </Text>

            <Text style={styles.title}>
              Feedback
            </Text>

            <Text style={styles.subtitle}>
              See what students thought about
              your events.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={colors.navy}
            />
          </View>
        </View>

        {/* =========================================
            ERROR
        ========================================= */}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.danger}
            />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn't load feedback
              </Text>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>

            <Pressable
              onPress={loadFeedback}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* =========================================
            OVERVIEW
        ========================================= */}

        <View style={styles.overviewCard}>
          <View style={styles.overviewMain}>
            <Text style={styles.overviewLabel}>
              AVERAGE RATING
            </Text>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : '—'}
              </Text>

              <View>
                {renderStars(
                  Math.round(
                    averageRating
                  )
                )}
              </View>
            </View>

            <Text
              style={styles.overviewSubtext}
            >
              Based on{' '}
              {feedbackData.length}{' '}
              response
              {feedbackData.length === 1
                ? ''
                : 's'}
            </Text>
          </View>

          <View style={styles.ratingDivider} />

          <View style={styles.overviewSide}>
            <Text style={styles.miniNumber}>
              {fiveStarCount}
            </Text>

            <Text style={styles.miniLabel}>
              5 star
            </Text>

            <View style={styles.miniDivider} />

            <Text style={styles.miniNumber}>
              {anonymousCount}
            </Text>

            <Text style={styles.miniLabel}>
              anonymous
            </Text>
          </View>
        </View>

        {/* =========================================
            RATING DISTRIBUTION
        ========================================= */}

        <View style={styles.distributionCard}>
          <Text style={styles.cardTitle}>
            Rating overview
          </Text>

          {[5, 4, 3, 2, 1].map(
            (rating) => {
              const count =
                getRatingCount(
                  rating
                );

              const percentage =
                getRatingPercentage(
                  rating
                );

              return (
                <View
                  key={rating}
                  style={
                    styles.distributionRow
                  }
                >
                  <View
                    style={
                      styles.ratingLabelContainer
                    }
                  >
                    <Text
                      style={
                        styles.ratingLabelText
                      }
                    >
                      {rating}
                    </Text>

                    <Ionicons
                      name="star"
                      size={12}
                      color={colors.yellow}
                    />
                  </View>

                  <View
                    style={
                      styles.progressBackground
                    }
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

                  <Text
                    style={styles.countText}
                  >
                    {count}
                  </Text>
                </View>
              );
            }
          )}
        </View>

        {/* =========================================
            SEARCH
        ========================================= */}

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.textMuted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search feedback..."
            placeholderTextColor={
              colors.textMuted
            }
            style={styles.searchInput}
          />
        </View>

        {/* =========================================
            FILTERS
        ========================================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.filters
          }
        >
          {filters.map((filter) => {
            const active =
              activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() =>
                  setActiveFilter(
                    filter
                  )
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* =========================================
            FEEDBACK LIST
        ========================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={styles.sectionTitle}
            >
              Student feedback
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {filteredFeedback.length}{' '}
              response
              {filteredFeedback.length === 1
                ? ''
                : 's'}
            </Text>
          </View>
        </View>

        {filteredFeedback.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  feedbackData.length ===
                  0
                    ? 'chatbubble-outline'
                    : 'search-outline'
                }
                size={35}
                color={
                  colors.textMuted
                }
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              {feedbackData.length ===
              0
                ? 'No feedback yet'
                : 'No feedback found'}
            </Text>

            <Text
              style={styles.emptyText}
            >
              {feedbackData.length ===
              0
                ? 'Student feedback for your completed events will appear here.'
                : 'Try changing the search or rating filter.'}
            </Text>
          </View>
        ) : (
          filteredFeedback.map(
            (item) => (
              <View
                key={item.id}
                style={
                  styles.feedbackCard
                }
              >
                {/* Event + rating */}

                <View
                  style={
                    styles.feedbackTop
                  }
                >
                  <View
                    style={
                      styles.eventIcon
                    }
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={colors.navy}
                    />
                  </View>

                  <View
                    style={
                      styles.eventInfo
                    }
                  >
                    <Text
                      style={
                        styles.eventName
                      }
                      numberOfLines={2}
                    >
                      {item.event}
                    </Text>

                    <Text
                      style={
                        styles.feedbackDate
                      }
                    >
                      {item.date}
                    </Text>
                  </View>

                  {renderStars(
                    item.rating
                  )}
                </View>

                {/* Comment */}

                <View
                  style={
                    styles.commentBox
                  }
                >
                  <Text
                    style={
                      styles.commentText
                    }
                  >
                    “{item.comment}”
                  </Text>
                </View>

                {/* Student identity */}

                <View
                  style={
                    styles.feedbackBottom
                  }
                >
                  <View
                    style={
                      styles.studentInfo
                    }
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Ionicons
                        name={
                          item.anonymous
                            ? 'eye-off-outline'
                            : 'person-outline'
                        }
                        size={16}
                        color={
                          colors.navy
                        }
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          styles.studentName
                        }
                      >
                        {item.student}
                      </Text>

                      <Text
                        style={
                          styles.identityText
                        }
                      >
                        {item.anonymous
                          ? 'Identity hidden from organizer'
                          : 'Identified response'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.identityBadge,
                      item.anonymous
                        ? styles.anonymousBadge
                        : styles.identifiedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.identityBadgeText,
                        item.anonymous
                          ? styles.anonymousText
                          : styles.identifiedText,
                      ]}
                    >
                      {item.anonymous
                        ? 'Anonymous'
                        : 'Identified'}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )
        )}

        {/* =========================================
            PRIVACY NOTE
        ========================================= */}

        <View
          style={styles.privacyNote}
        >
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color={colors.navy}
          />

          <View
            style={
              styles.privacyTextContainer
            }
          >
            <Text
              style={styles.privacyTitle}
            >
              Student privacy
            </Text>

            <Text
              style={styles.privacyText}
            >
              Anonymous feedback does not
              reveal the student's identity
              to organizers. Identified
              feedback may show the student's
              name.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   STAR DISPLAY
========================================================= */

function renderStars(rating: number) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <Ionicons
            key={star}
            name={
              star <= rating
                ? 'star'
                : 'star-outline'
            }
            size={15}
            color={
              star <= rating
                ? colors.yellow
                : colors.textMuted
            }
          />
        )
      )}
    </View>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
) {
  if (!value) {
    return 'Date unavailable';
  }

  return new Date(
    value
  ).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
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
    paddingTop: 25,
    paddingBottom: 100,
  },

  loadingContainer: {
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
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorCard: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3CACA',
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorContent: {
    flex: 1,
    marginLeft: 9,
    marginRight: 7,
  },

  errorTitle: {
    color: colors.danger,
    fontSize: 11.5,
    fontWeight: '800',
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  retryButton: {
    backgroundColor: colors.white,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  retryText: {
    color: colors.navy,
    fontSize: 9.5,
    fontWeight: '800',
  },

  overviewCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 14,
  },

  overviewMain: {
    flex: 1,
  },

  overviewLabel: {
    color: '#BFC6D4',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  ratingNumber: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    marginRight: 9,
  },

  overviewSubtext: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 5,
  },

  ratingDivider: {
    width: 1,
    backgroundColor: '#33415C',
    marginHorizontal: 14,
  },

  overviewSide: {
    width: 63,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniNumber: {
    color: colors.yellow,
    fontSize: 20,
    fontWeight: '800',
  },

  miniLabel: {
    color: '#AAB2C2',
    fontSize: 9,
    marginTop: 1,
  },

  miniDivider: {
    width: 35,
    height: 1,
    backgroundColor: '#33415C',
    marginVertical: 8,
  },

  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  distributionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTitle: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },

  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  ratingLabelContainer: {
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  ratingLabelText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  progressBackground: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#ECE9E1',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.yellow,
  },

  countText: {
    width: 25,
    textAlign: 'right',
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },

  searchBox: {
    height: 49,
    backgroundColor: colors.cream,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    color: colors.navy,
    fontSize: 12,
    marginLeft: 8,
  },

  filters: {
    gap: 8,
    paddingBottom: 19,
  },

  filterButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  filterButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  filterTextActive: {
    color: colors.white,
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },

  feedbackTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  eventInfo: {
    flex: 1,
    paddingRight: 7,
  },

  eventName: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
    lineHeight: 17,
  },

  feedbackDate: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  commentBox: {
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  commentText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    fontStyle: 'italic',
  },

  feedbackBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 7,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDEFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  studentName: {
    color: colors.navy,
    fontSize: 10.5,
    fontWeight: '700',
  },

  identityText: {
    color: colors.textMuted,
    fontSize: 8.5,
    marginTop: 2,
  },

  identityBadge: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  anonymousBadge: {
    backgroundColor: '#F0F1F4',
  },

  identifiedBadge: {
    backgroundColor: '#EAF5EE',
  },

  identityBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },

  anonymousText: {
    color: colors.textSecondary,
  },

  identifiedText: {
    color: colors.success,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 19,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 11,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
  },

  privacyNote: {
    backgroundColor: '#EEF1F6',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    marginTop: 5,
  },

  privacyTextContainer: {
    flex: 1,
    marginLeft: 9,
  },

  privacyTitle: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },

  privacyText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 15,
  },
});