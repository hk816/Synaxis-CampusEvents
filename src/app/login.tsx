import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type LoginMode = 'student' | 'staff';

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('student');
  const [loading, setLoading] = useState(false);

  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setRollNumber('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async () => {
    if (mode === 'student' && !rollNumber.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your roll number.'
      );
      return;
    }

    if (mode === 'staff' && !email.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your email address.'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        'Missing information',
        'Please enter your password.'
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === 'student') {
        /*
         * Student login:
         * Roll Number + Password
         *
         * The Edge Function finds the student's real
         * verified email behind the scenes.
         */
        const { data, error } =
          await supabase.functions.invoke(
            'student-login',
            {
              body: {
                rollNumber: rollNumber
                  .trim()
                  .toUpperCase(),
                password,
              },
            }
          );

        if (error) {
          console.error(
            'Student login error:',
            error
          );

          Alert.alert(
            'Login failed',
            error.message ||
              'Unable to log in. Please try again.'
          );
          return;
        }

        if (data?.error) {
          Alert.alert(
            data.emailNotVerified
              ? 'Email verification required'
              : 'Login failed',
            data.error
          );
          return;
        }

        if (!data?.session) {
          Alert.alert(
            'Login failed',
            'No login session was returned.'
          );
          return;
        }

        /*
         * Store the authenticated Supabase session.
         */
        const { error: sessionError } =
          await supabase.auth.setSession({
            access_token:
              data.session.access_token,
            refresh_token:
              data.session.refresh_token,
          });

        if (sessionError) {
          console.error(
            'Session error:',
            sessionError
          );

          Alert.alert(
            'Login failed',
            'Could not establish your session.'
          );
          return;
        }

        router.replace('/student-home');
        return;
      }

      /*
       * Staff login:
       *
       * This is used for Organizer and Admin accounts.
       * The actual role comes from profiles.role.
       */
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError) {
        console.error(
          'Staff login error:',
          authError
        );

        if (
          authError.message
            .toLowerCase()
            .includes('email not confirmed')
        ) {
          Alert.alert(
            'Email verification required',
            'Please verify your email before logging in.'
          );
        } else {
          Alert.alert(
            'Login failed',
            authError.message ||
              'Invalid email or password.'
          );
        }

        return;
      }

      if (!authData.user) {
        Alert.alert(
          'Login failed',
          'User account could not be found.'
        );
        return;
      }

      /*
       * Get the actual role from the database.
       */
      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, role, profile_completed'
          )
          .eq('id', authData.user.id)
          .single();

      if (profileError || !profile) {
        console.error(
          'Profile lookup error:',
          profileError
        );

        await supabase.auth.signOut();

        Alert.alert(
          'Login failed',
          'Your account profile could not be loaded.'
        );
        return;
      }

      /*
       * Never trust the selected login tab as the role.
       * The database role is authoritative.
       */
      if (
        profile.role !== 'organizer' &&
        profile.role !== 'admin'
      ) {
        await supabase.auth.signOut();

        Alert.alert(
          'Wrong login type',
          'This account is a Student account. Please use Student Login.'
        );
        return;
      }

      if (!profile.profile_completed) {
        router.replace('/complete-profile');
        return;
      }

      if (profile.role === 'admin') {
        router.replace('/admin-home');
        return;
      }

      if (profile.role === 'organizer') {
        router.replace('/organizer-home');
        return;
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Login failed',
        'Your account role is not supported.'
      );
    } catch (error) {
      console.error(
        'Unexpected login error:',
        error
      );

      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>
            Campus Events
          </Text>

          <Text style={styles.title}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue to Campus Events
          </Text>
        </View>

        {/* LOGIN TYPE */}
        <View style={styles.modeContainer}>
          <Pressable
            style={[
              styles.modeButton,
              mode === 'student' &&
                styles.modeButtonActive,
            ]}
            onPress={() =>
              switchMode('student')
            }
          >
            <Text
              style={[
                styles.modeText,
                mode === 'student' &&
                  styles.modeTextActive,
              ]}
            >
              Student
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              mode === 'staff' &&
                styles.modeButtonActive,
            ]}
            onPress={() =>
              switchMode('staff')
            }
          >
            <Text
              style={[
                styles.modeText,
                mode === 'staff' &&
                  styles.modeTextActive,
              ]}
            >
              Organizer / Admin
            </Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.loginType}>
            {mode === 'student'
              ? 'Student Login'
              : 'Organizer / Admin Login'}
          </Text>

          {mode === 'student' ? (
            <>
              <Text style={styles.label}>
                Roll Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your roll number"
                placeholderTextColor={
                  colors.textMuted
                }
                value={rollNumber}
                onChangeText={setRollNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text style={styles.helperText}>
                Use the roll number you registered
                with.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                Email Address
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={
                  colors.textMuted
                }
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={
              colors.textMuted
            }
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {mode === 'student' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Student login
              </Text>

              <Text style={styles.infoText}>
                Use your roll number and password.
                Your verified email is used
                automatically for authentication.
              </Text>
            </View>
          )}

          {mode === 'staff' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Organizer / Admin login
              </Text>

              <Text style={styles.infoText}>
                Use the email and password associated
                with your account. Your actual role
                determines which dashboard you can
                access.
              </Text>
            </View>
          )}

          <Pressable
            style={[
              styles.loginButton,
              loading &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color={colors.white}
              />
            ) : (
              <Text
                style={styles.loginButtonText}
              >
                Log In
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don't have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.push('/register')
            }
          >
            <Text style={styles.registerLink}>
              {' '}
              Create account
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  header: {
    marginBottom: 24,
  },

  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 16,
    letterSpacing: 0.4,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  modeButtonActive: {
    backgroundColor: colors.navy,
  },

  modeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  modeTextActive: {
    color: colors.white,
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loginType: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.cream,
  },

  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  infoBox: {
    backgroundColor: '#FFF7DF',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EED78E',
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 5,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  loginButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
});