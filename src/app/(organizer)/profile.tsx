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
  organization: string | null;
  designation: string | null;
  phone: string | null;
  role: string | null;
};

export default function OrganizerProfile() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [email, setEmail] = useState('');
  const [eventCount, setEventCount] = useState(0);
  const [registrationCount, setRegistrationCount] =
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
          organization,
          designation,
          phone,
          role
        `
        )
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.role !== 'organizer') {
        if (profileData.role === 'student') {
          router.replace('/student-home');
        } else if (
          profileData.role === 'admin'
        ) {
          router.replace('/admin-home');
        }

        return;
      }

      setProfile(profileData);

      // -----------------------------------------
      // Organizer's actual event count
      // -----------------------------------------

      const { count: eventsCount } =
        await supabase
          .from('events')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('organizer_id', user.id);

      setEventCount(eventsCount ?? 0);

      // -----------------------------------------
      // Organizer's actual registrations
      // -----------------------------------------

      const { data: organizerEvents } =
        await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', user.id);

      const eventIds =
        organizerEvents?.map(
          (event) => event.id
        ) ?? [];

      if (eventIds.length === 0) {
        setRegistrationCount(0);
      } else {
        const {
          count: registrations,
        } = await supabase
          .from('event_registrations')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .in('event_id', eventIds)
          .eq('status', 'registered');

        setRegistrationCount(
          registrations ?? 0
        );
      }
    } catch (error) {
      console.error(
        'Load organizer profile error:',
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
                'Organizer logout error:',
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
      .join('') || 'O';

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              ORGANIZER SPACE
            </Text>

            <Text style={styles.title}>
              Profile
            </Text>

            <Text style={styles.subtitle}>
              Manage your organizer information.
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() =>
              router.push(
                '/organizer-notifications'
              )
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

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile.full_name ||
                'Organizer'}
            </Text>

            <Text style={styles.email}>
              {email || 'Email not available'}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={colors.navy}
              />

              <Text style={styles.roleText}>
                Organizer
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Organization details
        </Text>

        <View style={styles.detailsCard}>
          <DetailRow
            icon="business-outline"
            label="Organization"
            value={
              profile.organization ||
              'Not provided'
            }
          />

          <View style={styles.divider} />

          <DetailRow
            icon="briefcase-outline"
            label="Designation"
            value={
              profile.designation ||
              'Event Organizer'
            }
          />

          <View style={styles.divider} />

          <DetailRow
            icon="school-outline"
            label="Department"
            value={
              profile.department ||
              'Not provided'
            }
          />

          <View style={styles.divider} />

          <DetailRow
            icon="mail-outline"
            label="Email"
            value={
              email || 'Not available'
            }
          />

          <View style={styles.divider} />

          <DetailRow
            icon="call-outline"
            label="Phone"
            value={
              profile.phone ||
              'Not provided'
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          Your activity
        </Text>

        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons
                name="calendar-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.activityContent}>
              <Text style={styles.activityNumber}>
                {eventCount}
              </Text>

              <Text style={styles.activityLabel}>
                Events created
              </Text>
            </View>
          </View>

          <View style={styles.activityDivider} />

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons
                name="people-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.activityContent}>
              <Text style={styles.activityNumber}>
                {registrationCount}
              </Text>

              <Text style={styles.activityLabel}>
                Registrations
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.optionsCard}>
          <Pressable
            style={styles.optionRow}
            onPress={loadProfile}
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name="person-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Profile information
              </Text>

              <Text style={styles.optionSubtitle}>
                View your registered information
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
            style={styles.optionRow}
            onPress={() =>
              router.push(
                '/organizer-notifications'
              )
            }
          >
            <View style={styles.optionIcon}>
              <Ionicons
                name="notifications-outline"
                size={19}
                color={colors.navy}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Notifications
              </Text>

              <Text style={styles.optionSubtitle}>
                View event and registration updates
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.logoutButton,
            loggingOut && styles.disabled,
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

        <Text style={styles.versionText}>
          Campus Events • Organizer
        </Text>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={colors.navy}
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  eyebrow: {
    color: colors.yellowDark,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.4,
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

  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  profileCard: {
    backgroundColor: colors.navy,
    borderRadius: 21,
    padding: 19,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  avatarText: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },

  email: {
    color: '#AAB2C2',
    fontSize: 11,
    marginTop: 4,
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
  },

  roleText: {
    color: colors.navy,
    fontSize: 9.5,
    fontWeight: '800',
    marginLeft: 4,
  },

  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },

  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginBottom: 3,
  },

  detailValue: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },

  activityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  activityContent: {
    flex: 1,
  },

  activityNumber: {
    color: colors.navy,
    fontSize: 19,
    fontWeight: '800',
  },

  activityLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
  },

  activityDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },

  optionsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: colors.navy,
    fontSize: 12.5,
    fontWeight: '700',
  },

  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 3,
  },

  logoutButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FBECEC',
    borderWidth: 1,
    borderColor: '#F0CCCC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 7,
  },

  disabled: {
    opacity: 0.7,
  },

  versionText: {
    color: colors.textMuted,
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 17,
  },
});