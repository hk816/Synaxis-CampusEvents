import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
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

type EventItem = {
  id: string;
  title: string;
};

type ResourceStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

type ResourceItem = {
  id: string;
  event_id: string;
  resource_name: string;
  responsible_person: string;
  status: ResourceStatus;
  requested_at: string;
  rejection_reason?: string | null;
};

export default function OrganizerResources() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  const [selectedEvent, setSelectedEvent] =
    useState<string | null>(null);

  const [resourceName, setResourceName] =
    useState('');

  const [responsiblePerson, setResponsiblePerson] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] =
    useState(false);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in.');
      }

      const { data: eventData, error: eventError } =
        await supabase
          .from('events')
          .select('id, title')
          .eq('organizer_id', user.id)
          .order('start_at', {
            ascending: false,
          });

      if (eventError) {
        throw eventError;
      }

      const eventList =
        (eventData ?? []) as EventItem[];

      setEvents(eventList);

      if (
        !selectedEvent &&
        eventList.length > 0
      ) {
        setSelectedEvent(eventList[0].id);
      }

      if (eventList.length === 0) {
        setResources([]);
        return;
      }

      const eventIds = eventList.map(
        event => event.id
      );

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from('event_resources')
        .select('*')
        .in('event_id', eventIds)
        .order('requested_at', {
          ascending: false,
        });

      if (resourceError) {
        throw resourceError;
      }

      setResources(
        (resourceData ?? []) as ResourceItem[]
      );
    } catch (error: any) {
      console.error(
        'Organizer resources error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to load resources.',
        'error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEvent, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const addResource = async () => {
    const name = resourceName.trim();
    const person = responsiblePerson.trim();

    if (!selectedEvent) {
      showToast(
        'Please select an event.',
        'warning'
      );
      return;
    }

    if (!name) {
      showToast(
        'Enter the resource you need.',
        'warning'
      );
      return;
    }

    if (!person) {
      showToast(
        'Enter the responsible person.',
        'warning'
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'You must be logged in.'
        );
      }

      const selected = events.find(
        event => event.id === selectedEvent
      );

      if (!selected) {
        throw new Error(
          'Selected event was not found.'
        );
      }

      const { error } = await supabase
        .from('event_resources')
        .insert({
          event_id: selectedEvent,
          resource_name: name,
          responsible_person: person,
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      setResourceName('');
      setResponsiblePerson('');

      showToast(
        'Resource request submitted.',
        'success'
      );

      await loadData();
    } catch (error: any) {
      console.error(
        'Add resource error:',
        error
      );

      showToast(
        error?.message ||
          'Unable to submit resource request.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const getEventName = (eventId: string) => {
    return (
      events.find(
        event => event.id === eventId
      )?.title ?? 'Event'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.yellowDark}
        />

        <Text style={styles.loadingText}>
          Loading resources...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
              Request and track resources for
              your events
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

        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={42}
              color={colors.textMuted}
            />

            <Text style={styles.emptyTitle}>
              No events yet
            </Text>

            <Text style={styles.emptyText}>
              Create an event before requesting
              resources.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                New Resource Request
              </Text>

              <Text style={styles.label}>
                Event
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.eventSelector
                }
              >
                {events.map(event => {
                  const active =
                    selectedEvent === event.id;

                  return (
                    <Pressable
                      key={event.id}
                      onPress={() =>
                        setSelectedEvent(
                          event.id
                        )
                      }
                      style={[
                        styles.eventChip,
                        active &&
                          styles.eventChipActive,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.eventChipText,
                          active &&
                            styles.eventChipTextActive,
                        ]}
                      >
                        {event.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>
                Resource
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="cube-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  value={resourceName}
                  onChangeText={setResourceName}
                  placeholder="e.g. Projector & AV System"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  style={styles.input}
                />
              </View>

              <Text style={styles.label}>
                Responsible Person
              </Text>

              <View style={styles.inputBox}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  value={responsiblePerson}
                  onChangeText={
                    setResponsiblePerson
                  }
                  placeholder="Person obtaining approval"
                  placeholderTextColor={
                    colors.textMuted
                  }
                  style={styles.input}
                />
              </View>

              <View style={styles.notice}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={colors.yellowDark}
                />

                <Text style={styles.noticeText}>
                  The organizer is responsible for
                  personally obtaining any required
                  approval or consent for this
                  resource.
                </Text>
              </View>

              <Pressable
                disabled={saving}
                onPress={addResource}
                style={[
                  styles.submitButton,
                  saving &&
                    styles.submitButtonDisabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator
                    color={colors.navy}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="add"
                      size={21}
                      color={colors.navy}
                    />

                    <Text
                      style={
                        styles.submitButtonText
                      }
                    >
                      Submit Request
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              Resource Requests
            </Text>

            {resources.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={38}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>
                  No resource requests
                </Text>

                <Text style={styles.emptyText}>
                  Resource requests you submit will
                  appear here.
                </Text>
              </View>
            ) : (
              resources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  eventName={getEventName(
                    resource.event_id
                  )}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function ResourceCard({
  resource,
  eventName,
}: {
  resource: ResourceItem;
  eventName: string;
}) {
  const status =
    resource.status ?? 'pending';

  return (
    <View style={styles.resourceCard}>
      <View style={styles.resourceTop}>
        <View style={styles.resourceIcon}>
          <Ionicons
            name="cube-outline"
            size={21}
            color={colors.navy}
          />
        </View>

        <View style={styles.resourceInfo}>
          <Text style={styles.resourceName}>
            {resource.resource_name}
          </Text>

          <Text
            style={styles.eventName}
            numberOfLines={1}
          >
            {eventName}
          </Text>
        </View>

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
      </View>

      <View style={styles.personRow}>
        <Ionicons
          name="person-outline"
          size={16}
          color={colors.textMuted}
        />

        <Text style={styles.personText}>
          Responsible: {
            resource.responsible_person
          }
        </Text>
      </View>

      {status === 'rejected' &&
      resource.rejection_reason ? (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>
            Reason
          </Text>

          <Text style={styles.rejectionText}>
            {resource.rejection_reason}
          </Text>
        </View>
      ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
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

  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },

  eventSelector: {
    gap: 8,
    paddingBottom: 8,
  },

  eventChip: {
    maxWidth: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  eventChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  eventChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },

  eventChipTextActive: {
    color: colors.white,
  },

  inputBox: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FCFBF7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: colors.navy,
  },

  notice: {
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: '#FFF7DE',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  submitButton: {
    height: 52,
    borderRadius: 14,
    marginTop: 16,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },

  sectionTitle: {
    marginTop: 27,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },

  resourceCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 11,
  },

  resourceTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resourceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resourceInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  resourceName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },

  eventName: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSecondary,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
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

  personRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  personText: {
    marginLeft: 6,
    fontSize: 11,
    color: colors.textSecondary,
  },

  rejectionBox: {
    marginTop: 12,
    borderRadius: 11,
    padding: 11,
    backgroundColor: '#FDECEC',
  },

  rejectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },

  rejectionText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  emptyCard: {
    minHeight: 170,
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