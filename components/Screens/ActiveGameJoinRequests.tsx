import { Session } from '@supabase/supabase-js'; // Supabase session for user authentication
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { deleteJoinRequest, getGameRequests, getJoinRequests, supabase } from '../../lib/supabase';
import { Text as CustomText } from '../text';

interface JoinRequest {
  id: number;
  game_request_id: number;
  user_id: string;
  status: string;
  requested_at: string;
}

interface GameRequest {
  id: number;
  sport_id: number;
  description: string;
  requested_time: string;
  creator_id: string;
}

export default function ActiveGameJoinRequests() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [gameDetails, setGameDetails] = useState<{[key: number]: GameRequest}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session || null);
    });
  }, []);

  // Load requests when we have a session
  useEffect(() => {
    if (!session?.user?.id) return;
    loadRequests();
  }, [session]);

  const loadRequests = async () => {
    if (!session?.user?.id) {
      console.log('No session user ID available');
      return;
    }
    
    try {
      console.log('Fetching requests for user:', session.user.id);
      const data = await getJoinRequests(session.user.id, { 
        user_id: session.user.id 
      });
      console.log('Raw response from getJoinRequests:', data);
      
      if (!data) {
        console.log('No data returned from getJoinRequests');
        return;
      }
      
      setRequests(data);
      console.log('Requests set to:', data.length, 'items');
      
      // Fetch game details for each request
      const gameIds = [...new Set(data.map(req => req.game_request_id))];
      const gameDetailsMap: {[key: number]: GameRequest} = {};
      
      for (const gameId of gameIds) {
        try {
          // Use the new game_id parameter for direct lookup
          const gameData = await getGameRequests({ game_id: gameId });
          if (gameData && gameData.length > 0) {
            gameDetailsMap[gameId] = gameData[0];
          }
        } catch (error) {
          console.error(`Error fetching details for game ${gameId}:`, error);
        }
      }
      
      setGameDetails(gameDetailsMap);
    } catch (error) {
      console.error('Error in loadRequests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

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
  
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'Your request has been accepted! You can now join this game.';
      case 'Rejected':
        return 'Your request was declined by the host.';
      default:
        return 'Your request is pending approval from the host.';
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!session?.user?.id) return;

    try {
      await deleteJoinRequest(requestId, session.user.id);
      setRequests(requests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error deleting request:', error);
      Alert.alert('Error', 'Failed to delete request');
    }
  };

  const confirmDelete = (requestId: number) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => handleDeleteRequest(requestId),
          style: 'destructive'
        },
      ]
    );
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
      <View style={styles.header}>
        <CustomText style={styles.title}>My Join Requests</CustomText>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            console.log('Refresh button pressed');
            handleRefresh();
          }}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#2F622A" />
          ) : (
            <CustomText style={styles.refreshButtonText}>⟳</CustomText>
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyBox}>
            <CustomText style={styles.emptyText}>You haven't requested to join any games yet</CustomText>
          </View>
        ) : (
          <>
            {requests.map((request) => {
              const game = gameDetails[request.game_request_id];
              return (
                <View key={request.id} style={[styles.requestBox, getStatusStyle(request.status)]}>
                  <View style={styles.requestHeader}>
                    <CustomText style={styles.gameTitle}>
                      {game?.description || `Game #${request.game_request_id}`}
                    </CustomText>
                    <CustomText style={[styles.statusBadge, getStatusTextStyle(request.status)]}>
                      {request.status}
                    </CustomText>
                  </View>
                  
                  {game && (
                    <CustomText style={styles.gameTime}>
                      {formatDate(game.requested_time)}
                    </CustomText>
                  )}
                  
                  <CustomText style={styles.statusMessage}>
                    {getStatusMessage(request.status)}
                  </CustomText>
                  
                  <CustomText style={styles.requestDate}>
                    Requested on {new Date(request.requested_at).toLocaleDateString()}
                  </CustomText>
                
                  {(request.status === 'Rejected' || request.status === 'Pending') && (
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => confirmDelete(request.id)}
                    >
                      <CustomText style={styles.deleteButtonText}>
                        {request.status === 'Pending' ? 'Cancel Request' : 'Remove'}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#013D5A',
    flex: 1,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pendingText: {
    color: '#666',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  acceptedText: {
    color: '#2F622A',
    backgroundColor: 'rgba(47, 98, 42, 0.1)',
  },
  rejectedText: {
    color: '#d32f2f',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  gameTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    marginVertical: 8,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
});