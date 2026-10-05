import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

export default function VerifyEmailScreen() {
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email_confirmed_at) {
        setVerified(true);
      }
    } catch (error) {
      console.error('Verification check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const continueToApp = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, profile_completed')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Profile lookup error:', error);
        router.replace('/login');
        return;
      }

      if (profile?.role === 'organizer') {
        router.replace(
          '/(organizer)/home' as any
        );
        return;
      }

      if (profile?.role === 'admin') {
        router.replace(
          '/(admin)/home' as any
        );
        return;
      }

      router.replace(
        '/(student)/home' as any
      );
    } catch (error) {
      console.error(
        'Continue to app error:',
        error
      );

      router.replace('/login');
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
        />

        <Text style={styles.checkingText}>
          Checking verification...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          verified
            ? styles.successCircle
            : styles.pendingCircle,
        ]}
      >
        <Ionicons
          name={
            verified
              ? 'checkmark'
              : 'mail-outline'
          }
          size={42}
          color={
            verified
              ? colors.white
              : colors.navy
          }
        />
      </View>

      {verified ? (
        <>
          <Text style={styles.title}>
            Email verified
          </Text>

          <Text style={styles.description}>
            Your email has been successfully verified.
            You can now continue to Campus Events.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={continueToApp}
          >
            <Text style={styles.primaryButtonText}>
              Continue to App
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={colors.navy}
            />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>
            Check your email
          </Text>

          <Text style={styles.description}>
            We couldn't confirm the verification from
            this screen yet. Open the verification email
            and tap the verification link.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={checkVerification}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={colors.navy}
            />

            <Text style={styles.primaryButtonText}>
              Check Again
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.replace('/login')
            }
          >
            <Text style={styles.secondaryButtonText}>
              Back to Login
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  checkingText: {
    marginTop: 15,
    fontSize: 14,
    color: colors.textSecondary,
  },

  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  successCircle: {
    backgroundColor: colors.success,
  },

  pendingCircle: {
    backgroundColor: colors.yellow,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },

  description: {
    marginTop: 12,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  primaryButton: {
    width: '100%',
    maxWidth: 330,
    height: 53,
    marginTop: 28,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  secondaryButton: {
    height: 48,
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});