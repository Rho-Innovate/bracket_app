-- Migration: Transaction-safe join request handling
-- Prevents race conditions when accepting join requests

-- ============================================================================
-- TYPE FOR FUNCTION RETURN
-- ============================================================================

-- Drop type if it exists (for re-running migration)
DROP TYPE IF EXISTS join_request_result CASCADE;

-- Result type for join request operations
CREATE TYPE join_request_result AS (
  success boolean,
  message text,
  new_player_count integer
);

-- ============================================================================
-- ACCEPT JOIN REQUEST FUNCTION (Atomic with row-level locking)
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_join_request(
  p_request_id integer,
  p_host_id uuid
)
RETURNS join_request_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_join_request record;
  v_game_request record;
  v_result join_request_result;
BEGIN
  -- Initialize result
  v_result.success := false;
  v_result.new_player_count := 0;

  -- Get join request details
  SELECT jr.*, gr.creator_id, gr.current_players, gr.max_players, gr.status as game_status
  INTO v_join_request
  FROM join_requests jr
  JOIN game_requests gr ON gr.id = jr.game_request_id
  WHERE jr.id = p_request_id
  FOR UPDATE OF jr, gr; -- Lock both rows to prevent concurrent modifications

  -- Validate join request exists
  IF v_join_request IS NULL THEN
    v_result.message := 'Join request not found';
    RETURN v_result;
  END IF;

  -- Validate host authorization
  IF v_join_request.creator_id != p_host_id THEN
    v_result.message := 'You are not authorized to accept this request';
    RETURN v_result;
  END IF;

  -- Validate request is still pending
  IF v_join_request.status != 'Pending' THEN
    v_result.message := 'This request has already been processed';
    RETURN v_result;
  END IF;

  -- Validate game is not full
  IF v_join_request.current_players >= v_join_request.max_players THEN
    v_result.message := 'This game is already full';
    RETURN v_result;
  END IF;

  -- Validate game is still open
  IF v_join_request.game_status != 'Open' THEN
    v_result.message := 'This game is no longer accepting players';
    RETURN v_result;
  END IF;

  -- All validations passed - perform atomic update

  -- Update join request status
  UPDATE join_requests
  SET status = 'Accepted'
  WHERE id = p_request_id;

  -- Increment player count
  UPDATE game_requests
  SET current_players = current_players + 1
  WHERE id = v_join_request.game_request_id;

  -- Get new player count
  SELECT current_players INTO v_result.new_player_count
  FROM game_requests
  WHERE id = v_join_request.game_request_id;

  -- Auto-close game if now full
  IF v_result.new_player_count >= v_join_request.max_players THEN
    UPDATE game_requests
    SET status = 'Closed'
    WHERE id = v_join_request.game_request_id;

    -- Reject all remaining pending requests for this game
    UPDATE join_requests
    SET status = 'Rejected'
    WHERE game_request_id = v_join_request.game_request_id
    AND status = 'Pending';
  END IF;

  v_result.success := true;
  v_result.message := 'Join request accepted successfully';
  RETURN v_result;
END;
$$;

-- ============================================================================
-- REJECT JOIN REQUEST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_join_request(
  p_request_id integer,
  p_host_id uuid
)
RETURNS join_request_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_join_request record;
  v_result join_request_result;
BEGIN
  -- Initialize result
  v_result.success := false;
  v_result.new_player_count := 0;

  -- Get join request details with lock
  SELECT jr.*, gr.creator_id, gr.current_players
  INTO v_join_request
  FROM join_requests jr
  JOIN game_requests gr ON gr.id = jr.game_request_id
  WHERE jr.id = p_request_id
  FOR UPDATE OF jr;

  -- Validate join request exists
  IF v_join_request IS NULL THEN
    v_result.message := 'Join request not found';
    RETURN v_result;
  END IF;

  -- Validate host authorization
  IF v_join_request.creator_id != p_host_id THEN
    v_result.message := 'You are not authorized to reject this request';
    RETURN v_result;
  END IF;

  -- Validate request is still pending
  IF v_join_request.status != 'Pending' THEN
    v_result.message := 'This request has already been processed';
    RETURN v_result;
  END IF;

  -- Update join request status
  UPDATE join_requests
  SET status = 'Rejected'
  WHERE id = p_request_id;

  v_result.success := true;
  v_result.message := 'Join request rejected';
  v_result.new_player_count := v_join_request.current_players;
  RETURN v_result;
END;
$$;

-- ============================================================================
-- KICK ACCEPTED PLAYER FUNCTION (for removing previously accepted players)
-- ============================================================================

CREATE OR REPLACE FUNCTION kick_player_from_game(
  p_request_id integer,
  p_host_id uuid
)
RETURNS join_request_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_join_request record;
  v_result join_request_result;
BEGIN
  -- Initialize result
  v_result.success := false;
  v_result.new_player_count := 0;

  -- Get join request details with lock
  SELECT jr.*, gr.creator_id, gr.current_players, gr.status as game_status
  INTO v_join_request
  FROM join_requests jr
  JOIN game_requests gr ON gr.id = jr.game_request_id
  WHERE jr.id = p_request_id
  FOR UPDATE OF jr, gr;

  -- Validate join request exists
  IF v_join_request IS NULL THEN
    v_result.message := 'Join request not found';
    RETURN v_result;
  END IF;

  -- Validate host authorization
  IF v_join_request.creator_id != p_host_id THEN
    v_result.message := 'You are not authorized to remove this player';
    RETURN v_result;
  END IF;

  -- Validate request was accepted
  IF v_join_request.status != 'Accepted' THEN
    v_result.message := 'This player is not currently in the game';
    RETURN v_result;
  END IF;

  -- Update join request status
  UPDATE join_requests
  SET status = 'Rejected'
  WHERE id = p_request_id;

  -- Decrement player count
  UPDATE game_requests
  SET
    current_players = current_players - 1,
    status = 'Open' -- Re-open the game if it was closed
  WHERE id = v_join_request.game_request_id;

  -- Get new player count
  SELECT current_players INTO v_result.new_player_count
  FROM game_requests
  WHERE id = v_join_request.game_request_id;

  v_result.success := true;
  v_result.message := 'Player removed from game';
  RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION accept_join_request(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_join_request(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION kick_player_from_game(integer, uuid) TO authenticated;
