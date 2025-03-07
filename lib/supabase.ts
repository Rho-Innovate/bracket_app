import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { decode } from 'base64-arraybuffer'

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

// Update the Profile interface
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  description?: string;
  sports_preferences?: Array<{
    sport: string;
    skill_level: string;
    years_experience: number;
  }>;
}

// Update the updateProfile function type
export const updateProfile = async (
  id: string,
  profileData: Partial<{
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    location: { lat: number; lng: number };
    description: string;
    avatar_url: string;
    sports_preferences: Array<{
      sport: string;
      skill_level: string;
      years_experience: number;
    }>;
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

export const getGameRequests = async (filters: {
  location?: { lat: number; lng: number };
  creator_id?: string;
  square_radius?: number; // Instead of circular radius, this defines the bounding box size
  sport_id?: number;
  requested_time_from?: string;
  requested_time_to?: string;
  status?: 'Open' | 'Closed';
  sort_by?: 'recency' | 'max_players';
  sort_order?: 'asc' | 'desc';
}) => {
  try {
    // Calculate bounding box (square)
    
    // Base query
    let query = supabase.from('game_requests').select('*');

    // Apply filters
    if(filters.creator_id) {
      query = query.eq('creator_id', filters.creator_id)
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

    // Apply bounding box filter for location (square radius)
    if (filters.square_radius && filters.location){
      const lat_min = filters.location.lat - filters.square_radius;
      const lat_max = filters.location.lat + filters.square_radius;
      const lng_min = filters.location.lng - filters.square_radius;
      const lng_max = filters.location.lng + filters.square_radius;

      query = query
        .gte('ST_Y(location)', lat_min) // Latitude >= lat_min
        .lte('ST_Y(location)', lat_max) // Latitude <= lat_max
        .gte('ST_X(location)', lng_min) // Longitude >= lng_min
        .lte('ST_X(location)', lng_max); // Longitude <= lng_max
    }
    // Apply sorting
    if (filters.sort_by === 'recency') {
      query = query.order('requested_time', { ascending: filters.sort_order === 'asc' });
    } else if (filters.sort_by === 'max_players') {
      query = query.order('max_players', { ascending: filters.sort_order === 'asc' });
    }

    // Fetch data
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

//Lowkey Useless
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
export const getJoinRequests = async (p0: null, hostUserId: string, filters: { game_request_ids?: number[]; user_id?: string} ) => {
  try {
    let query = supabase.from('join_requests').select('*');
    //query = query.eq('user_id', hostUserId)


    if (filters.game_request_ids && filters.game_request_ids.length > 0) {
      query = query.in('game_request_id', filters.game_request_ids);
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

// Add this new function to handle avatar uploads
export const uploadAvatar = async (userId: string, base64Image: string) => {
  try {
    const filePath = `${userId}/avatar.jpg`;
    
    // Upload the image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64Image), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get the public URL - Updated method
    const { data: urlData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 31536000); // URL valid for 1 year

    if (!urlData?.signedUrl) {
      throw new Error('Failed to get signed URL');
    }

    const avatarUrl = urlData.signedUrl;
    console.log('Generated signed URL:', avatarUrl);

    // Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/*
* Elo Routes
*/

// POST
/**
 * Initialize a user's Elo rating for a specific sport.
 */
export const initializeElo = async (userId: string, sportId: number) => {
  try {
    // Check if Elo rating already exists for this user & sport
    const { data: existingElo, error: checkError } = await supabase
      .from('elo_ratings')
      .select('id')
      .eq('id', userId)
      .eq('sport_id', sportId)
      .single();

    if (existingElo) {
      throw new Error('Elo rating already exists for this sport.');
    }

    // Insert new Elo record
    const { data, error } = await supabase.from('elo_ratings').insert([
      {
        id: userId, // Matches the profile ID
        sport_id: sportId,
        rating: 1000,
        sigma: 30,
        // created_at: new Date().toISOString(), // Uncomment if handling timestamps manually
        // updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error initializing Elo:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error initializing Elo:', error);
    throw error;
  }
};

// GET
/**
 * Get all Elo ratings for a user, returned as a map of sport_id to rating.
 */
export const getUserElos = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('elo_ratings')
      .select('sport_id, rating')
      .eq('id', userId);

    if (error) {
      console.error('Error fetching Elo ratings:', error.message);
      throw error;
    }

    // Convert array to a map of { sport_id: rating }
    const eloMap: Record<number, number> = {};
    data.forEach((entry) => {
      eloMap[entry.sport_id] = entry.rating;
    });

    return eloMap;
  } catch (error) {
    console.error('Unexpected error fetching Elo ratings:', error);
    throw error;
  }
};

/**
 * Get a user's Elo rating for a specific sport.
 */
export const getUserEloForSport = async (userId: string, sportId: number) => {
  try {
    const { data, error } = await supabase
      .from('elo_ratings')
      .select('rating')
      .eq('id', userId)
      .eq('sport_id', sportId)
      .single();

    if (error) {
      console.error('Error fetching Elo for sport:', error.message);
      throw error;
    }

    return data.rating; // Return the Elo rating
  } catch (error) {
    console.error('Unexpected error fetching Elo for sport:', error);
    throw error;
  }
};


// PUT (MATCHUP)
/**
 * Update Elo ratings after a match result.
 */
export const updateEloAfterMatch = async (
  hostUserId: string,
  opponentUserId: string,
  //gameId: number,
  sportId: number,
  result: -1 | 0 | 1 // Host loss (-1), draw (0), win (1)
) => {
  try {
    // Fetch current Elo ratings
    const { data: hostElo, error: hostError } = await supabase
      .from('elo_ratings')
      .select('rating')
      .eq('id', hostUserId)
      .eq('sport_id', sportId)
      .single();

    const { data: opponentElo, error: opponentError } = await supabase
      .from('elo_ratings')
      .select('rating')
      .eq('id', opponentUserId)
      .eq('sport_id', sportId)
      .single();

    if (hostError || opponentError) {
      throw new Error('Error fetching player Elo ratings.');
    }

    const ratingA = hostElo.rating;
    const ratingB = opponentElo.rating;
    const K = 32; // Elo scaling factor

    // Expected scores
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA; // Expected score for opponent

    // Convert match result (-1, 0, 1) to score (0, 0.5, 1)
    const scoreA = result === -1 ? 0 : result === 0 ? 0.5 : 1;
    const scoreB = 1 - scoreA;

    // Calculate new ratings
    const newRatingA = Math.round(ratingA + K * (scoreA - expectedA));
    const newRatingB = Math.round(ratingB + K * (scoreB - expectedB));

    // Update ratings in the database
    const { error: updateHostError } = await supabase
      .from('elo_ratings')
      .update({ rating: newRatingA })
      .eq('id', hostUserId)
      .eq('sport_id', sportId);

    const { error: updateOpponentError } = await supabase
      .from('elo_ratings')
      .update({ rating: newRatingB })
      .eq('id', opponentUserId)
      .eq('sport_id', sportId);

    if (updateHostError || updateOpponentError) {
      throw new Error('Error updating Elo ratings.');
    }

    return {
      message: 'Elo ratings updated successfully',
      host_new_rating: newRatingA,
      opponent_new_rating: newRatingB,
    };
  } catch (error) {
    console.error('Unexpected error updating Elo ratings:', error);
    throw error;
  }
};


