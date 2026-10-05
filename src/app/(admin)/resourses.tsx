import { Ionicons } from '@expo/vector-icons';
import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useToast } from '../../components/AppToast';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type ResourceStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

type Resource = {
  id: string;
  event_id: string;
  resource_name: string;
  responsible_person: string;
  status: ResourceStatus;
  requested_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  organizer_id: string;
};

type ResourceWithEvent = Resource & {
  eventTitle: string;
};

export default function AdminResources() {
  const { showToast } = useToast();

  const [resources, setResources] = useState<
    ResourceWithEvent[]
  >([]);

  const [filteredResources, setFilteredResources] =
    useState<ResourceWithEvent[]>([]);

  const [filter, setFilter] =
    useState<'all' | ResourceStatus>('pending');

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [reviewingId, setReviewingId] =
    useState<string | null>(null);

  const [rejectionId, setRejectionId] =
    useState<string | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState('');

  const loadResources = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const {
          data: resourceData,
          error: resourceError,
        } = await supabase
          .from('event_resources')
          .select('*')
          .order('requested_at', {
            ascending: false,
          });

        if (resourceError) {
          throw resourceError;
        }

        const rawResources =
          (resourceData ?? []) as Resource[];

        if (rawResources.length === 0) {
          setResources([]);
          return;
        }

        const eventIds = [
          ...new Set(
            rawResources.map(
              resource => resource.event_id
            )
          ),
        ];

        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from('events')
          .select(
            'id, title, organizer_id'
          )
          .in('id', eventIds);

        if (eventError) {
          throw eventError;
        }

        const eventMap = new Map<
          string,
          EventItem
        >();

        (
          (eventData ?? []) as EventItem[]
        ).forEach(event => {
          eventMap.set(event.id, event);
        });

        const combined =
          rawResources.map(resource => ({
            ...resource,
            eventTitle:
              eventMap.get(resource.event_id)
                ?.title ?? 'Unknown Event',
          }));

        setResources(combined);
      } catch (error: any) {
        console.error(
          'Admin resources error:',
          error
        );

        showToast(
          error?.message ||
            'Unable to load resource requests.',
          'error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    const query =
      search.trim().toLowerCase();

    let result = resources;

    if (filter !== 'all') {
      result = result.filter(
        resource =>
          resource.status === filter
      );
    }

    if (query) {
      result = result.filter(resource =>
        [
          resource.resource_name,
          resource.responsible_person,
          resource.eventTitle,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    setFilteredResources(result);
  }, [resources, filter, search]);

  const approveResource = async (
    resource: ResourceWithEvent
  ) => {
    await reviewResource(
      resource,
      'approved'
    );
  };

  const rejectResource = async (
    resource: ResourceWithEvent
  ) => {
    const reason =
      rejectionReason.trim();

    if (!reason) {
      showToast(
        'Enter a rejection reason.',
        'warning'
      );
      return;
    }

    await reviewResource(
      resource,
      'rejected',
      reason
    );
  };

  const reviewResource = async (
    resource: ResourceWithEvent,
    decision: 'approved' | 'rejected',
    comments?: string
  ) => {
    try {
      setReviewingId(resource.id);

      const { error } =
        await supabase.rpc(
          'admin_review_resource',
          {
            p_resource_id: resource.id,
            p_decision: decision,
            p_comments:
              comments?.trim() || null,
          }
        );

      if (error) {
        throw error;
      }

      setRejectionId(null);
      setRejectionReason('');

      showToast(
        decision === 'approved'
          ? 'Resource request approved.'
          : 'Resource request rejected.',
        'success'
      );

      await loadResources(true);
    } catch (error: any) {
      console.error(
        'Resource review error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to review resource request.',
        'error'
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.yellowDark}
        />

        <Text style={styles.loadingText}>
          Loading resource requests...
        </Text>
      </View>
    );
  }

  const pendingCount =
    resources.filter(
      resource =>
        resource.status === 'pending'
    ).length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadResources(true)
            }
            tintColor={colors.yellowDark}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Resources
            </Text>

            <Text style={styles.subtitle}>
              Review organizer resource requests
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="cube-outline"
              size={25}
              color={colors.navy}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="time-outline"
              size={22}
              color={colors.navy}
            />
          </View>

          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>
              {pendingCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Pending requests
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.textMuted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources or events..."
            placeholderTextColor={
              colors.textMuted
            }
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
              <Ionicons
                name="close-circle"
                size={19}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {(
            [
              ['all', 'All'],
              ['pending', 'Pending'],
              ['approved', 'Approved'],
              ['rejected', 'Rejected'],
            ] as const
          ).map(([value, label]) => {
            const active = filter === value;

            return (
              <Pressable
                key={value}
                onPress={() =>
                  setFilter(value)
                }
                style={[
                  styles.filterChip,
                  active &&
                    styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredResources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="file-tray-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text style={styles.emptyTitle}>
              No resource requests
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? 'No requests match your search.'
                : filter === 'pending'
                  ? 'There are no pending resource requests.'
                  : 'No resource requests found.'}
            </Text>
          </View>
        ) : (
          filteredResources.map(resource => {
            const isReviewing =
              reviewingId === resource.id;

            const isRejecting =
              rejectionId === resource.id;

            return (
              <View
                key={resource.id}
                style={styles.resourceCard}
              >
                <View style={styles.topRow}>
                  <View style={styles.resourceIcon}>
                    <Ionicons
                      name="cube-outline"
                      size={22}
                      color={colors.navy}
                    />
                  </View>

                  <View
                    style={styles.resourceInfo}
                  >
                    <Text
                      style={styles.resourceName}
                    >
                      {resource.resource_name}
                    </Text>

                    <Text
                      style={styles.eventName}
                      numberOfLines={2}
                    >
                      {resource.eventTitle}
                    </Text>
                  </View>

                  <StatusBadge
                    status={resource.status}
                  />
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={colors.textMuted}
                  />

                  <Text style={styles.detailText}>
                    Responsible:{' '}
                    {resource.responsible_person}
                  </Text>
                </View>

                {resource.status ===
                  'rejected' &&
                  resource.rejection_reason ? (
                  <View
                    style={styles.rejectionInfo}
                  >
                    <Text
                      style={
                        styles.rejectionLabel
                      }
                    >
                      Rejection reason
                    </Text>

                    <Text
                      style={
                        styles.rejectionReason
                      }
                    >
                      {resource.rejection_reason}
                    </Text>
                  </View>
                ) : null}

                {resource.status ===
                  'pending' && (
                  <>
                    {isRejecting ? (
                      <View
                        style={
                          styles.rejectionForm
                        }
                      >
                        <Text
                          style={
                            styles.rejectionFormTitle
                          }
                        >
                          Rejection reason
                        </Text>

                        <TextInput
                          value={
                            rejectionReason
                          }
                          onChangeText={
                            setRejectionReason
                          }
                          placeholder="Explain why this request is rejected..."
                          placeholderTextColor={
                            colors.textMuted
                          }
                          multiline
                          textAlignVertical="top"
                          style={
                            styles.rejectionInput
                          }
                        />

                        <View
                          style={
                            styles.rejectionActions
                          }
                        >
                          <Pressable
                            disabled={
                              isReviewing
                            }
                            onPress={() => {
                              setRejectionId(
                                null
                              );
                              setRejectionReason(
                                ''
                              );
                            }}
                            style={
                              styles.cancelButton
                            }
                          >
                            <Text
                              style={
                                styles.cancelButtonText
                              }
                            >
                              Cancel
                            </Text>
                          </Pressable>

                          <Pressable
                            disabled={
                              isReviewing
                            }
                            onPress={() =>
                              rejectResource(
                                resource
                              )
                            }
                            style={
                              styles.confirmRejectButton
                            }
                          >
                            {isReviewing ? (
                              <ActivityIndicator
                                color={
                                  colors.white
                                }
                              />
                            ) : (
                              <Text
                                style={
                                  styles.confirmRejectText
                                }
                              >
                                Reject Request
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={styles.actions}
                      >
                        <Pressable
                          disabled={isReviewing}
                          onPress={() =>
                            approveResource(
                              resource
                            )
                          }
                          style={
                            styles.approveButton
                          }
                        >
                          {isReviewing ? (
                            <ActivityIndicator
                              color={
                                colors.white
                              }
                            />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color={
                                  colors.white
                                }
                              />

                              <Text
                                style={
                                  styles.approveText
                                }
                              >
                                Approve
                              </Text>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          disabled={isReviewing}
                          onPress={() => {
                            setRejectionId(
                              resource.id
                            );
                            setRejectionReason(
                              ''
                            );
                          }}
                          style={
                            styles.rejectButton
                          }
                        >
                          <Ionicons
                            name="close"
                            size={18}
                            color={colors.danger}
                          />

                          <Text
                            style={
                              styles.rejectText
                            }
                          >
                            Reject
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: ResourceStatus;
}) {
  return (
    <View
      style={[
        styles.statusBadge,
        status === 'approved' &&
          styles.approvedBadge,
        status === 'rejected' &&
          styles.rejectedBadge,
        status === 'pending' &&
          styles.pendingBadge,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          status === 'approved' &&
            styles.approvedText,
          status === 'rejected' &&
            styles.rejectedText,
          status === 'pending' &&
            styles.pendingText,
        ]}
      >
        {status.charAt(0).toUpperCase() +
          status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    padding: 20,
    paddingTop: 28,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 14,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: colors.navy,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  summaryIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryText: {
    marginLeft: 12,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },

  searchBox: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    color: colors.navy,
  },

  filters: {
    gap: 8,
    paddingVertical: 14,
  },

  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  filterChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  filterTextActive: {
    color: colors.white,
  },

  resourceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resourceIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  resourceName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },

  eventName: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  statusBadge: {
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  approvedBadge: {
    backgroundColor: '#E8F4EC',
  },

  rejectedBadge: {
    backgroundColor: '#FDECEC',
  },

  pendingBadge: {
    backgroundColor: '#FFF4D4',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  approvedText: {
    color: colors.success,
  },

  rejectedText: {
    color: colors.danger,
  },

  pendingText: {
    color: colors.warning,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  detailText: {
    marginLeft: 6,
    fontSize: 11,
    color: colors.textSecondary,
  },

  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },

  approveButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  approveText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },

  rejectButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  rejectText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },

  rejectionInfo: {
    marginTop: 13,
    borderRadius: 11,
    backgroundColor: '#FDECEC',
    padding: 11,
  },

  rejectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },

  rejectionReason: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  rejectionForm: {
    marginTop: 15,
  },

  rejectionFormTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
  },

  rejectionInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9BABA',
    backgroundColor: '#FFF9F9',
    padding: 11,
    fontSize: 12,
    color: colors.navy,
  },

  rejectionActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
  },

  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#F1F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  confirmRejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmRejectText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },

  emptyCard: {
    minHeight: 180,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  emptyTitle: {
    marginTop: 11,
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});