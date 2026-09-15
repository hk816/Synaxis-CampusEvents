import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Resource = {
  id: string;
  event_id: string;
  resource_name: string;
  responsible_person: string;
  status: 'pending' | 'approved' | 'rejected';
  event?: {
    id: string;
    title: string;
  } | null;
};

type EventItem = {
  id: string;
  title: string;
};

export default function OrganizerResourcesScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [eventId, setEventId] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [responsiblePerson, setResponsiblePerson] =
    useState('');
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: eventData, error: eventError } =
        await supabase
          .from('events')
          .select('id, title')
          .eq('organizer_id', user.id)
          .order('created_at', {
            ascending: false,
          });

      if (eventError) throw eventError;

      setEvents(eventData ?? []);

      if (!eventData?.length) {
        setResources([]);
        return;
      }

      const eventIds = eventData.map(
        (event) => event.id
      );

      const {
        data: resourceData,
        error: resourceError,
      } = await supabase
        .from('event_resources')
        .select(
          `
          id,
          event_id,
          resource_name,
          responsible_person,
          status
        `
        )
        .in('event_id', eventIds)
        .order('created_at', {
          ascending: false,
        });

      if (resourceError) throw resourceError;

      const eventMap = new Map(
        eventData.map((event) => [
          event.id,
          event,
        ])
      );

      setResources(
        (resourceData ?? []).map((resource) => ({
          ...resource,
          event:
            eventMap.get(resource.event_id) ?? null,
        }))
      );
    } catch (error) {
      console.error(
        'Load resources error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  const addResource = async () => {
    if (
      !eventId ||
      !resourceName.trim() ||
      !responsiblePerson.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please select an event and enter all resource details.'
      );
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('event_resources')
        .insert({
          event_id: eventId,
          resource_name: resourceName.trim(),
          responsible_person:
            responsiblePerson.trim(),
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert(
        'Resource Added',
        'The resource has been submitted for approval.'
      );

      setEventId('');
      setResourceName('');
      setResponsiblePerson('');
      setModalVisible(false);

      await loadResources();
    } catch (error: any) {
      Alert.alert(
        'Unable to add resource',
        error?.message ??
          'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = (status: string) => {
    if (status === 'approved') {
      return {
        backgroundColor: '#E2F2E9',
        color: colors.success,
      };
    }

    if (status === 'rejected') {
      return {
        backgroundColor: '#FBE5E5',
        color: colors.danger,
      };
    }

    return {
      backgroundColor: '#FFF0D4',
      color: colors.warning,
    };
  };

  const renderResource = ({
    item,
  }: {
    item: Resource;
  }) => {
    const status = statusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons
            name="cube-outline"
            size={21}
            color={colors.navy}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.resourceName}>
            {item.resource_name}
          </Text>

          <Text style={styles.eventName}>
            {item.event?.title ??
              'Event unavailable'}
          </Text>

          <View style={styles.personRow}>
            <Ionicons
              name="person-outline"
              size={13}
              color={colors.textSecondary}
            />

            <Text style={styles.personText}>
              {item.responsible_person}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            ORGANIZER SPACE
          </Text>

          <Text style={styles.title}>
            Resources
          </Text>

          <Text style={styles.subtitle}>
            Track resources and their approval status.
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name="add"
            size={22}
            color={colors.navy}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.yellowDark}
          />
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={renderResource}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            resources.length === 0 &&
              styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="cube-outline"
                  size={30}
                  color={colors.textSecondary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No resources added
              </Text>

              <Text style={styles.emptyText}>
                Add resources required for your events
                and track their approval status here.
              </Text>

              <Pressable
                style={styles.emptyButton}
                onPress={() =>
                  setModalVisible(true)
                }
              >
                <Text style={styles.emptyButtonText}>
                  Add Resource
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Add Resource
                </Text>

                <Text style={styles.modalSubtitle}>
                  Submit a resource for approval.
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.navy}
                />
              </Pressable>
            </View>

            <Text style={styles.label}>
              EVENT
            </Text>

            <FlatList
              horizontal
              data={events}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.eventSelector
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.eventChip,
                    eventId === item.id &&
                      styles.eventChipSelected,
                  ]}
                  onPress={() =>
                    setEventId(item.id)
                  }
                >
                  <Text
                    style={[
                      styles.eventChipText,
                      eventId === item.id &&
                        styles.eventChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              )}
            />

            <Text style={styles.label}>
              RESOURCE NAME
            </Text>

            <TextInput
              value={resourceName}
              onChangeText={setResourceName}
              placeholder="e.g. Projector"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>
              RESPONSIBLE PERSON
            </Text>

            <TextInput
              value={responsiblePerson}
              onChangeText={setResponsiblePerson}
              placeholder="e.g. Event Coordinator"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.note}>
              Resources are submitted as pending and
              require approval.
            </Text>

            <Pressable
              style={styles.saveButton}
              onPress={addResource}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color={colors.navy}
                />
              ) : (
                <Text style={styles.saveText}>
                  Submit Resource
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContent: {
    flex: 1,
    marginLeft: 12,
  },

  resourceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },

  eventName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 3,
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  personText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 7,
  },

  emptyButton: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },

  emptyButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 33, 61, 0.35)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },

  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 7,
    marginTop: 10,
  },

  eventSelector: {
    gap: 8,
    paddingBottom: 3,
  },

  eventChip: {
    maxWidth: 180,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  eventChipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },

  eventChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  eventChipTextSelected: {
    color: colors.white,
  },

  input: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.navy,
    borderWidth: 1,
    borderColor: colors.border,
  },

  note: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 12,
  },

  saveButton: {
    height: 50,
    backgroundColor: colors.yellow,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },

  saveText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
});