-- BRACKT Sports Matchmaking App - Complete Database Schema Migration
-- This migration adds TrueSkill ratings, game states, consensus results, chat, and matchmaking

-- ============================================
-- 1. TRUESKILL RATINGS (replaces elo_ratings)
-- ============================================

CREATE TABLE IF NOT EXISTS trueskill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  mu DOUBLE PRECISION DEFAULT 25.0,           -- Mean skill
  sigma DOUBLE PRECISION DEFAULT 8.333,       -- Uncertainty (25/3)
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trueskill_user_sport ON trueskill_ratings(user_id, sport_id);
CREATE INDEX IF NOT EXISTS idx_trueskill_rating ON trueskill_ratings(mu, sigma);

-- ============================================
-- 2. SPORT TRUESKILL CONFIG (per-sport LUCK parameter)
-- ============================================

CREATE TABLE IF NOT EXISTS sport_trueskill_config (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER UNIQUE NOT NULL,
  sport_name VARCHAR(100) NOT NULL,
  beta DOUBLE PRECISION DEFAULT 4.1667,        -- Performance variance (LUCK factor)
  tau DOUBLE PRECISION DEFAULT 0.0833,         -- Skill drift between games
  draw_probability DOUBLE PRECISION DEFAULT 0.0,
  is_team_sport BOOLEAN DEFAULT false,
  team_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial sports configuration
INSERT INTO sport_trueskill_config (sport_id, sport_name, beta, tau, draw_probability, is_team_sport, team_size) VALUES
  -- Individual Sports (lower beta = less luck)
  (1, 'Tennis', 4.1667, 0.0833, 0.0, false, 1),
  (2, 'Badminton', 4.1667, 0.0833, 0.0, false, 1),
  (3, 'Table Tennis', 4.1667, 0.0833, 0.0, false, 1),
  (4, 'Squash', 4.1667, 0.0833, 0.0, false, 1),
  (5, 'Racquetball', 4.1667, 0.0833, 0.0, false, 1),
  (6, 'Golf', 6.0, 0.1, 0.05, false, 1),  -- Higher luck factor

  -- Team Sports
  (7, 'Basketball', 5.0, 0.1, 0.0, true, 5),
  (8, 'Soccer', 5.5, 0.1, 0.1, true, 11),  -- Higher draw probability
  (9, 'Volleyball', 4.5, 0.0833, 0.0, true, 6),
  (10, 'Pickleball', 4.1667, 0.0833, 0.0, true, 2),  -- Doubles
  (11, 'Beach Volleyball', 4.5, 0.0833, 0.0, true, 2),
  (12, 'Futsal', 5.0, 0.1, 0.05, true, 5)
ON CONFLICT (sport_id) DO NOTHING;

-- ============================================
-- 3. ADD GAME STATE TO GAME_REQUESTS
-- ============================================

-- Add game_state column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_requests' AND column_name = 'game_state'
  ) THEN
    ALTER TABLE game_requests ADD COLUMN game_state VARCHAR(20) DEFAULT 'scheduled'
      CHECK (game_state IN ('scheduled', 'in_progress', 'awaiting_results', 'disputed', 'completed', 'cancelled'));
  END IF;
END $$;

-- Add started_at and ended_at columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_requests' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE game_requests ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_requests' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE game_requests ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_requests' AND column_name = 'is_team_game'
  ) THEN
    ALTER TABLE game_requests ADD COLUMN is_team_game BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 4. GAME PARTICIPANTS (tracks players in games)
-- ============================================

CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team INTEGER CHECK (team IN (1, 2)),  -- 1 or 2, NULL for individual games
  mu_before DOUBLE PRECISION,           -- Rating snapshot before game
  sigma_before DOUBLE PRECISION,
  mu_after DOUBLE PRECISION,            -- Rating after game
  sigma_after DOUBLE PRECISION,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);

-- ============================================
-- 5. GAME RESULT SUBMISSIONS (for consensus)
-- ============================================

