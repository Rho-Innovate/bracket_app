import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, fetchOwnProfile, checkOnboardingStatus, ensureProfileExists, signOut as supabaseSignOut } from '@/lib/supabase';

export interface Profile {
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
  onboarding_completed?: boolean;
  trust_score?: number;
  dispute_count?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setOnboardingComplete: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profileExists = await ensureProfileExists(userId);

      // If ensureProfileExists returned null, the session was stale and user was signed out
      if (profileExists === null) {
        console.log('Stale session detected, user signed out');
        setSession(null);
        setProfile(null);
        setIsOnboardingComplete(false);
        return;
      }

      const [profileData, onboardingStatus] = await Promise.all([
        fetchOwnProfile(userId),
        checkOnboardingStatus(userId),
      ]);
      setProfile(profileData);
      setIsOnboardingComplete(onboardingStatus);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === '23503') {
        console.log('User no longer exists in auth, signing out...');
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setIsOnboardingComplete(false);
        return; // Don't throw - just return after signing out
      }
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      const profileData = await fetchOwnProfile(session.user.id);
      setProfile(profileData);
    }
  }, [session?.user?.id]);

  const handleSignOut = useCallback(async () => {
    await supabaseSignOut();
    setSession(null);
    setProfile(null);
    setIsOnboardingComplete(false);
  }, []);

  const setOnboardingComplete = useCallback((value: boolean) => {
    setIsOnboardingComplete(value);
  }, []);

  useEffect(() => {
    const loadSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user?.id) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        try {
          await loadProfile(session.user.id);
        } catch (error) {
          console.error('Error loading profile on auth change:', error);
        }
      } else {
        setProfile(null);
        setIsOnboardingComplete(false);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isOnboardingComplete,
    refreshProfile,
    signOut: handleSignOut,
    setOnboardingComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useSession() {
  const { session } = useAuth();
  return session;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  return { profile, refreshProfile };
}
