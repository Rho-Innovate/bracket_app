import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  Divider,
  Surface,
  Text,
} from 'react-native-paper';
import {
  cancelGame,
  endGame,
  GameState,
  getGameDetails,
  getGameParticipants,
  getResultSubmissions,
  startGame,
  supabase,
  subscribeToGameState,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSportName } from '../../constants/sports';
import { AppTheme, gameStateColors, gameStateLabels } from '../../constants/theme';
import { showError, showSuccess } from '@/utils/errorHandler';
import { GameParticipant, ResultSubmission } from '@/lib/supabase/types';

interface GameDetailParams {
  gameId: number;
}

type RootStackParamList = {
  GameDetail: GameDetailParams;
  ResultSubmission: { gameId: number };
  GameChat: { gameId: number; conversationId: number };
};

// Game details type with relations
interface GameWithDetails {
  id: number;
  creator_id: string;
  sport_id: number;
  requested_time: string;
  description: string;
  max_players: number;
  current_players: number;
  status: string;
  game_state: GameState;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string;
  };
  game_results?: {
    winner_team: number;
    is_draw: boolean;
    score_team1?: number;
    score_team2?: number;
  };
}

// Extended participant type with profile
interface ParticipantWithProfile extends GameParticipant {
  profiles?: {
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string;
  };
}

