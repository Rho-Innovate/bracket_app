import { supabase } from './client';

/**
 * Ensure a profile exists for the given user, creating a minimal one if needed
 */
export const ensureProfileExists = async (userId: string) => {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: '',
        last_name: '',
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) {
      // If user doesn't exist in auth.users (stale session), sign out
      if (error.code === '23503') {
        console.log('User no longer exists in auth, signing out stale session...');
        await supabase.auth.signOut();
        return null;
      }
      console.error('Error creating profile:', error);
      throw error;
    }

    console.log('Created new profile for user:', userId);
    return data;
  } catch (error: unknown) {
    const err = error as { code?: string };
    // Handle stale session in catch block as well
    if (err?.code === '23503') {
      console.log('User no longer exists in auth, signing out stale session...');
      await supabase.auth.signOut();
      return null;
    }
    console.error('Error ensuring profile exists:', error);
    throw error;
  }
};

/**
 * Update the user's profile
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

/**
 * Fetch the user's own profile data (includes sensitive fields like location).
 */
export const fetchOwnProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    throw error;
  }

  if (!data) {
    console.log('No profile found for user, returning default');
    return {
      id: userId,
      first_name: '',
      last_name: '',
      username: null,
      avatar_url: null,
      description: null,
      sports_preferences: [],
    };
  }

  // Log profile data to debug username issue
  console.log('Fetched profile data:', { id: data.id, username: data.username, first_name: data.first_name });

  return data;
};

/**
 * Fetch another user's public profile data (excludes sensitive fields like location).
 */
export const fetchPublicProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching public profile:', error.message);
    throw error;
  }

  return data;
};

/**
 * Fetch public profiles for multiple users in a single query.
 * This is an optimized batch fetch to avoid N+1 queries.
 * Returns a Map for O(1) lookup by user ID.
 */
export const fetchPublicProfilesBatch = async (
  userIds: string[]
): Promise<Map<string, { id: string; username?: string; first_name: string; last_name: string; avatar_url?: string }>> => {
  if (userIds.length === 0) {
    return new Map();
  }

  // Deduplicate IDs
  const uniqueIds = [...new Set(userIds)];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error fetching profiles batch:', error.message);
    throw error;
  }

  const profileMap = new Map<string, { id: string; username?: string; first_name: string; last_name: string; avatar_url?: string }>();
  for (const profile of data || []) {
    profileMap.set(profile.id, profile);
  }

  return profileMap;
};

/**
 * Search for users by username, first name, or last name
 */
export const searchUsers = async (searchQuery: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error searching users:', error);
    throw error;
  }
};

/**
 * Get user's trust score
 */
export const getUserTrustScore = async (userId: string): Promise<{ trust_score: number; dispute_count: number }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('trust_score, dispute_count')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return {
      trust_score: data?.trust_score || 100,
      dispute_count: data?.dispute_count || 0
    };
  } catch (error) {
    console.error('Error getting user trust score:', error);
    throw error;
  }
};

/**
 * Add a new sport to the user's sports preferences
 */
export const addNewSport = async (
  userId: string,
  sport: string,
  skillLevel: string
) => {
  try {
    // First fetch current profile to get existing sports_preferences
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('sports_preferences')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const existingPrefs = profile?.sports_preferences || [];

    // Check if sport already exists
    const alreadyExists = existingPrefs.some(
      (pref: { sport: string }) => pref.sport === sport
    );

    if (alreadyExists) {
      throw new Error('You already have this sport in your preferences');
    }

    // Add the new sport
    const updatedPrefs = [
      ...existingPrefs,
      {
        sport,
        years_experience: 0,
      },
    ];

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ sports_preferences: updatedPrefs })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Initialize TrueSkill rating based on skill level
    const { sportNameToId } = await import('../../constants/sports');
    const sportId = sportNameToId[sport];

    if (sportId) {
      // Map skill level to rating values
      const skillToRating: Record<string, { mu: number; sigma: number }> = {
        Beginner: { mu: 15.0, sigma: 6.0 },
        Intermediate: { mu: 25.0, sigma: 5.0 },
        Advanced: { mu: 35.0, sigma: 4.0 },
      };
      const rating = skillToRating[skillLevel] || skillToRating['Beginner'];

      await supabase.from('trueskill_ratings').upsert({
        user_id: userId,
        sport_id: sportId,
        mu: rating.mu,
        sigma: rating.sigma,
        games_played: 0,
      }, {
        onConflict: 'user_id,sport_id',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding new sport:', error);
    throw error;
  }
};
