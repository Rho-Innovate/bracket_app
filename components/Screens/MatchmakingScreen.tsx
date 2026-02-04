import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import {
  Avatar,
  Button,
  Chip,
  Surface,
  Text,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllSportsConfig,
  getMatchProposals,
  getQueueStatus,
  getUserTrueSkill,
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
  MatchProposal,
  MatchmakingQueueEntry,
  respondToMatchProposal,
  SportConfig,
  subscribeToMatchProposals,
  triggerMatchmaking,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '../../constants/theme';
import { getSportName } from '../../constants/sports';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import { showError } from '@/utils/errorHandler';

type RootStackParamList = {
  Matchmaking: undefined;
  GameDetail: { gameId: number };
};

export default function MatchmakingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState<SportConfig[]>([]);
  const [queueEntries, setQueueEntries] = useState<MatchmakingQueueEntry[]>([]);
  const [matchProposals, setMatchProposals] = useState<MatchProposal[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [responding, setResponding] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      const sportsData = await getAllSportsConfig();
      setSports(sportsData);

      const queueData = await getQueueStatus(session.user.id);
      setQueueEntries(queueData);

      const proposalsData = await getMatchProposals(session.user.id);
      setMatchProposals(proposalsData);
    } catch (error) {
      showError(error, 'Failed to Load Data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();

      const subscription = subscribeToMatchProposals(session.user.id, (proposal) => {
        setMatchProposals((prev) => {
          const exists = prev.find((p) => p.id === proposal.id);
          if (exists) {
            return prev.map((p) => (p.id === proposal.id ? proposal : p));
          }
          return [...prev, proposal];
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.user?.id]);

  const handleJoinQueue = async (sportId: number) => {
    if (!session?.user?.id) return;

    try {
      setJoining(true);

      const rating = await getUserTrueSkill(session.user.id, sportId);
      const conservativeRating = rating
        ? rating.mu - 3 * rating.sigma
        : 0;

      await joinMatchmakingQueue(session.user.id, sportId, {
        searchRadiusKm: 20,
        skillRangeMin: conservativeRating - 10,
        skillRangeMax: conservativeRating + 10,
      });

      // Trigger matchmaking to find potential matches immediately
      const result = await triggerMatchmaking(sportId);

      await fetchData();

      if (result.matched > 0) {
        Alert.alert('Match Found!', 'A potential match has been found. Check your proposals above!');
      } else {
        Alert.alert('Joined Queue', "You'll be notified when a match is found!");
      }
    } catch (error: unknown) {
      showError(error, 'Failed to Join Queue');
    } finally {
      setJoining(false);
      setSelectedSport(null);
    }
  };

  const handleLeaveQueue = async (sportId: number) => {
    if (!session?.user?.id) return;

    try {
      await leaveMatchmakingQueue(session.user.id, sportId);
      await fetchData();
    } catch (error: unknown) {
      showError(error, 'Failed to Leave Queue');
    }
  };

  const handleRespondToProposal = async (proposalId: number, accept: boolean) => {
    if (!session?.user?.id) return;

    try {
      setResponding(proposalId);
      const result = await respondToMatchProposal(proposalId, session.user.id, accept);

      if (result.status === 'accepted' && result.gameId) {
        Alert.alert('Match Found!', 'Your game has been created.', [
          {
            text: 'View Game',
            onPress: () => navigation.navigate('GameDetail', { gameId: result.gameId! }),
          },
        ]);
      } else if (result.status === 'waiting') {
        Alert.alert('Waiting', 'Waiting for the other player to accept...');
      } else if (result.status === 'declined') {
        Alert.alert('Declined', 'You have declined this match.');
      }

      await fetchData();
    } catch (error: unknown) {
      showError(error, 'Failed to Respond');
    } finally {
      setResponding(null);
    }
  };

  const formatExpiresIn = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Expiring soon';
    if (diffMins < 60) return `Expires in ${diffMins}m`;
    return `Expires in ${Math.floor(diffMins / 60)}h`;
  };

  const isInQueueForSport = (sportId: number): boolean => {
    return queueEntries.some((entry) => entry.sport_id === sportId);
  };

  if (loading) {
    return <LoadingState message="Loading matchmaking..." />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Find"
        rightActions={[
          { icon: 'help-circle-outline', onPress: () => setShowHelpModal(true) }
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Match Proposals */}
        {matchProposals.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Match Proposals</Text>
            {matchProposals.map((proposal) => {
              const isPlayer1 = proposal.player1_id === session?.user?.id;
              const opponent: any = isPlayer1 ? (proposal as any).player2 : (proposal as any).player1;
              const hasAccepted = isPlayer1 ? proposal.player1_accepted : proposal.player2_accepted;

              return (
                <Surface key={proposal.id} style={styles.proposalCard} elevation={1}>
                  <View style={styles.proposalHeader}>
                    <Chip
                      mode="flat"
                      style={styles.sportChip}
                      textStyle={styles.sportChipText}
                    >
                      {getSportName(proposal.sport_id, 'Sport')}
                    </Chip>
                    <Text variant="labelSmall" style={styles.expiresText}>
                      {formatExpiresIn(proposal.expires_at)}
                    </Text>
                  </View>

                  <View style={styles.opponentInfo}>
                    {opponent?.avatar_url ? (
                      <Avatar.Image size={48} source={{ uri: opponent.avatar_url }} />
                    ) : (
                      <Avatar.Text
                        size={48}
                        label={opponent?.first_name?.charAt(0) || '?'}
                        style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
                        labelStyle={{ color: AppTheme.colors.textSecondary }}
                      />
                    )}
                    <View style={styles.opponentDetails}>
                      <Text variant="titleMedium" style={styles.opponentName}>
                        {opponent?.first_name} {opponent?.last_name?.charAt(0)}.
                      </Text>
                      {proposal.proposed_time && (
                        <Text variant="bodySmall" style={styles.proposedTime}>
                          {new Date(proposal.proposed_time).toLocaleString('en-US', {
                            weekday: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>

                  {hasAccepted ? (
                    <Surface style={styles.waitingBadge} elevation={0}>
                      <Text variant="labelMedium" style={styles.waitingText}>
                        Waiting for opponent...
                      </Text>
                    </Surface>
                  ) : (
                    <View style={styles.proposalActions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleRespondToProposal(proposal.id, false)}
                        disabled={responding === proposal.id}
                        style={styles.declineButton}
                      >
                        Decline
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleRespondToProposal(proposal.id, true)}
                        loading={responding === proposal.id}
                        disabled={responding === proposal.id}
                        buttonColor={AppTheme.colors.primary}
                        style={styles.acceptButton}
                      >
                        Accept
                      </Button>
                    </View>
                  )}
                </Surface>
              );
            })}
          </View>
        )}

        {/* Active Queue Entries */}
        {queueEntries.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>In Queue</Text>
            {queueEntries.map((entry) => (
              <Surface key={entry.id} style={styles.queueCard} elevation={0}>
                <View style={styles.queueInfo}>
                  <Text variant="titleSmall" style={styles.queueSport}>
                    {getSportName(entry.sport_id, 'Sport')}
                  </Text>
                  <Text variant="bodySmall" style={styles.queueStatus}>
                    Searching for opponents...
                  </Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => handleLeaveQueue(entry.sport_id)}
                  textColor={AppTheme.colors.textSecondary}
                >
                  Leave
                </Button>
              </Surface>
            ))}
          </View>
        )}

        {/* Sport Selection */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Find a Match</Text>
          <Text variant="bodyMedium" style={styles.sectionSubtitle}>
            Select a sport to join the matchmaking queue
          </Text>

          <View style={styles.sportsGrid}>
            {sports.map((sport) => {
              const inQueue = isInQueueForSport(sport.sport_id);
              const isSelected = selectedSport === sport.sport_id;
              return (
                <TouchableOpacity
                  key={sport.sport_id}
                  onPress={() => {
                    if (!inQueue) {
                      setSelectedSport(isSelected ? null : sport.sport_id);
                    }
                  }}
                  disabled={inQueue}
                  activeOpacity={0.7}
                  style={[
                    styles.sportCard,
                    isSelected && styles.sportCardSelected,
                    inQueue && styles.sportCardDisabled,
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.sportCardName,
                      isSelected && styles.sportCardNameSelected,
                      inQueue && styles.sportCardNameDisabled,
                    ]}
                  >
                    {sport.sport_name}
                  </Text>
                  {sport.is_team_sport && (
                    <Text variant="bodySmall" style={styles.sportCardTeamSize}>
                      {sport.team_size}v{sport.team_size}
                    </Text>
                  )}
                  {inQueue && (
                    <Text variant="labelSmall" style={styles.inQueueLabel}>In Queue</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedSport && (
            <Button
              mode="contained"
              onPress={() => handleJoinQueue(selectedSport)}
              loading={joining}
              disabled={joining}
              buttonColor={AppTheme.colors.primary}
              style={styles.joinQueueButton}
            >
              Join Queue for {getSportName(selectedSport)}
            </Button>
          )}
        </View>

      </ScrollView>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Matchmaking Works</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={AppTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.helpSectionTitle}>Quick Match</Text>
              <Text style={styles.helpText}>
                Matchmaking helps you find opponents with similar skill levels automatically. No need to browse events - just join the queue and we'll find you a match!
              </Text>

              <Text style={styles.helpSectionTitle}>Step by Step</Text>
              <Text style={styles.helpText}>
                1. Select a sport you want to play.{'\n\n'}
                2. Tap "Join Queue" to start searching.{'\n\n'}
                3. We'll find players near your skill level based on your TrueSkill rating.{'\n\n'}
                4. When a match is found, both players receive a proposal.{'\n\n'}
                5. If both players accept, a game is automatically created.{'\n\n'}
                6. After the game, submit your results to update your ranking!
              </Text>

              <Text style={styles.helpSectionTitle}>Skill-Based Matching</Text>
              <Text style={styles.helpText}>
                Your TrueSkill rating determines who you get matched with. As you play more games, your rating becomes more accurate and you'll get better matches.
              </Text>

              <Text style={styles.helpSectionTitle}>Tips</Text>
              <Text style={styles.helpText}>
                {'\u2022'} You can be in queue for multiple sports at once{'\n'}
                {'\u2022'} Match proposals expire after a set time - respond quickly!{'\n'}
                {'\u2022'} Leave the queue anytime if you change your mind
              </Text>
            </ScrollView>

            <Button
              mode="contained"
              onPress={() => setShowHelpModal(false)}
              style={styles.modalButton}
              buttonColor={AppTheme.colors.primary}
            >
              Got it!
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  scrollContent: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl * 2,
  },
  section: {
    marginBottom: AppTheme.spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.sm,
  },
  sectionSubtitle: {
    color: AppTheme.colors.textSecondary,
    marginBottom: AppTheme.spacing.md,
  },
  proposalCard: {
    backgroundColor: AppTheme.colors.background,
    borderRadius: AppTheme.borderRadius.xl,
    padding: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
    borderWidth: 2,
    borderColor: AppTheme.colors.primary,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  sportChip: {
    backgroundColor: `${AppTheme.colors.primary}15`,
  },
  sportChipText: {
    color: AppTheme.colors.primary,
    fontSize: 12,
  },
  expiresText: {
    color: '#FF9800',
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.md,
    gap: AppTheme.spacing.sm,
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  proposedTime: {
    color: AppTheme.colors.textSecondary,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
  },
  declineButton: {
    flex: 1,
    borderColor: AppTheme.colors.border,
  },
  acceptButton: {
    flex: 1,
  },
  waitingBadge: {
    backgroundColor: `${AppTheme.colors.accent}20`,
    padding: AppTheme.spacing.sm,
    borderRadius: AppTheme.borderRadius.lg,
    alignItems: 'center',
  },
  waitingText: {
    color: AppTheme.colors.accent,
  },
  queueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
  },
  queueInfo: {
    flex: 1,
  },
  queueSport: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  queueStatus: {
    color: AppTheme.colors.textSecondary,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
  },
  sportCard: {
    width: '48%',
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: AppTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  sportCardSelected: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: `${AppTheme.colors.accent}15`,
  },
  sportCardDisabled: {
    opacity: 0.6,
  },
  sportCardName: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    textAlign: 'center',
  },
  sportCardNameSelected: {
    color: AppTheme.colors.primary,
  },
  sportCardNameDisabled: {
    color: AppTheme.colors.textMuted,
  },
  sportCardTeamSize: {
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: AppTheme.spacing.xs,
  },
  inQueueLabel: {
    color: '#2196F3',
    marginTop: AppTheme.spacing.xs,
  },
  joinQueueButton: {
    marginTop: AppTheme.spacing.lg,
    borderRadius: AppTheme.borderRadius.full,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppTheme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  modalScroll: {
    marginBottom: 16,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: AppTheme.colors.text,
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 8,
  },
});
