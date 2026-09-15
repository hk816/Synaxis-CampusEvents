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

const pendingEvents = [
  {
    title: 'Annual Music Night',
    organizer: 'Cultural Committee',
    submitted: '2 hours ago',
  },
  {
    title: 'Photography Workshop',
    organizer: 'Photography Club',
    submitted: 'Yesterday',
  },
  {
    title: 'Startup Pitch Day',
    organizer: 'E-Cell',
    submitted: '2 days ago',
  },
];

export default function AdminHome() {
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
            <Text style={styles.title}>Command Center</Text>
            <Text style={styles.subtitle}>
              Manage the campus events platform.
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => {}}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {/* Main overview card */}
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
            Review users, approve events, and monitor activity
            across Campus Events.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>286</Text>
              <Text style={styles.heroLabel}>Students</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>24</Text>
              <Text style={styles.heroLabel}>Organizers</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroNumber}>42</Text>
              <Text style={styles.heroLabel}>Events</Text>
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <Text style={styles.sectionTitle}>Platform overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="people-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>310</Text>
            <Text style={styles.statLabel}>Total users</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.navy}
              />
            </View>

            <Text style={styles.statNumber}>5</Text>
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

            <Text style={styles.statNumber}>17</Text>
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

            <Text style={styles.statNumber}>4.6</Text>
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
            onPress={() => router.push('/event-approvals')}
          >
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>

        {pendingEvents.map((event) => (
          <View
            key={event.title}
            style={styles.approvalCard}
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
                {event.organizer}
              </Text>

              <Text style={styles.approvalTime}>
                Submitted {event.submitted}
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>
                Pending
              </Text>
            </View>
          </View>
        ))}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.actionsCard}>
          <AdminAction
            icon="people-outline"
            title="Manage users"
            subtitle="View students and organizers"
            onPress={() => router.push('/users')}
          />

          <View style={styles.divider} />

          <AdminAction
            icon="checkmark-circle-outline"
            title="Review events"
            subtitle="Approve or reject submissions"
            onPress={() => router.push('/event-approvals')}
          />

          <View style={styles.divider} />

          <AdminAction
            icon="bar-chart-outline"
            title="View analytics"
            subtitle="Monitor platform performance"
            onPress={() => router.push('/analytics')}
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
              Admins have platform-wide visibility and control.
              Students and organizers can only access the areas
              permitted for their role.
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
        <Text style={styles.actionTitle}>{title}</Text>
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