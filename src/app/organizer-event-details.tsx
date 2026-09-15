import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const event = {
  title: 'Campus Innovation Summit',
  category: 'Technology',
  status: 'Approved',
  date: 'September 18, 2026',
  time: '10:00 AM – 4:00 PM',
  location: 'Main Auditorium',
  description:
    'A campus-wide innovation event bringing students together to explore ideas, technology, entrepreneurship, and emerging solutions.',
  capacity: 100,
  registered: 58,
  waitlisted: 4,
};

const resources = [
  {
    name: 'Auditorium',
    person: 'Rahul Sharma',
    status: 'Approved',
  },
  {
    name: 'Projector & AV System',
    person: 'Priya Nair',
    status: 'Approved',
  },
  {
    name: 'Photography Equipment',
    person: 'Sneha Reddy',
    status: 'Pending',
  },
];

export default function OrganizerEventDetails() {
  const registrationPercentage =
    (event.registered / event.capacity) * 100;

  const handleEdit = () => {
    Alert.alert(
      'Edit Event',
      'Event editing will be connected to the backend later.'
    );
  };

  const handleUpdate = () => {
    Alert.alert(
      'Event Update',
      'Event updates will be sent to registered students once backend notifications are connected.'
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

          <Text style={styles.headerTitle}>Event Details</Text>

          <Pressable
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {/* Event Hero */}
        <View style={styles.heroCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {event.status}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <Text style={styles.eventDescription}>
            {event.description}
          </Text>
        </View>

        {/* Event Information */}
        <Text style={styles.sectionTitle}>Event information</Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label="Date"
            value={event.date}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="time-outline"
            label="Time"
            value={event.time}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="location-outline"
            label="Venue"
            value={event.location}
          />
        </View>

        {/* Registration Overview */}
        <Text style={styles.sectionTitle}>
          Registration overview
        </Text>

        <View style={styles.registrationCard}>
          <View style={styles.registrationTop}>
            <View>
              <Text style={styles.registrationLabel}>
                REGISTERED
              </Text>

              <View style={styles.registrationNumberRow}>
                <Text style={styles.registrationNumber}>
                  {event.registered}
                </Text>

                <Text style={styles.registrationCapacity}>
                  / {event.capacity}
                </Text>
              </View>
            </View>

            <View style={styles.registrationIcon}>
              <Ionicons
                name="people-outline"
                size={22}
                color={colors.navy}
              />
            </View>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    registrationPercentage,
                    100
                  )}%`,
                },
              ]}
            />
          </View>

          <View style={styles.registrationBottom}>
            <Text style={styles.registrationSubtext}>
              {Math.round(registrationPercentage)}% of capacity
            </Text>

            <Text style={styles.registrationSubtext}>
              {event.capacity - event.registered} spots left
            </Text>
          </View>

          <View style={styles.waitlistBox}>
            <Ionicons
              name="people-circle-outline"
              size={19}
              color={colors.warning}
            />

            <Text style={styles.waitlistText}>
              {event.waitlisted} student
              {event.waitlisted === 1 ? '' : 's'} currently on
              the waitlist.
            </Text>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Resources & approvals
            </Text>
            <Text style={styles.sectionSubtitle}>
              Resources associated with this event
            </Text>
          </View>

          <View style={styles.resourceCount}>
            <Text style={styles.resourceCountText}>
              {resources.length}
            </Text>
          </View>
        </View>

        {resources.map((resource) => (
          <View
            key={resource.name}
            style={styles.resourceCard}
          >
            <View style={styles.resourceIcon}>
              <Ionicons
                name="cube-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.resourceInfo}>
              <Text style={styles.resourceName}>
                {resource.name}
              </Text>

              <Text style={styles.resourcePerson}>
                Responsible: {resource.person}
              </Text>
            </View>

            <View
              style={[
                styles.resourceStatus,
                resource.status === 'Approved'
                  ? styles.approvedBackground
                  : styles.pendingBackground,
              ]}
            >
              <Text
                style={[
                  styles.resourceStatusText,
                  resource.status === 'Approved'
                    ? styles.approvedText
                    : styles.pendingText,
                ]}
              >
                {resource.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Management */}
        <Text style={styles.sectionTitle}>Event management</Text>

        <View style={styles.managementCard}>
          <Pressable
            style={styles.managementRow}
            onPress={handleEdit}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="create-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>
                Edit event
              </Text>

              <Text style={styles.managementSubtitle}>
                Update event information
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.managementRow}
            onPress={() => router.push('/participants')}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="people-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>
                View participants
              </Text>

              <Text style={styles.managementSubtitle}>
                See students registered for this event
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.managementRow}
            onPress={handleUpdate}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="megaphone-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>
                Send event update
              </Text>

              <Text style={styles.managementSubtitle}>
                Notify registered students about changes
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {/* Approval note */}
        <View style={styles.approvalNote}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={colors.success}
          />

          <View style={styles.approvalTextContainer}>
            <Text style={styles.approvalTitle}>
              Event approval status
            </Text>

            <Text style={styles.approvalText}>
              This event has been approved by Admin and is
              available to students.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={colors.navy}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
    paddingTop: 55,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerTitle: {
    flex: 1,
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginHorizontal: 10,
  },

  editButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 19,
    marginBottom: 23,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#30405E',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  categoryText: {
    color: colors.yellow,
    fontSize: 9.5,
    fontWeight: '800',
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 5,
  },

  statusText: {
    color: colors.success,
    fontSize: 9.5,
    fontWeight: '800',
  },

  eventTitle: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginTop: 14,
  },

  eventDescription: {
    color: '#B8C0CF',
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 8,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: -7,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginBottom: 3,
  },

  infoValue: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  registrationCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },

  registrationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  registrationLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  registrationNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },

  registrationNumber: {
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
  },

  registrationCapacity: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 3,
  },

  registrationIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBackground: {
    height: 8,
    borderRadius: 5,
    backgroundColor: '#ECE9E1',
    overflow: 'hidden',
    marginTop: 14,
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.yellow,
  },

  registrationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  registrationSubtext: {
    color: colors.textMuted,
    fontSize: 9.5,
  },

  waitlistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5DD',
    borderRadius: 11,
    padding: 10,
    marginTop: 13,
  },

  waitlistText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginLeft: 7,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resourceCount: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  resourceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },

  resourceIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  resourceInfo: {
    flex: 1,
  },

  resourceName: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  resourcePerson: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },

  resourceStatus: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  approvedBackground: {
    backgroundColor: '#EAF5EE',
  },

  pendingBackground: {
    backgroundColor: '#FFF5DD',
  },

  resourceStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  approvedText: {
    color: colors.success,
  },

  pendingText: {
    color: colors.warning,
  },

  managementCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  managementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },

  managementIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  managementContent: {
    flex: 1,
  },

  managementTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '700',
  },

  managementSubtitle: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },

  approvalNote: {
    flexDirection: 'row',
    backgroundColor: '#EDF7F0',
    borderRadius: 15,
    padding: 13,
    marginTop: 1,
  },

  approvalTextContainer: {
    flex: 1,
    marginLeft: 8,
  },

  approvalTitle: {
    color: colors.navy,
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  approvalText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
});