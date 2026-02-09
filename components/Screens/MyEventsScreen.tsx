import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Text,
} from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '@/constants/theme';
import { getSportName } from '@/constants/sports';
import Header from '../common/Header';
import EmptyState from '../common/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import { showError, showSuccess } from '@/utils/errorHandler';

interface MyEvent {
  id: string;
  description: string;
  requested_time: string;
  max_players: number;
  current_players: number;
  status: string;
  sport_id: number;
  created_at: string;
}

export default function MyEventsScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyEvents = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('game_requests')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('requested_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      showError(error, 'Failed to Load Events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete game participants first
              await supabase
                .from('game_participants')
                .delete()
                .eq('game_id', eventId);

              // Delete the game
              const { error } = await supabase
                .from('game_requests')
                .delete()
                .eq('id', eventId);

              if (error) throw error;

              setEvents(prev => prev.filter(e => e.id !== eventId));
              showSuccess('Event deleted');
            } catch (error: unknown) {
              showError(error, 'Failed to Delete Event');
            }
          },
        },
      ]
    );
  };

  const handleCancelEvent = async (eventId: string) => {
    Alert.alert(
      'Cancel Event',
      'This will cancel the event and notify participants.',
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('game_requests')
                .update({ status: 'cancelled' })
                .eq('id', eventId);

              if (error) throw error;

              setEvents(prev =>
                prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e)
              );
              showSuccess('Event cancelled');
            } catch (error: unknown) {
              showError(error, 'Failed to Cancel Event');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventTitle = (description: string) => {
    const firstLine = description.split('\n')[0];
    return firstLine || 'Untitled Event';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return AppTheme.colors.primary;
      case 'in_progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      case 'cancelled': return AppTheme.colors.error;
      default: return AppTheme.colors.textSecondary;
    }
  };

  const isPastEvent = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const renderEvent = ({ item }: { item: MyEvent }) => {
    const isPast = isPastEvent(item.requested_time);
    const isCancelled = item.status === 'cancelled';

    return (
      <Card style={[styles.card, (isPast || isCancelled) && styles.cardPast]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.eventTitle}>
                {getEventTitle(item.description)}
              </Text>
              <Chip
                mode="flat"
                textStyle={{ fontSize: 11, color: '#fff' }}
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {item.status.replace('_', ' ')}
              </Chip>
            </View>

            <Text style={styles.sportName}>
              {getSportName(item.sport_id)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={AppTheme.colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(item.requested_time)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color={AppTheme.colors.textSecondary} />
            <Text style={styles.infoText}>
              {item.current_players} / {item.max_players} players
            </Text>
          </View>

          {!isPast && !isCancelled && (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => handleCancelEvent(item.id)}
                textColor={AppTheme.colors.error}
                style={styles.actionButton}
                compact
              >
                Cancel
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleDeleteEvent(item.id)}
                textColor={AppTheme.colors.textSecondary}
                style={styles.actionButton}
                compact
              >
                Delete
              </Button>
            </View>
          )}

          {(isPast || isCancelled) && (
            <Button
              mode="text"
              onPress={() => handleDeleteEvent(item.id)}
              textColor={AppTheme.colors.textSecondary}
              compact
            >
              Remove from list
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="My Events" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppTheme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Events" />

      {events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Events Yet"
          message="Events you create will appear here."
        />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[AppTheme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardPast: {
    opacity: 0.6,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  sportName: {
    color: AppTheme.colors.textSecondary,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    color: AppTheme.colors.textSecondary,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.divider,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});
