import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type Feedback = {
  id: number;
  event: string;
  rating: number;
  comment: string;
  student: string;
  anonymous: boolean;
  date: string;
};

const feedbackData: Feedback[] = [
  {
    id: 1,
    event: 'Campus Innovation Summit',
    rating: 5,
    comment:
      'The sessions were very informative and the overall organization was excellent.',
    student: 'Aarav Mehta',
    anonymous: false,
    date: 'Sep 10, 2026',
  },
  {
    id: 2,
    event: 'Campus Innovation Summit',
    rating: 4,
    comment:
      'Good event with interesting speakers. The networking session could have been longer.',
    student: 'Anonymous Student',
    anonymous: true,
    date: 'Sep 10, 2026',
  },
  {
    id: 3,
    event: 'Coding Club Hack Night',
    rating: 5,
    comment:
      'Really enjoyed the challenge format. Everything we needed was available.',
    student: 'Diya Reddy',
    anonymous: false,
    date: 'Sep 8, 2026',
  },
  {
    id: 4,
    event: 'Coding Club Hack Night',
    rating: 4,
    comment:
      'Fun experience and a great opportunity to work with other students.',
    student: 'Anonymous Student',
    anonymous: true,
    date: 'Sep 8, 2026',
  },
  {
    id: 5,
    event: 'Photography Workshop',
    rating: 3,
    comment:
      'The workshop was useful, but I would have liked more practical activities.',
    student: 'Rohan Kumar',
    anonymous: false,
    date: 'Sep 6, 2026',
  },
];

const filters = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

export default function OrganizerFeedback() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const averageRating =
    feedbackData.reduce((sum, item) => sum + item.rating, 0) /
    feedbackData.length;

  const fiveStarCount = feedbackData.filter(
    (item) => item.rating === 5
  ).length;

  const fourStarCount = feedbackData.filter(
    (item) => item.rating === 4
  ).length;

  const anonymousCount = feedbackData.filter(
    (item) => item.anonymous
  ).length;

  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      let matchesFilter = true;

      if (activeFilter !== 'All') {
        const rating = Number(activeFilter.charAt(0));
        matchesFilter = item.rating === rating;
      }

      const query = search.toLowerCase();

      const matchesSearch =
        item.event.toLowerCase().includes(query) ||
        item.comment.toLowerCase().includes(query) ||
        item.student.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={15}
            color={colors.yellow}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ORGANIZER SPACE</Text>
            <Text style={styles.title}>Feedback</Text>
            <Text style={styles.subtitle}>
              See what students thought about your events.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={23}
              color={colors.navy}
            />
          </View>
        </View>

        {/* Overview card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewMain}>
            <Text style={styles.overviewLabel}>AVERAGE RATING</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>
                {averageRating.toFixed(1)}
              </Text>

              <View style={styles.ratingStars}>
                {renderStars(Math.round(averageRating))}
              </View>
            </View>

            <Text style={styles.overviewSubtext}>
              Based on {feedbackData.length} student responses
            </Text>
          </View>

          <View style={styles.ratingDivider} />

          <View style={styles.overviewSide}>
            <Text style={styles.miniNumber}>{fiveStarCount}</Text>
            <Text style={styles.miniLabel}>5 star</Text>

            <View style={styles.miniDivider} />

            <Text style={styles.miniNumber}>{anonymousCount}</Text>
            <Text style={styles.miniLabel}>anonymous</Text>
          </View>
        </View>

        {/* Rating distribution */}
        <View style={styles.distributionCard}>
          <Text style={styles.cardTitle}>Rating overview</Text>

          {[5, 4, 3, 2, 1].map((rating) => {
            const count = feedbackData.filter(
              (item) => item.rating === rating
            ).length;

            const percentage =
              feedbackData.length > 0
                ? (count / feedbackData.length) * 100
                : 0;

            return (
              <View key={rating} style={styles.distributionRow}>
                <View style={styles.ratingLabel}>
                  <Text style={styles.ratingLabelText}>{rating}</Text>
                  <Ionicons
                    name="star"
                    size={12}
                    color={colors.yellow}
                  />
                </View>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>

                <Text style={styles.countText}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search feedback..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section heading */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Student feedback</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredFeedback.length} response
              {filteredFeedback.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* Feedback cards */}
        {filteredFeedback.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="chatbubble-outline"
              size={38}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No feedback found</Text>
            <Text style={styles.emptyText}>
              Try changing the search or rating filter.
            </Text>
          </View>
        ) : (
          filteredFeedback.map((item) => (
            <View key={item.id} style={styles.feedbackCard}>
              {/* Card top */}
              <View style={styles.feedbackTop}>
                <View style={styles.eventIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={colors.navy}
                  />
                </View>

                <View style={styles.eventInfo}>
                  <Text style={styles.eventName} numberOfLines={1}>
                    {item.event}
                  </Text>

                  <Text style={styles.feedbackDate}>{item.date}</Text>
                </View>

                {renderStars(item.rating)}
              </View>

              {/* Comment */}
              <View style={styles.commentBox}>
                <Text style={styles.commentText}>
                  “{item.comment}”
                </Text>
              </View>

              {/* Student */}
              <View style={styles.feedbackBottom}>
                <View style={styles.studentInfo}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name={
                        item.anonymous
                          ? 'eye-off-outline'
                          : 'person-outline'
                      }
                      size={16}
                      color={colors.navy}
                    />
                  </View>

                  <View>
                    <Text style={styles.studentName}>
                      {item.student}
                    </Text>

                    <Text style={styles.identityText}>
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
                    {item.anonymous ? 'Anonymous' : 'Identified'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color={colors.navy}
          />

          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>Student privacy</Text>
            <Text style={styles.privacyText}>
              Anonymous feedback does not reveal the student's identity to
              organizers. Identified feedback may show the student's name.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: colors.navy,
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
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
    marginRight: 10,
  },

  ratingStars: {
    marginTop: 4,
  },

  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  overviewSubtext: {
    color: '#AAB2C2',
    fontSize: 10.5,
    marginTop: 4,
  },

  ratingDivider: {
    width: 1,
    backgroundColor: '#33415C',
    marginHorizontal: 16,
  },

  overviewSide: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniNumber: {
    color: colors.yellow,
    fontSize: 21,
    fontWeight: '800',
  },

  miniLabel: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 1,
  },

  miniDivider: {
    width: 38,
    height: 1,
    backgroundColor: '#33415C',
    marginVertical: 9,
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
    marginBottom: 13,
  },

  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  ratingLabel: {
    width: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  ratingLabelText: {
    color: colors.textSecondary,
    fontSize: 11,
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
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 13,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 9,
  },

  filters: {
    gap: 8,
    paddingBottom: 20,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  filterTextActive: {
    color: colors.white,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },

  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
    paddingRight: 6,
  },

  eventName: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  feedbackDate: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  commentBox: {
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    padding: 12,
    marginTop: 13,
  },

  commentText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  feedbackBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
  },

  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 11.5,
    fontWeight: '700',
  },

  identityText: {
    color: colors.textMuted,
    fontSize: 9.5,
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
    fontSize: 9,
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
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
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
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  privacyText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
});