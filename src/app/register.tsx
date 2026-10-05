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

  const resetRoleFields = () => {
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

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    resetRoleFields();
  };

  const validate = () => {
    if (!fullName.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your full name.'
      );
      return false;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert(
        'Missing information',
        'Please enter your email address.'
      );
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.'
      );
      return false;
    }

    // STUDENT EMAIL VALIDATION
    if (role === 'student') {
      if (
        !normalizedEmail.endsWith(
          '@woxsen.edu.in'
        )
      ) {
        Alert.alert(
          'Woxsen email required',
          'Students must register using their Woxsen University Outlook email ending with @woxsen.edu.in.'
        );
        return false;
      }
    }

    if (!department.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your department.'
      );
      return false;
    }

    if (!phone.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your phone number.'
      );
      return false;
    }

    // STUDENT VALIDATION
    if (role === 'student') {
      const rawRollNumber =
        rollNumber.trim().toUpperCase();

      if (!rawRollNumber) {
        Alert.alert(
          'Missing information',
          'Please enter your roll number.'
        );
        return false;
      }

      if (
        !/^\d{2}WU\d{7}$/.test(
          rawRollNumber
        )
      ) {
        Alert.alert(
          'Invalid roll number',
          'Enter your Woxsen roll number in the format 25WU0101060. The 3rd and 4th characters must be uppercase WU.'
        );
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

    // ORGANIZER VALIDATION
    if (
      role === 'organizer' &&
      !organization.trim()
    ) {
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

  // -----------------------------------------
  // READ ACTUAL EDGE FUNCTION ERROR
  // -----------------------------------------
  const getFunctionErrorMessage = async (
    error: any
  ) => {
    let message =
      'Registration failed. Please try again.';

    try {
      if (error?.context) {
        const responseText =
          await error.context.text();

        if (responseText) {
          try {
            const responseData =
              JSON.parse(responseText);

            if (responseData?.error) {
              message =
                responseData.error;
            } else if (
              responseData?.message
            ) {
              message =
                responseData.message;
            } else {
              message = responseText;
            }
          } catch {
            message = responseText;
          }
        }
      } else if (error?.message) {
        message = error.message;
      }
    } catch (parseError) {
      console.error(
        'Could not read Edge Function error:',
        parseError
      );

      if (error?.message) {
        message = error.message;
      }
    }

    return message;
  };

  // -----------------------------------------
  // REGISTER
  // -----------------------------------------
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      // =========================================
      // STUDENT REGISTRATION
      // =========================================
      if (role === 'student') {
        const { data, error } =
          await supabase.functions.invoke(
            'student-register',
            {
              body: {
                fullName:
                  fullName.trim(),

                email:
                  email.trim().toLowerCase(),

                rollNumber:
                  rollNumber
                    .trim()
                    .toUpperCase(),

                department:
                  department.trim(),

                yearOfStudy:
                  yearOfStudy.trim(),

                phone:
                  phone.trim(),

                password,
              },
            }
          );

        if (error) {
          console.error(
            'Student registration error:',
            error
          );

          const message =
            await getFunctionErrorMessage(
              error
            );

          Alert.alert(
            'Registration failed',
            message
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
          'Account created successfully',
          'Your student account is ready. You can now log in using your roll number and password.',
          [
            {
              text: 'Go to Login',
              onPress: () =>
                router.replace('/login'),
            },
          ]
        );

        return;
      }

      // =========================================
      // ORGANIZER REGISTRATION
      // =========================================
      const { data, error } =
        await supabase.functions.invoke(
          'organizer-register',
          {
            body: {
              fullName:
                fullName.trim(),

              email:
                email.trim().toLowerCase(),

              department:
                department.trim(),

              organization:
                organization.trim(),

              phone:
                phone.trim(),

              password,
            },
          }
        );

      if (error) {
        console.error(
          'Organizer registration error:',
          error
        );

        const message =
          await getFunctionErrorMessage(
            error
          );

        Alert.alert(
          'Registration failed',
          message
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
        'Account created successfully',
        'Your organizer account is ready. You can now log in using your email and password.',
        [
          {
            text: 'Go to Login',
            onPress: () =>
              router.replace('/login'),
          },
        ]
      );
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
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
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

        {/* ROLE SELECTOR */}
        <View style={styles.roleContainer}>
          <Pressable
            style={[
              styles.roleButton,
              role === 'student' &&
                styles.roleButtonActive,
            ]}
            onPress={() =>
              handleRoleChange('student')
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
              handleRoleChange('organizer')
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

        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {role === 'student'
              ? 'Student Registration'
              : 'Organizer Registration'}
          </Text>

          {/* FULL NAME */}
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

          {/* EMAIL */}
          <Text style={styles.label}>
            {role === 'student'
              ? 'Woxsen University Email'
              : 'Email Address'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={
              role === 'student'
                ? 'yourname@woxsen.edu.in'
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

          {/* STUDENT ROLL NUMBER */}
          {role === 'student' && (
            <>
              <Text style={styles.label}>
                Roll Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Example: 25WU0101060"
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

          {/* DEPARTMENT */}
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

          {/* YEAR OF STUDY */}
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

          {/* ORGANIZATION */}
          {role === 'organizer' && (
            <View>
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
            </View>
          )}

          {/* PHONE */}
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

          {/* PASSWORD */}
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

          {/* CONFIRM PASSWORD */}
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

          {/* STUDENT INFORMATION */}
          {role === 'student' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                Woxsen registration requirements
              </Text>

              <Text style={styles.infoText}>
                Students must use their Woxsen
                University Outlook email ending
                in @woxsen.edu.in.
              </Text>

              <Text
                style={[
                  styles.infoText,
                  styles.infoTextSpacing,
                ]}
              >
                Your account will be ready to
                log in after registration.
              </Text>

              <Text
                style={[
                  styles.infoText,
                  styles.infoTextSpacing,
                ]}
              >
                Roll number format:{' '}
                <Text style={styles.infoBold}>
                  25WU0101060
                </Text>
              </Text>
            </View>
          )}

          {/* CREATE ACCOUNT */}
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

        {/* LOGIN */}
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
              {' '}Log in
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

  infoTextSpacing: {
    marginTop: 5,
  },

  infoBold: {
    fontWeight: '800',
    color: colors.navy,
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