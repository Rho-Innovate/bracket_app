-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS sports_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comments for documentation
COMMENT ON COLUMN profiles.username IS 'Unique username for the user';
COMMENT ON COLUMN profiles.age IS 'User age in years';
COMMENT ON COLUMN profiles.gender IS 'User gender (male, female, other)';
COMMENT ON COLUMN profiles.sports_preferences IS 'JSON array of sport preferences with skill levels';
