import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_at: string;
  end_at: string;
  capacity: number;
  image_url: string | null;
  status: string;
  rejection_reason: string | null;
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrganizerEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEvents([]);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          category,
          location,
          start_at,
          end_at,
          capacity,
          image_url,
          status,
          rejection_reason
        `
        )
        .eq('organizer_id', user.id)
        .order('start_at', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setEvents((data ?? []) as EventItem[]);
    } catch (error) {
      console.error('Load organizer events error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const renderEvent = ({
    item,
  }: {
    item: EventItem;
  }) => {
    const status = item.status;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/organizer-event-details',
            params: {
              eventId: item.id,
            },
          })
        }
      >
        <View style={styles.cardTop}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              status === 'approved' &&
                styles.statusApproved,
              status === 'pending' &&
                styles.statusPending,
              status === 'rejected' &&
                styles.statusRejected,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                status === 'approved' &&
                  styles.statusApprovedText,
                status === 'pending' &&
                  styles.statusPendingText,
                status === 'rejected' &&
                  styles.statusRejectedText,
              ]}
            >
              {statusLabel[status] ?? status}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>
          {item.title}
        </Text>

        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {formatDate(item.start_at)} ·{' '}
            {formatTime(item.start_at)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text
            style={styles.infoText}
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.capacity}>
            <Ionicons
              name="people-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={styles.capacityText}>
              Capacity: {item.capacity}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textMuted}
          />
        </View>

        {status === 'rejected' &&
          item.rejection_reason && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>
                Rejection reason
              </Text>

              <Text style={styles.rejectionText}>
                {item.rejection_reason}
              </Text>
            </View>
          )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            ORGANIZER SPACE
          </Text>

          <Text style={styles.title}>
            My Events
          </Text>

          <Text style={styles.subtitle}>
            Manage the events you organize.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() =>
            router.push('/create-event')
          }
        >
          <Ionicons
            name="add"
            size={24}
            color={colors.navy}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />

          <Text style={styles.loadingText}>
            Loading your events...
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            events.length === 0 &&
              styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No events yet
              </Text>

              <Text style={styles.emptyText}>
                Create your first event and submit it
                for admin approval.
              </Text>

              <Pressable
                style={styles.createButton}
                onPress={() =>
                  router.push('/create-event')
                }
              >
                <Text style={styles.createButtonText}>
                  Create Event
                </Text>
              </Pressable>
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: {
    paddingHorizontal: 22,
    paddingBottom: 35,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.cream,
  },

  statusPending: {
    backgroundColor: '#FFF1D2',
  },

  statusApproved: {
    backgroundColor: '#E2F2E9',
  },

  statusRejected: {
    backgroundColor: '#FBE5E5',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  statusPendingText: {
    color: colors.warning,
  },

  statusApprovedText: {
    color: colors.success,
  },

  statusRejectedText: {
    color: colors.danger,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 13,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    gap: 7,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  capacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  capacityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  rejectionBox: {
    backgroundColor: '#FFF1F1',
    borderRadius: 11,
    padding: 11,
    marginTop: 13,
  },

  rejectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
  },

  rejectionText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 40,
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
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 7,
  },

  createButton: {
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },

  createButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});