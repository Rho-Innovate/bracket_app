import { supabase } from './client';
import type { GameState, GameParticipant } from './types';

/**
 * Start a game (move from scheduled to in_progress)
 */
export const startGame = async (gameId: number, hostId: string): Promise<void> => {
  try {
    const { data: game, error: fetchError } = await supabase
      .from('game_requests')
      .select('creator_id, game_state')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      throw new Error('Game not found');
    }

    if (game.creator_id !== hostId) {
      throw new Error('Only the host can start the game');
    }

    if (game.game_state !== 'scheduled') {
      throw new Error(`Cannot start game in state: ${game.game_state}`);
    }

    const { error } = await supabase
      .from('game_requests')
      .update({
        game_state: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (error) throw error;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

/**
 * End a game (move from in_progress to awaiting_results)
 */
export const endGame = async (gameId: number, hostId: string): Promise<void> => {
  try {
    const { data: game, error: fetchError } = await supabase
      .from('game_requests')
      .select('creator_id, game_state')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      throw new Error('Game not found');
    }

    if (game.creator_id !== hostId) {
      throw new Error('Only the host can end the game');
    }

    if (game.game_state !== 'in_progress') {
      throw new Error(`Cannot end game in state: ${game.game_state}`);
    }

    const { error } = await supabase
      .from('game_requests')
      .update({
        game_state: 'awaiting_results',
        ended_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (error) throw error;
  } catch (error) {
    console.error('Error ending game:', error);
    throw error;
  }
};

/**
 * Cancel a game
 */
export const cancelGame = async (gameId: number, hostId: string, _reason?: string): Promise<void> => {
  try {
    const { data: game, error: fetchError } = await supabase
      .from('game_requests')
      .select('creator_id, game_state')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      throw new Error('Game not found');
    }

    if (game.creator_id !== hostId) {
      throw new Error('Only the host can cancel the game');
    }

    if (game.game_state === 'completed' || game.game_state === 'cancelled') {
      throw new Error(`Cannot cancel game in state: ${game.game_state}`);
    }

    const { error } = await supabase
      .from('game_requests')
      .update({
        game_state: 'cancelled',
        status: 'Closed'
      })
      .eq('id', gameId);

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling game:', error);
    throw error;
  }
};

/**
 * Get user's active game (in_progress)
 */
export const getUserActiveGame = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        game_id,
        team,
        game_requests(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const activeGames = (data || []).filter(
      (p: any) => p.game_requests?.game_state === 'in_progress'
    );

    return activeGames.length > 0 ? activeGames[0] : null;
  } catch (error) {
    console.error('Error getting user active game:', error);
    throw error;
  }
};

/**
 * Subscribe to game state changes
 */
export const subscribeToGameState = (
  gameId: number,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`game_state_${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_requests',
        filter: `id=eq.${gameId}`
      },
      callback
    )
    .subscribe();
};

// Game Participants Functions

/**
 * Add participant to a game
 */
export const addGameParticipant = async (
  gameId: number,
  userId: string,
  team?: number
): Promise<GameParticipant> => {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .insert({
        game_id: gameId,
        user_id: userId,
        team: team || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding game participant:', error);
    throw error;
  }
};

/**
 * Update participant's team assignment
 */
export const updateParticipantTeam = async (
  gameId: number,
  userId: string,
  team: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('game_participants')
      .update({ team })
      .eq('game_id', gameId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating participant team:', error);
    throw error;
  }
};

/**
 * Get all participants for a game
 */
export const getGameParticipants = async (gameId: number): Promise<GameParticipant[]> => {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        *,
        profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('game_id', gameId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting game participants:', error);
    throw error;
  }
};
