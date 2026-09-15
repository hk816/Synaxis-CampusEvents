import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type UserRole = 'Student' | 'Organizer';

type User = {
  id: number;
  name: string;
  role: UserRole;
  department: string;
  year?: string;
  events?: number;
  status: 'Active' | 'Inactive';
};

const users: User[] = [
  {
    id: 1,
    name: 'Aarav Mehta',
    role: 'Student',
    department: 'Computer Science',
    year: '3rd Year',
    events: 6,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Diya Reddy',
    role: 'Student',
    department: 'Information Technology',
    year: '2nd Year',
    events: 4,
    status: 'Active',
  },
  {
    id: 3,
    name: 'Rohan Kumar',
    role: 'Student',
    department: 'Electronics',
    year: '3rd Year',
    events: 8,
    status: 'Active',
  },
  {
    id: 4,
    name: 'Sneha Rao',
    role: 'Student',
    department: 'Mechanical',
    year: '4th Year',
    events: 3,
    status: 'Inactive',
  },
  {
    id: 5,
    name: 'Rahul Sharma',
    role: 'Organizer',
    department: 'Cultural Committee',
    events: 8,
    status: 'Active',
  },
  {
    id: 6,
    name: 'Priya Nair',
    role: 'Organizer',
    department: 'Technical Club',
    events: 5,
    status: 'Active',
  },
  {
    id: 7,
    name: 'Arjun Rao',
    role: 'Organizer',
    department: 'Music Club',
    events: 3,
    status: 'Active',
  },
  {
    id: 8,
    name: 'Kiran Kumar',
    role: 'Organizer',
    department: 'E-Cell',
    events: 6,
    status: 'Inactive',
  },
];

const filters = ['All', 'Students', 'Organizers'];

export default function AdminUsers() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Students' &&
          user.role === 'Student') ||
        (activeFilter === 'Organizers' &&
          user.role === 'Organizer');

      const query = search.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const students = users.filter(
    (user) => user.role === 'Student'
  ).length;

  const organizers = users.filter(
    (user) => user.role === 'Organizer'
  ).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMIN SPACE</Text>
            <Text style={styles.title}>Users</Text>
            <Text style={styles.subtitle}>
              People on the platform.
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
              {filteredUsers.length === 1 ? '' : 's'} shown
            </Text>
          </View>
        </View>

        {/* User cards */}
        {filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0)}
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
                    user.status === 'Active'
                      ? styles.activeBadge
                      : styles.inactiveBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      user.status === 'Active'
                        ? styles.activeDot
                        : styles.inactiveDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      user.status === 'Active'
                        ? styles.activeText
                        : styles.inactiveText,
                    ]}
                  >
                    {user.status}
                  </Text>
                </View>
              </View>

              <View style={styles.roleRow}>
                <View
                  style={[
                    styles.roleBadge,
                    user.role === 'Student'
                      ? styles.studentBadge
                      : styles.organizerBadge,
                  ]}
                >
                  <Ionicons
                    name={
                      user.role === 'Student'
                        ? 'person-outline'
                        : 'briefcase-outline'
                    }
                    size={11}
                    color={colors.navy}
                  />

                  <Text style={styles.roleText}>
                    {user.role}
                  </Text>
                </View>
              </View>

              <Text style={styles.department}>
                {user.department}
              </Text>

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
                  {user.events === 1
                    ? 'event'
                    : 'events'}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Privacy / access note */}
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
              This user directory is only available to Admins.
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
    backgroundColor: colors.white,
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

  inactiveBadge: {
    backgroundColor: '#F0F1F4',
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

  inactiveDot: {
    backgroundColor: colors.textMuted,
  },

  statusText: {
    fontSize: 8.5,
    fontWeight: '800',
  },

  activeText: {
    color: colors.success,
  },

  inactiveText: {
    color: colors.textMuted,
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