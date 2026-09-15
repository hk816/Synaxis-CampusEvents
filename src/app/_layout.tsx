import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

type Role = 'student' | 'organizer' | 'admin';

export default function RootLayout() {
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

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
          }
          return;
        }

        const { data: profile } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

        if (mounted) {
          setRole(
            (profile?.role as Role) ?? null
          );
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checking) return;

    const publicRoutes = [
      '/',
      '/login',
      '/register',
    ];

    const isPublicRoute =
      publicRoutes.includes(pathname);

    if (!role) {
      if (!isPublicRoute) {
        router.replace('/login');
      }
      return;
    }

    if (
      pathname === '/login' ||
      pathname === '/register'
    ) {
      if (role === 'student') {
        router.replace('/student-home');
      } else if (role === 'organizer') {
        router.replace('/organizer-home');
      } else {
        router.replace('/admin-home');
      }

      return;
    }

    // -----------------------------
    // STUDENT PROTECTION
    // -----------------------------

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

    // -----------------------------
    // ORGANIZER PROTECTION
    // -----------------------------

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

    // -----------------------------
    // ADMIN PROTECTION
    // -----------------------------

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
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}