import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(
          `
          id,
          title,
          message,
          type,
          is_read,
          created_at
        `
        )
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) throw error;

      setNotifications(data ?? []);
    } catch (error) {
      console.error(
        'Load notifications error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const markAsRead = async (
    notification: NotificationItem
  ) => {
    if (notification.is_read) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Mark notification read error:',
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    } catch (error) {
      console.error(
        'Mark all notifications error:',
        error
      );
    }
  };

  const getIcon = (
    type: string
  ): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'registration':
        return 'checkmark-circle-outline';

      case 'waitlist':
        return 'time-outline';

      case 'event_approved':
        return 'checkmark-done-outline';

      case 'event_rejected':
        return 'close-circle-outline';

      case 'event_update':
        return 'calendar-outline';

      case 'feedback_required':
        return 'star-outline';

      case 'resource_update':
        return 'cube-outline';

      default:
        return 'notifications-outline';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diff =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      diff / (1000 * 60)
    );

    if (minutes < 1) return 'Just now';
    if (minutes < 60)
      return `${minutes}m ago`;

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24)
      return `${hours}h ago`;

    const days = Math.floor(
      hours / 24
    );

    if (days < 7)
      return `${days}d ago`;

    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
      }
    );
  };

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  const renderNotification = ({
    item,
  }: {
    item: NotificationItem;
  }) => (
    <Pressable
      style={[
        styles.card,
        !item.is_read && styles.unreadCard,
      ]}
      onPress={() => markAsRead(item)}
    >
      <View
        style={[
          styles.iconBox,
          !item.is_read &&
            styles.unreadIconBox,
        ]}
      >
        <Ionicons
          name={getIcon(item.type)}
          size={21}
          color={
            !item.is_read
              ? colors.navy
              : colors.textSecondary
          }
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.notificationTitle}>
            {item.title}
          </Text>

          {!item.is_read && (
            <View style={styles.dot} />
          )}
        </View>

        <Text style={styles.message}>
          {item.message}
        </Text>

        <Text style={styles.time}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            UPDATES
          </Text>

          <Text style={styles.title}>
            Notifications
          </Text>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={styles.readButton}
          >
            <Text style={styles.readButtonText}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            notifications.length === 0 &&
              styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-off-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                You're all caught up
              </Text>

              <Text style={styles.emptyText}>
                New event updates, registrations,
                approvals and other notifications will
                appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },

  readButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  readButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.navy,
  },

  list: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 11,
    flexDirection: 'row',
  },

  unreadCard: {
    borderColor: '#E8D7A7',
    backgroundColor: '#FFFDF7',
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadIconBox: {
    backgroundColor: colors.yellow,
  },

  content: {
    flex: 1,
    marginLeft: 11,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.yellowDark,
    marginLeft: 7,
  },

  message: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 4,
  },

  time: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7,
  },
});