-- Fix profile update issue during signup
-- The RLS policy blocks updates when user isn't fully authenticated (pre-email verification)
-- This creates an RPC function that runs with elevated privileges to update profiles

-- Create a function to update profile that bypasses RLS
CREATE OR REPLACE FUNCTION update_profile_on_signup(
  p_user_id UUID,
  p_username TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_location_lng DOUBLE PRECISION,
  p_location_lat DOUBLE PRECISION
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    username = p_username,
    first_name = p_first_name,
    last_name = p_last_name,
    age = p_age,
    gender = p_gender,
    location = ST_SetSRID(ST_MakePoint(p_location_lng, p_location_lat), 4326),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users (needed for signup flow)
GRANT EXECUTE ON FUNCTION update_profile_on_signup TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_on_signup TO anon;

-- Also update the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
