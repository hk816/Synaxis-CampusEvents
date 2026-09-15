import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type Role = 'student' | 'organizer';

export default function RegisterScreen() {
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetFields = () => {
    setFullName('');
    setEmail('');
    setRollNumber('');
    setDepartment('');
    setYearOfStudy('');
    setPhone('');
    setOrganization('');
    setPassword('');
    setConfirmPassword('');
  };

  const changeRole = (newRole: Role) => {
    setRole(newRole);
    resetFields();
  };

  const validate = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing information', 'Please enter your full name.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Missing information', 'Please enter your email address.');
      return false;
    }

    if (!email.trim().includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return false;
    }

    if (!department.trim()) {
      Alert.alert('Missing information', 'Please enter your department.');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Missing information', 'Please enter your phone number.');
      return false;
    }

    if (role === 'student') {
      if (!rollNumber.trim()) {
        Alert.alert('Missing information', 'Please enter your roll number.');
        return false;
      }

      if (!yearOfStudy.trim()) {
        Alert.alert(
          'Missing information',
          'Please enter your year of study.'
        );
        return false;
      }
    }

    if (role === 'organizer' && !organization.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your organization.'
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must be at least 6 characters.'
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please make sure both passwords are the same.'
      );
      return false;
    }

    return true;
  };

  const handleStudentRegister = async () => {
    /*
     * Student registration now uses Supabase Auth directly.
     *
     * The database trigger creates the profiles row automatically.
     */

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRollNumber = rollNumber
      .trim()
      .toUpperCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'student',
          roll_number: normalizedRollNumber,
          department: department.trim(),
          year_of_study: yearOfStudy.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      console.error('Student signup error:', error);

      let message = error.message;

      if (
        message.toLowerCase().includes('already registered') ||
        message.toLowerCase().includes('already exists')
      ) {
        message =
          'This email address is already registered. Please use another email or log in.';
      }

      Alert.alert('Registration failed', message);
      return;
    }

    if (!data.user) {
      Alert.alert(
        'Registration failed',
        'The account could not be created. Please try again.'
      );
      return;
    }

    /*
     * When email confirmation is enabled, Supabase normally
     * returns a user without an active session.
     */

    Alert.alert(
      'Check your email',
      `Your student account has been created.\n\nA verification email has been sent to ${normalizedEmail}.\n\nPlease verify your email before logging in.`,
      [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/login'),
        },
      ]
    );
  };

  const handleOrganizerRegister = async () => {
    /*
     * Organizer registration remains on the existing Edge Function.
     */

    const { data, error } = await supabase.functions.invoke(
      'organizer-register',
      {
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          department: department.trim(),
          organization: organization.trim(),
          phone: phone.trim(),
          password,
        },
      }
    );

    if (error) {
      console.error(
        'Organizer registration error:',
        error
      );

      Alert.alert(
        'Registration failed',
        error.message || 'Please try again.'
      );
      return;
    }

    if (data?.error) {
      Alert.alert(
        'Registration failed',
        data.error
      );
      return;
    }

    Alert.alert(
      'Check your email',
      `Your organizer account has been created.\n\nA verification email has been sent to ${email.trim()}.\n\nPlease verify your email before logging in.`,
      [
        {
          text: 'Go to Login',
          onPress: () => router.replace('/login'),
        },
      ]
    );
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      if (role === 'student') {
        await handleStudentRegister();
      } else {
        await handleOrganizerRegister();
      }
    } catch (error) {
      console.error(
        'Registration exception:',
        error
      );

      Alert.alert(
        'Registration failed',
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>
            Campus Events
          </Text>

          <Text style={styles.title}>
            Create your account
          </Text>

          <Text style={styles.subtitle}>
            Join the campus event community
          </Text>
        </View>

        <View style={styles.roleContainer}>
          <Pressable
            style={[
              styles.roleButton,
              role === 'student' &&
                styles.roleButtonActive,
            ]}
            onPress={() =>
              changeRole('student')
            }
          >
            <Text
              style={[
                styles.roleText,
                role === 'student' &&
                  styles.roleTextActive,
              ]}
            >
              Student
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.roleButton,
              role === 'organizer' &&
                styles.roleButtonActive,
            ]}
            onPress={() =>
              changeRole('organizer')
            }
          >
            <Text
              style={[
                styles.roleText,
                role === 'organizer' &&
                  styles.roleTextActive,
              ]}
            >
              Organizer
            </Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {role === 'student'
              ? 'Student Registration'
              : 'Organizer Registration'}
          </Text>

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={
              colors.textMuted
            }
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>
            Email Address
          </Text>

          <TextInput
            style={styles.input}
            placeholder={
              role === 'student'
                ? 'Enter your college email'
                : 'Enter your email'
            }
            placeholderTextColor={
              colors.textMuted
            }
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {role === 'student' && (
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
            </>
          )}

          <Text style={styles.label}>
            Department
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your department"
            placeholderTextColor={
              colors.textMuted
            }
            value={department}
            onChangeText={setDepartment}
            autoCapitalize="words"
          />

          {role === 'student' && (
            <>
              <Text style={styles.label}>
                Year of Study
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Example: 2"
                placeholderTextColor={
                  colors.textMuted
                }
                value={yearOfStudy}
                onChangeText={setYearOfStudy}
                keyboardType="numeric"
              />
            </>
          )}

          {role === 'organizer' && (
            <>
              <Text style={styles.label}>
                Organization
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter organization name"
                placeholderTextColor={
                  colors.textMuted
                }
                value={organization}
                onChangeText={setOrganization}
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor={
              colors.textMuted
            }
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Minimum 6 characters"
            placeholderTextColor={
              colors.textMuted
            }
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>
            Confirm Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor={
              colors.textMuted
            }
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {role === 'student' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Email verification required
              </Text>

              <Text style={styles.infoText}>
                A verification link will be sent
                to your email. Verify your email
                before logging in with your roll
                number and password.
              </Text>
            </View>
          )}

          {role === 'organizer' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Email verification required
              </Text>

              <Text style={styles.infoText}>
                A verification link will be sent
                to your email. Verify your email
                before logging in.
              </Text>
            </View>
          )}

          <Pressable
            style={[
              styles.registerButton,
              loading &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color={colors.white}
              />
            ) : (
              <Text
                style={
                  styles.registerButtonText
                }
              >
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.replace('/login')
            }
          >
            <Text style={styles.loginLink}>
              {' '}
              Log in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
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

  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },

  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },

  roleButtonActive: {
    backgroundColor: colors.navy,
  },

  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  roleTextActive: {
    color: colors.white,
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 20,
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

  registerButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  registerButtonDisabled: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
});