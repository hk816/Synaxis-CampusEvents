import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const eventStats = [
  {
    name: 'Campus Innovation Summit',
    participants: 58,
    capacity: 100,
    rating: 4.8,
  },
  {
    name: 'Coding Club Hack Night',
    participants: 34,
    capacity: 50,
    rating: 4.6,
  },
  {
    name: 'Photography Workshop',
    participants: 24,
    capacity: 30,
    rating: 4.4,
  },
];

export default function OrganizerAnalytics() {
  const totalParticipants = eventStats.reduce(
    (sum, event) => sum + event.participants,
    0
  );

  const averageRating =
    eventStats.reduce((sum, event) => sum + event.rating, 0) /
    eventStats.length;

  const totalCapacity = eventStats.reduce(
    (sum, event) => sum + event.capacity,
    0
  );

  const registrationRate =
    (totalParticipants / totalCapacity) * 100;

  return (
    <View style={styles.screen}>
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

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ORGANIZER SPACE</Text>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>
              Performance of your events.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="bar-chart-outline"
              size={23}
              color={colors.navy}
            />
          </View>
        </View>

        {/* Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewEyebrow}>EVENT PERFORMANCE</Text>

          <Text style={styles.overviewTitle}>
            Your events at a glance
          </Text>

          <Text style={styles.overviewDescription}>
            Track registrations, capacity usage, and student ratings
            across your events.
          </Text>

          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>
                {totalParticipants}
              </Text>
              <Text style={styles.overviewLabel}>
                Participants
              </Text>
            </View>

            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={styles.overviewLabel}>
                Avg. Rating
              </Text>
            </View>

            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>
                {Math.round(registrationRate)}%
              </Text>
              <Text style={styles.overviewLabel}>
                Capacity Used
              </Text>
            </View>
          </View>
        </View>

        {/* Key metrics */}
        <Text style={styles.sectionTitle}>Key metrics</Text>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.metricNumber}>8</Text>
            <Text style={styles.metricLabel}>Total events</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="people-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.metricNumber}>142</Text>
            <Text style={styles.metricLabel}>Total registrations</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="star-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.metricNumber}>
              {averageRating.toFixed(1)}
            </Text>
            <Text style={styles.metricLabel}>Average rating</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.metricNumber}>3</Text>
            <Text style={styles.metricLabel}>Upcoming events</Text>
          </View>
        </View>

        {/* Event performance */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Event performance
            </Text>
            <Text style={styles.sectionSubtitle}>
              Registration and feedback overview
            </Text>
          </View>
        </View>

        {eventStats.map((event) => {
          const percentage =
            (event.participants / event.capacity) * 100;

          return (
            <View key={event.name} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={colors.navy}
                  />
                </View>

                <View style={styles.eventInfo}>
                  <Text
                    style={styles.eventName}
                    numberOfLines={1}
                  >
                    {event.name}
                  </Text>

                  <Text style={styles.eventParticipants}>
                    {event.participants} of {event.capacity}{' '}
                    registered
                  </Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Ionicons
                    name="star"
                    size={12}
                    color={colors.yellowDark}
                  />
                  <Text style={styles.ratingText}>
                    {event.rating}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressRow}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(percentage, 100)}%` },
                    ]}
                  />
                </View>

                <Text style={styles.progressText}>
                  {Math.round(percentage)}%
                </Text>
              </View>
            </View>
          );
        })}

        {/* Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <View style={styles.insightsIcon}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.insightsTitle}>
              Quick insight
            </Text>
          </View>

          <Text style={styles.insightsText}>
            Your events are currently averaging{' '}
            <Text style={styles.boldText}>
              {averageRating.toFixed(1)} stars
            </Text>
            . Keep monitoring registrations and student feedback
            to improve future events.
          </Text>
        </View>

        {/* Scope note */}
        <View style={styles.scopeNote}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={colors.navy}
          />

          <Text style={styles.scopeText}>
            These analytics are limited to events managed by you.
            Platform-wide analytics are available to Admins.
          </Text>
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
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerText: {
    flex: 1,
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
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overviewCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 19,
    marginBottom: 22,
  },

  overviewEyebrow: {
    color: '#BFC6D4',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  overviewTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  overviewDescription: {
    color: '#AAB2C2',
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 6,
  },

  overviewStats: {
    flexDirection: 'row',
    marginTop: 19,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#33415C',
  },

  overviewStat: {
    flex: 1,
  },

  overviewNumber: {
    color: colors.yellow,
    fontSize: 22,
    fontWeight: '800',
  },

  overviewLabel: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 2,
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

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 23,
  },

  metricCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  metricNumber: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '800',
  },

  metricLabel: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 2,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },

  eventHeader: {
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
    fontSize: 13,
    fontWeight: '800',
  },

  eventParticipants: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5DD',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  ratingText: {
    color: colors.yellowDark,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 3,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
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

  progressText: {
    width: 35,
    textAlign: 'right',
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  insightsCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0D99B',
  },

  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  insightsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  insightsTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '800',
  },

  insightsText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 18,
  },

  boldText: {
    color: colors.navy,
    fontWeight: '800',
  },

  scopeNote: {
    flexDirection: 'row',
    backgroundColor: '#EEF1F6',
    borderRadius: 15,
    padding: 13,
    marginTop: 12,
  },

  scopeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
    marginLeft: 8,
  },
});