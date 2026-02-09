// Re-export supabase client
export { supabase } from './client';

// Re-export types
export type {
  UserProfile,
  ReceivedFriendRequest,
  SentFriendRequest,
  TrueSkillRating,
  SportConfig,
  GameState,
  GameParticipant,
  ResultSubmission,
  GameResult,
  UserReport,
  Conversation,
  Message,
  MatchmakingQueueEntry,
  MatchProposal,
  MatchHistoryEntry,
} from './types';

// Re-export auth functions
export {
  signUpAndCreateProfile,
  signInWithEmail,
  signOut,
  deleteUserAccount,
  resendVerificationEmail,
} from './auth';

// Re-export profile functions
export {
  ensureProfileExists,
  updateProfile,
  fetchOwnProfile,
  fetchPublicProfile,
  searchUsers,
  getUserTrustScore,
  addNewSport,
} from './profiles';

// Re-export game functions
export {
  createGameRequest,
  modifyGameRequest,
  fetchOwnGameRequests,
  getGameRequests,
  getGameRequestsWithHosts,
  deleteGameRequest,
  updatePlayerCount,
  getGameDetails,
} from './games';

// Re-export join request functions
export {
  createJoinRequest,
  getJoinRequests,
  deleteJoinRequest,
  updateJoinRequestStatus,
  changeJoinRequestStatus,
  getUserPendingRequestGameIds,
  getUserRequestedGameIds,
} from './joinRequests';

// Re-export storage functions
export { uploadAvatar } from './storage';

// Re-export rating functions
export {
  initializeElo,
  getUserElos,
  getUserEloForSport,
  updateEloAfterMatch,
  initializeTrueSkill,
  getUserTrueSkill,
  getUserAllTrueSkillRatings,
  calculateConservativeRating,
  getSportConfig,
  getAllSportsConfig,
  getSportLeaderboard,
  initializeTrueSkillFromOnboarding,
} from './ratings';

// Re-export friend functions
export {
  sendFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  respondToFriendRequest,
  getFriends,
  removeFriend,
} from './friends';

// Re-export game state functions
export {
  startGame,
  endGame,
  cancelGame,
  getUserActiveGame,
  subscribeToGameState,
  addGameParticipant,
  updateParticipantTeam,
  getGameParticipants,
} from './gameState';

// Re-export result functions
export {
  submitGameResult,
  getResultSubmissions,
  checkAndFinalizeConsensus,
  getGameResult,
  reportUser,
} from './results';

// Re-export chat functions
export {
  getGameConversation,
  getMessages,
  sendMessage,
  subscribeToConversation,
  getUserGameConversations,
  markConversationRead,
} from './chat';

// Re-export matchmaking functions
export {
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
  getQueueStatus,
  getMatchProposals,
  respondToMatchProposal,
  subscribeToMatchProposals,
  getUserMatchHistory,
  recordMatchHistory,
  triggerMatchmaking,
} from './matchmaking';

// Re-export onboarding functions
export {
  checkOnboardingStatus,
  completeOnboarding,
  saveSportsPreferences,
  finishOnboarding,
} from './onboarding';

// Re-export sport ID mapping from constants
export { sportNameToId } from '../../constants/sports';
