import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase URL and anon key from the Supabase dashboard
const supabaseUrl = 'https://utreebqeudeznsggsbry.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmVlYnFldWRlem5zZ2dzYnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDMzMTksImV4cCI6MjA0NjI3OTMxOX0.UkAIxSqYHt4hq-oG5WMujeUKloCx02jhR--O42GH_q0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auth queries

//POST
/**
 * Signs up a user and creates a profile.
 */
export const signUpAndCreateProfile = async (
  email: string,
  password: string,
  profileData: {
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    location: { lat: number; lng: number };
  }
) => {
  // Step 1: Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Error during sign-up:', signUpError.message);
    throw signUpError;
  }

  const user = signUpData.user;

  if (!user) {
    throw new Error('User was not created during sign-up.');
  }

  // Step 2: Create a profile for the user
  const { username, first_name, last_name, age, gender, location } = profileData;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id, // The user's UUID from Supabase Auth
    username,
    first_name,
    last_name,
    age,
    gender,
    location: `SRID=4326;POINT(${location.lng} ${location.lat})`, // Store as geometry
  });

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
    throw profileError;
  }

  return { user, profile: { ...profileData, id: user.id } };
};

//POST
/*
* Sign into account
*/
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

//POST
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

//DELETE
/*
Deletes user account and corresponding profile
*/
export const deleteUserAccount = async () => {
  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error(userError?.message || 'No user is logged in.');
    }

    const userId = user.id;

    // Delete the user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Error deleting user from auth: ${authError.message}`);
    }

    console.log('User and profile deleted successfully.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting user account:', error.message);
    } else {
      console.error('Unknown error occurred.');
    }
    throw error; // Re-throw for further handling if needed
  }
};

//Profile queries

//PUT
/**
 * Updates a user's profile.
 */
export const updateProfile = async (
  id: string,
  profileData: Partial<{
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    location: { lat: number; lng: number };
  }>
) => {
  const { location, ...rest } = profileData;

  const updateData = {
    ...rest,
    ...(location && { location: `SRID=4326;POINT(${location.lng} ${location.lat})` }),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating profile:', error.message);
    throw error;
  }

  return data;
};

//GET
//*
// Fetch the user's own profile data (includes sensitive fields like location).
// */
export const fetchOwnProfile = async (userId: string) => {
 const { data, error } = await supabase
   .from('profiles')
   .select('*') // Fetch all fields
   .eq('id', userId)
   .single();

 if (error) {
   console.error('Error fetching user profile:', error.message);
   throw error;
 }

 return data;
};

//GET
/**
* Fetch another user's public profile data (excludes sensitive fields like location).
*/
export const fetchPublicProfile = async (userId: string) => {
 const { data, error } = await supabase
   .from('profiles')
   .select('id, username, first_name, last_name, avatar_url') // Exclude sensitive fields
   .eq('id', userId)
   .single();

 if (error) {
   console.error('Error fetching public profile:', error.message);
   throw error;
 }

 return data;
};

//POST & DELETE
// Not required. Post is associated with sign up and delete is associated with account deletion



// Game Request queries



//POST
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
      current_players = 1, // Default to 1
    } = gameData;

    const { data, error } = await supabase.from('game_requests').insert([
      {
        creator_id,
        sport_id,
        location: `SRID=4326;POINT(${location.lng} ${location.lat})`, // Store as geometry
        requested_time,
        status: 'Open', // Default to Open
        description,
        max_players,
        current_players,
      },
    ]);

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

//PUT
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
    // Fetch the game request to verify the creator
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

    // Prepare updates
    const { location, ...restUpdates } = updates;
    const updateData = {
      ...restUpdates,
      ...(location && { location: `SRID=4326;POINT(${location.lng} ${location.lat})` }),
    };

    // Update the game request
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

//GET
/**
 * Fetch a user's own game requests.
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

//GET
/**
 * Search for game requests based on filters, radius, and sorting criteria.
 */
interface GameRequest {
  id: number;
  creator_id: string;
  sport_id: number;
  location: string; // This is a geometry(Point, 4326) type; you may process it further if needed
  requested_time: string;
  status: 'Open' | 'Closed';
  description: string;
  max_players: number;
  current_players: number;
  distance: number; // This is added by the Postgres function
}
export const searchGameRequests = async (filters: {
  location: { lat: number; lng: number };
  radius: number;
  sport_id?: number;
  requested_time_from?: string;
  requested_time_to?: string;
  status?: 'Open' | 'Closed';
  sort_by?: 'recency' | 'max_players';
  sort_order?: 'asc' | 'desc';
}): Promise<GameRequest[]> => {
  try {
    const { data, error } = await supabase.rpc<
      any, // Allow flexibility in the return type
      {
        user_longitude: number;
        user_latitude: number;
        radius: number;
        sport_filter?: number | null;
        status_filter?: string | null;
        time_from?: string | null;
        time_to?: string | null;
      }
    >('search_game_requests', {
      user_longitude: filters.location.lng,
      user_latitude: filters.location.lat,
      radius: filters.radius,
      sport_filter: filters.sport_id || null,
      status_filter: filters.status || null,
      time_from: filters.requested_time_from || null,
      time_to: filters.requested_time_to || null,
    });

    if (error) {
      console.error('Error searching for game requests:', error.message);
      throw error;
    }

    // Cast the response data to GameRequest[]
    const gameRequests = data as GameRequest[];

    // Apply sorting if needed
    if (filters.sort_by === 'max_players') {
      gameRequests.sort((a, b) =>
        filters.sort_order === 'asc'
          ? a.max_players - b.max_players
          : b.max_players - a.max_players
      );
    }

    return gameRequests;
  } catch (error) {
    console.error('Unexpected error searching for game requests:', error);
    throw error;
  }
};


