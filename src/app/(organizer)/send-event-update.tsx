import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export default function SendEventUpdateScreen() {
  const params = useLocalSearchParams<{
    eventId?: string;
    id?: string;
  }>();

  const eventId = String(params.eventId ?? params.id ?? '');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [message, setMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!eventId) {
      setErrorMessage('Event ID is missing.');
      setLoading(false);
      return;
    }

    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single();

      if (error) throw error;

      setEventTitle(data.title ?? '');
    } catch (error: any) {
      console.error('Load event update error:', error);

      setErrorMessage(
        error?.message ?? 'Unable to load this event.'
      );
    } finally {
      setLoading(false);
    }
  };

  const sendUpdate = async () => {
    if (!message.trim()) {
      setErrorMessage('Please enter an update message.');
      return;
    }

    if (message.trim().length < 5) {
      setErrorMessage('Please enter a little more detail in your update.');
      return;
    }

    try {
      setSending(true);
      setErrorMessage('');
      setSuccessMessage('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      /*
       * This calls the backend function using the SAME event ID.
       *
       * The backend verifies:
       * 1. The user is logged in.
       * 2. The user is an organizer.
       * 3. The organizer owns this event.
       * 4. Notifications are created only for registered students.
       */
      const { data, error } = await supabase.rpc(
        'notify_event_participants',
        {
          p_event_id: eventId,
          p_title: `Update: ${eventTitle}`,
          p_message: message.trim(),
        }
      );

      if (error) throw error;

      const recipientCount = Number(data ?? 0);

      setSuccessMessage(
        recipientCount === 1
          ? 'Update sent to 1 registered student.'
          : `Update sent to ${recipientCount} registered students.`
      );

      setMessage('');

      /*
       * Give the user time to see the success message,
       * then return to Event Details automatically.
       */
      setTimeout(() => {
        router.replace({
          pathname: '/organizer-event-details',
          params: { eventId },
        });
      }, 1800);
    } catch (error: any) {
      console.error('Send event update error:', error);

      setErrorMessage(
        error?.message ?? 'Unable to send the event update.'
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.navy}
        />

        <Text style={styles.loadingText}>
          Loading event...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.navy}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Send Event Update
          </Text>

          <Text style={styles.headerSubtitle}>
            Notify registered students
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Success message */}
        {successMessage ? (
          <Pressable
            style={styles.successBanner}
            onPress={() => {
              setSuccessMessage('');
              router.replace({
                pathname: '/organizer-event-details',
                params: { eventId },
              });
            }}
          >
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.white}
              />
            </View>

            <View style={styles.bannerTextContainer}>
              <Text style={styles.successTitle}>
                Update sent
              </Text>

              <Text style={styles.successText}>
                {successMessage}
              </Text>
            </View>

            <Ionicons
              name="close"
              size={19}
              color={colors.success}
            />
          </Pressable>
        ) : null}

        {/* Error message */}
        {errorMessage ? (
          <Pressable
            style={styles.errorBanner}
            onPress={() => setErrorMessage('')}
          >
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={colors.danger}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>

            <Ionicons
              name="close"
              size={19}
              color={colors.danger}
            />
          </Pressable>
        ) : null}

        {/* Event card */}
        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.navy}
            />
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventLabel}>
              EVENT
            </Text>

            <Text style={styles.eventTitle}>
              {eventTitle}
            </Text>
          </View>
        </View>

        {/* Information */}
        <View style={styles.infoCard}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.yellowDark}
          />

          <Text style={styles.infoText}>
            This message will be sent as an in-app notification
            to students who are currently registered for this
            event.
          </Text>
        </View>

        {/* Message */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Update Message
          </Text>

          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={(text) => {
              setMessage(text);

              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            placeholder="Example: The venue has been changed to the Main Auditorium."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />

          <View style={styles.characterRow}>
            <Text style={styles.helperText}>
              Keep students informed about important changes.
            </Text>

            <Text style={styles.characterCount}>
              {message.length}/500
            </Text>
          </View>
        </View>

        {/* Send button */}
        <Pressable
          style={[
            styles.sendButton,
            sending && styles.disabledButton,
          ]}
          onPress={sendUpdate}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <>
              <Ionicons
                name="send-outline"
                size={20}
                color={colors.navy}
              />

              <Text style={styles.sendButtonText}>
                Send Update
              </Text>
            </>
          )}
        </Pressable>

        {/* Cancel */}
        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={sending}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 18,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.navy,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },

  content: {
    padding: 20,
    paddingBottom: 45,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6EF',
    borderWidth: 1,
    borderColor: '#B8DFC8',
    borderRadius: 15,
    padding: 14,
    marginBottom: 16,
  },

  successIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerTextContainer: {
    flex: 1,
    marginHorizontal: 11,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },

  successText: {
    marginTop: 2,
    fontSize: 12,
    color: colors.text,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F1C2C2',
    borderRadius: 15,
    padding: 14,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
    fontWeight: '600',
  },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },

  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF1C9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  eventInfo: {
    flex: 1,
    marginLeft: 13,
  },

  eventLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 3,
  },

  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4D8',
    borderRadius: 16,
    padding: 15,
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },

  messageInput: {
    minHeight: 170,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },

  characterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },

  helperText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
  },

  characterCount: {
    marginLeft: 10,
    fontSize: 11,
    color: colors.textMuted,
  },

  sendButton: {
    height: 53,
    borderRadius: 15,
    backgroundColor: colors.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  sendButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  disabledButton: {
    opacity: 0.65,
  },

  cancelButton: {
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});