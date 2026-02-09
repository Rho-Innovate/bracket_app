-- BRACKT Sports Matchmaking App - Complete Initial Schema
-- This migration creates everything from scratch for a new Supabase project

-- Enable PostGIS extension for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. PROFILES TABLE (created by Supabase Auth trigger, but we define structure)
-- ============================================

-- This table is auto-created by Supabase when a user signs up
-- We just add our custom columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INTEGER,
  gender VARCHAR(20),
  location GEOMETRY(POINT, 4326),
  description TEXT,
  avatar_url TEXT,
  sports_preferences JSONB,
  dispute_count INTEGER DEFAULT 0,
  trust_score DOUBLE PRECISION DEFAULT 100.0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. GAME REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS game_requests (
  id SERIAL PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  location GEOMETRY(POINT, 4326),
  requested_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  description TEXT,
  max_players INTEGER DEFAULT 2,
  current_players INTEGER DEFAULT 1,
  game_state VARCHAR(20) DEFAULT 'scheduled' CHECK (game_state IN ('scheduled', 'in_progress', 'awaiting_results', 'disputed', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_team_game BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_requests_location ON game_requests USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_game_requests_sport ON game_requests(sport_id);
CREATE INDEX IF NOT EXISTS idx_game_requests_status ON game_requests(status);
CREATE INDEX IF NOT EXISTS idx_game_requests_state ON game_requests(game_state);

ALTER TABLE game_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open games"
  ON game_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON game_requests FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their games"
  ON game_requests FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their games"
  ON game_requests FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- 3. JOIN REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS join_requests (
  id SERIAL PRIMARY KEY,
  game_request_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_game ON join_requests(game_request_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON join_requests(user_id);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view join requests for their games"
  ON join_requests FOR SELECT
  USING (
    user_id = auth.uid() OR
    game_request_id IN (SELECT id FROM game_requests WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own join requests"
  ON join_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Game creators can update join requests"
  ON join_requests FOR UPDATE
  USING (
    game_request_id IN (SELECT id FROM game_requests WHERE creator_id = auth.uid())
  );

-- ============================================
-- 4. FRIEND REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friend requests"
  ON friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update friend requests they're involved in"
  ON friend_requests FOR UPDATE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================
-- 5. TRUESKILL RATINGS
-- ============================================

CREATE TABLE IF NOT EXISTS trueskill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  mu DOUBLE PRECISION DEFAULT 25.0,
  sigma DOUBLE PRECISION DEFAULT 8.333,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

CREATE INDEX IF NOT EXISTS idx_trueskill_user_sport ON trueskill_ratings(user_id, sport_id);
CREATE INDEX IF NOT EXISTS idx_trueskill_rating ON trueskill_ratings(mu, sigma);

ALTER TABLE trueskill_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trueskill ratings"
  ON trueskill_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON trueskill_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. SPORT TRUESKILL CONFIG
-- ============================================

CREATE TABLE IF NOT EXISTS sport_trueskill_config (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER UNIQUE NOT NULL,
  sport_name VARCHAR(100) NOT NULL,
  beta DOUBLE PRECISION DEFAULT 4.1667,
  tau DOUBLE PRECISION DEFAULT 0.0833,
  draw_probability DOUBLE PRECISION DEFAULT 0.0,
  is_team_sport BOOLEAN DEFAULT false,
  team_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed sports
INSERT INTO sport_trueskill_config (sport_id, sport_name, beta, tau, draw_probability, is_team_sport, team_size) VALUES
  (1, 'Tennis', 4.1667, 0.0833, 0.0, false, 1),
  (2, 'Badminton', 4.1667, 0.0833, 0.0, false, 1),
  (3, 'Table Tennis', 4.1667, 0.0833, 0.0, false, 1),
  (4, 'Squash', 4.1667, 0.0833, 0.0, false, 1),
  (5, 'Racquetball', 4.1667, 0.0833, 0.0, false, 1),
  (6, 'Golf', 6.0, 0.1, 0.05, false, 1),
  (7, 'Basketball', 5.0, 0.1, 0.0, true, 5),
  (8, 'Soccer', 5.5, 0.1, 0.1, true, 11),
  (9, 'Volleyball', 4.5, 0.0833, 0.0, true, 6),
  (10, 'Pickleball', 4.1667, 0.0833, 0.0, true, 2),
  (11, 'Beach Volleyball', 4.5, 0.0833, 0.0, true, 2),
  (12, 'Futsal', 5.0, 0.1, 0.05, true, 5)
ON CONFLICT (sport_id) DO NOTHING;

ALTER TABLE sport_trueskill_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sport config"
  ON sport_trueskill_config FOR SELECT
  USING (true);

-- ============================================
-- 7. GAME PARTICIPANTS
-- ============================================

CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team INTEGER CHECK (team IN (1, 2)),
  mu_before DOUBLE PRECISION,
  sigma_before DOUBLE PRECISION,
  mu_after DOUBLE PRECISION,
  sigma_after DOUBLE PRECISION,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);

ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game participants"
  ON game_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join games"
  ON game_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. GAME RESULT SUBMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS game_result_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  winner_team INTEGER CHECK (winner_team IN (0, 1, 2)),
  score_team1 INTEGER,
  score_team2 INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, submitted_by)
);

CREATE INDEX IF NOT EXISTS idx_result_submissions_game ON game_result_submissions(game_id);

ALTER TABLE game_result_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view result submissions for their games"
  ON game_result_submissions FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    game_id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can submit results for games they participated in"
  ON game_result_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by AND
    game_id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
  );

-- ============================================
-- 9. GAME RESULTS
-- ============================================

CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER UNIQUE REFERENCES game_requests(id) ON DELETE CASCADE,
  winner_team INTEGER CHECK (winner_team IN (0, 1, 2)),
  is_draw BOOLEAN DEFAULT false,
  score_team1 INTEGER,
  score_team2 INTEGER,
  consensus_reached BOOLEAN DEFAULT false,
  resolved_by VARCHAR(20) CHECK (resolved_by IN ('consensus', 'admin', 'timeout')),
  finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game results"
  ON game_results FOR SELECT
  USING (true);

-- ============================================
-- 10. MATCHMAKING QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  location GEOMETRY(POINT, 4326),
  search_radius_km DOUBLE PRECISION DEFAULT 10.0,
  preferred_time_start TIMESTAMP WITH TIME ZONE,
  preferred_time_end TIMESTAMP WITH TIME ZONE,
  skill_range_min DOUBLE PRECISION,
  skill_range_max DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  matched_game_id INTEGER REFERENCES game_requests(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id, sport_id)
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_active ON matchmaking_queue(is_active, sport_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_location ON matchmaking_queue USING GIST(location);

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active queue entries"
  ON matchmaking_queue FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own queue entries"
  ON matchmaking_queue FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 11. MATCH PROPOSALS
-- ============================================

CREATE TABLE IF NOT EXISTS match_proposals (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER NOT NULL,
  player1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player1_accepted BOOLEAN,
  player2_accepted BOOLEAN,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  proposed_time TIMESTAMP WITH TIME ZONE,
  proposed_location GEOMETRY(POINT, 4326),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_game_id INTEGER REFERENCES game_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_proposals_players ON match_proposals(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_match_proposals_status ON match_proposals(status);

ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their match proposals"
  ON match_proposals FOR SELECT
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can update their match proposals"
  ON match_proposals FOR UPDATE
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- ============================================
-- 12. CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('direct', 'game')) NOT NULL,
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_game ON conversations(game_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS policy will be added after conversation_participants table is created

-- ============================================
-- 13. CONVERSATION PARTICIPANTS
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Now add the conversations RLS policy
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- ============================================
-- 14. MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'image')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- ============================================
-- 15. MATCH HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER UNIQUE REFERENCES game_requests(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  team1_user_ids UUID[] NOT NULL,
  team2_user_ids UUID[] NOT NULL,
  winner_team INTEGER CHECK (winner_team IN (0, 1, 2)),
  team1_score INTEGER,
  team2_score INTEGER,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_history_sport ON match_history(sport_id);

ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match history"
  ON match_history FOR SELECT
  USING (true);

-- ============================================
-- 16. USER REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES game_requests(id) ON DELETE SET NULL,
  reason VARCHAR(50) CHECK (reason IN ('result_dispute', 'no_show', 'unsportsmanlike', 'cheating', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON user_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- 17. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_conservative_rating(mu DOUBLE PRECISION, sigma DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN mu - (3 * sigma);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID, p_sport_id INTEGER)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_rating DOUBLE PRECISION;
BEGIN
  SELECT calculate_conservative_rating(mu, sigma) INTO v_rating
  FROM trueskill_ratings
  WHERE user_id = p_user_id AND sport_id = p_sport_id;
  RETURN COALESCE(v_rating, 0.0);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION create_game_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id INTEGER;
BEGIN
  INSERT INTO conversations (type, game_id)
  VALUES ('game', NEW.id)
  RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, NEW.creator_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_game_conversation ON game_requests;
CREATE TRIGGER trigger_create_game_conversation
  AFTER INSERT ON game_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_game_conversation();

CREATE OR REPLACE FUNCTION add_player_to_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id INTEGER;
BEGIN
  IF NEW.status = 'Accepted' AND (OLD.status IS NULL OR OLD.status != 'Accepted') THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE game_id = NEW.game_request_id;

    IF v_conv_id IS NOT NULL THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (v_conv_id, NEW.user_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    INSERT INTO game_participants (game_id, user_id)
    VALUES (NEW.game_request_id, NEW.user_id)
    ON CONFLICT (game_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_player_to_conversation ON join_requests;
CREATE TRIGGER trigger_add_player_to_conversation
  AFTER INSERT OR UPDATE ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION add_player_to_conversation();

CREATE OR REPLACE FUNCTION increment_profile_games(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET games_played = COALESCE(games_played, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_dispute_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    dispute_count = COALESCE(dispute_count, 0) + 1,
    trust_score = GREATEST(0, COALESCE(trust_score, 100) - 5)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