export const joinGameRequest = async (gameId: number) => {
  try {
    // Get current game data
    const { data: game, error: fetchError } = await supabase
      .from("game_requests")
      .select("*")
      .eq("id", gameId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    // Prevent overbooking
    if (game.current_players >= game.max_players) {
      throw new Error("Game is full.");
    }

    // Update current players
    const updatedPlayers = game.current_players + 1;

    const { data, error: updateError } = await supabase
      .from("game_requests")
      .update({ current_players: updatedPlayers })
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return data; // Return updated event
  } catch (error) {
    console.error("Error joining game request:", error);
    throw error;
  }
};


//DELETE
/**
 * Delete a game request.
 */
export const deleteGameRequest = async (gameId: number, creatorId: string) => {
  try {
    // Fetch the game request to verify the creator
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

    // Delete the game request
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


// Join Request Queries

/**
 * Create a join request for a game request.
 * Ensures that the same user cannot request to join the same game more than once.
 */
export const createJoinRequest = async (gameRequestId: number, userId: string) => {
  try {
    // Check if the user has already made a join request for this game_request_id
    const { data: existingRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('id')
      .eq('game_request_id', gameRequestId)
      .eq('user_id', userId)
      .single(); // Use single() to retrieve at most one row

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Ignore "No rows found" error (PGRST116) since it means the user hasn't joined yet
      console.error('Error checking existing join request:', fetchError.message);
      throw fetchError;
    }

    // If a join request already exists, prevent duplicate submissions
    if (existingRequest) {
      throw new Error('You have already requested to join this game.');
    }

    // Insert new join request
    const { data, error } = await supabase.from('join_requests').insert([
      {
        game_request_id: gameRequestId,
        user_id: userId,
        status: 'Pending',
        requested_at: new Date().toISOString(), // Set current timestamp
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

//GET
/**
 * Retrieve join requests with optional filters.
 */
export const getJoinRequests = async (filters: { game_request_id?: number; user_id?: string }) => {
  try {
    let query = supabase.from('join_requests').select('*');

    if (filters.game_request_id) {
      query = query.eq('game_request_id', filters.game_request_id);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
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

//DELETE
/**
 * Delete a join request.
 */
export const deleteJoinRequest = async (joinRequestId: number, userId: string) => {
  try {
    // Ensure the join request belongs to the user
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

    // Proceed to delete the join request
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

//UPDATE
/**
 * Update join request status (Accepted or Rejected) and update player count accordingly.
 */
export const updateJoinRequestStatus = async (
  joinRequestId: number,
  hostId: string,
  newStatus: 'Accepted' | 'Rejected'
) => {
  try {
    // Fetch the join request and related game request
    const { data: joinRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('game_request_id, user_id, status')
      .eq('id', joinRequestId)
      .single();

    if (fetchError || !joinRequest) {
      throw new Error('Join request not found');
    }

    // Fetch the game request and verify the host is updating the request
    const { data: gameRequest, error: gameFetchError } = await supabase
      .from('game_requests')
      .select('creator_id, current_players, max_players')
      .eq('id', joinRequest.game_request_id)
      .single();

    if (gameFetchError || !gameRequest) {
      throw new Error('Game request not found');
    }

    if (gameRequest.creator_id !== hostId) {
      throw new Error('You are not authorized to update this join request');
    }

    // Track whether the player count should be updated
    let playerCountChange = 0;

    // Handle status change logic
    if (newStatus === 'Accepted' && joinRequest.status === 'Pending') {
      // Accepting a new user
      if (gameRequest.current_players >= gameRequest.max_players) {
        throw new Error('Game request is already full');
      }
      playerCountChange = 1;
    } else if (newStatus === 'Rejected' && joinRequest.status === 'Accepted') {
      // Changing from Accepted to Rejected, decrease player count
      playerCountChange = -1;
    }

    // Update the join request status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ status: newStatus })
      .eq('id', joinRequestId);

    if (updateError) {
      throw new Error(`Error updating join request status: ${updateError.message}`);
    }

    // Update the player count if necessary
    if (playerCountChange !== 0) {
      const { error: playerUpdateError } = await supabase
        .from('game_requests')
        .update({ current_players: gameRequest.current_players + playerCountChange })
        .eq('id', joinRequest.game_request_id);

      if (playerUpdateError) {
        throw new Error(`Error updating player count: ${playerUpdateError.message}`);
      }
    }

    return { message: `Join request has been ${newStatus.toLowerCase()}` };
  } catch (error) {
    console.error('Unexpected error updating join request status:', error);
    throw error;
  }
};
