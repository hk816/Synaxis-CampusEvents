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
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Profile = {
  full_name: string | null;
  roll_number: string | null;
  department: string | null;
  year_of_study: number | null;
  phone: string | null;
  role: string | null;
};

export default function StudentProfileScreen() {
  const [profile, setProfile] =
    useState<Profile | null>(null);
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

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          full_name,
          roll_number,
          department,
          year_of_study,
          phone,
          role
        `
        )
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data.role !== 'student') {
        if (data.role === 'organizer') {
          router.replace('/organizer-home');
        } else if (data.role === 'admin') {
          router.replace('/admin-home');
        }
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error(
        'Load student profile error:',
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

  const logout = async () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
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
                'Logout error:',
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
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      </SafeAreaView>
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
      .join('') || 'S';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              STUDENT SPACE
            </Text>

            <Text style={styles.title}>
              Profile
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              router.push('/notifications')
            }
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.navy}
            />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {profile.full_name || 'Student'}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              STUDENT
            </Text>
          </View>

          {profile.roll_number && (
            <Text style={styles.rollNumber}>
              {profile.roll_number}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            PERSONAL INFORMATION
          </Text>

          <View style={styles.infoCard}>
            <ProfileRow
              icon="person-outline"
              label="Full Name"
              value={
                profile.full_name ||
                'Not provided'
              }
            />

            <ProfileRow
              icon="id-card-outline"
              label="Roll Number"
              value={
                profile.roll_number ||
                'Not provided'
              }
            />

            <ProfileRow
              icon="business-outline"
              label="Department"
              value={
                profile.department ||
                'Not provided'
              }
            />

            <ProfileRow
              icon="school-outline"
              label="Year of Study"
              value={
                profile.year_of_study
                  ? `Year ${profile.year_of_study}`
                  : 'Not provided'
              }
            />

            <ProfileRow
              icon="call-outline"
              label="Phone Number"
              value={
                profile.phone ||
                'Not provided'
              }
              last
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ACCOUNT
          </Text>

          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() =>
                router.push('/notifications')
              }
            >
              <View style={styles.menuIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={19}
                  color={colors.navy}
                />
              </View>

              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>
                  Notifications
                </Text>

                <Text style={styles.menuSubtitle}>
                  View your latest updates
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.logoutButton,
            loggingOut && styles.disabled,
          ]}
          onPress={logout}
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
                Log Out
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.profileRow,
        !last && styles.profileRowBorder,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.navy}
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>
          {label}
        </Text>

        <Text style={styles.rowValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 21,
    paddingBottom: 35,
  },

  header: {
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },

  notificationButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 25,
    marginBottom: 22,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 27,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  avatarText: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.navy,
  },

  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },

  roleBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 7,
  },

  roleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.navy,
  },

  rollNumber: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 7,
  },

  section: {
    marginBottom: 19,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.textSecondary,
    marginBottom: 9,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },

  profileRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowContent: {
    flex: 1,
    marginLeft: 11,
  },

  rowLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },

  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 3,
  },

  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },

  menuRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuContent: {
    flex: 1,
    marginLeft: 11,
  },

  menuTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  menuSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 3,
  },

  logoutButton: {
    height: 51,
    borderRadius: 14,
    backgroundColor: '#FBE5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },

  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
  },

  disabled: {
    opacity: 0.7,
  },
});