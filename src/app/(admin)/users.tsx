import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

type UserRole = 'student' | 'organizer';

type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  year_of_study: string | null;
  organization: string | null;
  designation: string | null;
  profile_completed: boolean;
};

type DisplayUser = {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  year?: string;
  organization?: string;
  designation?: string;
  events: number;
  profileCompleted: boolean;
};

const filters = ['All', 'Students', 'Organizers'];

export default function AdminUsers() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setErrorMessage('');

      // Load real profiles.
      const { data: profiles, error: profilesError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, role, department, year_of_study, organization, designation, profile_completed'
          )
          .in('role', ['student', 'organizer'])
          .order('full_name', {
            ascending: true,
          });

      if (profilesError) {
        throw profilesError;
      }

      const profileRows = (profiles ?? []) as Profile[];

      /*
       * Get registration counts for students.
       * We count currently registered registrations.
       */
      const { data: registrations, error: registrationsError } =
        await supabase
          .from('event_registrations')
          .select('student_id')
          .eq('status', 'registered');

      if (registrationsError) {
        throw registrationsError;
      }

      /*
       * Get event counts for organizers.
       */
      const { data: organizerEvents, error: eventsError } =
        await supabase
          .from('events')
          .select('organizer_id');

      if (eventsError) {
        throw eventsError;
      }

      const studentRegistrationCounts =
        new Map<string, number>();

      (registrations ?? []).forEach((registration) => {
        const studentId = registration.student_id;

        studentRegistrationCounts.set(
          studentId,
          (studentRegistrationCounts.get(studentId) ?? 0) + 1
        );
      });

      const organizerEventCounts =
        new Map<string, number>();

      (organizerEvents ?? []).forEach((event) => {
        const organizerId = event.organizer_id;

        organizerEventCounts.set(
          organizerId,
          (organizerEventCounts.get(organizerId) ?? 0) + 1
        );
      });

      const displayUsers: DisplayUser[] =
        profileRows.map((profile) => {
          const isStudent = profile.role === 'student';

          return {
            id: profile.id,
            name:
              profile.full_name?.trim() ||
              'Unnamed user',
            role: profile.role,
            department:
              profile.department?.trim() ||
              profile.organization?.trim() ||
              'Not specified',
            year:
              profile.year_of_study?.trim() ||
              undefined,
            organization:
              profile.organization?.trim() ||
              undefined,
            designation:
              profile.designation?.trim() ||
              undefined,
            events: isStudent
              ? studentRegistrationCounts.get(profile.id) ?? 0
              : organizerEventCounts.get(profile.id) ?? 0,
            profileCompleted:
              profile.profile_completed,
          };
        });

      setUsers(displayUsers);
    } catch (error) {
      console.error('Admin users error:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load users.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Students' &&
          user.role === 'student') ||
        (activeFilter === 'Organizers' &&
          user.role === 'organizer');

      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        (user.organization ?? '')
          .toLowerCase()
          .includes(query) ||
        (user.designation ?? '')
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [users, activeFilter, search]);

  const students = users.filter(
    (user) => user.role === 'student'
  ).length;

  const organizers = users.filter(
    (user) => user.role === 'organizer'
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
        />

        <Text style={styles.loadingText}>
          Loading platform users...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.navy}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              ADMIN SPACE
            </Text>

            <Text style={styles.title}>
              Users
            </Text>

            <Text style={styles.subtitle}>
              People currently registered on the platform.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="people-outline"
              size={23}
              color={colors.navy}
            />
          </View>
        </View>

        {/* Error */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colors.danger}
            />

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn't load users
              </Text>

              <Text style={styles.errorText}>
                {errorMessage}
              </Text>

              <Pressable
                onPress={loadUsers}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>
                  Try again
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {users.length}
            </Text>

            <Text style={styles.overviewLabel}>
              Total users
            </Text>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {students}
            </Text>

            <Text style={styles.overviewLabel}>
              Students
            </Text>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {organizers}
            </Text>

            <Text style={styles.overviewLabel}>
              Organizers
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textMuted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search people..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Platform users
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredUsers.length} user
              {filteredUsers.length === 1
                ? ''
                : 's'} shown
            </Text>
          </View>
        </View>

        {/* Real users */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={24}
                color={colors.navy}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No users found
            </Text>

            <Text style={styles.emptyText}>
              Try changing the filter or search term.
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View
              key={user.id}
              style={styles.userCard}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text
                    style={styles.userName}
                    numberOfLines={1}
                  >
                    {user.name}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      user.profileCompleted
                        ? styles.activeBadge
                        : styles.incompleteBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        user.profileCompleted
                          ? styles.activeDot
                          : styles.incompleteDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        user.profileCompleted
                          ? styles.activeText
                          : styles.incompleteText,
                      ]}
                    >
                      {user.profileCompleted
                        ? 'Profile complete'
                        : 'Incomplete'}
                    </Text>
                  </View>
                </View>

                <View style={styles.roleRow}>
                  <View
                    style={[
                      styles.roleBadge,
                      user.role === 'student'
                        ? styles.studentBadge
                        : styles.organizerBadge,
                    ]}
                  >
                    <Ionicons
                      name={
                        user.role === 'student'
                          ? 'person-outline'
                          : 'briefcase-outline'
                      }
                      size={11}
                      color={colors.navy}
                    />

                    <Text style={styles.roleText}>
                      {user.role === 'student'
                        ? 'Student'
                        : 'Organizer'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.department}>
                  {user.department}
                </Text>

                {user.role === 'organizer' &&
                  user.designation && (
                    <Text style={styles.designation}>
                      {user.designation}
                    </Text>
                  )}

                <View style={styles.metaRow}>
                  {user.year && (
                    <>
                      <Text style={styles.metaText}>
                        {user.year}
                      </Text>

                      <View style={styles.metaDot} />
                    </>
                  )}

                  <Text style={styles.metaText}>
                    {user.events}{' '}
                    {user.role === 'student'
                      ? user.events === 1
                        ? 'registration'
                        : 'registrations'
                      : user.events === 1
                        ? 'event'
                        : 'events'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Privacy note */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={colors.navy}
            />
          </View>

          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              Admin-only access
            </Text>

            <Text style={styles.noteText}>
              This directory is available only to Admins.
              Students cannot access or view platform users.
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
    paddingTop: 58,
    paddingBottom: 110,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
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
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  title: {
    color: colors.navy,
    fontSize: 29,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 17,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E9BABA',
  },

  errorContent: {
    flex: 1,
    marginLeft: 10,
  },

  errorTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '800',
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 3,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 7,
  },

  retryText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  overviewCard: {
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },

  overviewNumber: {
    color: colors.yellow,
    fontSize: 23,
    fontWeight: '800',
  },

  overviewLabel: {
    color: '#AAB2C2',
    fontSize: 9.5,
    marginTop: 2,
  },

  overviewDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#33415C',
  },

  searchBox: {
    height: 50,
    backgroundColor: colors.cream,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 9,
  },

  filters: {
    gap: 8,
    paddingBottom: 21,
  },

  filterButton: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  filterTextActive: {
    color: colors.white,
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 3,
  },

  userCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarText: {
    color: colors.yellow,
    fontSize: 18,
    fontWeight: '800',
  },

  userInfo: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userName: {
    flex: 1,
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    marginRight: 6,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  activeBadge: {
    backgroundColor: '#EAF5EE',
  },

  incompleteBadge: {
    backgroundColor: '#FFF5DD',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
  },

  activeDot: {
    backgroundColor: colors.success,
  },

  incompleteDot: {
    backgroundColor: colors.warning,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  activeText: {
    color: colors.success,
  },

  incompleteText: {
    color: colors.warning,
  },

  roleRow: {
    flexDirection: 'row',
    marginTop: 5,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  studentBadge: {
    backgroundColor: '#EEF1F6',
  },

  organizerBadge: {
    backgroundColor: '#FFF5DD',
  },

  roleText: {
    color: colors.navy,
    fontSize: 8.5,
    fontWeight: '800',
    marginLeft: 4,
  },

  department: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginTop: 6,
  },

  designation: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  metaText: {
    color: colors.textMuted,
    fontSize: 9.5,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginHorizontal: 6,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 4,
    textAlign: 'center',
  },

  noteCard: {
    backgroundColor: '#EEF1F6',
    borderRadius: 17,
    padding: 13,
    flexDirection: 'row',
    marginTop: 5,
  },

  noteIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  noteContent: {
    flex: 1,
  },

  noteTitle: {
    color: colors.navy,
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  noteText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
});