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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Favorite = {
  id: string;
  event_id: string;
  created_at: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_at: string;
  end_at: string;
  capacity: number;
  status: string;
};

type FavoriteItem = Favorite & {
  event: EventItem | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<
    FavoriteItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('event_favorites')
        .select(
          `
          id,
          event_id,
          created_at
        `
        )
        .eq('student_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setFavorites([]);
        return;
      }

      const eventIds = data.map(
        (favorite) => favorite.event_id
      );

      const { data: events, error: eventError } =
        await supabase
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
            status
          `
          )
          .in('id', eventIds)
          .eq('status', 'approved');

      if (eventError) {
        throw eventError;
      }

      const eventMap = new Map(
        (events ?? []).map((event) => [
          event.id,
          event as EventItem,
        ])
      );

      setFavorites(
        data
          .map((favorite) => ({
            ...(favorite as Favorite),
            event:
              eventMap.get(favorite.event_id) ??
              null,
          }))
          .filter((item) => item.event !== null)
      );
    } catch (error) {
      console.error(
        'Load favorites error:',
        error
      );

      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const removeFavorite = async (
    favoriteId: string
  ) => {
    const { error } = await supabase
      .from('event_favorites')
      .delete()
      .eq('id', favoriteId);

    if (error) {
      console.error(
        'Remove favorite error:',
        error
      );
      return;
    }

    setFavorites((current) =>
      current.filter(
        (item) => item.id !== favoriteId
      )
    );
  };

  const renderFavorite = ({
    item,
  }: {
    item: FavoriteItem;
  }) => {
    if (!item.event) return null;

    const event = item.event;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/event-details',
            params: {
              eventId: event.id,
            },
          })
        }
      >
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <Pressable
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation();
              removeFavorite(item.id);
            }}
          >
            <Ionicons
              name="heart"
              size={19}
              color={colors.danger}
            />
          </Pressable>
        </View>

        <Text style={styles.eventTitle}>
          {event.title}
        </Text>

        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {event.description}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {formatDate(event.start_at)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textSecondary}
          />

          <Text style={styles.infoText}>
            {event.location}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.viewText}>
            View Event
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          STUDENT SPACE
        </Text>

        <Text style={styles.title}>
          Favorites
        </Text>

        <Text style={styles.subtitle}>
          Events you want to keep an eye on.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />

          <Text style={styles.loadingText}>
            Loading favorites...
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderFavorite}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            favorites.length === 0 &&
              styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFavorites();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="heart-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No favorites yet
              </Text>

              <Text style={styles.emptyText}>
                Save events you are interested in and
                they will appear here.
              </Text>

              <Pressable
                style={styles.exploreButton}
                onPress={() =>
                  router.push('/(student)/explore')
                }
              >
                <Text style={styles.exploreText}>
                  Explore Events
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
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
    paddingBottom: 15,
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

  topRow: {
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

  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FBE5E5',
    alignItems: 'center',
    justifyContent: 'center',
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

  viewText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.navy,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 7,
  },

  exploreButton: {
    backgroundColor: colors.yellow,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },

  exploreText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});