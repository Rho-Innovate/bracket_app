import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  removeFriend,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
  supabase
} from '../../lib/supabase';
import { Text } from '../text';

// Interface for user profiles
interface UserProfile {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// Interface for friend requests received
interface ReceivedFriendRequest {
  id: number;
  status: string;
  created_at: string;
  sender_id: string;
  profiles: UserProfile;
}

// Interface for friend requests sent
interface SentFriendRequest {
  id: number;
  status: string;
  created_at: string;
  receiver_id: string;
  profiles: UserProfile;
}

export default function FriendsScreen() {
  // State variables
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedFriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get the current session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load friends and requests when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadFriends();
      loadFriendRequests();
    }
  }, [session]);

  // Load friends
  const loadFriends = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const data = await getFriends(session.user.id);
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const received = await getReceivedFriendRequests(session.user.id);
      const sent = await getSentFriendRequests(session.user.id);
      
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      
      // Filter out the current user
      const filteredResults = results.filter(user => user.id !== session?.user?.id);
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  // Send a friend request
  const handleSendRequest = async (userId: string) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to send friend requests');
      return;
    }
    
    try {
      await sendFriendRequest(session.user.id, userId);
      Alert.alert('Success', 'Friend request sent');
      
      // Refresh the search results to update UI
      handleSearch();
      
      // Refresh sent requests
      loadFriendRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  // Accept a friend request
  const handleAcceptRequest = async (requestId: number) => {
    if (!session?.user?.id) return;
    
    try {
      await respondToFriendRequest(requestId, session.user.id, 'accepted');
      
      // Refresh friends and requests
      loadFriends();
      loadFriendRequests();
      
      Alert.alert('Success', 'Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  // Reject a friend request
  const handleRejectRequest = async (requestId: number) => {
    if (!session?.user?.id) return;
    
    try {
      await respondToFriendRequest(requestId, session.user.id, 'rejected');
      
      // Refresh requests
      loadFriendRequests();
      
      Alert.alert('Success', 'Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  // Remove a friend
  const handleRemoveFriend = async (friendId: string) => {
    if (!session?.user?.id) return;
    
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(session.user.id, friendId);
              
              // Refresh friends list
              loadFriends();
              
              Alert.alert('Success', 'Friend removed');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  // Render user item for search results
  const renderSearchItem = ({ item }: { item: UserProfile }) => {
    // Check if a request has already been sent to this user
    const requestSent = sentRequests.some(request => 
      request.profiles.id === item.id
    );
    
    // Check if this user is already a friend
    const isFriend = friends.some(friend => friend.id === item.id);
    
    // Check if this user has sent a request to the current user
    const hasRequestedCurrentUser = receivedRequests.some(request => 
      request.sender_id === item.id
    );

    return (
      <View style={styles.userItem}>
        {/* Avatar */}
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.first_name ? item.first_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
        
        {/* User info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.first_name} {item.last_name}
          </Text>
          {item.username && (
            <Text style={styles.username}>@{item.username}</Text>
          )}
        </View>
        
        {/* Action button */}
        {isFriend ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.friendButton]}
            onPress={() => handleRemoveFriend(item.id)}
          >
            <Text style={styles.friendButtonText}>Friends</Text>
          </TouchableOpacity>
        ) : requestSent ? (
          <TouchableOpacity style={[styles.actionButton, styles.pendingButton]} disabled>
            <Text style={styles.pendingButtonText}>Pending</Text>
          </TouchableOpacity>
        ) : hasRequestedCurrentUser ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => {
              const request = receivedRequests.find(req => req.sender_id === item.id);
              if (request) {
                handleAcceptRequest(request.id);
              }
            }}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={() => handleSendRequest(item.id)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render friend item
  const renderFriendItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userItem}>
      {/* Avatar */}
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.first_name ? item.first_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}
      
      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
        {item.username && (
          <Text style={styles.username}>@{item.username}</Text>
        )}
      </View>
      
      {/* Remove button */}
      <TouchableOpacity 
        style={[styles.actionButton, styles.removeButton]}
        onPress={() => handleRemoveFriend(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  // Render friend request item
  const renderRequestItem = ({ item }: { item: ReceivedFriendRequest }) => (
    <View style={styles.userItem}>
      {/* Avatar */}
      {item.profiles.avatar_url ? (
        <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.profiles.first_name ? item.profiles.first_name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
      )}
      
      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        {item.profiles.username && (
          <Text style={styles.username}>@{item.profiles.username}</Text>
        )}
      </View>
      
      {/* Action buttons */}
      <View style={styles.requestButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Text style={styles.rejectButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'friends' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'friends' && styles.activeTabButtonText
          ]}>Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'requests' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'requests' && styles.activeTabButtonText
          ]}>
            Requests
            {receivedRequests.length > 0 && (
              <Text style={styles.badgeText}> ({receivedRequests.length})</Text>
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'search' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'search' && styles.activeTabButtonText
          ]}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      {activeTab === 'search' ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          ) : searchQuery && !searchLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : null}
        </View>
      ) : activeTab === 'requests' ? (
        <View style={styles.requestsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
          ) : receivedRequests.length > 0 ? (
            <FlatList
              data={receivedRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <Text style={styles.sectionTitle}>Friend Requests</Text>
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending friend requests</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.friendsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
          ) : friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>You don't have any friends yet</Text>
              <TouchableOpacity 
                style={styles.findFriendsButton}
                onPress={() => setActiveTab('search')}
              >
                <Text style={styles.findFriendsButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#013D5A',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2F622A',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#2F622A',
    fontWeight: '600',
  },
  badgeText: {
    color: '#2F622A',
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2F622A',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  requestsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#013D5A',
    marginBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2F622A',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pendingButton: {
    backgroundColor: '#f0f0f0',
  },
  pendingButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  friendButton: {
    backgroundColor: '#e7f3e8',
  },
  friendButtonText: {
    color: '#2F622A',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  removeButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 14,
  },
  requestButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#2F622A',
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  rejectButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  findFriendsButton: {
    backgroundColor: '#2F622A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  findFriendsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
});
