import { createJoinRequest, GameState, getGameRequestsWithHosts, getUserRequestedGameIds } from '@/lib/supabase';
import { showError } from '@/utils/errorHandler';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Searchbar,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { useAuth } from '@/contexts/AuthContext';
import ActiveGameJoinRequests from './ActiveGameJoinRequests';
import HostGameJoinRequests from './HostGameJoinRequests';
import { AppTheme, gameStateColors, gameStateLabels } from '../../constants/theme';
import { getSportName } from '../../constants/sports';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import UserProfileModal from '../common/UserProfileModal';

type HomeStackParamList = {
  HomeMain: undefined;
  GameDetail: { gameId: number };
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

interface EventWithHost {
  id: number;
  description: string;
  requested_time: string;
  sport_id: number;
  current_players: number;
  max_players: number;
  creator_id: string;
  game_state?: GameState;
  request_status?: string | null; // 'Pending', 'Accepted', or null
  host?: {
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string;
  };
}

function HomeScreen() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { session } = useAuth();
  const [events, setEvents] = useState<EventWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [joining, setJoining] = useState<{ [key: number]: boolean }>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('myRequests');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const fetchEvents = async () => {
    try {
      // Use optimized single query that JOINs with profiles
      // This replaces N+1 pattern (was 22+ API calls, now just 2)
      const [eventsWithHosts, userRequests] = await Promise.all([
        getGameRequestsWithHosts({ status: 'Open' }),
        session?.user?.id ? getUserRequestedGameIds(session.user.id) : Promise.resolve({}),
      ]);

      // Merge user request status into events
      const eventsWithStatus = eventsWithHosts.map((event) => ({
        ...event,
        request_status: userRequests[event.id] || null,
      }));

      setEvents(eventsWithStatus);
      setLoading(false);
    } catch (error) {
      showError(error, 'Failed to Load Events');
      setEvents([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchEvents();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: number) => {
    if (!session?.user?.id) return;

    try {
      setJoining((prev) => ({ ...prev, [eventId]: true }));
      await createJoinRequest(eventId, session.user.id);

      setEvents((prevEvents) =>
        prevEvents.map((event) => {
          if (event.id === eventId) {
            return { ...event, request_status: 'Pending' };
          }
          return event;
        })
      );
    } catch (error) {
      showError(error, 'Failed to Join Event');
    } finally {
      setJoining((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const filteredEvents = events.filter(event =>
    event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memoized render function for FlatList
  const renderEventCard = useCallback(({ item: event }: { item: EventWithHost }) => {
    const isExpanded = expandedEvent === event.id;
    const isOwnEvent = event.creator_id === session?.user?.id;

    return (
      <Card
        key={event.id}
        style={styles.eventCard}
        mode="elevated"
        onPress={() => setExpandedEvent(isExpanded ? null : event.id)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text variant="titleMedium" style={styles.eventTitle}>
                {event.description || 'No description provided'}
              </Text>
              <Text variant="bodySmall" style={styles.eventDate}>
                {event.requested_time ? formatDate(event.requested_time) : 'Time TBD'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedUserId(event.creator_id);
                  setShowProfileModal(true);
                }}
              >
                <Text variant="bodySmall" style={styles.hostNameClickable}>
                  {event.host
                    ? `Host: ${event.host.username ? `@${event.host.username}` : `${event.host.first_name || 'Unknown'}${event.host.last_name ? ` ${event.host.last_name.charAt(0)}.` : ''}`}`
                    : 'Host: Unknown'}
                </Text>
              </TouchableOpacity>
            </View>
            {event.host?.avatar_url ? (
              <Avatar.Image size={50} source={{ uri: event.host.avatar_url }} />
            ) : (
              <Avatar.Text
                size={50}
                label={event.host?.first_name?.charAt(0) || '?'}
                style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
                labelStyle={{ color: AppTheme.colors.textSecondary }}
              />
            )}
          </View>

          <View style={styles.tagsRow}>
            <Chip
              mode="flat"
              style={styles.sportChip}
              textStyle={styles.sportChipText}
            >
              {getSportName(event.sport_id, 'Sport')}
            </Chip>
            {event.game_state && event.game_state !== 'scheduled' && (
              <Chip
                mode="flat"
                style={[styles.stateChip, { backgroundColor: gameStateColors[event.game_state] }]}
                textStyle={styles.stateChipText}
              >
                {gameStateLabels[event.game_state]}
              </Chip>
            )}
            <Text variant="labelMedium" style={styles.playerCount}>
              {event.current_players}/{event.max_players}
            </Text>
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <Divider style={styles.divider} />
              <View style={styles.expandedButtons}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('GameDetail', { gameId: event.id })}
                  style={styles.detailsButton}
                  buttonColor={AppTheme.colors.secondary}
                >
                  View Details
                </Button>
                {isOwnEvent ? (
                  <Button
                    mode="contained"
                    disabled
                    style={styles.joinButton}
                    buttonColor={AppTheme.colors.surfaceVariant}
                    textColor={AppTheme.colors.textSecondary}
                  >
                    Your Event
                  </Button>
                ) : event.request_status === 'Accepted' ? (
                  <Button
                    mode="contained"
                    disabled
                    style={styles.joinButton}
                    buttonColor={AppTheme.colors.accent}
                    textColor="#fff"
                  >
                    Joined
                  </Button>
                ) : event.request_status === 'Pending' ? (
                  <Button
                    mode="contained"
                    disabled
                    style={styles.joinButton}
                    buttonColor={AppTheme.colors.secondary}
                    textColor="#fff"
                  >
                    Requested
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={() => handleJoinEvent(event.id)}
                    loading={joining[event.id]}
                    disabled={joining[event.id] || event.current_players >= event.max_players}
                    style={styles.joinButton}
                    buttonColor={AppTheme.colors.primary}
                  >
                    {event.current_players >= event.max_players ? 'Full' : 'Join Event'}
                  </Button>
                )}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }, [expandedEvent, session?.user?.id, joining, navigation]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: EventWithHost) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      <Header
        title="Home"
        rightActions={[
          { icon: 'account-circle', onPress: () => setIsModalVisible(true) },
          { icon: 'refresh', onPress: handleRefresh, disabled: loading },
        ]}
      />

      <Searchbar
        placeholder="Search events..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchbarInput}
      />

      <Divider />

      {loading ? (
        <LoadingState message="Loading events..." style={styles.loadingState} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Events Available"
          message="Create a new event or check back later for upcoming games."
          actionLabel="Refresh"
          onAction={handleRefresh}
        />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.scrollContent}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
        />
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text variant="titleLarge" style={styles.modalTitle}>My Events</Text>
                  <IconButton icon="close" onPress={() => setIsModalVisible(false)} />
                </View>

                <SegmentedButtons
                  value={activeTab}
                  onValueChange={setActiveTab}
                  buttons={[
                    { value: 'myRequests', label: 'My Requests' },
                    { value: 'hostRequests', label: 'Host Requests' },
                  ]}
                  style={styles.segmentedButtons}
                />

                <ScrollView style={styles.modalContent}>
                  {activeTab === 'myRequests' ? (
                    <ActiveGameJoinRequests />
                  ) : (
                    <HostGameJoinRequests />
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <UserProfileModal
        visible={showProfileModal}
        userId={selectedUserId}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  searchbar: {
    marginHorizontal: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
    elevation: 0,
    backgroundColor: AppTheme.colors.surfaceVariant,
    borderRadius: AppTheme.borderRadius.md,
  },
  searchbarInput: {
    fontSize: 14,
  },
  scrollContent: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl,
  },
  loadingState: {
    paddingTop: AppTheme.spacing.xl * 2,
  },
  eventCard: {
    marginBottom: AppTheme.spacing.sm,
    backgroundColor: AppTheme.colors.background,
    borderRadius: AppTheme.borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: AppTheme.spacing.sm,
  },
  eventTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.xs,
  },
  eventDate: {
    color: AppTheme.colors.textSecondary,
    marginBottom: 2,
  },
  hostName: {
    color: AppTheme.colors.secondary,
    fontWeight: '500',
  },
  hostNameClickable: {
    color: AppTheme.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
  },
  sportChip: {
    backgroundColor: `${AppTheme.colors.primary}15`,
  },
  sportChipText: {
    color: AppTheme.colors.primary,
    fontSize: 12,
  },
  stateChip: {
    backgroundColor: '#2196F3',
  },
  stateChipText: {
    color: '#fff',
    fontSize: 12,
  },
  playerCount: {
    color: AppTheme.colors.textSecondary,
    marginLeft: 'auto',
  },
  expandedContent: {
    marginTop: AppTheme.spacing.sm,
  },
  divider: {
    marginBottom: AppTheme.spacing.sm,
  },
  expandedButtons: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
  },
  detailsButton: {
    flex: 1,
    borderRadius: AppTheme.borderRadius.md,
  },
  joinButton: {
    flex: 1,
    borderRadius: AppTheme.borderRadius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AppTheme.colors.background,
    borderTopLeftRadius: AppTheme.borderRadius.xl,
    borderTopRightRadius: AppTheme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.sm,
  },
  modalTitle: {
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  segmentedButtons: {
    marginHorizontal: AppTheme.spacing.md,
    marginVertical: AppTheme.spacing.sm,
  },
  modalContent: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.md,
  },
  noSessionContainer: {
    padding: AppTheme.spacing.lg,
    alignItems: 'center',
  },
});

export default HomeScreen;
