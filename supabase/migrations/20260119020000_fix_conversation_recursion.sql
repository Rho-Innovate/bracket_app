-- Fix infinite recursion in conversation_participants RLS policies
-- Uses dynamic SQL to handle missing tables gracefully

-- =====================================================
-- STEP 1: Fix conversation_participants (if exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_participants') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants';
    EXECUTE 'ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Recreate trigger functions with SECURITY DEFINER
-- =====================================================

DROP FUNCTION IF EXISTS create_game_conversation() CASCADE;
DROP FUNCTION IF EXISTS add_player_to_conversation() CASCADE;

CREATE OR REPLACE FUNCTION create_game_conversation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_conversation_id UUID;
BEGIN
  INSERT INTO conversations (game_id)
  VALUES (NEW.id)
  RETURNING id INTO new_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, NEW.creator_id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION add_player_to_conversation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  conv_id UUID;
BEGIN
  SELECT id INTO conv_id
  FROM conversations
  WHERE game_id = NEW.game_id;

  IF conv_id IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, NEW.user_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Recreate triggers (if tables exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_game_created ON games';
    EXECUTE 'CREATE TRIGGER on_game_created AFTER INSERT ON games FOR EACH ROW EXECUTE FUNCTION create_game_conversation()';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_participants') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_game_participant_added ON game_participants';
    EXECUTE 'CREATE TRIGGER on_game_participant_added AFTER INSERT ON game_participants FOR EACH ROW EXECUTE FUNCTION add_player_to_conversation()';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Fix conversations table RLS (if both tables exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations')
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games')
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_participants') THEN

    EXECUTE 'ALTER TABLE conversations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their conversations" ON conversations';
    EXECUTE $policy$
      CREATE POLICY "Users can view their conversations"
      ON conversations FOR SELECT
      TO authenticated
      USING (
        game_id IN (SELECT id FROM games WHERE creator_id = auth.uid())
        OR
        game_id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
      )
    $policy$;
  END IF;
END $$;

-- =====================================================
-- STEP 5: Fix messages table RLS (if all tables exist)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations')
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games')
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_participants') THEN

    EXECUTE 'ALTER TABLE messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages';
    EXECUTE 'DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages';

    EXECUTE $policy$
      CREATE POLICY "Users can view messages in their conversations"
      ON messages FOR SELECT
      TO authenticated
      USING (
        conversation_id IN (
          SELECT c.id FROM conversations c
          WHERE c.game_id IN (SELECT id FROM games WHERE creator_id = auth.uid())
             OR c.game_id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
        )
      )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can send messages to their conversations"
      ON messages FOR INSERT
      TO authenticated
      WITH CHECK (
        sender_id = auth.uid()
        AND conversation_id IN (
          SELECT c.id FROM conversations c
          WHERE c.game_id IN (SELECT id FROM games WHERE creator_id = auth.uid())
             OR c.game_id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
        )
      )
    $policy$;
  END IF;
END $$;

-- =====================================================
-- STEP 6: Ensure proper RLS on game_participants
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'game_participants') THEN
    EXECUTE 'ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view game participants" ON game_participants';
    EXECUTE 'DROP POLICY IF EXISTS "Users can join games" ON game_participants';
    EXECUTE 'DROP POLICY IF EXISTS "Users can leave games" ON game_participants';

    EXECUTE $policy$
      CREATE POLICY "Anyone can view game participants"
      ON game_participants FOR SELECT
      TO authenticated
      USING (true)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can join games"
      ON game_participants FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can leave games"
      ON game_participants FOR DELETE
      TO authenticated
      USING (user_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- =====================================================
-- STEP 7: Ensure games table has proper RLS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'games') THEN
    EXECUTE 'ALTER TABLE games ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own games" ON games';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own games" ON games';

    EXECUTE $policy$
      CREATE POLICY "Anyone can view games"
      ON games FOR SELECT
      TO authenticated
      USING (true)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Authenticated users can create games"
      ON games FOR INSERT
      TO authenticated
      WITH CHECK (creator_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can update their own games"
      ON games FOR UPDATE
      TO authenticated
      USING (creator_id = auth.uid())
      WITH CHECK (creator_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can delete their own games"
      ON games FOR DELETE
      TO authenticated
      USING (creator_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- =====================================================
-- STEP 8: Ensure friendships table has proper RLS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'friendships') THEN
    EXECUTE 'ALTER TABLE friendships ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their friendships" ON friendships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can send friend requests" ON friendships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their friendships" ON friendships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships';

    EXECUTE $policy$
      CREATE POLICY "Users can view their friendships"
      ON friendships FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR friend_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can send friend requests"
      ON friendships FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can update their friendships"
      ON friendships FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid() OR friend_id = auth.uid())
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Users can delete their friendships"
      ON friendships FOR DELETE
      TO authenticated
      USING (user_id = auth.uid() OR friend_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- =====================================================
-- STEP 9: Ensure profiles has SELECT policy
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON profiles';

    EXECUTE $policy$
      CREATE POLICY "Users can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true)
    $policy$;
  END IF;
END $$;

