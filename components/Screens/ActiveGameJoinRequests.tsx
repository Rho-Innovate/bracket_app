//This is not gonna be connected to anything for the time being but I'm leaving it here for now until we figure out how it fits in.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getJoinRequests } from '../../lib/supabase';

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

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await getJoinRequests({ user_id: 'your-user-id' });
        setRequests(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

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
      <Text style={styles.title}>Active Game Join Requests</Text>
      <ScrollView>
        {requests.length === 0 ? (
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2F622A',
    textAlign: 'center',
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
});