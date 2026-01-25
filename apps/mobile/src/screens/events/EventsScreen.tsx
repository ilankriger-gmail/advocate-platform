import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../components/ui';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { Event } from '../../types';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Check user registrations
      if (user && data) {
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);

        const registeredEventIds = new Set(registrations?.map((r) => r.event_id) || []);

        const eventsWithRegistration = data.map((event) => ({
          ...event,
          is_registered: registeredEventIds.has(event.id),
        }));

        setEvents(eventsWithRegistration as Event[]);
      } else {
        setEvents((data as Event[]) || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        user_id: user.id,
      });

      if (error) throw error;

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                is_registered: true,
                registrations_count: (event.registrations_count || 0) + 1,
              }
            : event
        )
      );
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const getEventStatus = (event: Event) => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const now = new Date();

    if (isPast(endDate)) {
      return { text: 'Encerrado', color: colors.gray[500], icon: 'checkmark-circle' as const };
    }
    if (now >= startDate && now <= endDate) {
      return { text: 'Acontecendo agora', color: colors.success.main, icon: 'radio-button-on' as const };
    }
    if (isToday(startDate)) {
      return { text: 'Hoje', color: colors.primary[600], icon: 'time' as const };
    }
    return null;
  };

  const renderEvent = ({ item: event }: { item: Event }) => {
    const status = getEventStatus(event);
    const startDate = new Date(event.start_time);
    const isPastEvent = isPast(new Date(event.end_time));

    return (
      <Card style={[styles.eventCard, isPastEvent ? styles.eventCardPast : undefined]} padding="none">
        {/* Event Image */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.eventImage} />
        ) : (
          <View style={styles.eventImagePlaceholder}>
            <Ionicons
              name={event.is_virtual ? 'videocam-outline' : 'location-outline'}
              size={40}
              color={colors.gray[400]}
            />
          </View>
        )}

        <View style={styles.eventContent}>
          {/* Status Badge */}
          <View style={styles.eventHeader}>
            <View style={styles.eventTypeTag}>
              <Ionicons
                name={event.is_virtual ? 'videocam-outline' : 'location-outline'}
                size={14}
                color={colors.primary[600]}
              />
              <Text style={styles.eventTypeText}>
                {event.is_virtual ? 'Online' : 'Presencial'}
              </Text>
            </View>
            {status && (
              <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                <Ionicons name={status.icon} size={12} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
              </View>
            )}
          </View>

          {/* Event Info */}
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>

          {/* Date & Location */}
          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.metaText}>
                {format(startDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </Text>
            </View>
            {event.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
          </View>

          {/* Action */}
          {!isPastEvent && (
            <View style={styles.eventFooter}>
              <View style={styles.spotsInfo}>
                {event.max_participants && (
                  <Text style={styles.spotsText}>
                    {event.registrations_count || 0}/{event.max_participants} vagas
                  </Text>
                )}
              </View>
              {event.is_registered ? (
                <View style={styles.registeredBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
                  <Text style={styles.registeredText}>Inscrito</Text>
                </View>
              ) : (
                <Button
                  title="Inscrever-se"
                  size="sm"
                  onPress={() => handleRegister(event.id)}
                />
              )}
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>Nenhum evento</Text>
              <Text style={styles.emptySubtitle}>
                Não há eventos programados no momento
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  eventCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  eventCardPast: {
    opacity: 0.7,
  },
  eventImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.gray[200],
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eventTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  eventTypeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary[700],
    marginLeft: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.xs,
  },
  eventTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  eventMeta: {
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginLeft: spacing.sm,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  spotsInfo: {
    flex: 1,
  },
  spotsText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registeredText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.success.main,
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
});
