import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
    getGameRequests,
  getJoinRequests, // You’ll implement or import this from your supabase logic
  updateJoinRequestStatus,      // Or however you update status
} from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Example interface for JoinRequest
interface JoinRequest {
  id: number;
  user_id: string;       // ID of the user who’s requesting
  game_request_id: number;       // The host’s game ID
  status: string;        // e.g. 'Pending', 'Accepted', 'Rejected'
  requested_at: string;  // Datetime
  // Optionally store user or game details if you want them shown in the list
  // e.g. user_name: string;
  // or game_name: string;
}

export default function HostGameJoinRequests({ session }: { session: Session }) {
  // Replace with how you fetch the current host’s ID
  // For example, from session or context:
  const hostUserId = session.user.id; 

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Load the join requests for the host’s games
  const loadRequests = async () => {
    try {
      setLoading(true);
      // E.g. get all join requests where the host_id = hostUserId
      const gameRequests = await getGameRequests({creator_id: hostUserId});
      const gameRequestIds = gameRequests.map((g) => g.id);
      

      const data = await getJoinRequests(null, hostUserId, {game_request_ids: gameRequestIds});
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load host join requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // 2. Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // 3. Accept
  const handleAccept = async (requestId: number) => {
    try {
      await updateJoinRequestStatus(requestId, session.user.id, "Accepted");
      // Optionally show a success alert or toast
      Alert.alert('Accepted', 'You have accepted this request.');
      loadRequests(); // reload the list so the status updates
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  // 4. Reject
  const handleReject = async (requestId: number) => {
    try {
      await updateJoinRequestStatus(requestId, session.user.id, "Rejected");
      Alert.alert('Rejected', 'You have rejected this request.');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  // Helpers for coloring boxes & text based on status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
        return styles.acceptedBox;
      case 'Rejected':
        return styles.rejectedBox;
      default:
        return styles.grayBox;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Accepted':
        return styles.acceptedText;
      case 'Rejected':
        return styles.rejectedText;
      default:
        return styles.boxText;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header / Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Join Requests</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#2F622A" />
            ) : (
              <Text style={styles.refreshButtonText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : requests.length === 0 ? (
          <View style={styles.grayBox}>
            <Text style={styles.boxText}>No one has requested to join your game yet.</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View
              key={request.id}
              style={[styles.grayBox, getStatusStyle(request.status)]}
            >
              {/* Show any relevant info about the requesting user or game */}
              <Text style={styles.boxText}>Request ID: {request.id}</Text>
              <Text style={styles.boxText}>Game ID: {request.game_request_id}</Text>
              <Text style={styles.boxText}>User ID: {request.user_id}</Text>

              {/* Status */}
              <Text style={[styles.boxText, getStatusTextStyle(request.status)]}>
                Status: {request.status}
              </Text>

              {/* Requested Date */}
              <Text style={styles.boxText}>
                Requested: {new Date(request.requested_at).toLocaleString()}
              </Text>

              {/* Accept / Reject Buttons if still pending */}
              {request.status === 'Pending' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(request.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(request.id)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F622A',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F622A',
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#2F622A',
  },
  loader: {
    marginTop: 20,
  },
  grayBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
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
  boxText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
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
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: '#2F622A',
    padding: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    backgroundColor: '#d32f2f',
    padding: 8,
    borderRadius: 5,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
