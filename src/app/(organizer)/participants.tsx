import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
  start_at: string;
};

type Participant = {
  id: string;
  event_id: string;
  student_id: string;
  status: string;
  registered_at: string;
  event: EventItem | null;
  studentName: string;
  rollNumber: string | null;
  department: string | null;
  yearOfStudy: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrganizerParticipantsScreen() {
  const [participants, setParticipants] =
    useState<Participant[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<string>('all');

  const loadParticipants = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setParticipants([]);
        return;
      }

      // First get this organizer's events.
      const { data: events, error: eventError } =
        await supabase
          .from('events')
          .select(
            `
            id,
            title,
            start_at
          `
          )
          .eq('organizer_id', user.id)
          .order('start_at', {
            ascending: false,
          });

      if (eventError) {
        throw eventError;
      }

      if (!events || events.length === 0) {
        setParticipants([]);
        return;
      }

      const eventIds = events.map(
        (event) => event.id
      );

      // Get registrations for only those events.
      const {
        data: registrations,
        error: registrationError,
      } = await supabase
        .from('event_registrations')
        .select(
          `
          id,
          event_id,
          student_id,
          status,
          registered_at
        `
        )
        .in('event_id', eventIds)
        .eq('status', 'registered')
        .order('registered_at', {
          ascending: false,
        });

      if (registrationError) {
        throw registrationError;
      }

      if (
        !registrations ||
        registrations.length === 0
      ) {
        setParticipants([]);
        return;
      }

      const studentIds = [
        ...new Set(
          registrations.map(
            (registration) =>
              registration.student_id
          )
        ),
      ];

      // This query is protected by RLS.
      // Organizers can only receive permitted student
      // information associated with their own events.
      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          roll_number,
          department,
          year_of_study
        `
        )
        .in('id', studentIds);

      if (profileError) {
        throw profileError;
      }

      const eventMap = new Map(
        events.map((event) => [
          event.id,
          event as EventItem,
        ])
      );

      const profileMap = new Map(
        (profiles ?? []).map((profile) => [
          profile.id,
          profile,
        ])
      );

      const result: Participant[] =
        registrations.map((registration) => {
          const profile = profileMap.get(
            registration.student_id
          );

          return {
            id: registration.id,
            event_id: registration.event_id,
            student_id: registration.student_id,
            status: registration.status,
            registered_at:
              registration.registered_at,
            event:
              eventMap.get(
                registration.event_id
              ) ?? null,
            studentName:
              profile?.full_name ??
              'Student',
            rollNumber:
              profile?.roll_number ?? null,
            department:
              profile?.department ?? null,
            yearOfStudy:
              profile?.year_of_study ?? null,
          };
        });

      setParticipants(result);
    } catch (error) {
      console.error(
        'Load participants error:',
        error
      );

      setParticipants([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [])
  );

  const eventOptions = [
    {
      id: 'all',
      title: 'All Events',
    },
    ...Array.from(
      new Map(
        participants
          .filter((item) => item.event)
          .map((item) => [
            item.event!.id,
            {
              id: item.event!.id,
              title: item.event!.title,
            },
          ])
      ).values()
    ),
  ];

  const filteredParticipants =
    selectedEvent === 'all'
      ? participants
      : participants.filter(
          (participant) =>
            participant.event_id === selectedEvent
        );

  const renderParticipant = ({
    item,
  }: {
    item: Participant;
  }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.studentName
            .charAt(0)
            .toUpperCase()}
        </Text>
      </View>

      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {item.studentName}
        </Text>

        {item.rollNumber && (
          <Text style={styles.rollNumber}>
            {item.rollNumber}
          </Text>
        )}

        {item.department && (
          <Text style={styles.detailText}>
            {item.department}
            {item.yearOfStudy
              ? ` · Year ${item.yearOfStudy}`
              : ''}
          </Text>
        )}

        {item.event && (
          <View style={styles.eventRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={colors.textSecondary}
            />

            <Text
              style={styles.eventText}
              numberOfLines={1}
            >
              {item.event.title}
            </Text>
          </View>
        )}

        <Text style={styles.registeredText}>
          Registered {formatDate(item.registered_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          ORGANIZER SPACE
        </Text>

        <Text style={styles.title}>
          Participants
        </Text>

        <Text style={styles.subtitle}>
          Students registered for your events.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />

          <Text style={styles.loadingText}>
            Loading participants...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredParticipants}
          keyExtractor={(item) => item.id}
          renderItem={renderParticipant}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            filteredParticipants.length === 0 &&
              styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadParticipants();
              }}
            />
          }
          ListHeaderComponent={
            participants.length > 0 ? (
              <View>
                <View style={styles.statsCard}>
                  <View style={styles.statsIcon}>
                    <Ionicons
                      name="people-outline"
                      size={22}
                      color={colors.navy}
                    />
                  </View>

                  <View>
                    <Text style={styles.statsNumber}>
                      {filteredParticipants.length}
                    </Text>

                    <Text style={styles.statsLabel}>
                      {selectedEvent === 'all'
                        ? 'Total Participants'
                        : 'Participants'}
                    </Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  data={eventOptions}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.eventFilters
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.filterChip,
                        selectedEvent === item.id &&
                          styles.filterChipSelected,
                      ]}
                      onPress={() =>
                        setSelectedEvent(item.id)
                      }
                    >
                      <Text
                        style={[
                          styles.filterText,
                          selectedEvent === item.id &&
                            styles.filterTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No participants yet
              </Text>

              <Text style={styles.emptyText}>
                Students who register for your events
                will appear here.
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
    paddingBottom: 15,
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
    paddingBottom: 35,
  },

  emptyList: {
    flexGrow: 1,
  },

  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  statsIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  statsNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },

  statsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  eventFilters: {
    gap: 8,
    paddingVertical: 13,
  },

  filterChip: {
    maxWidth: 180,
    paddingHorizontal: 13,
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
    borderRadius: 17,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },

  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },

  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  rollNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },

  detailText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  eventText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },

  registeredText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 5,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
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
    fontSize: 19,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7,
  },
});