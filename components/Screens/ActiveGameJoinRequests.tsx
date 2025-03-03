import React, { useEffect, useState } from 'react';
import { Text as CustomText } from '../text';
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
        <CustomText style={styles.title}>Join Requests</CustomText>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
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
          <View style={styles.grayBox}>
            <CustomText style={styles.boxText}>No active join requests</CustomText>
          </View>
        ) : (
          requests.map((request) => (
            <View 
              key={request.id} 
              style={[styles.grayBox, getStatusStyle(request.status)]}
            >
              <CustomText style={styles.boxText}>Game ID: {request.game_request_id}</CustomText>
              <CustomText style={[styles.boxText, getStatusTextStyle(request.status)]}>
                Status: {request.status}
              </CustomText>
              <CustomText style={styles.boxText}>
                Requested: {new Date(request.requested_at).toLocaleDateString()}
              </CustomText>
              
              {request.status === 'Rejected' && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(request.id)}
                >
                  <CustomText style={styles.deleteButtonText}>Delete Request</CustomText>
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
    paddingHorizontal: 28,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#rgba(1, 61, 90, 1)',
  },
  refreshButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingLeft: 4,
    paddingTop: 4,
    marginLeft: 8,
    backgroundColor: '#rgba(1, 61, 90, .08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'fff',
    fontSize: 32,
  },
  loader: {
    marginTop: 20,
  },
  grayBox: {
    marginBottom: 12,
  },
  boxText: {
    fontSize: 12,
    color: '#000',
    marginBottom: 4,
    fontWeight: '500',
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