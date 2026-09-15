import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_at: string;
  end_at: string;
  capacity: number;
  image_url: string | null;
  status: string;
};

const categories = [
  'All',
  'Technology',
  'Cultural',
  'Sports',
  'Academic',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExploreScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          category,
          location,
          start_at,
          end_at,
          capacity,
          image_url,
          status
        `
        )
        .eq('status', 'approved')
        .order('start_at', { ascending: true });

      if (category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setEvents((data ?? []) as EventItem[]);
    } catch (error) {
      console.error('Load student events error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [category])
  );

  const filteredEvents = events.filter((event) => {
    const text = search.trim().toLowerCase();

    if (!text) return true;

    return (
      event.title.toLowerCase().includes(text) ||
      event.description.toLowerCase().includes(text) ||
      event.location.toLowerCase().includes(text) ||
      event.category.toLowerCase().includes(text)
    );
  });

  const renderEvent = ({
    item,
  }: {
    item: EventItem;
  }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/event-details',
          params: { eventId: item.id },
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {item.category}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
        />
      </View>

      <Text style={styles.eventTitle}>
        {item.title}
      </Text>

      <Text
        style={styles.description}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.infoRow}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.textSecondary}
        />

        <Text style={styles.infoText}>
          {formatDate(item.start_at)} ·{' '}
          {formatTime(item.start_at)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons
          name="location-outline"
          size={16}
          color={colors.textSecondary}
        />

        <Text
          style={styles.infoText}
          numberOfLines={1}
        >
          {item.location}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.capacity}>
          <Ionicons
            name="people-outline"
            size={15}
            color={colors.textSecondary}
          />

          <Text style={styles.capacityText}>
            Capacity {item.capacity}
          </Text>
        </View>

        <Text style={styles.viewText}>
          View Event
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          CAMPUS EVENTS
        </Text>

        <Text style={styles.title}>
          Explore Events
        </Text>

        <Text style={styles.subtitle}>
          Discover what's happening around campus.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search events..."
            placeholderTextColor={colors.textMuted}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          filteredEvents.length === 0 &&
            styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEvents();
            }}
          />
        }
        ListHeaderComponent={
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.filterChip,
                  category === item &&
                    styles.filterChipSelected,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    category === item &&
                      styles.filterTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            )}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator
                size="large"
                color={colors.yellowDark}
              />

              <Text style={styles.loadingText}>
                Loading events...
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="calendar-outline"
                size={34}
                color={colors.textMuted}
              />

              <Text style={styles.emptyTitle}>
                No events found
              </Text>

              <Text style={styles.emptyText}>
                Try another search or category.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 3,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  searchBox: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.navy,
  },

  categoryRow: {
    gap: 8,
    paddingVertical: 10,
  },

  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.white,
  },

  list: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 12,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },

  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  capacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  capacityText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  viewText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
});