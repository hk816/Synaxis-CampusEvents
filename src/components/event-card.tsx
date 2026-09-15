import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { colors } from '@/theme/colors';

type EventCardProps = {
  title: string;
  category: string;
  date: string;
  month: string;
  time: string;
  location: string;
  status?: 'upcoming' | 'live' | 'previous';
  onPress?: () => void;
};

export default function EventCard({
  title,
  category,
  date,
  month,
  time,
  location,
  status,
  onPress,
}: EventCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.dateBox}>
        <Text style={styles.month}>{month}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={styles.category}>
            {category.toUpperCase()}
          </Text>

          {status === 'live' && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text style={styles.info}>
          {time}
        </Text>

        <Text
          style={styles.info}
          numberOfLines={1}
        >
          {location}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardPressed: {
    opacity: 0.85,
  },

  dateBox: {
    width: 58,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  month: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  date: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },

  details: {
    flex: 1,
    justifyContent: 'center',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  category: {
    color: colors.yellowDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 5,
  },

  info: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBE8E5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginRight: 5,
  },

  liveText: {
    color: colors.danger,
    fontSize: 9,
    fontWeight: '800',
  },
});