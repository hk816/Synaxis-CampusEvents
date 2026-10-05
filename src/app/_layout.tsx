import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '../components/AppToast';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type Role = 'student' | 'organizer' | 'admin';

export default function RootLayout() {
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // -----------------------------------------
  // HANDLE EMAIL CONFIRMATION DEEP LINK
  // -----------------------------------------
  useEffect(() => {
    let mounted = true;

    const handleAuthUrl = async (url: string) => {
      try {
        if (!url.startsWith('campusevents://')) {
          return;
        }

        console.log('Auth deep link received:', url);

        const hashIndex = url.indexOf('#');

        if (hashIndex === -1) {
          console.log('No authentication hash found.');
          return;
        }

        const hash = url.substring(hashIndex + 1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          console.log('No auth session found in deep link.');
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error(
            'Failed to establish session from confirmation link:',
            error
          );
          return;
        }

        console.log('Email confirmation session established.');

        if (mounted) {
          setEmailConfirmed(true);
          setChecking(false);

          // Show the confirmation success page
          router.replace('/verify-email');
        }
      } catch (error) {
        console.error(
          'Error handling authentication deep link:',
          error
        );
      }
    };

    // App opened from the confirmation email
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthUrl(url);
      }
    });

    // App already running when confirmation link is opened
    const subscription = Linking.addEventListener(
      'url',
      ({ url }) => {
        handleAuthUrl(url);
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  // -----------------------------------------
  // CHECK CURRENT AUTH SESSION
  // -----------------------------------------
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) {
          setRole(null);
          setChecking(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, profile_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      if (mounted) {
        setRole(
          (profile?.role as Role) ?? null
        );
        setChecking(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          if (mounted) {
            setRole(null);
            setChecking(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (mounted) {
          setRole(
            (profile?.role as Role) ?? null
          );
          setChecking(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // -----------------------------------------
  // ROUTE PROTECTION
  // -----------------------------------------
  useEffect(() => {
    if (checking) return;

    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/verify-email',
    ];

    const isPublicRoute =
      publicRoutes.includes(pathname);

    // Allow the email confirmation success page
    if (
      pathname === '/verify-email' &&
      emailConfirmed
    ) {
      return;
    }

    if (!role) {
      if (!isPublicRoute) {
        router.replace('/login');
      }
      return;
    }

    if (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/verify-email'
    ) {
      if (emailConfirmed && pathname === '/verify-email') {
        return;
      }

      if (role === 'student') {
        router.replace('/student-home');
      } else if (role === 'organizer') {
        router.replace('/organizer-home');
      } else {
        router.replace('/admin-home');
      }

      return;
    }

    // STUDENT PROTECTION
    if (
      role === 'student' &&
      (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/users') ||
        pathname.startsWith('/event-approvals') ||
        pathname.startsWith('/analytics') ||
        pathname.startsWith('/organizer')
      )
    ) {
      router.replace('/student-home');
      return;
    }

    // ORGANIZER PROTECTION
    if (
      role === 'organizer' &&
      (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/users') ||
        pathname.startsWith('/event-approvals')
      )
    ) {
      router.replace('/organizer-home');
      return;
    }

    // ADMIN PROTECTION
    if (
      role === 'admin' &&
      (
        pathname.startsWith('/student') ||
        pathname.startsWith('/organizer')
      )
    ) {
      router.replace('/admin-home');
      return;
    }
  }, [
    pathname,
    role,
    checking,
    emailConfirmed,
  ]);

  if (checking) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.cream,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ToastProvider>
    </SafeAreaProvider>
  );
}