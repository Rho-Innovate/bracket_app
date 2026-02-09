-- Migration: Fix permissive RLS policies
-- This migration tightens RLS policies to follow principle of least privilege

-- ============================================================================
-- PROFILES TABLE - Create public view with limited fields
-- ============================================================================

-- Create a public_profiles view that exposes only non-sensitive fields
-- This is what should be used for looking up other users
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  username,
  first_name,
  last_name,
  avatar_url
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Note: The existing SELECT policy with USING (true) is intentionally kept
-- because we need it for:
-- 1. Users viewing their own full profile
-- 2. JOIN queries that need to fetch host info for game_requests
-- The sensitive fields (location, email, etc.) should be excluded in app-level queries
-- or through the public_profiles view

-- ============================================================================
-- GAME_REQUESTS TABLE - Restrict SELECT to relevant games
-- ============================================================================

-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view game requests" ON game_requests;
DROP POLICY IF EXISTS "Game requests are viewable by everyone" ON game_requests;
DROP POLICY IF EXISTS "Public game requests visible" ON game_requests;

-- Create more restrictive SELECT policy
-- Users can see:
-- 1. Open games (available to join)
-- 2. Their own games (as creator)
-- 3. Games they have joined or requested to join
CREATE POLICY "Users can view relevant game requests"
ON game_requests
FOR SELECT
TO authenticated
USING (
  -- Open games are visible to everyone (for browsing)
  status = 'Open'
  OR
  -- Creator can always see their own games
  creator_id = auth.uid()
  OR
  -- Users can see games they've requested to join
  EXISTS (
    SELECT 1 FROM join_requests jr
    WHERE jr.game_request_id = game_requests.id
    AND jr.user_id = auth.uid()
  )
);

-- ============================================================================
-- JOIN_REQUESTS TABLE - Restrict access
-- ============================================================================

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Anyone can view join requests" ON join_requests;
DROP POLICY IF EXISTS "Join requests are viewable by everyone" ON join_requests;

-- Users can view:
-- 1. Their own join requests
-- 2. Join requests for games they host
CREATE POLICY "Users can view relevant join requests"
ON join_requests
FOR SELECT
TO authenticated
USING (
  -- Users can see their own requests
  user_id = auth.uid()
  OR
  -- Hosts can see requests for their games
  EXISTS (
    SELECT 1 FROM game_requests gr
    WHERE gr.id = join_requests.game_request_id
    AND gr.creator_id = auth.uid()
  )
);

-- ============================================================================
-- TRUESKILL_RATINGS TABLE - Keep public (documented intent)
-- ============================================================================

-- trueskill_ratings SELECT policy is intentionally public because:
-- 1. Leaderboards need to display all user ratings
-- 2. Matchmaking needs to compare skill levels
-- 3. Rating data is not sensitive (it's meant to be shown)
-- No changes needed here - this is documented intentionally

COMMENT ON TABLE trueskill_ratings IS
  'Public read access is intentional - needed for leaderboards and matchmaking';
