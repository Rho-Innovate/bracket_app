-- Add onboarding columns to profiles table
-- This migration adds columns to track user onboarding completion

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying users by onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Comment on columns for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the initial onboarding flow';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when the user completed onboarding';
