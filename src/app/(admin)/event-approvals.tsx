import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Approval = {
  id: string;
  event_id: string;
  admin_id: string | null;
  status: string;
  comments: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type EventItem = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_at: string;
  end_at: string;
  capacity: number;
  status: string;
  rejection_reason: string | null;
};

type ApprovalItem = Approval & {
  event: EventItem | null;
};

const filters = [
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'approved',
    label: 'Approved',
  },
  {
    key: 'rejected',
    label: 'Rejected',
  },
  {
    key: 'all',
    label: 'All',
  },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

export default function AdminEventApprovalsScreen() {
  const [items, setItems] = useState<ApprovalItem[]>(
    []
  );
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rejecting, setRejecting] =
    useState<ApprovalItem | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState('');

  const [actionLoading, setActionLoading] =
    useState(false);

  const loadApprovals = async () => {
    try {
      let approvalQuery = supabase
        .from('event_approvals')
        .select(
          `
          id,
          event_id,
          admin_id,
          status,
          comments,
          reviewed_at,
          created_at
        `
        )
        .order('created_at', {
          ascending: false,
        });

      if (filter !== 'all') {
        approvalQuery = approvalQuery.eq(
          'status',
          filter
        );
      }

      const {
        data: approvals,
        error: approvalError,
      } = await approvalQuery;

      if (approvalError) {
        throw approvalError;
      }

      if (!approvals || approvals.length === 0) {
        setItems([]);
        return;
      }

      const eventIds = approvals.map(
        (approval) => approval.event_id
      );

      const {
        data: events,
        error: eventError,
      } = await supabase
        .from('events')
        .select(
          `
          id,
          organizer_id,
          title,
          description,
          category,
          location,
          start_at,
          end_at,
          capacity,
          status,
          rejection_reason
        `
        )
        .in('id', eventIds);

      if (eventError) {
        throw eventError;
      }

      const eventMap = new Map(
        (events ?? []).map((event) => [
          event.id,
          event as EventItem,
        ])
      );

      const combined: ApprovalItem[] =
        approvals.map((approval) => ({
          ...(approval as Approval),
          event:
            eventMap.get(approval.event_id) ??
            null,
        }));

      setItems(combined);
    } catch (error) {
      console.error(
        'Load approvals error:',
        error
      );

      Alert.alert(
        'Unable to load approvals',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadApprovals();
    }, [filter])
  );

  const approveEvent = async (
    item: ApprovalItem
  ) => {
    Alert.alert(
      'Approve Event',
      `Approve "${item.event?.title ?? 'this event'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);

            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                throw new Error(
                  'Admin session not found.'
                );
              }

              const { error } = await supabase
                .from('event_approvals')
                .update({
                  status: 'approved',
                  admin_id: user.id,
                  comments:
                    'Approved by administrator.',
                  reviewed_at: new Date().toISOString(),
                })
                .eq('id', item.id);

              if (error) {
                throw error;
              }

              Alert.alert(
                'Event Approved',
                'The event is now visible to students.'
              );

              await loadApprovals();
            } catch (error) {
              console.error(
                'Approve event error:',
                error
              );

              Alert.alert(
                'Approval failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to approve event.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openReject = (item: ApprovalItem) => {
    setRejectionReason('');
    setRejecting(item);
  };

  const rejectEvent = async () => {
    if (!rejecting) {
      return;
    }

    if (!rejectionReason.trim()) {
      Alert.alert(
        'Reason required',
        'Please provide a reason for rejecting this event.'
      );
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'Admin session not found.'
        );
      }

      const { error } = await supabase
        .from('event_approvals')
        .update({
          status: 'rejected',
          admin_id: user.id,
          comments: rejectionReason.trim(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', rejecting.id);

      if (error) {
        throw error;
      }

      setRejecting(null);
      setRejectionReason('');

      Alert.alert(
        'Event Rejected',
        'The organizer will be able to see the rejection reason.'
      );

      await loadApprovals();
    } catch (error) {
      console.error(
        'Reject event error:',
        error
      );

      Alert.alert(
        'Rejection failed',
        error instanceof Error
          ? error.message
          : 'Unable to reject event.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadApprovals();
  };

  const renderItem = ({
    item,
  }: {
    item: ApprovalItem;
  }) => {
    const event = item.event;

    if (!event) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === 'pending' &&
                styles.pendingBadge,
              item.status === 'approved' &&
                styles.approvedBadge,
              item.status === 'rejected' &&
                styles.rejectedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === 'pending' &&
                  styles.pendingText,
                item.status === 'approved' &&
                  styles.approvedText,
                item.status === 'rejected' &&
                  styles.rejectedText,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>
          {event.title}
        </Text>

        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {event.description}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {formatDate(event.start_at)} ·{' '}
            {formatTime(event.start_at)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {event.location}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="people-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            Capacity: {event.capacity}
          </Text>
        </View>

        {item.status === 'rejected' &&
          item.comments && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>
                Rejection reason
              </Text>

              <Text style={styles.reasonText}>
                {item.comments}
              </Text>
            </View>
          )}

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <Pressable
              style={styles.rejectButton}
              onPress={() => openReject(item)}
              disabled={actionLoading}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={colors.danger}
              />

              <Text style={styles.rejectText}>
                Reject
              </Text>
            </Pressable>

            <Pressable
              style={styles.approveButton}
              onPress={() => approveEvent(item)}
              disabled={actionLoading}
            >
              <Ionicons
                name="checkmark-outline"
                size={18}
                color={colors.navy}
              />

              <Text style={styles.approveText}>
                Approve
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          ADMIN SPACE
        </Text>

        <Text style={styles.title}>
          Event Approvals
        </Text>

        <Text style={styles.subtitle}>
          Review events submitted by organizers.
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          items.length === 0 &&
            styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.filterRow}>
            {filters.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.filterChip,
                  filter === item.key &&
                    styles.filterChipSelected,
                ]}
                onPress={() =>
                  setFilter(item.key)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === item.key &&
                      styles.filterTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="large"
                color={colors.yellowDark}
              />

              <Text style={styles.loadingText}>
                Loading approvals...
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No {filter === 'all' ? '' : filter}{' '}
                approvals
              </Text>

              <Text style={styles.emptyText}>
                There are no event approval requests in
                this category.
              </Text>
            </View>
          )
        }
      />

      {/* Rejection Modal */}
      <Modal
        visible={!!rejecting}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setRejecting(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="close-circle-outline"
                size={27}
                color={colors.danger}
              />
            </View>

            <Text style={styles.modalTitle}>
              Reject Event
            </Text>

            <Text style={styles.modalSubtitle}>
              Please provide a reason. The organizer
              will be able to see it.
            </Text>

            <TextInput
              style={styles.reasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() =>
                  setRejecting(null)
                }
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalReject}
                onPress={rejectEvent}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.white}
                  />
                ) : (
                  <Text style={styles.modalRejectText}>
                    Reject Event
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 14,
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

  list: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  emptyList: {
    flexGrow: 1,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.white,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },

  pendingBadge: {
    backgroundColor: '#FFF1D2',
  },

  approvedBadge: {
    backgroundColor: '#E2F2E9',
  },

  rejectedBadge: {
    backgroundColor: '#FBE5E5',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  pendingText: {
    color: colors.warning,
  },

  approvedText: {
    color: colors.success,
  },

  rejectedText: {
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
    gap: 7,
    marginTop: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  rejectButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FBE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  rejectText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  approveButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  approveText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
  },

  reasonBox: {
    backgroundColor: '#FFF1F1',
    borderRadius: 11,
    padding: 11,
    marginTop: 13,
  },

  reasonTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
  },

  reasonText: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 3,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingTop: 65,
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
    fontSize: 18,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 33, 61, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  modal: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
  },

  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FBE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 14,
  },

  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5,
  },

  reasonInput: {
    minHeight: 110,
    backgroundColor: colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    fontSize: 13,
    color: colors.navy,
    marginTop: 16,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  modalReject: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },

  modalRejectText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
});