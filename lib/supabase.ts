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
export const searchGameRequests = async (filters: {
  sport_id?: number;
  requested_time_from?: string;
  requested_time_to?: string;
  status?: 'Open' | 'Closed';
  location?: { lat: number; lng: number };
  radius?: number; // Radius in meters
  sort_by?: 'recency' | 'max_players' | 'distance'; // Sorting criteria
  sort_order?: 'asc' | 'desc';
}) => {
  try {
    let query = supabase.from('game_requests').select(`
      *,
      ST_Distance(location, ST_SetSRID(ST_Point(${filters.location?.lng || 0}, ${filters.location?.lat || 0}), 4326)) as distance
    `);

    // Apply filters
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

    // Apply radius filter
    if (filters.location && filters.radius) {
      query = query.filter(
        'location',
        'ST_DWithin',
        `ST_SetSRID(ST_Point(${filters.location.lng}, ${filters.location.lat}), 4326), ${filters.radius}`
      );
    }

    // Apply sorting
    if (filters.sort_by === 'recency') {
      query = query.order('requested_time', { ascending: filters.sort_order === 'asc' });
    } else if (filters.sort_by === 'max_players') {
      query = query.order('max_players', { ascending: filters.sort_order === 'asc' });
    } else if (filters.sort_by === 'distance' && filters.location) {
      query = query.order('distance', { ascending: filters.sort_order === 'asc' });
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




