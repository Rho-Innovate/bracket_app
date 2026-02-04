-- Function to get matchmaking queue entries with coordinates extracted from PostGIS geometry
-- This allows the Edge Function to work with lat/lng without parsing geometry

CREATE OR REPLACE FUNCTION get_matchmaking_queue_with_coords(p_sport_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  sport_id INTEGER,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  search_radius_km DOUBLE PRECISION,
  preferred_time_start TIMESTAMP WITH TIME ZONE,
  preferred_time_end TIMESTAMP WITH TIME ZONE,
  skill_range_min DOUBLE PRECISION,
  skill_range_max DOUBLE PRECISION,
  is_active BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mq.id,
    mq.user_id,
    mq.sport_id,
    ST_Y(mq.location::geometry) as lat,
    ST_X(mq.location::geometry) as lng,
    mq.search_radius_km,
    mq.preferred_time_start,
    mq.preferred_time_end,
    mq.skill_range_min,
    mq.skill_range_max,
    mq.is_active,
    mq.joined_at
  FROM matchmaking_queue mq
  WHERE mq.is_active = true
    AND mq.expires_at > NOW()
    AND (p_sport_id IS NULL OR mq.sport_id = p_sport_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_matchmaking_queue_with_coords TO authenticated;
GRANT EXECUTE ON FUNCTION get_matchmaking_queue_with_coords TO anon;
GRANT EXECUTE ON FUNCTION get_matchmaking_queue_with_coords TO service_role;
