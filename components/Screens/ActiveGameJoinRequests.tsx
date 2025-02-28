//This is not gonna be connected to anything for the time being but I'm leaving it here for now until we figure out how it fits in.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Session } from '@supabase/supabase-js'; // Supabase session for user authentication
import { supabase } from '../../lib/supabase';
import { getJoinRequests, deleteJoinRequest } from '../../lib/supabase';

interface JoinRequest {
  id: number;
  game_request_id: number;
  user_id: string;
  status: string;
  requested_at: string;
}

export default function ActiveGameJoinRequests() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
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
    if (!session?.user?.id) return;
    
    try {
      const data = await getJoinRequests({ user_id: session.user.id });
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Game Join Requests</Text>
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
      
      <ScrollView>
        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : requests.length === 0 ? (
          <View style={styles.grayBox}>
            <Text style={styles.boxText}>No active join requests</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View 
              key={request.id} 
              style={[styles.grayBox, getStatusStyle(request.status)]}
            >
              <Text style={styles.boxText}>Game ID: {request.game_request_id}</Text>
              <Text style={[styles.boxText, getStatusTextStyle(request.status)]}>
                Status: {request.status}
              </Text>
              <Text style={styles.boxText}>
                Requested: {new Date(request.requested_at).toLocaleDateString()}
              </Text>
              
              {request.status === 'Rejected' && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(request.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Request</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
    marginBottom: 10, // Add space between title and button
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
    fontSize: 24, // Increased size
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
  boxText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
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
  acceptedText: {
    color: '#2F622A',
    fontWeight: '600',
  },
  rejectedText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    padding: 8,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});