CREATE TABLE IF NOT EXISTS game_result_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  winner_team INTEGER CHECK (winner_team IN (0, 1, 2)),  -- 0 = draw, 1 = team1, 2 = team2
  score_team1 INTEGER,
  score_team2 INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, submitted_by)
);

CREATE INDEX IF NOT EXISTS idx_result_submissions_game ON game_result_submissions(game_id);

-- ============================================
-- 6. FINAL GAME RESULTS
-- ============================================

CREATE TABLE IF NOT EXISTS game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER UNIQUE REFERENCES game_requests(id) ON DELETE CASCADE,
  winner_team INTEGER CHECK (winner_team IN (0, 1, 2)),  -- 0 = draw
  is_draw BOOLEAN DEFAULT false,
  score_team1 INTEGER,
  score_team2 INTEGER,
  consensus_reached BOOLEAN DEFAULT false,
  resolved_by VARCHAR(20) CHECK (resolved_by IN ('consensus', 'admin', 'timeout')),
  finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. MATCHMAKING QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL,
  location GEOMETRY(POINT, 4326),
  search_radius_km DOUBLE PRECISION DEFAULT 10.0,
  preferred_time_start TIMESTAMP WITH TIME ZONE,
  preferred_time_end TIMESTAMP WITH TIME ZONE,
  skill_range_min DOUBLE PRECISION,  -- Conservative rating min
  skill_range_max DOUBLE PRECISION,  -- Conservative rating max
  is_active BOOLEAN DEFAULT true,
  matched_game_id INTEGER REFERENCES game_requests(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id, sport_id)
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_active ON matchmaking_queue(is_active, sport_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_location ON matchmaking_queue USING GIST(location);

-- ============================================
-- 8. MATCH PROPOSALS (accept/decline matchmaking)
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

-- ============================================
-- 9. CHAT CONVERSATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('direct', 'game')) NOT NULL,
  game_id INTEGER REFERENCES game_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_game ON conversations(game_id);

-- ============================================
-- 10. CONVERSATION PARTICIPANTS
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

-- ============================================
-- 11. MESSAGES
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

-- ============================================
-- 12. MATCH HISTORY
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

-- ============================================
-- 13. USER REPORTS (trust system)
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

-- ============================================
-- 14. ADD TRUST COLUMNS TO PROFILES
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'dispute_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN dispute_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_score DOUBLE PRECISION DEFAULT 100.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'games_played'
  ) THEN
    ALTER TABLE profiles ADD COLUMN games_played INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 15. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE trueskill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_trueskill_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_result_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- TrueSkill Ratings: Users can read all, but only system can update
CREATE POLICY "Anyone can view trueskill ratings"
  ON trueskill_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON trueskill_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sport Config: Read-only for all
CREATE POLICY "Anyone can view sport config"
  ON sport_trueskill_config FOR SELECT
  USING (true);

-- Game Participants: Viewable by participants
CREATE POLICY "Anyone can view game participants"
  ON game_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join games"
  ON game_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Result Submissions: Users can submit their own
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

-- Game Results: Readable by all
CREATE POLICY "Anyone can view game results"
  ON game_results FOR SELECT
  USING (true);

-- Matchmaking Queue: Users can manage their own entries
CREATE POLICY "Users can view active queue entries"
  ON matchmaking_queue FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own queue entries"
  ON matchmaking_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries"
  ON matchmaking_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries"
  ON matchmaking_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Match Proposals: Visible to involved players
CREATE POLICY "Users can view their match proposals"
  ON match_proposals FOR SELECT
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can update their match proposals"
  ON match_proposals FOR UPDATE
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Conversations: Participants only
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Conversation Participants
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
  );

-- Messages: Participants can read/write
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

-- Match History: Readable by all
CREATE POLICY "Anyone can view match history"
  ON match_history FOR SELECT
  USING (true);

-- User Reports: Users can submit, only see own reports
CREATE POLICY "Users can view their own reports"
  ON user_reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- 16. HELPER FUNCTIONS
-- ============================================

