import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchPublicProfilesBatch, getGameRequests, getJoinRequests, acceptJoinRequest, rejectJoinRequest } from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileModal from '../common/UserProfileModal';
import { showError, showSuccess } from '@/utils/errorHandler';

// Example interface for JoinRequest
interface JoinRequest {
  id: number;
  user_id: string; // ID of the user who's requesting
  game_request_id: number; // The host's game ID
  status: string; // e.g. 'Pending', 'Accepted', 'Rejected'
  requested_at: string; // Datetime
}

interface GameRequest {
  id: number;
  sport_id: number;
  description: string;
  requested_time: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  avatar_url?: string;
}

export default function HostGameJoinRequests() {
  const { session } = useAuth();
  const hostUserId = session?.user?.id;

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [games, setGames] = useState<{[key: number]: GameRequest}>({});
  const [userProfiles, setUserProfiles] = useState<{[key: string]: UserProfile}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load join requests for the host's games
  const loadRequests = async () => {
    if (!hostUserId) return;

    try {
      setLoading(true);
      const gameRequests = await getGameRequests({ creator_id: hostUserId });
      const gameRequestIds = gameRequests.map((g) => g.id);

      // Create a map of games for easy lookup
      const gamesMap: {[key: number]: GameRequest} = {};
      gameRequests.forEach(game => {
        gamesMap[game.id] = game;
      });
      setGames(gamesMap);

      const data = await getJoinRequests(hostUserId, {
        game_request_ids: gameRequestIds,
        status: 'Pending'
      });
      setRequests(data);

      // Fetch user profiles in batch (single query instead of N queries)
      const userIds = [...new Set(data.map(req => req.user_id))];
      const profilesMap = await fetchPublicProfilesBatch(userIds);

      // Convert Map to object for compatibility
      const profilesObj: {[key: string]: UserProfile} = {};
      profilesMap.forEach((profile, id) => {
        profilesObj[id] = profile;
      });

      setUserProfiles(profilesObj);
    } catch (error) {
      showError(error, 'Failed to Load Requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // Accept join request using transaction-safe RPC function
  const handleAccept = async (requestId: number) => {
    if (!hostUserId) return;

    try {
      const result = await acceptJoinRequest(requestId, hostUserId);

      if (result.success) {
        showSuccess('Request accepted!');
        loadRequests(); // Refresh requests
      } else {
        Alert.alert('Cannot Accept', result.message);
      }
    } catch (error) {
      showError(error, 'Failed to Accept Request');
    }
  };

  // Reject join request using transaction-safe RPC function
  const handleReject = async (requestId: number) => {
    if (!hostUserId) return;

    try {
      const result = await rejectJoinRequest(requestId, hostUserId);

      if (result.success) {
        showSuccess('Request declined');
        loadRequests();
      } else {
        Alert.alert('Cannot Reject', result.message);
      }
    } catch (error) {
      showError(error, 'Failed to Reject Request');
    }
  };

  // Helper styles for different statuses
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
        return styles.acceptedBox;
      case 'Rejected':
        return styles.rejectedBox;
      default:
        return styles.pendingBox;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
        return styles.acceptedText;
      case 'Rejected':
        return styles.rejectedText;
      default:
        return styles.pendingText;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Join Requests</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#2F622A" />
          ) : (
            <Text style={styles.refreshButtonText}>⟳</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No one has requested to join your games yet.</Text>
          </View>
        ) : (
          requests.map((request) => {
            const game = games[request.game_request_id];
            const profile = userProfiles[request.user_id];
            
            return (
              <View key={request.id} style={[styles.requestBox, getStatusStyle(request.status)]}>
                {/* Game Info */}
                <View style={styles.gameInfoContainer}>
                  <Text style={styles.gameTitle}>
                    {game?.description || `Game #${request.game_request_id}`}
                  </Text>
                  {game && (
                    <Text style={styles.gameTime}>
                      {formatDate(game.requested_time)}
                    </Text>
                  )}
                </View>
                
                {/* Player Info */}
                <View style={styles.playerInfoContainer}>
                  {profile?.avatar_url ? (
                    <Image 
                      source={{ uri: profile.avatar_url }} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {profile?.first_name ? profile.first_name[0] : '?'}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.playerDetails}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedUserId(request.user_id);
                        setShowProfileModal(true);
                      }}
                    >
                      <Text style={styles.playerNameClickable}>
                        {profile
                          ? profile.username
                            ? `@${profile.username}`
                            : `${profile.first_name} ${profile.last_name}`
                          : 'Unknown Player'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.requestTime}>
                      Requested {new Date(request.requested_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Accept / Reject Buttons if still pending */}
                {request.status === 'Pending' && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.rejectButton} 
                      onPress={() => handleReject(request.id)}
                    >
                      <Text style={styles.rejectButtonText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(request.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <UserProfileModal
        visible={showProfileModal}
        userId={selectedUserId}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013D5A',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(1, 61, 90, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#013D5A',
  },
  loader: {
    marginTop: 20,
  },
  emptyBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  requestBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  pendingBox: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#666',
  },
  acceptedBox: {
    backgroundColor: '#e7f3e8',
    borderLeftWidth: 4,
    borderLeftColor: '#2F622A',
  },
  rejectedBox: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  gameInfoContainer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013D5A',
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 14,
    color: '#666',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  playerNameClickable: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2F622A',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
  },
  pendingText: {
    color: '#666',
  },
  acceptedText: {
    color: '#2F622A',
    fontWeight: '600',
  },
  rejectedText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptButton: {
    backgroundColor: '#2F622A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  rejectButtonText: {
    color: '#d32f2f',
    fontWeight: '500',
    fontSize: 14,
  },
});

