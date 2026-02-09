import { supabase } from './client';

/**
 * Create a join request for a game request.
 */
export const createJoinRequest = async (gameRequestId: number, userId: string) => {
  try {
    const { data: existingRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('id')
      .eq('game_request_id', gameRequestId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing join request:', fetchError.message);
      throw fetchError;
    }

    if (existingRequest) {
      throw new Error('You have already requested to join this game.');
    }

    const { data, error } = await supabase.from('join_requests').insert([
      {
        game_request_id: gameRequestId,
        user_id: userId,
        status: 'Pending',
        requested_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error creating join request:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error creating join request:', error);
    throw error;
  }
};

/**
 * Retrieve join requests with optional filters.
 */
export const getJoinRequests = async (_hostUserId: string, filters: { game_request_ids?: number[]; user_id?: string; status?: string }) => {
  try {
    let query = supabase.from('join_requests').select('*');

    if (filters.game_request_ids && filters.game_request_ids.length > 0) {
      query = query.in('game_request_id', filters.game_request_ids);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching join requests:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching join requests:', error);
    throw error;
  }
};

/**
 * Delete a join request.
 */
export const deleteJoinRequest = async (joinRequestId: number, userId: string) => {
  try {
    const { data: joinRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('user_id')
      .eq('id', joinRequestId)
      .single();

    if (fetchError || !joinRequest) {
      throw new Error('Join request not found');
    }

    if (joinRequest.user_id !== userId) {
      throw new Error('You are not authorized to delete this join request');
    }

    const { error } = await supabase.from('join_requests').delete().eq('id', joinRequestId);

    if (error) {
      console.error('Error deleting join request:', error.message);
      throw error;
    }

    return { message: 'Join request deleted successfully' };
  } catch (error) {
    console.error('Unexpected error deleting join request:', error);
    throw error;
  }
};

/**
 * Result type from join request RPC functions
 */
interface JoinRequestRPCResult {
  success: boolean;
  message: string;
  new_player_count: number;
}

/**
 * Accept a join request using the transaction-safe RPC function.
 * This prevents race conditions when multiple requests are accepted simultaneously.
 */
export const acceptJoinRequest = async (
  joinRequestId: number,
  hostId: string
): Promise<{ success: boolean; message: string; newPlayerCount?: number }> => {
  try {
    const { data, error } = await supabase.rpc('accept_join_request', {
      p_request_id: joinRequestId,
      p_host_id: hostId,
    });

    if (error) {
      console.error('Error calling accept_join_request RPC:', error);
      throw new Error(error.message || 'Failed to accept join request');
    }

    const result = data as JoinRequestRPCResult;
    return {
      success: result.success,
      message: result.message,
      newPlayerCount: result.new_player_count,
    };
  } catch (error) {
    console.error('Unexpected error accepting join request:', error);
    throw error;
  }
};

/**
 * Reject a join request using the transaction-safe RPC function.
 */
export const rejectJoinRequest = async (
  joinRequestId: number,
  hostId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.rpc('reject_join_request', {
      p_request_id: joinRequestId,
      p_host_id: hostId,
    });

    if (error) {
      console.error('Error calling reject_join_request RPC:', error);
      throw new Error(error.message || 'Failed to reject join request');
    }

    const result = data as JoinRequestRPCResult;
    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error('Unexpected error rejecting join request:', error);
    throw error;
  }
};

/**
 * Kick a player from a game (removes an accepted player).
 */
export const kickPlayerFromGame = async (
  joinRequestId: number,
  hostId: string
): Promise<{ success: boolean; message: string; newPlayerCount?: number }> => {
  try {
    const { data, error } = await supabase.rpc('kick_player_from_game', {
      p_request_id: joinRequestId,
      p_host_id: hostId,
    });

    if (error) {
      console.error('Error calling kick_player_from_game RPC:', error);
      throw new Error(error.message || 'Failed to remove player');
    }

    const result = data as JoinRequestRPCResult;
    return {
      success: result.success,
      message: result.message,
      newPlayerCount: result.new_player_count,
    };
  } catch (error) {
    console.error('Unexpected error removing player:', error);
    throw error;
  }
};

/**
 * Update join request status (Accepted or Rejected) and update player count accordingly.
 * @deprecated Use acceptJoinRequest() or rejectJoinRequest() instead for race-condition safety
 */
export const updateJoinRequestStatus = async (
  joinRequestId: number,
  hostId: string,
  newStatus: 'Accepted' | 'Rejected'
) => {
  // Use the new transaction-safe functions
  if (newStatus === 'Accepted') {
    const result = await acceptJoinRequest(joinRequestId, hostId);
    if (!result.success) {
      throw new Error(result.message);
    }
    return { message: result.message };
  } else {
    const result = await rejectJoinRequest(joinRequestId, hostId);
    if (!result.success) {
      throw new Error(result.message);
    }
    return { message: result.message };
  }
};

/**
 * Change join request status
 */
export const changeJoinRequestStatus = async (requestId: number, hostId: string, status: string) => {
  const { error } = await supabase
    .from('game_join_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('host_id', hostId);

  if (error) throw error;
};

/**
 * Get all game request IDs that the user has already requested to join (Pending or Accepted)
 * Returns an object with gameId as key and status as value
 */
export const getUserRequestedGameIds = async (userId: string): Promise<{ [gameId: number]: string }> => {
  try {
    const { data, error } = await supabase
      .from('join_requests')
      .select('game_request_id, status')
      .eq('user_id', userId)
      .in('status', ['Pending', 'Accepted']);

    if (error) {
      console.error('Error fetching user requests:', error.message);
      throw error;
    }

    const result: { [gameId: number]: string } = {};
    for (const r of data || []) {
      result[r.game_request_id] = r.status;
    }
    return result;
  } catch (error) {
    console.error('Unexpected error fetching user requests:', error);
    return {};
  }
};

// Backward compatibility alias
export const getUserPendingRequestGameIds = async (userId: string): Promise<number[]> => {
  const requests = await getUserRequestedGameIds(userId);
  return Object.keys(requests).map(Number);
};