// Extended result submission type with profile
interface ResultSubmissionWithProfile extends ResultSubmission {
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export default function GameDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'GameDetail'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { gameId } = route.params;
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameWithDetails | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [resultSubmissions, setResultSubmissions] = useState<ResultSubmissionWithProfile[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const gameData = await getGameDetails(gameId);
      setGame(gameData as GameWithDetails);

      const participantsData = await getGameParticipants(gameId);
      setParticipants(participantsData as ParticipantWithProfile[]);

      if (gameData.game_state === 'awaiting_results' || gameData.game_state === 'disputed') {
        const submissions = await getResultSubmissions(gameId);
        setResultSubmissions(submissions as ResultSubmissionWithProfile[]);
      }
    } catch (error: unknown) {
      showError(error, 'Failed to Load Game');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();

    const subscription = subscribeToGameState(gameId, (payload) => {
      setGame((prev) => prev ? { ...prev, ...payload.new } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  const isHost = session?.user?.id === game?.creator_id;
  const isParticipant = participants.some(p => p.user_id === session?.user?.id);
  const currentUserSubmission = resultSubmissions.find(s => s.submitted_by === session?.user?.id);

  const handleStartGame = async () => {
    if (!session?.user?.id) return;
    try {
      setActionLoading(true);
      await startGame(gameId, session.user.id);
      await fetchGameData();
      showSuccess('Game started!');
    } catch (error: unknown) {
      showError(error, 'Failed to Start Game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!session?.user?.id) return;
    try {
      setActionLoading(true);
      await endGame(gameId, session.user.id);
      await fetchGameData();
      showSuccess('Game ended! Players can now submit results.');
    } catch (error: unknown) {
      showError(error, 'Failed to End Game');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelGame = async () => {
    Alert.alert(
      'Cancel Game',
      'Are you sure you want to cancel this game?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (!session?.user?.id) return;
            try {
              setActionLoading(true);
              await cancelGame(gameId, session.user.id);
              await fetchGameData();
              showSuccess('Game cancelled');
            } catch (error: unknown) {
              showError(error, 'Failed to Cancel Game');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitResult = () => {
    navigation.navigate('ResultSubmission', { gameId });
  };

  const handleOpenChat = async () => {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('game_id', gameId)
      .single();

    if (conversation) {
      navigation.navigate('GameChat', { gameId, conversationId: conversation.id });
    }
  };

  const renderParticipants = () => {
    const team1 = participants.filter(p => p.team === 1);
    const team2 = participants.filter(p => p.team === 2);
    const noTeam = participants.filter(p => !p.team);

    const renderPlayer = (participant: ParticipantWithProfile) => (
      <Surface key={participant.user_id} style={styles.participantCard} elevation={0}>
        {participant.profiles?.avatar_url ? (
          <Avatar.Image size={40} source={{ uri: participant.profiles.avatar_url }} />
        ) : (
          <Avatar.Text
            size={40}
            label={participant.profiles?.first_name?.charAt(0) || '?'}
            style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
            labelStyle={{ color: AppTheme.colors.textSecondary }}
          />
        )}
        <View style={styles.participantInfo}>
          <Text variant="titleSmall" style={styles.participantName}>
            {participant.profiles?.first_name} {participant.profiles?.last_name?.charAt(0)}.
          </Text>
          {participant.mu_after && (
            <Text variant="bodySmall" style={styles.ratingText}>
              Rating: {(participant.mu_after - 3 * participant.sigma_after).toFixed(0)}
              {participant.mu_before && (
                <Text style={{ color: participant.mu_after > participant.mu_before ? '#4CAF50' : '#f44336' }}>
                  {' '}({participant.mu_after > participant.mu_before ? '+' : ''}
                  {(participant.mu_after - participant.mu_before).toFixed(1)})
                </Text>
              )}
            </Text>
          )}
        </View>
      </Surface>
    );

    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Players</Text>

        {team1.length > 0 && (
          <View style={styles.teamSection}>
            <Text variant="labelLarge" style={styles.teamLabel}>Team 1</Text>
            {team1.map(renderPlayer)}
          </View>
        )}

        {team2.length > 0 && (
          <View style={styles.teamSection}>
            <Text variant="labelLarge" style={styles.teamLabel}>Team 2</Text>
            {team2.map(renderPlayer)}
          </View>
        )}

        {noTeam.length > 0 && (
          <View style={styles.teamSection}>
            {noTeam.map(renderPlayer)}
          </View>
        )}
      </View>
    );
  };

  const renderResultSubmissions = () => {
    if (resultSubmissions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Result Submissions</Text>
        {resultSubmissions.map((submission) => (
          <Surface key={submission.id} style={styles.submissionCard} elevation={0}>
            <Text variant="titleSmall">
              {submission.profiles?.first_name || 'User'}:
            </Text>
            <Text variant="bodyMedium" style={styles.submissionResult}>
              {submission.winner_team === 0 ? 'Draw' : `Team ${submission.winner_team} Won`}
              {submission.score_team1 != null && submission.score_team2 != null && (
                ` (${submission.score_team1} - ${submission.score_team2})`
              )}
            </Text>
          </Surface>
        ))}
      </View>
    );
  };

  const renderActions = () => {
    if (!game || !session?.user?.id) return null;
    const state = game.game_state as GameState;

    return (
      <View style={styles.actionsSection}>
        {isParticipant && (
          <Button
            mode="contained"
            onPress={handleOpenChat}
            style={styles.chatButton}
            buttonColor={AppTheme.colors.secondary}
          >
            Open Chat
          </Button>
        )}

        {isHost && state === 'scheduled' && (
          <>
            <Button
              mode="contained"
              onPress={handleStartGame}
              loading={actionLoading}
              disabled={actionLoading}
              style={styles.actionButton}
              buttonColor={AppTheme.colors.primary}
            >
              Start Game
            </Button>
            <Button
              mode="outlined"
              onPress={handleCancelGame}
              disabled={actionLoading}
              style={styles.cancelButton}
              textColor="#d32f2f"
            >
              Cancel Game
            </Button>
          </>
        )}

        {isHost && state === 'in_progress' && (
          <Button
            mode="contained"
            onPress={handleEndGame}
            loading={actionLoading}
            disabled={actionLoading}
            style={styles.actionButton}
            buttonColor={AppTheme.colors.primary}
          >
            End Game
          </Button>
        )}

        {isParticipant && state === 'awaiting_results' && !currentUserSubmission && (
          <Button
            mode="contained"
            onPress={handleSubmitResult}
            style={styles.actionButton}
            buttonColor={AppTheme.colors.primary}
          >
            Submit Result
          </Button>
        )}

        {currentUserSubmission && (
          <Surface style={styles.submittedBadge} elevation={0}>
            <Text variant="labelLarge" style={styles.submittedText}>Result Submitted</Text>
          </Surface>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  const state = game.game_state as GameState;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Chip
              mode="flat"
              style={styles.sportChip}
              textStyle={styles.sportChipText}
            >
              {getSportName(game.sport_id, 'Sport')}
            </Chip>
            <Chip
              mode="flat"
              style={[styles.stateChip, { backgroundColor: gameStateColors[state] }]}
              textStyle={styles.stateChipText}
            >
              {gameStateLabels[state]}
            </Chip>
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            {game.description || 'Game'}
          </Text>
          <Text variant="bodyMedium" style={styles.date}>
            {game.requested_time ? formatDate(game.requested_time) : 'Time TBD'}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {/* Host info */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Host</Text>
          <Surface style={styles.hostCard} elevation={0}>
            {game.profiles?.avatar_url ? (
              <Avatar.Image size={48} source={{ uri: game.profiles.avatar_url }} />
            ) : (
              <Avatar.Text
                size={48}
                label={game.profiles?.first_name?.charAt(0) || '?'}
                style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
                labelStyle={{ color: AppTheme.colors.textSecondary }}
              />
            )}
            <Text variant="titleMedium" style={styles.hostName}>
              {game.profiles?.first_name} {game.profiles?.last_name}
            </Text>
          </Surface>
        </View>

        {/* Participants */}
        {renderParticipants()}

        {/* Result submissions */}
        {renderResultSubmissions()}

        {/* Final result for completed games */}
        {game.game_state === 'completed' && game.game_results && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Final Result</Text>
            <Surface style={styles.finalResultCard} elevation={1}>
              <Text variant="titleLarge" style={styles.finalResultText}>
                {game.game_results.is_draw ? 'Draw' : `Team ${game.game_results.winner_team} Won`}
              </Text>
              {game.game_results.score_team1 != null && (
                <Text variant="headlineMedium" style={styles.finalScoreText}>
                  {game.game_results.score_team1} - {game.game_results.score_team2}
                </Text>
              )}
            </Surface>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
  },
  errorText: {
    color: AppTheme.colors.textSecondary,
  },
  scrollContent: {
    padding: AppTheme.spacing.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: AppTheme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.md,
  },
  sportChip: {
    backgroundColor: `${AppTheme.colors.primary}15`,
  },
  sportChipText: {
    color: AppTheme.colors.primary,
    fontSize: 12,
  },
  stateChip: {},
  stateChipText: {
    color: AppTheme.colors.background,
    fontSize: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: AppTheme.spacing.xs,
  },
  date: {
    color: AppTheme.colors.textSecondary,
  },
  divider: {
    marginVertical: AppTheme.spacing.md,
  },
  section: {
    marginBottom: AppTheme.spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: AppTheme.spacing.md,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    gap: AppTheme.spacing.md,
  },
  hostName: {
    fontWeight: '600',
  },
  teamSection: {
    marginBottom: AppTheme.spacing.md,
  },
  teamLabel: {
    color: AppTheme.colors.primary,
    marginBottom: AppTheme.spacing.sm,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    marginBottom: AppTheme.spacing.sm,
    gap: AppTheme.spacing.md,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontWeight: '600',
  },
  ratingText: {
    color: AppTheme.colors.textSecondary,
  },
  submissionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    marginBottom: AppTheme.spacing.sm,
  },
  submissionResult: {
    color: AppTheme.colors.textSecondary,
  },
  finalResultCard: {
    padding: AppTheme.spacing.lg,
    backgroundColor: AppTheme.colors.primary,
    borderRadius: AppTheme.borderRadius.xl,
    alignItems: 'center',
  },
  finalResultText: {
    color: AppTheme.colors.background,
    fontWeight: '700',
  },
  finalScoreText: {
    color: AppTheme.colors.background,
    fontWeight: '700',
    marginTop: AppTheme.spacing.sm,
  },
  actionsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.divider,
    gap: AppTheme.spacing.sm,
  },
  actionButton: {
    borderRadius: AppTheme.borderRadius.full,
  },
  chatButton: {
    borderRadius: AppTheme.borderRadius.full,
  },
  cancelButton: {
    borderRadius: AppTheme.borderRadius.full,
    borderColor: AppTheme.colors.error,
  },
  submittedBadge: {
    backgroundColor: `${AppTheme.colors.accent}20`,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
    alignItems: 'center',
  },
  submittedText: {
    color: AppTheme.colors.accent,
  },
});
