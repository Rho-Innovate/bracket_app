import { supabase } from './client';

/**
 * Create a new game request
 */
export const createGameRequest = async (gameData: {
  creator_id: string;
  sport_id: number;
  location: { lat: number; lng: number };
  requested_time: string;
  description: string;
  max_players: number;
  current_players?: number;
}) => {
  try {
    const {
      creator_id,
      sport_id,
      location,
      requested_time,
      description,
      max_players,
      current_players = 1,
    } = gameData;

    const { data, error } = await supabase.from('game_requests').insert({
      creator_id,
      sport_id,
      location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
      requested_time,
      status: 'Open',
      description,
      max_players,
      current_players,
    }).select().single();

    if (error) {
      console.error('Error creating game request:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error creating game request:', error);
    throw error;
  }
};

/**
 * Modifies an existing game request
 */
export const modifyGameRequest = async (
  gameId: number,
  creatorId: string,
  updates: Partial<{
    sport_id: number;
    location: { lat: number; lng: number };
    requested_time: string;
    status: 'Open' | 'Closed';
    description: string;
    max_players: number;
    current_players: number;
  }>
) => {
  try {
    const { data: gameRequest, error: fetchError } = await supabase
      .from('game_requests')
      .select('creator_id')
      .eq('id', gameId)
      .single();

    if (fetchError || !gameRequest) {
      throw new Error('Game request not found');
    }

    if (gameRequest.creator_id !== creatorId) {
      throw new Error('You are not authorized to modify this game request');
    }

    const { location, ...restUpdates } = updates;
    const updateData = {
      ...restUpdates,
      ...(location && { location: `SRID=4326;POINT(${location.lng} ${location.lat})` }),
    };

    const { data, error: updateError } = await supabase
      .from('game_requests')
      .update(updateData)
      .eq('id', gameId);

    if (updateError) {
      console.error('Error modifying game request:', updateError.message);
      throw updateError;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error modifying game request:', error);
    throw error;
  }
};

/**
 * Fetch a user's own game requests
 */
export const fetchOwnGameRequests = async (creatorId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_requests')
      .select('*')
      .eq('creator_id', creatorId);

    if (error) {
      console.error('Error fetching own game requests:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching own game requests:', error);
    throw error;
  }
};

/**
 * Search for game requests based on filters
 */
export const getGameRequests = async (filters: {
  location?: { lat: number; lng: number };
  creator_id?: string;
  square_radius?: number;
  sport_id?: number;
  requested_time_from?: string;
  requested_time_to?: string;
  status?: 'Open' | 'Closed';
  sort_by?: 'recency' | 'max_players';
  sort_order?: 'asc' | 'desc';
  game_id?: number;
}) => {
  try {
    let query = supabase.from('game_requests').select('*');

    if (filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id);
    }
    if (filters.sport_id) {
      query = query.eq('sport_id', filters.sport_id);
    }
    if (filters.requested_time_from) {
      query = query.gte('requested_time', filters.requested_time_from);
    }
    if (filters.requested_time_to) {
      query = query.lte('requested_time', filters.requested_time_to);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.game_id) {
      query = query.eq('id', filters.game_id);
    }

    if (filters.sort_by === 'recency') {
      query = query.order('requested_time', { ascending: filters.sort_order === 'asc' });
    } else if (filters.sort_by === 'max_players') {
      query = query.order('max_players', { ascending: filters.sort_order === 'asc' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching for game requests:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error searching for game requests:', error);
    throw error;
  }
};

/**
 * Delete a game request
 */
export const deleteGameRequest = async (gameId: number, creatorId: string) => {
  try {
    const { data: gameRequest, error: fetchError } = await supabase
      .from('game_requests')
      .select('creator_id')
      .eq('id', gameId)
      .single();

    if (fetchError || !gameRequest) {
      throw new Error('Game request not found');
    }

    if (gameRequest.creator_id !== creatorId) {
      throw new Error('You are not authorized to delete this game request');
    }

    const { error: deleteError } = await supabase
      .from('game_requests')
      .delete()
      .eq('id', gameId);

    if (deleteError) {
      console.error('Error deleting game request:', deleteError.message);
      throw deleteError;
    }

    return { message: 'Game request deleted successfully' };
  } catch (error) {
    console.error('Unexpected error deleting game request:', error);
    throw error;
  }
};

/**
 * Update player count for a game
 */
export const updatePlayerCount = async (gameId: number, increment: number) => {
  const { data: gameData, error: fetchError } = await supabase
    .from('game_requests')
    .select('current_players')
    .eq('id', gameId)
    .single();

  if (fetchError) throw fetchError;

  const newCount = (gameData.current_players || 0) + increment;

  const { data, error } = await supabase
    .from('game_requests')
    .update({ current_players: newCount })
    .eq('id', gameId);

  if (error) throw error;
  return data;
};

/**
 * Get game requests with host profiles in a single optimized query.
 * This avoids N+1 queries by JOINing with profiles table.
 */
export const getGameRequestsWithHosts = async (filters: {
  status?: 'Open' | 'Closed';
  sport_id?: number;
  requested_time_from?: string;
  requested_time_to?: string;
} = {}) => {
  try {
    let query = supabase
      .from('game_requests')
      .select(`
        *,
        profiles!game_requests_creator_id_fkey(
          id,
          username,
          first_name,
          last_name,
          avatar_url
        )
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.sport_id) {
      query = query.eq('sport_id', filters.sport_id);
    }
    if (filters.requested_time_from) {
      query = query.gte('requested_time', filters.requested_time_from);
    }
    if (filters.requested_time_to) {
      query = query.lte('requested_time', filters.requested_time_to);
    }

    // Order by most recent first
    query = query.order('requested_time', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching game requests with hosts:', error.message);
      throw error;
    }

    // Transform the data to match the expected EventWithHost format
    return (data || []).map((game) => ({
      ...game,
      host: game.profiles ? {
        id: game.profiles.id,
        first_name: game.profiles.first_name,
        last_name: game.profiles.last_name,
        username: game.profiles.username,
        avatar_url: game.profiles.avatar_url,
      } : undefined,
    }));
  } catch (error) {
    console.error('Unexpected error fetching game requests with hosts:', error);
    throw error;
  }
};

/**
 * Get game with full details including participants
 */
export const getGameDetails = async (gameId: number) => {
  try {
    const { data: game, error: gameError } = await supabase
      .from('game_requests')
      .select(`
        *,
        profiles!game_requests_creator_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const { data: participants, error: partError } = await supabase
      .from('game_participants')
      .select(`
        *,
        profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq('game_id', gameId);

    if (partError) throw partError;

    return {
      ...game,
      participants: participants || []
    };
  } catch (error) {
    console.error('Error getting game details:', error);
    throw error;
  }
};
