import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

export default function CompleteProfileScreen() {
  const { role } = useLocalSearchParams<{
    role?: string;
  }>();

  const isStudent = role === 'student';

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] =
    useState('');
  const [designation, setDesignation] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
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
          phone,
          department,
          roll_number,
          year_of_study,
          organization,
          designation,
          role
        `
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setDepartment(data.department ?? '');
        setRollNumber(data.roll_number ?? '');
        setYearOfStudy(
          data.year_of_study
            ? String(data.year_of_study)
            : ''
        );
        setOrganization(
          data.organization ?? ''
        );
        setDesignation(
          data.designation ?? ''
        );
      }
    } catch (error) {
      console.error(
        'Load profile error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your full name.'
      );
      return;
    }

    if (!department.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your department.'
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your phone number.'
      );
      return;
    }

    if (isStudent) {
      if (!rollNumber.trim()) {
        Alert.alert(
          'Missing information',
          'Please enter your roll number.'
        );
        return;
      }

      if (!yearOfStudy.trim()) {
        Alert.alert(
          'Missing information',
          'Please enter your year of study.'
        );
        return;
      }
    } else {
      if (!organization.trim()) {
        Alert.alert(
          'Missing information',
          'Please enter your organization.'
        );
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const profileData: Record<
        string,
        string | number | boolean | null
      > = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        department: department.trim(),
        profile_completed: true,
      };

      if (isStudent) {
        profileData.roll_number =
          rollNumber.trim();

        profileData.year_of_study =
          Number(yearOfStudy);
      } else {
        profileData.organization =
          organization.trim();

        profileData.designation =
          designation.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert(
        'Profile completed',
        'Your profile has been saved successfully.'
      );

      if (isStudent) {
        router.replace('/student-home');
      } else {
        router.replace('/organizer-home');
      }
    } catch (error: any) {
      console.error(
        'Save profile error:',
        error
      );

      Alert.alert(
        'Unable to save profile',
        error?.message ??
          'Something went wrong while saving your profile.'
      );
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name="person-outline"
            size={28}
            color={colors.navy}
          />
        </View>

        <Text style={styles.eyebrow}>
          {isStudent
            ? 'STUDENT PROFILE'
            : 'ORGANIZER PROFILE'}
        </Text>

        <Text style={styles.title}>
          Complete your profile
        </Text>

        <Text style={styles.subtitle}>
          Add your details once so Campus Events can
          personalize your experience.
        </Text>

        <View style={styles.card}>
          <Field
            label="FULL NAME"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
          />

          {isStudent ? (
            <>
              <Field
                label="ROLL NUMBER"
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="Enter your roll number"
                autoCapitalize="characters"
              />

              <Field
                label="YEAR OF STUDY"
                value={yearOfStudy}
                onChangeText={setYearOfStudy}
                placeholder="e.g. 1, 2, 3 or 4"
                keyboardType="numeric"
              />
            </>
          ) : (
            <>
              <Field
                label="ORGANIZATION"
                value={organization}
                onChangeText={setOrganization}
                placeholder="Enter organization"
              />

              <Field
                label="DESIGNATION"
                value={designation}
                onChangeText={setDesignation}
                placeholder="e.g. Event Coordinator"
              />
            </>
          )}

          <Field
            label="DEPARTMENT"
            value={department}
            onChangeText={setDepartment}
            placeholder="Enter your department"
          />

          <Field
            label="PHONE NUMBER"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <Pressable
          style={[
            styles.saveButton,
            saving && styles.disabled,
          ]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color={colors.navy}
            />
          ) : (
            <>
              <Text style={styles.saveText}>
                Save & Continue
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.navy}
              />
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'words',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 35,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 4,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 7,
    marginBottom: 22,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },

  field: {
    marginBottom: 15,
  },

  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
    paddingHorizontal: 13,
    fontSize: 13,
    color: colors.navy,
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 17,
  },

  disabled: {
    opacity: 0.7,
  },

  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});