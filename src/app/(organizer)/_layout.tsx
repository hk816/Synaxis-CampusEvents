import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';

export default function OrganizerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: '#8A8F9C',

        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="organizer-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="participants"
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="cube-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden from bottom navigation */}

      <Tabs.Screen
        name="feedback"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="edit-event"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="send-event-update"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}