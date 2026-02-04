import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOwnProfile, fetchPublicProfile } from '@/lib/supabase';

interface ProfileData {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  description?: string;
  age?: number;
  gender?: string;
  sports_preferences?: Array<{
    sport: string;
    skill_level: string;
    years_experience?: number;
  }>;
}

interface UseProfileResult {
  profile: ProfileData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch a user's profile
 * If no userId is provided, fetches the current user's profile from AuthContext
 */
export function useProfile(userId?: string): UseProfileResult {
  const { profile: authProfile, session } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isOwnProfile = !userId || userId === session?.user?.id;

  const fetchProfile = useCallback(async () => {
    // If it's the current user's profile, use the AuthContext profile
    if (isOwnProfile && authProfile) {
      setProfile(authProfile as ProfileData);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch the other user's public profile
    if (userId) {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchPublicProfile(userId);
        setProfile(data as ProfileData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setIsLoading(false);
      }
    } else if (session?.user?.id) {
      // Fetch own profile if not available in context
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchOwnProfile(session.user.id);
        setProfile(data as ProfileData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setIsLoading(false);
      }
    }
  }, [userId, isOwnProfile, authProfile, session?.user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile: isOwnProfile && authProfile ? (authProfile as ProfileData) : profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}

export default useProfile;
