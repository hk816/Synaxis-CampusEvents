import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type NotificationType =
  | 'approval'
  | 'registration'
  | 'waitlist'
  | 'update'
  | 'feedback';

type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'approval',
    title: 'Event approved',
    message:
      'Campus Innovation Summit has been approved and is now visible to students.',
    time: '15 min ago',
    unread: true,
  },
  {
    id: 2,
    type: 'registration',
    title: 'New registration',
    message:
      'A student registered for Campus Innovation Summit.',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: 3,
    type: 'waitlist',
    title: 'Waitlist update',
    message:
      'A student has been added to the waitlist for Coding Club Hack Night.',
    time: '3 hours ago',
    unread: true,
  },
  {
    id: 4,
    type: 'update',
    title: 'Event update',
    message:
      'The venue information for Campus Innovation Summit was updated.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 5,
    type: 'feedback',
    title: 'New feedback received',
    message:
      'Students have submitted new feedback for Coding Club Hack Night.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 6,
    type: 'approval',
    title: 'Resource approved',
    message:
      'The Auditorium resource request for Campus Innovation Summit was approved.',
    time: '2 days ago',
    unread: false,
  },
];

export default function OrganizerNotifications() {
  const [notifications, setNotifications] = useState(
    initialNotifications
  );

  const unreadCount = notifications.filter(
    (item) => item.unread
  ).length;

  const markAsRead = (id: number) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        unread: false,
      }))
    );
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'approval':
        return 'checkmark-circle-outline';
      case 'registration':
        return 'person-add-outline';
      case 'waitlist':
        return 'people-outline';
      case 'update':
        return 'calendar-outline';
      case 'feedback':
        return 'star-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconBackground = (type: NotificationType) => {
    switch (type) {
      case 'approval':
        return '#EAF5EE';
      case 'registration':
        return '#EEF1F6';
      case 'waitlist':
        return '#FFF5DD';
      case 'update':
        return '#EEF1F6';
      case 'feedback':
        return '#FFF5DD';
      default:
        return '#EEF1F6';
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case 'approval':
        return colors.success;
      case 'registration':
        return colors.navy;
      case 'waitlist':
        return colors.warning;
      case 'update':
        return colors.navy;
      case 'feedback':
        return colors.yellowDark;
      default:
        return colors.navy;
    }
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

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ORGANIZER SPACE</Text>
            <Text style={styles.title}>Notifications</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.navy}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryEyebrow}>
              NOTIFICATION CENTER
            </Text>

            <Text style={styles.summaryTitle}>
              Stay up to date
            </Text>

            <Text style={styles.summaryText}>
              Updates about your events, registrations and feedback.
            </Text>
          </View>

          <View style={styles.unreadCircle}>
            <Text style={styles.unreadNumber}>{unreadCount}</Text>
            <Text style={styles.unreadLabel}>unread</Text>
          </View>
        </View>

        {/* Mark all */}
        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={17}
              color={colors.navy}
            />
            <Text style={styles.markAllText}>
              Mark all as read
            </Text>
          </Pressable>
        )}

        {/* Notification list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.sectionCount}>
            {notifications.length}
          </Text>
        </View>

        {notifications.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => markAsRead(notification.id)}
            style={[
              styles.notificationCard,
              notification.unread && styles.unreadCard,
            ]}
          >
            <View
              style={[
                styles.notificationIcon,
                {
                  backgroundColor: getIconBackground(
                    notification.type
                  ),
                },
              ]}
            >
              <Ionicons
                name={getIcon(notification.type)}
                size={20}
                color={getIconColor(notification.type)}
              />
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.notificationTitleRow}>
                <Text
                  style={[
                    styles.notificationTitle,
                    notification.unread &&
                      styles.unreadTitle,
                  ]}
                >
                  {notification.title}
                </Text>

                {notification.unread && (
                  <View style={styles.unreadDot} />
                )}
              </View>

              <Text style={styles.notificationMessage}>
                {notification.message}
              </Text>

              <Text style={styles.notificationTime}>
                {notification.time}
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Empty-state style footer / info */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.yellowDark}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              What you'll receive here
            </Text>

            <Text style={styles.infoText}>
              Event approvals, registration activity, waitlist
              updates, event changes, resource approvals and
              student feedback notifications.
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
    paddingTop: 55,
    paddingBottom: 45,
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

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  summaryEyebrow: {
    color: '#BFC6D4',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },

  summaryText: {
    color: '#AAB2C2',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    maxWidth: 220,
  },

  unreadCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  unreadNumber: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: '800',
  },

  unreadLabel: {
    color: colors.navy,
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: -1,
  },

  markAllButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 3,
    marginBottom: 10,
  },

  markAllText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
  },

  sectionCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 7,
  },

  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },

  unreadCard: {
    borderColor: '#D9D5C9',
    backgroundColor: '#FFFDF7',
  },

  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },

  unreadTitle: {
    fontWeight: '800',
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    marginLeft: 7,
  },

  notificationMessage: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 5,
  },

  notificationTime: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 7,
  },

  infoCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    marginTop: 7,
    borderWidth: 1,
    borderColor: '#F0D99B',
  },

  infoIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },

  infoText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
});