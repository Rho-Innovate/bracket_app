// Generic API result type for consistent return types
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// User Profile interfaces
export interface UserProfile {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// Game Request interface
export interface GameRequest {
  id: number;
  creator_id: string;
  sport_id: number;
  location: string; // PostGIS POINT format
  requested_time: string;
  status: 'Open' | 'Closed';
  description: string;
  max_players: number;
  current_players: number;
  game_state?: GameState;
  created_at?: string;
  updated_at?: string;
}

// Game request with host profile
export interface EventWithHost extends GameRequest {
  request_status?: string | null; // 'Pending', 'Accepted', or null
  host?: {
    id: string;
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string;
  };
}

// Join request interface
export interface JoinRequest {
  id: number;
  game_request_id: number;
  user_id: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  requested_at: string;
}

// DateTimePicker event type (from @react-native-community/datetimepicker)
export interface DateTimePickerEvent {
  type: 'set' | 'dismissed';
  nativeEvent: {
    timestamp?: number;
    utcOffset?: number;
  };
}

export interface ReceivedFriendRequest {
  id: number;
  status: string;
  created_at: string;
  sender_id: string;
  profiles: UserProfile;
}

export interface SentFriendRequest {
  id: number;
  status: string;
  created_at: string;
  receiver_id: string;
  profiles: UserProfile;
}

// TrueSkill interfaces
export interface TrueSkillRating {
  id: string;
  user_id: string;
  sport_id: number;
  mu: number;
  sigma: number;
  games_played: number;
  created_at?: string;
  updated_at?: string;
}

export interface SportConfig {
  id: number;
  sport_id: number;
  sport_name: string;
  beta: number;
  tau: number;
  draw_probability: number;
  is_team_sport: boolean;
  team_size: number;
}

// Game state types
export type GameState = 'scheduled' | 'in_progress' | 'awaiting_results' | 'disputed' | 'completed' | 'cancelled';

// Game participant interface
export interface GameParticipant {
  id: string;
  game_id: number;
  user_id: string;
  team: number | null;
  mu_before?: number;
  sigma_before?: number;
  mu_after?: number;
  sigma_after?: number;
  joined_at: string;
}

// Result submission interfaces
export interface ResultSubmission {
  id: string;
  game_id: number;
  submitted_by: string;
  winner_team: number;
  score_team1?: number;
  score_team2?: number;
  submitted_at: string;
}

export interface GameResult {
  id: string;
  game_id: number;
  winner_team: number;
  is_draw: boolean;
  score_team1?: number;
  score_team2?: number;
  consensus_reached: boolean;
  resolved_by: 'consensus' | 'admin' | 'timeout';
  finalized_at: string;
}

// User report interface
export interface UserReport {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  game_id?: number;
  reason: 'result_dispute' | 'no_show' | 'unsportsmanlike' | 'cheating' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  created_at: string;
}

// Chat interfaces
export interface Conversation {
  id: number;
  type: 'direct' | 'game';
  game_id?: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: number;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'image';
  created_at: string;
  sender?: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

// Matchmaking interfaces
export interface MatchmakingQueueEntry {
  id: string;
  user_id: string;
  sport_id: number;
  location?: { lat: number; lng: number };
  search_radius_km: number;
  preferred_time_start?: string;
  preferred_time_end?: string;
  skill_range_min?: number;
  skill_range_max?: number;
  is_active: boolean;
  matched_game_id?: number;
  joined_at: string;
  expires_at: string;
}

export interface MatchProposal {
  id: number;
  sport_id: number;
  player1_id: string;
  player2_id: string;
  player1_accepted?: boolean;
  player2_accepted?: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  proposed_time?: string;
  proposed_location?: { lat: number; lng: number };
  expires_at: string;
  created_game_id?: number;
  created_at: string;
}

// Match history interface
export interface MatchHistoryEntry {
  id: string;
  game_id: number;
  sport_id: number;
  team1_user_ids: string[];
  team2_user_ids: string[];
  winner_team: number;
  team1_score?: number;
  team2_score?: number;
  played_at: string;
}
