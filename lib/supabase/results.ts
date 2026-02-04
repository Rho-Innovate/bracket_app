import { supabase } from './client';
import type { ResultSubmission, GameResult, UserReport } from './types';

/**
 * Submit game result
 */
export const submitGameResult = async (
  gameId: number,
  userId: string,
  winnerTeam: number,
  scoreTeam1?: number,
  scoreTeam2?: number
): Promise<ResultSubmission> => {
  try {
    const { data: participant, error: partError } = await supabase
      .from('game_participants')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', userId)
      .single();

    if (partError || !participant) {
      throw new Error('You are not a participant in this game');
    }

    const { data: game, error: gameError } = await supabase
      .from('game_requests')
      .select('game_state')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      throw new Error('Game not found');
    }

    if (game.game_state !== 'awaiting_results') {
      throw new Error('Game is not accepting results');
    }

    const { data, error } = await supabase
      .from('game_result_submissions')
      .upsert({
        game_id: gameId,
        submitted_by: userId,
        winner_team: winnerTeam,
        score_team1: scoreTeam1,
        score_team2: scoreTeam2,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'game_id,submitted_by'
      })
      .select()
      .single();

    if (error) throw error;

    await checkAndFinalizeConsensus(gameId);

    return data;
  } catch (error) {
    console.error('Error submitting game result:', error);
    throw error;
  }
};

/**
 * Get all result submissions for a game
 */
export const getResultSubmissions = async (gameId: number): Promise<ResultSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from('game_result_submissions')
      .select(`
        *,
        profiles(id, username, first_name, last_name)
      `)
      .eq('game_id', gameId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting result submissions:', error);
    throw error;
  }
};

/**
 * Check if consensus has been reached and finalize if so
 */
export const checkAndFinalizeConsensus = async (gameId: number): Promise<boolean> => {
  try {
    const { data: participants, error: partError } = await supabase
      .from('game_participants')
      .select('user_id')
      .eq('game_id', gameId);

    if (partError) throw partError;

    const { data: submissions, error: subError } = await supabase
      .from('game_result_submissions')
      .select('*')
      .eq('game_id', gameId);

    if (subError) throw subError;

    const participantCount = participants?.length || 0;
    const submissionCount = submissions?.length || 0;

    if (submissionCount < participantCount) {
      return false;
    }

    const winners = new Set(submissions?.map(s => s.winner_team));
    if (winners.size !== 1) {
      await supabase
        .from('game_requests')
        .update({ game_state: 'disputed' })
        .eq('id', gameId);
      return false;
    }

    const winnerTeam = submissions![0].winner_team;
    const avgScore1 = submissions?.reduce((acc, s) => acc + (s.score_team1 || 0), 0) / submissionCount;
    const avgScore2 = submissions?.reduce((acc, s) => acc + (s.score_team2 || 0), 0) / submissionCount;

    const { error: resultError } = await supabase
      .from('game_results')
      .upsert({
        game_id: gameId,
        winner_team: winnerTeam,
        is_draw: winnerTeam === 0,
        score_team1: Math.round(avgScore1),
        score_team2: Math.round(avgScore2),
        consensus_reached: true,
        resolved_by: 'consensus',
        finalized_at: new Date().toISOString()
      }, {
        onConflict: 'game_id'
      });

    if (resultError) throw resultError;

    await supabase
      .from('game_requests')
      .update({ game_state: 'completed' })
      .eq('id', gameId);

    return true;
  } catch (error) {
    console.error('Error checking consensus:', error);
    throw error;
  }
};

/**
 * Get final game result
 */
export const getGameResult = async (gameId: number): Promise<GameResult | null> => {
  try {
    const { data, error } = await supabase
      .from('game_results')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting game result:', error);
    throw error;
  }
};

/**
 * Report a user for dispute or misconduct
 */
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: UserReport['reason'],
  gameId?: number,
  description?: string
): Promise<UserReport> => {
  try {
    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        game_id: gameId,
        reason,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc('increment_dispute_count', { user_id: reportedUserId });

    return data;
  } catch (error) {
    console.error('Error reporting user:', error);
    throw error;
  }
};
