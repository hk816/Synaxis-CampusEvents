import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Profile = {
  full_name: string | null;
  department: string | null;
  phone: string | null;
  role: string | null;
};

export default function AdminProfile() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [email, setEmail] = useState('');

  const [studentCount, setStudentCount] =
    useState(0);
  const [organizerCount, setOrganizerCount] =
    useState(0);
  const [eventCount, setEventCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setEmail(user.email ?? '');

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          `
          full_name,
          department,
          phone,
          role
        `
        )
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.role !== 'admin') {
        if (profileData.role === 'student') {
          router.replace('/student-home');
        } else if (
          profileData.role === 'organizer'
        ) {
          router.replace('/organizer-home');
        }

        return;
      }

      setProfile(profileData);

      // -----------------------------------------
      // Platform summary
      // -----------------------------------------

      const { count: students } =
        await supabase
          .from('profiles')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('role', 'student');

      const { count: organizers } =
        await supabase
          .from('profiles')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('role', 'organizer');

      const { count: events } =
        await supabase
          .from('events')
          .select('id', {
            count: 'exact',
            head: true,
          });

      setStudentCount(students ?? 0);
      setOrganizerCount(organizers ?? 0);
      setEventCount(events ?? 0);
    } catch (error) {
      console.error(
        'Load admin profile error:',
        error
      );

      Alert.alert(
        'Unable to load profile',
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out?',
      'You will be signed out of the Admin account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);

              const { error } =
                await supabase.auth.signOut();

              if (error) throw error;

              router.replace('/login');
            } catch (error: any) {
              console.error(
                'Admin logout error:',
                error
              );

              Alert.alert(
                'Unable to log out',
                error?.message ??
                  'Please try again.'
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.yellowDark}
        />
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const initials =
    profile.full_name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join('') || 'AD';

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              ADMIN SPACE
            </Text>

            <Text style={styles.title}>
              Profile
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="person-outline"
              size={22}
              color={colors.navy}
            />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.full_name || 'Admin'}
            </Text>

            <Text style={styles.email}>
              {email || 'Email not available'}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={12}
                color={colors.navy}
              />

              <Text style={styles.roleText}>
                Administrator
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Account information
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={
              email || 'Not available'
            }
          />

          <InfoRow
            icon="business-outline"
            label="Department"
            value={
              profile.department ||
              'Administration'
            }
          />

          <InfoRow
            icon="call-outline"
            label="Phone"
            value={
              profile.phone ||
              'Not provided'
            }
          />

          <InfoRow
            icon="shield-outline"
            label="Access level"
            value="Platform Administrator"
          />

          <InfoRow
            icon="checkmark-circle-outline"
            label="Account status"
            value="Active"
            valueColor={colors.success}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Admin responsibilities
        </Text>

        <View style={styles.responsibilityCard}>
          <ResponsibilityRow
            icon="people-outline"
            title="Manage users"
            text="View and manage student and organizer accounts."
          />

          <ResponsibilityRow
            icon="checkmark-circle-outline"
            title="Review events"
            text="Approve or reject event submissions from organizers."
          />

          <ResponsibilityRow
            icon="bar-chart-outline"
            title="Platform analytics"
            text="Monitor overall events, registrations and feedback."
          />
        </View>

        <Text style={styles.sectionTitle}>
          Platform summary
        </Text>

        <View style={styles.summaryCard}>
          <SummaryItem
            value={String(studentCount)}
            label="Students"
          />

          <View style={styles.summaryDivider} />

          <SummaryItem
            value={String(organizerCount)}
            label="Organizers"
          />

          <View style={styles.summaryDivider} />

          <SummaryItem
            value={String(eventCount)}
            label="Events"
          />
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.navy}
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Restricted account
            </Text>

            <Text style={styles.securityText}>
              Admin access is restricted to authorized
              administrators. Students and organizers
              cannot access Admin sections.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.logoutButton,
            loggingOut && styles.logoutDisabled,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator
              color={colors.danger}
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={19}
                color={colors.danger}
              />

              <Text style={styles.logoutText}>
                Log out
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.navy}
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.infoValue,
            valueColor
              ? { color: valueColor }
              : null,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ResponsibilityRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.responsibilityRow}>
      <View style={styles.responsibilityIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.navy}
        />
      </View>

      <View style={styles.responsibilityContent}>
        <Text style={styles.responsibilityTitle}>
          {title}
        </Text>

        <Text style={styles.responsibilityText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function SummaryItem({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 27,
    fontWeight: '800',
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    color: colors.navy,
    fontSize: 19,
    fontWeight: '900',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '800',
  },

  email: {
    color: '#AAB2C2',
    fontSize: 10.5,
    marginTop: 3,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
  },

  roleText: {
    color: colors.navy,
    fontSize: 8.5,
    fontWeight: '800',
    marginLeft: 4,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },

  infoIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoText: {
    flex: 1,
  },

  infoLabel: {
    color: colors.textMuted,
    fontSize: 8.5,
    marginBottom: 2,
  },

  infoValue: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  responsibilityCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },

  responsibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },

  responsibilityIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  responsibilityContent: {
    flex: 1,
  },

  responsibilityTitle: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },

  responsibilityText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  summaryCard: {
    backgroundColor: colors.navy,
    borderRadius: 19,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    color: colors.yellow,
    fontSize: 22,
    fontWeight: '800',
  },

  summaryLabel: {
    color: '#AAB2C2',
    fontSize: 9,
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 31,
    backgroundColor: '#33415C',
  },

  securityCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 17,
    padding: 13,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F0D99B',
    marginBottom: 15,
  },

  securityIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: colors.navy,
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  securityText: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  logoutButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FBECEC',
    borderWidth: 1,
    borderColor: '#F0CCCC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  logoutDisabled: {
    opacity: 0.7,
  },
});