-- Function to calculate conservative TrueSkill rating
CREATE OR REPLACE FUNCTION calculate_conservative_rating(mu DOUBLE PRECISION, sigma DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN mu - (3 * sigma);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get user's conservative rating for a sport
CREATE OR REPLACE FUNCTION get_user_rating(p_user_id UUID, p_sport_id INTEGER)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  v_rating DOUBLE PRECISION;
BEGIN
  SELECT calculate_conservative_rating(mu, sigma) INTO v_rating
  FROM trueskill_ratings
  WHERE user_id = p_user_id AND sport_id = p_sport_id;

  -- Return default rating if not found (new player)
  RETURN COALESCE(v_rating, 0.0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to auto-create conversation when game is created
CREATE OR REPLACE FUNCTION create_game_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id INTEGER;
BEGIN
  -- Create conversation for the game
  INSERT INTO conversations (type, game_id)
  VALUES ('game', NEW.id)
  RETURNING id INTO v_conv_id;

  -- Add creator as participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conv_id, NEW.creator_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-creating game conversations
DROP TRIGGER IF EXISTS trigger_create_game_conversation ON game_requests;
CREATE TRIGGER trigger_create_game_conversation
  AFTER INSERT ON game_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_game_conversation();

-- Function to add player to game conversation when join request is accepted
CREATE OR REPLACE FUNCTION add_player_to_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id INTEGER;
BEGIN
  -- Only act when status changes to 'Accepted'
  IF NEW.status = 'Accepted' AND (OLD.status IS NULL OR OLD.status != 'Accepted') THEN
    -- Find the conversation for this game
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE game_id = NEW.game_request_id;

    -- Add player to conversation if conversation exists
    IF v_conv_id IS NOT NULL THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (v_conv_id, NEW.user_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    -- Also add them to game_participants
    INSERT INTO game_participants (game_id, user_id)
    VALUES (NEW.game_request_id, NEW.user_id)
    ON CONFLICT (game_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for adding players to conversations
DROP TRIGGER IF EXISTS trigger_add_player_to_conversation ON join_requests;
CREATE TRIGGER trigger_add_player_to_conversation
  AFTER INSERT OR UPDATE ON join_requests
  FOR EACH ROW
  EXECUTE FUNCTION add_player_to_conversation();

-- Function to check consensus on game results
CREATE OR REPLACE FUNCTION check_result_consensus(p_game_id INTEGER)
RETURNS TABLE(
  has_consensus BOOLEAN,
  winner_team INTEGER,
  submission_count INTEGER,
  participant_count INTEGER
) AS $$
DECLARE
  v_participant_count INTEGER;
  v_submissions RECORD;
BEGIN
  -- Count participants
  SELECT COUNT(*) INTO v_participant_count
  FROM game_participants
  WHERE game_id = p_game_id;

  -- Check if all submissions agree
  SELECT
    COUNT(*) as sub_count,
    COUNT(DISTINCT winner_team) as unique_results,
    MIN(winner_team) as agreed_winner
  INTO v_submissions
  FROM game_result_submissions
  WHERE game_id = p_game_id;

  -- Return results
  RETURN QUERY SELECT
    (v_submissions.sub_count >= v_participant_count AND v_submissions.unique_results = 1) as has_consensus,
    v_submissions.agreed_winner as winner_team,
    v_submissions.sub_count::INTEGER as submission_count,
    v_participant_count as participant_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 17. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE match_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE game_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE game_result_submissions;

-- ============================================
-- 18. ADDITIONAL HELPER FUNCTIONS
-- ============================================

-- Function to increment a value (for games_played counter)
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment profile games played
CREATE OR REPLACE FUNCTION increment_profile_games(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET games_played = COALESCE(games_played, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment dispute count for a user
CREATE OR REPLACE FUNCTION increment_dispute_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    dispute_count = COALESCE(dispute_count, 0) + 1,
    trust_score = GREATEST(0, COALESCE(trust_score, 100) - 5)  -- Decrease trust by 5 per dispute
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update TrueSkill rating games_played
CREATE OR REPLACE FUNCTION increment_trueskill_games(p_user_id UUID, p_sport_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE trueskill_ratings
  SET games_played = COALESCE(games_played, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND sport_id = p_sport_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
