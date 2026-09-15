import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EventCard from '@/components/event-card';
import { colors } from '@/theme/colors';

export default function OrganizerHomeScreen() {
  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.spaceLabel}>
              ORGANIZER SPACE
            </Text>

            <Text style={styles.greeting}>
              Good morning, Organizer
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            number="8"
            label="Total Events"
            icon="calendar-outline"
          />

          <StatCard
            number="3"
            label="Upcoming"
            icon="time-outline"
          />

          <StatCard
            number="142"
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

        {/* Pending approval */}
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
                1 Pending
              </Text>
            </View>
          </View>

          <View style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Ionicons
                name="hourglass-outline"
                size={21}
                color={colors.navy}
              />
            </View>

            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>
                Annual Music Night
              </Text>

              <Text style={styles.pendingText}>
                Submitted for admin review
              </Text>

              <Text style={styles.pendingDate}>
                Submitted September 10
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>
        </View>

        {/* Upcoming */}
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

          <EventCard
            title="Campus Innovation Summit"
            category="Technology"
            date="18"
            month="SEP"
            time="10:00 AM"
            location="Main Auditorium"
            status="upcoming"
          />

          <EventCard
            title="Coding Club Hack Night"
            category="Technology"
            date="22"
            month="SEP"
            time="6:30 PM"
            location="Computer Lab 2"
            status="upcoming"
          />
        </View>

        {/* Quick actions */}
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  spaceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.yellowDark,
    marginBottom: 5,
  },

  greeting: {
    fontSize: 23,
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

  seeAll: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
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