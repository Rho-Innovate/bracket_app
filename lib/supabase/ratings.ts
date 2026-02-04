import { supabase } from './client';
import type { TrueSkillRating, SportConfig } from './types';
import { sportNameToId } from '../../constants/sports';

// TrueSkill ratings based on skill level selection during onboarding
const skillToRating: Record<string, { mu: number; sigma: number }> = {
  Beginner: { mu: 15, sigma: 6 },
  Intermediate: { mu: 25, sigma: 5 },
  Advanced: { mu: 35, sigma: 4 },
};

// Elo Functions

/**
 * Initialize a user's Elo rating for a specific sport.
 */
export const initializeElo = async (userId: string, sportId: number) => {
  try {
    const { data: existingElo } = await supabase
      .from('elo_ratings')
      .select('id')
      .eq('id', userId)
      .eq('sport_id', sportId)
      .single();

    if (existingElo) {
      throw new Error('Elo rating already exists for this sport.');
    }

    const { data, error } = await supabase.from('elo_ratings').insert([
      {
        id: userId,
        sport_id: sportId,
        rating: 1000,
        sigma: 30,
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

    return data.rating;
  } catch (error) {
    console.error('Unexpected error fetching Elo for sport:', error);
    throw error;
  }
};

/**
 * Update Elo ratings after a match result.
 */
export const updateEloAfterMatch = async (
  hostUserId: string,
  opponentUserId: string,
  sportId: number,
  result: -1 | 0 | 1
) => {
  try {
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
    const K = 32;

    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const expectedB = 1 - expectedA;

    const scoreA = result === -1 ? 0 : result === 0 ? 0.5 : 1;
    const scoreB = 1 - scoreA;

    const newRatingA = Math.round(ratingA + K * (scoreA - expectedA));
    const newRatingB = Math.round(ratingB + K * (scoreB - expectedB));

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

// TrueSkill Functions

/**
 * Initialize TrueSkill rating for a user in a specific sport
 */
export const initializeTrueSkill = async (userId: string, sportId: number): Promise<TrueSkillRating | null> => {
  try {
    const { data: existing } = await supabase
      .from('trueskill_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('sport_id', sportId)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('trueskill_ratings')
      .insert({
        user_id: userId,
        sport_id: sportId,
        mu: 25.0,
        sigma: 8.333,
        games_played: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error initializing TrueSkill:', error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error initializing TrueSkill:', error);
    throw error;
  }
};

/**
 * Get user's TrueSkill rating for a specific sport
 */
export const getUserTrueSkill = async (userId: string, sportId: number): Promise<TrueSkillRating | null> => {
  try {
    const { data, error } = await supabase
      .from('trueskill_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('sport_id', sportId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching TrueSkill rating:', error);
    throw error;
  }
};

/**
 * Get all TrueSkill ratings for a user
 */
export const getUserAllTrueSkillRatings = async (userId: string): Promise<TrueSkillRating[]> => {
  try {
    const { data, error } = await supabase
      .from('trueskill_ratings')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user TrueSkill ratings:', error);
    throw error;
  }
};

/**
 * Calculate conservative rating (mu - 3*sigma), used for matchmaking and leaderboards
 */
export const calculateConservativeRating = (mu: number, sigma: number): number => {
  return mu - (3 * sigma);
};

/**
 * Get sport configuration (including beta/luck parameter)
 */
export const getSportConfig = async (sportId: number): Promise<SportConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('sport_trueskill_config')
      .select('*')
      .eq('sport_id', sportId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching sport config:', error);
    throw error;
  }
};

/**
 * Get all sports with their configurations
 */
export const getAllSportsConfig = async (): Promise<SportConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('sport_trueskill_config')
      .select('*')
      .order('sport_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all sports config:', error);
    throw error;
  }
};

/**
 * Get leaderboard for a specific sport
 */
export const getSportLeaderboard = async (
  sportId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Array<TrueSkillRating & { conservative_rating: number; rank: number }>> => {
  try {
    const { data, error } = await supabase
      .from('trueskill_ratings')
      .select('*, profiles(username, first_name, last_name, avatar_url)')
      .eq('sport_id', sportId)
      .order('mu', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((rating, index) => ({
      ...rating,
      conservative_rating: calculateConservativeRating(rating.mu, rating.sigma),
      rank: offset + index + 1
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Initialize TrueSkill ratings from onboarding sport selections
 */
export const initializeTrueSkillFromOnboarding = async (
  userId: string,
  sportsPreferences: Array<{ sport: string; skill_level: string }>
) => {
  try {
    const promises = sportsPreferences.map(async (pref) => {
      const sportId = sportNameToId[pref.sport];
      if (!sportId) {
        console.warn(`Unknown sport: ${pref.sport}`);
        return;
      }

      const rating = skillToRating[pref.skill_level] || skillToRating['Beginner'];

      await supabase.from('trueskill_ratings').upsert({
        user_id: userId,
        sport_id: sportId,
        mu: rating.mu,
        sigma: rating.sigma,
        games_played: 0,
      }, {
        onConflict: 'user_id,sport_id'
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error initializing TrueSkill from onboarding:', error);
    throw error;
  }
};
