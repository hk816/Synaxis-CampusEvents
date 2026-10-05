import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type EventData = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  start_at: string;
  end_at: string;
  location: string | null;
  description: string | null;
  capacity: number;
};

type ResourceData = {
  id: string;
  resource_name: string;
  responsible_person: string;
  status: string;
};

type ApprovalData = {
  id: string;
  status: string;
  comments: string | null;
  reviewed_at: string | null;
};

export default function OrganizerEventDetails() {
  const params = useLocalSearchParams<{ eventId?: string; id?: string }>();
  const eventId = typeof params.eventId === 'string'
    ? params.eventId
    : typeof params.id === 'string'
      ? params.id
      : undefined;

  const [event, setEvent] = useState<EventData | null>(null);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [approval, setApproval] = useState<ApprovalData | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [waitlistedCount, setWaitlistedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    if (!eventId) {
      setErrorMessage('Event ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      const [
        eventResult,
        resourcesResult,
        approvalResult,
        registrationsResult,
        waitlistResult,
      ] = await Promise.all([
        supabase
          .from('events')
          .select(
            'id,title,category,status,start_at,end_at,location,description,capacity'
          )
          .eq('id', eventId)
          .single(),

        supabase
          .from('event_resources')
          .select('id,resource_name,responsible_person,status')
          .eq('event_id', eventId)
          .order('requested_at', { ascending: false }),

        supabase
          .from('event_approvals')
          .select('id,status,comments,reviewed_at')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from('event_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'registered'),

        supabase
          .from('event_waitlist')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'waiting'),
      ]);

      if (eventResult.error) throw eventResult.error;
      if (resourcesResult.error) throw resourcesResult.error;
      if (approvalResult.error) throw approvalResult.error;
      if (registrationsResult.error) throw registrationsResult.error;
      if (waitlistResult.error) throw waitlistResult.error;

      setEvent(eventResult.data as EventData);
      setResources((resourcesResult.data ?? []) as ResourceData[]);
      setApproval((approvalResult.data ?? null) as ApprovalData | null);
      setRegisteredCount(registrationsResult.count ?? 0);
      setWaitlistedCount(waitlistResult.count ?? 0);
    } catch (error: any) {
      console.error('Organizer event details error:', error);
      setErrorMessage(error?.message ?? 'Unable to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (start: string, end: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };

    return `${new Date(start).toLocaleTimeString('en-IN', options)} – ${new Date(
      end
    ).toLocaleTimeString('en-IN', options)}`;
  };

  const titleCase = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const registrationPercentage =
    event && event.capacity > 0
      ? (registeredCount / event.capacity) * 100
      : 0;

  const handleEdit = () => {
    if (!event?.id) return;

    router.push({
      pathname: '/edit-event',
      params: { eventId: event.id },
    });
  };

  const handleUpdate = () => {
    if (!event?.id) return;

    router.push({
      pathname: '/send-event-update',
      params: { eventId: event.id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingScreen}>
        <Ionicons
          name="alert-circle-outline"
          size={30}
          color={colors.danger}
        />
        <Text style={styles.loadingTitle}>Unable to load event</Text>
        <Text style={styles.loadingText}>
          {errorMessage || 'Event not found.'}
        </Text>

        <Pressable style={styles.retryButton} onPress={loadEventDetails}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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

        <View style={styles.heroCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category || 'General'}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {titleCase(event.status)}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <Text style={styles.eventDescription}>
            {event.description || 'No description provided.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Event information</Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label="Date"
            value={formatDate(event.start_at)}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="time-outline"
            label="Time"
            value={formatTime(event.start_at, event.end_at)}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="location-outline"
            label="Venue"
            value={event.location || 'Venue not specified'}
          />
        </View>

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
                  {registeredCount}
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
                  width: `${Math.min(registrationPercentage, 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.registrationBottom}>
            <Text style={styles.registrationSubtext}>
              {Math.round(registrationPercentage)}% of capacity
            </Text>

            <Text style={styles.registrationSubtext}>
              {Math.max(event.capacity - registeredCount, 0)} spots left
            </Text>
          </View>

          <View style={styles.waitlistBox}>
            <Ionicons
              name="people-circle-outline"
              size={19}
              color={colors.warning}
            />

            <Text style={styles.waitlistText}>
              {waitlistedCount} student
              {waitlistedCount === 1 ? '' : 's'} currently on the waitlist.
            </Text>
          </View>
        </View>

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

        {resources.length === 0 ? (
          <View style={styles.emptyResourceCard}>
            <Ionicons
              name="cube-outline"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.emptyResourceText}>
              No resources have been added for this event.
            </Text>
          </View>
        ) : (
          resources.map((resource) => {
            const normalizedStatus = resource.status.toLowerCase();

            return (
              <View
                key={resource.id}
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
                    {resource.resource_name}
                  </Text>

                  <Text style={styles.resourcePerson}>
                    Responsible: {resource.responsible_person}
                  </Text>
                </View>

                <View
                  style={[
                    styles.resourceStatus,
                    normalizedStatus === 'approved'
                      ? styles.approvedBackground
                      : normalizedStatus === 'rejected'
                        ? styles.rejectedBackground
                        : styles.pendingBackground,
                  ]}
                >
                  <Text
                    style={[
                      styles.resourceStatusText,
                      normalizedStatus === 'approved'
                        ? styles.approvedText
                        : normalizedStatus === 'rejected'
                          ? styles.rejectedText
                          : styles.pendingText,
                    ]}
                  >
                    {titleCase(normalizedStatus)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Approval</Text>

        <View style={styles.approvalCard}>
          <View style={styles.approvalIcon}>
            <Ionicons
              name={
                event.status === 'approved'
                  ? 'checkmark-circle-outline'
                  : event.status === 'rejected'
                    ? 'close-circle-outline'
                    : 'time-outline'
              }
              size={21}
              color={
                event.status === 'approved'
                  ? colors.success
                  : event.status === 'rejected'
                    ? colors.danger
                    : colors.warning
              }
            />
          </View>

          <View style={styles.approvalTextContainer}>
            <Text style={styles.approvalTitle}>
              {approval
                ? `${titleCase(approval.status)} by Admin`
                : `Current status: ${titleCase(event.status)}`}
            </Text>

            <Text style={styles.approvalText}>
              {approval?.comments
                ? approval.comments
                : approval?.reviewed_at
                  ? `Reviewed on ${formatDate(approval.reviewed_at)}.`
                  : 'No Admin approval comment has been recorded yet.'}
            </Text>
          </View>
        </View>

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
            onPress={() =>
              router.push({
                pathname: '/participants',
                params: { eventId: event.id },
              })
            }
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
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 17,
  },

  retryButton: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 15,
  },

  retryText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  emptyResourceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 23,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyResourceText: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 7,
    textAlign: 'center',
  },

  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },

  approvalIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

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