import { supabase } from './client';
import type { MatchmakingQueueEntry, MatchProposal, MatchHistoryEntry } from './types';

/**
 * Join the matchmaking queue
 */
export const joinMatchmakingQueue = async (
  userId: string,
  sportId: number,
  preferences: {
    location?: { lat: number; lng: number };
    searchRadiusKm?: number;
    preferredTimeStart?: string;
    preferredTimeEnd?: string;
    skillRangeMin?: number;
    skillRangeMax?: number;
  }
): Promise<MatchmakingQueueEntry> => {
  try {
    const insertData: any = {
      user_id: userId,
      sport_id: sportId,
      search_radius_km: preferences.searchRadiusKm || 10,
      is_active: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    if (preferences.location) {
      insertData.location = `SRID=4326;POINT(${preferences.location.lng} ${preferences.location.lat})`;
    }
    if (preferences.preferredTimeStart) {
      insertData.preferred_time_start = preferences.preferredTimeStart;
    }
    if (preferences.preferredTimeEnd) {
      insertData.preferred_time_end = preferences.preferredTimeEnd;
    }
    if (preferences.skillRangeMin !== undefined) {
      insertData.skill_range_min = preferences.skillRangeMin;
    }
    if (preferences.skillRangeMax !== undefined) {
      insertData.skill_range_max = preferences.skillRangeMax;
    }

    const { data, error } = await supabase
      .from('matchmaking_queue')
      .upsert(insertData, {
        onConflict: 'user_id,sport_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error joining matchmaking queue:', error);
    throw error;
  }
};

/**
 * Leave the matchmaking queue
 */
export const leaveMatchmakingQueue = async (userId: string, sportId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', userId)
      .eq('sport_id', sportId);

    if (error) throw error;
  } catch (error) {
    console.error('Error leaving matchmaking queue:', error);
    throw error;
  }
};

/**
 * Get user's current queue status
 */
export const getQueueStatus = async (userId: string): Promise<MatchmakingQueueEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting queue status:', error);
    throw error;
  }
};

/**
 * Get pending match proposals for a user
 */
export const getMatchProposals = async (userId: string): Promise<MatchProposal[]> => {
  try {
    const { data, error } = await supabase
      .from('match_proposals')
      .select(`
        *,
        player1:profiles!match_proposals_player1_id_fkey(id, username, first_name, last_name, avatar_url),
        player2:profiles!match_proposals_player2_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting match proposals:', error);
    throw error;
  }
};

/**
 * Respond to a match proposal (accept/decline)
 */
export const respondToMatchProposal = async (
  proposalId: number,
  userId: string,
  accept: boolean
): Promise<{ status: string; gameId?: number }> => {
  try {
    const { data: proposal, error: fetchError } = await supabase
      .from('match_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError || !proposal) {
      throw new Error('Match proposal not found');
    }

    const isPlayer1 = proposal.player1_id === userId;
    const isPlayer2 = proposal.player2_id === userId;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error('You are not part of this match proposal');
    }

    const updateData: any = {};
    if (isPlayer1) {
      updateData.player1_accepted = accept;
    } else {
      updateData.player2_accepted = accept;
    }

    if (!accept) {
      updateData.status = 'declined';
    }

    const { data: updated, error: updateError } = await supabase
      .from('match_proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (updated.player1_accepted && updated.player2_accepted) {
      const { data: newGame, error: gameError } = await supabase
        .from('game_requests')
        .insert({
          creator_id: proposal.player1_id,
          sport_id: proposal.sport_id,
          location: proposal.proposed_location,
          requested_time: proposal.proposed_time || new Date().toISOString(),
          description: 'Matchmaking game',
          max_players: 2,
          current_players: 2,
          status: 'Open',
          game_state: 'scheduled'
        })
        .select()
        .single();

      if (gameError) throw gameError;

      await supabase
        .from('match_proposals')
        .update({
          status: 'accepted',
          created_game_id: newGame.id
        })
        .eq('id', proposalId);

      await supabase
        .from('game_participants')
        .insert([
          { game_id: newGame.id, user_id: proposal.player1_id, team: 1 },
          { game_id: newGame.id, user_id: proposal.player2_id, team: 2 }
        ]);

      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('sport_id', proposal.sport_id)
        .in('user_id', [proposal.player1_id, proposal.player2_id]);

      return { status: 'accepted', gameId: newGame.id };
    }

    return { status: accept ? 'waiting' : 'declined' };
  } catch (error) {
    console.error('Error responding to match proposal:', error);
    throw error;
  }
};

/**
 * Subscribe to match proposals for a user
 */
export const subscribeToMatchProposals = (
  userId: string,
  callback: (proposal: MatchProposal) => void
) => {
  return supabase
    .channel(`match_proposals_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_proposals',
        filter: `player1_id=eq.${userId}`
      },
      (payload) => callback(payload.new as MatchProposal)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'match_proposals',
        filter: `player2_id=eq.${userId}`
      },
      (payload) => callback(payload.new as MatchProposal)
    )
    .subscribe();
};

/**
 * Get user's match history
 */
export const getUserMatchHistory = async (
  userId: string,
  sportId?: number,
  limit: number = 20
): Promise<MatchHistoryEntry[]> => {
  try {
    let query = supabase
      .from('match_history')
      .select('*')
      .or(`team1_user_ids.cs.{${userId}},team2_user_ids.cs.{${userId}}`)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting match history:', error);
    throw error;
  }
};

/**
 * Record match to history (called after game completion)
 */
export const recordMatchHistory = async (
  gameId: number,
  sportId: number,
  team1UserIds: string[],
  team2UserIds: string[],
  winnerTeam: number,
  team1Score?: number,
  team2Score?: number
): Promise<MatchHistoryEntry> => {
  try {
    const { data, error } = await supabase
      .from('match_history')
      .insert({
        game_id: gameId,
        sport_id: sportId,
        team1_user_ids: team1UserIds,
        team2_user_ids: team2UserIds,
        winner_team: winnerTeam,
        team1_score: team1Score,
        team2_score: team2Score,
        played_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording match history:', error);
    throw error;
  }
};

/**
 * Trigger the matchmaking Edge Function to find matches
 * This should be called after a player joins the queue
 */
export const triggerMatchmaking = async (sportId?: number): Promise<{ matched: number; proposalIds: number[] }> => {
  try {
    const { data, error } = await supabase.functions.invoke('matchmaking', {
      body: { sportId, runForAll: !sportId }
    });

    if (error) {
      console.error('Error triggering matchmaking:', error);
      // Don't throw - matchmaking failure shouldn't block the user
      return { matched: 0, proposalIds: [] };
    }

    return data || { matched: 0, proposalIds: [] };
  } catch (error) {
    console.error('Error invoking matchmaking function:', error);
    return { matched: 0, proposalIds: [] };
  }
};
