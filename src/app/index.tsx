import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>CE</Text>
        </View>

        <Text style={styles.title}>Campus Events</Text>

        <Text style={styles.subtitle}>
          Discover. Participate. Connect.
        </Text>

        <Text style={styles.description}>
          Your campus events, all in one place.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.footer}>
          Student • Organizer • Admin
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4E8',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#14213D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  logo: {
    color: '#F4B942',
    fontSize: 26,
    fontWeight: '800',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#14213D',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#39445C',
    textAlign: 'center',
  },

  description: {
    marginTop: 12,
    fontSize: 15,
    color: '#697386',
    textAlign: 'center',
  },

  button: {
    marginTop: 32,
    backgroundColor: '#F4B942',
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 14,
  },

  buttonText: {
    color: '#14213D',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    position: 'absolute',
    bottom: 32,
    color: '#8A8F9C',
    fontSize: 13,
  },
});