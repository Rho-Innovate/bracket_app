import { supabase } from './client';
import { initializeTrueSkillFromOnboarding } from './ratings';

/**
 * Check if user has completed onboarding
 */
export const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed ?? false;
  } catch (error) {
    console.error('Error in checkOnboardingStatus:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

/**
 * Save sports preferences during onboarding
 */
export const saveSportsPreferences = async (
  userId: string,
  sports: Array<{ sport: string; skill_level: string; years_experience?: number }>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        sports_preferences: sports
      })
      .eq('id', userId);

    if (error) throw error;

    await initializeTrueSkillFromOnboarding(userId, sports);
  } catch (error) {
    console.error('Error saving sports preferences:', error);
    throw error;
  }
};

/**
 * Complete the full onboarding flow
 */
export const finishOnboarding = async (
  userId: string,
  data: {
    sports?: Array<{ sport: string; skill_level: string; years_experience?: number }>;
    description?: string;
  }
): Promise<void> => {
  try {
    const updates: any = {
      onboarding_completed: true
    };

    if (data.description) {
      updates.description = data.description;
    }

    if (data.sports && data.sports.length > 0) {
      updates.sports_preferences = data.sports;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (profileError) throw profileError;

    if (data.sports && data.sports.length > 0) {
      await initializeTrueSkillFromOnboarding(userId, data.sports);
    }
  } catch (error) {
    console.error('Error finishing onboarding:', error);
    throw error;
  }
};
