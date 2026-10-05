import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type Notification = {
  id: string;
  user_id: string;
  event_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error: notificationError } = await supabase
        .from('notifications')
        .select(
          'id, user_id, event_id, type, title, message, is_read, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationError) {
        throw notificationError;
      }

      setNotifications((data ?? []) as Notification[]);
    } catch (err: any) {
      console.error('Notifications error:', err);

      setError(
        err?.message ?? 'Unable to load notifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const refresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  /*
   * Uses the secure backend RPC.
   * A student cannot mark somebody else's notification as read.
   */
  const markAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    const { error: rpcError } = await supabase.rpc(
      'mark_notification_read',
      {
        p_notification_id: notification.id,
      }
    );

    if (rpcError) {
      console.error(
        'Mark notification read error:',
        rpcError
      );
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item
      )
    );
  };

  /*
   * Uses the secure backend RPC to mark all notifications
   * belonging to the current user as read.
   */
  const markAllAsRead = async () => {
    const unreadCount = notifications.filter(
      (notification) => !notification.is_read
    ).length;

    if (unreadCount === 0) return;

    const { error: rpcError } = await supabase.rpc(
      'mark_all_notifications_read'
    );

    if (rpcError) {
      console.error(
        'Mark all notifications read error:',
        rpcError
      );
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
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
        return 'checkmark-done-circle-outline';

      case 'event_rejected':
        return 'close-circle-outline';

      case 'feedback_required':
        return 'chatbubble-ellipses-outline';

      case 'event_update':
        return 'megaphone-outline';

      case 'resource_update':
        return 'document-text-outline';

      default:
        return 'notifications-outline';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const seconds = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString();
  };

  const openNotification = async (
    notification: Notification
  ) => {
    await markAsRead(notification);

    if (!notification.event_id) {
      return;
    }

    if (notification.type === 'feedback_required') {
      router.push({
        pathname: '/feedback',
        params: {
          eventId: notification.event_id,
        },
      });

      return;
    }

    router.push({
      pathname: '/event-details',
      params: {
        eventId: notification.event_id,
      },
    });
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
        />

        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.navy}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>
              Mark all
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* ERROR */}
      {error ? (
        <Pressable
          style={styles.errorBanner}
          onPress={() => {
            setError('');
            loadNotifications();
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={21}
            color={colors.danger}
          />

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Ionicons
            name="refresh-outline"
            size={19}
            color={colors.danger}
          />
        </Pressable>
      ) : null}

      {/* NOTIFICATION LIST */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.navy}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 &&
            styles.emptyListContent,
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.notificationCard,
              !item.is_read &&
                styles.unreadNotification,
            ]}
            onPress={() => openNotification(item)}
          >
            {!item.is_read && (
              <View style={styles.unreadDot} />
            )}

            <View style={styles.iconContainer}>
              <Ionicons
                name={getIcon(item.type)}
                size={23}
                color={colors.navy}
              />
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.notificationTitle,
                    !item.is_read &&
                      styles.unreadTitle,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text style={styles.timeText}>
                  {getTimeAgo(item.created_at)}
                </Text>
              </View>

              <Text style={styles.message}>
                {item.message}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={38}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No notifications yet
            </Text>

            <Text style={styles.emptyText}>
              Event updates, registrations, approvals,
              waitlist updates and feedback reminders will
              appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
    minHeight: 96,
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 13,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.navy,
  },

  countBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  markAllButton: {
    paddingHorizontal: 7,
    paddingVertical: 8,
  },

  markAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  headerSpacer: {
    width: 55,
  },

  errorBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F1C2C2',
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorText: {
    flex: 1,
    marginHorizontal: 9,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  listContent: {
    padding: 16,
    paddingBottom: 35,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },

  unreadNotification: {
    borderColor: '#D8C98F',
    backgroundColor: '#FFFDF6',
  },

  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.yellow,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  notificationTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.text,
  },

  unreadTitle: {
    fontWeight: '800',
  },

  timeText: {
    marginLeft: 8,
    fontSize: 10,
    color: colors.textMuted,
  },

  message: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});