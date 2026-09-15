import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const eventPerformance = [
  {
    title: 'Campus Innovation Summit',
    participants: 58,
    capacity: 100,
    rating: 4.8,
  },
  {
    title: 'Coding Club Hack Night',
    participants: 34,
    capacity: 50,
    rating: 4.6,
  },
  {
    title: 'Annual Music Night',
    participants: 0,
    capacity: 300,
    rating: 0,
  },
  {
    title: 'Photography Workshop',
    participants: 0,
    capacity: 50,
    rating: 0,
  },
];

const monthlyData = [
  { month: 'May', events: 8, registrations: 86 },
  { month: 'Jun', events: 11, registrations: 124 },
  { month: 'Jul', events: 9, registrations: 108 },
  { month: 'Aug', events: 14, registrations: 156 },
  { month: 'Sep', events: 17, registrations: 192 },
];

export default function AdminAnalytics() {
  const maxRegistrations = Math.max(
    ...monthlyData.map((item) => item.registrations)
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMIN SPACE</Text>

            <Text style={styles.title}>
              Analytics
            </Text>

            <Text style={styles.subtitle}>
              A platform-wide view of Campus Events.
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

        {/* Main metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="calendar-outline"
            value="42"
            label="Total Events"
            note="+12% this month"
          />

          <MetricCard
            icon="people-outline"
            value="310"
            label="Total Users"
            note="+18% this month"
          />

          <MetricCard
            icon="person-add-outline"
            value="192"
            label="Registrations"
            note="This month"
          />

          <MetricCard
            icon="star-outline"
            value="4.6"
            label="Avg. Rating"
            note="Across events"
          />
        </View>

        {/* Platform overview */}
        <SectionTitle
          title="Platform overview"
          subtitle="Current activity across the platform"
        />

        <View style={styles.overviewCard}>
          <OverviewRow
            icon="people-outline"
            label="Students"
            value="286"
            detail="92% of users"
          />

          <OverviewRow
            icon="briefcase-outline"
            label="Organizers"
            value="24"
            detail="8% of users"
          />

          <OverviewRow
            icon="time-outline"
            label="Upcoming events"
            value="17"
            detail="Currently approved"
          />

          <OverviewRow
            icon="hourglass-outline"
            label="Pending approvals"
            value="5"
            detail="Need review"
            highlight
          />
        </View>

        {/* Registration trend */}
        <SectionTitle
          title="Registration trend"
          subtitle="Monthly platform registrations"
        />

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartNumber}>
                192
              </Text>

              <Text style={styles.chartLabel}>
                registrations in September
              </Text>
            </View>

            <View style={styles.growthBadge}>
              <Ionicons
                name="trending-up-outline"
                size={14}
                color={colors.success}
              />

              <Text style={styles.growthText}>
                +23%
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {monthlyData.map((item) => {
              const height =
                (item.registrations / maxRegistrations) * 125;

              return (
                <View
                  key={item.month}
                  style={styles.barColumn}
                >
                  <View style={styles.barArea}>
                    <View
                      style={[
                        styles.bar,
                        { height },
                      ]}
                    />
                  </View>

                  <Text style={styles.barValue}>
                    {item.registrations}
                  </Text>

                  <Text style={styles.month}>
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Event performance */}
        <SectionTitle
          title="Event performance"
          subtitle="Participation and feedback across events"
        />

        {eventPerformance.map((event) => {
          const percentage =
            event.capacity > 0
              ? Math.round(
                  (event.participants / event.capacity) * 100
                )
              : 0;

          return (
            <View
              key={event.title}
              style={styles.performanceCard}
            >
              <View style={styles.performanceTop}>
                <View style={styles.performanceIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={colors.navy}
                  />
                </View>

                <View style={styles.performanceTitle}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>

                  <Text style={styles.participantText}>
                    {event.participants} / {event.capacity}{' '}
                    participants
                  </Text>
                </View>

                {event.rating > 0 ? (
                  <View style={styles.rating}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={colors.yellowDark}
                    />

                    <Text style={styles.ratingText}>
                      {event.rating.toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.notRated}>
                    Upcoming
                  </Text>
                )}
              </View>

              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        percentage,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.capacityText}>
                {percentage}% capacity
              </Text>
            </View>
          );
        })}

        {/* Insights */}
        <SectionTitle
          title="Platform insights"
          subtitle="Useful signals from current activity"
        />

        <View style={styles.insightCard}>
          <InsightRow
            icon="trending-up-outline"
            title="Participation is growing"
            text="Registrations have increased consistently over the last few months."
          />

          <InsightRow
            icon="star-outline"
            title="Strong event satisfaction"
            text="The platform currently maintains an average rating of 4.6 out of 5."
          />

          <InsightRow
            icon="time-outline"
            title="Reviews need attention"
            text="There are currently pending event submissions waiting for Admin review."
          />
        </View>

        {/* Admin note */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={colors.navy}
            />
          </View>

          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              Admin analytics
            </Text>

            <Text style={styles.noteText}>
              These metrics represent platform-level activity.
              Organizers only receive analytics for their own
              events.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({
  icon,
  value,
  label,
  note,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  note: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.navy}
        />
      </View>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricNote}>
        {note}
      </Text>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function OverviewRow({
  icon,
  label,
  value,
  detail,
  highlight = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.overviewRow}>
      <View style={styles.overviewLeft}>
        <View style={styles.overviewIcon}>
          <Ionicons
            name={icon}
            size={17}
            color={colors.navy}
          />
        </View>

        <Text style={styles.overviewLabel}>
          {label}
        </Text>
      </View>

      <View style={styles.overviewRight}>
        <Text
          style={[
            styles.overviewValue,
            highlight && {
              color: colors.warning,
            },
          ]}
        >
          {value}
        </Text>

        <Text style={styles.overviewDetail}>
          {detail}
        </Text>
      </View>
    </View>
  );
}

function InsightRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.navy}
        />
      </View>

      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>
          {title}
        </Text>

        <Text style={styles.insightText}>
          {text}
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
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
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
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

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },

  metricCard: {
    width: '48.3%',
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  metricValue: {
    color: colors.navy,
    fontSize: 23,
    fontWeight: '800',
  },

  metricLabel: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },

  metricNote: {
    color: colors.textMuted,
    fontSize: 8.5,
    marginTop: 4,
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
    fontSize: 10.5,
    marginTop: 3,
  },

  overviewCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 25,
  },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  overviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  overviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  overviewLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  overviewRight: {
    alignItems: 'flex-end',
  },

  overviewValue: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '800',
  },

  overviewDetail: {
    color: colors.textMuted,
    fontSize: 8.5,
    marginTop: 1,
  },

  chartCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 17,
    marginBottom: 25,
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  chartNumber: {
    color: colors.white,
    fontSize: 27,
    fontWeight: '800',
  },

  chartLabel: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 2,
  },

  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  growthText: {
    color: colors.success,
    fontSize: 9.5,
    fontWeight: '800',
    marginLeft: 3,
  },

  chart: {
    height: 180,
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },

  barColumn: {
    flex: 1,
    alignItems: 'center',
  },

  barArea: {
    height: 125,
    justifyContent: 'flex-end',
  },

  bar: {
    width: 24,
    borderRadius: 7,
    backgroundColor: colors.yellow,
  },

  barValue: {
    color: '#C8CED9',
    fontSize: 8,
    marginTop: 5,
  },

  month: {
    color: '#8993A7',
    fontSize: 9,
    marginTop: 4,
  },

  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  performanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  performanceIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  performanceTitle: {
    flex: 1,
  },

  eventTitle: {
    color: colors.navy,
    fontSize: 11.5,
    fontWeight: '800',
  },

  participantText: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5DD',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  ratingText: {
    color: colors.yellowDark,
    fontSize: 9.5,
    fontWeight: '800',
    marginLeft: 3,
  },

  notRated: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: '600',
  },

  progressBackground: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#E9E7E0',
    marginTop: 13,
  },

  progressFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.yellow,
  },

  capacityText: {
    color: colors.textMuted,
    fontSize: 8.5,
    marginTop: 5,
    textAlign: 'right',
  },

  insightCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },

  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },

  insightIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  insightContent: {
    flex: 1,
  },

  insightTitle: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },

  insightText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
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