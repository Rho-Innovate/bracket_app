import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
} from 'react-native-paper';
import {
  getFriends,
  getReceivedFriendRequests,
  getSentFriendRequests,
  removeFriend,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '../../constants/theme';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';

interface UserProfile {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface ReceivedFriendRequest {
  id: number;
  status: string;
  created_at: string;
  sender_id: string;
  profiles: UserProfile;
}

interface SentFriendRequest {
  id: number;
  status: string;
  created_at: string;
  receiver_id: string;
  profiles: UserProfile;
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedFriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadFriends();
      loadFriendRequests();
    }
  }, [session?.user?.id]);

  const loadFriends = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const data = await getFriends(session.user.id);
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      const filteredResults = results.filter(user => user.id !== session?.user?.id);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    try {
      await sendFriendRequest(session.user.id, userId);
      Alert.alert('Success', 'Friend request sent');
      handleSearch();
      loadFriendRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (!session?.user?.id) return;
    try {
      await respondToFriendRequest(requestId, session.user.id, 'accepted');
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!session?.user?.id) return;
    try {
      await respondToFriendRequest(requestId, session.user.id, 'rejected');
      loadFriendRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!session?.user?.id) return;
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(session.user.id, friendId);
            loadFriends();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove friend');
          }
        }
      }
    ]);
  };

  // Performance optimization: Create lookup sets for O(1) checks instead of O(n) array searches
  const sentRequestUserIds = useMemo(
    () => new Set(sentRequests.map(req => req.profiles.id)),
    [sentRequests]
  );

  const friendIds = useMemo(
    () => new Set(friends.map(friend => friend.id)),
    [friends]
  );

  const receivedRequestMap = useMemo(
    () => new Map(receivedRequests.map(req => [req.sender_id, req])),
    [receivedRequests]
  );

  const renderUserItem = useCallback((item: UserProfile, type: 'search' | 'friend') => {
    // O(1) lookups using Sets/Maps instead of O(n) array.some()
    const requestSent = sentRequestUserIds.has(item.id);
    const isFriend = friendIds.has(item.id);
    const receivedRequest = receivedRequestMap.get(item.id);

    return (
      <Surface style={styles.userItem} elevation={0}>
        {item.avatar_url ? (
          <Avatar.Image size={48} source={{ uri: item.avatar_url }} />
        ) : (
          <Avatar.Text
            size={48}
            label={item.first_name?.charAt(0) || '?'}
            style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
            labelStyle={{ color: AppTheme.colors.textSecondary }}
          />
        )}
        <View style={styles.userInfo}>
          <Text variant="titleSmall" style={styles.userName}>
            {item.first_name} {item.last_name}
          </Text>
          {item.username && (
            <Text variant="bodySmall" style={styles.username}>@{item.username}</Text>
          )}
        </View>

        {type === 'friend' ? (
          <Button
            mode="outlined"
            onPress={() => handleRemoveFriend(item.id)}
            textColor={AppTheme.colors.error}
            style={styles.removeButton}
          >
            Remove
          </Button>
        ) : isFriend ? (
          <Button mode="outlined" disabled style={styles.actionButton} textColor={AppTheme.colors.primary}>
            Friends
          </Button>
        ) : requestSent ? (
          <Button mode="outlined" disabled style={styles.actionButton}>
            Pending
          </Button>
        ) : receivedRequest ? (
          <Button
            mode="contained"
            onPress={() => handleAcceptRequest(receivedRequest.id)}
            buttonColor={AppTheme.colors.primary}
          >
            Accept
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => handleSendRequest(item.id)}
            buttonColor={AppTheme.colors.primary}
          >
            Add
          </Button>
        )}
      </Surface>
    );
  }, [sentRequestUserIds, friendIds, receivedRequestMap, handleRemoveFriend, handleAcceptRequest, handleSendRequest]);

  const renderRequestItem = (item: ReceivedFriendRequest) => (
    <Surface style={styles.userItem} elevation={0}>
      {item.profiles.avatar_url ? (
        <Avatar.Image size={48} source={{ uri: item.profiles.avatar_url }} />
      ) : (
        <Avatar.Text
          size={48}
          label={item.profiles.first_name?.charAt(0) || '?'}
          style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
          labelStyle={{ color: AppTheme.colors.textSecondary }}
        />
      )}
      <View style={styles.userInfo}>
        <Text variant="titleSmall" style={styles.userName}>
          {item.profiles.first_name} {item.profiles.last_name}
        </Text>
        {item.profiles.username && (
          <Text variant="bodySmall" style={styles.username}>@{item.profiles.username}</Text>
        )}
      </View>
      <View style={styles.requestButtons}>
        <IconButton
          icon="close"
          iconColor={AppTheme.colors.error}
          size={20}
          onPress={() => handleRejectRequest(item.id)}
        />
        <IconButton
          icon="check"
          iconColor={AppTheme.colors.primary}
          size={20}
          onPress={() => handleAcceptRequest(item.id)}
          style={{ backgroundColor: `${AppTheme.colors.primary}15` }}
        />
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <Header title="Friends" showDivider={false} />

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'friends', label: 'Friends' },
          { value: 'requests', label: `Requests${receivedRequests.length > 0 ? ` (${receivedRequests.length})` : ''}` },
          { value: 'search', label: 'Search' },
        ]}
        style={styles.segmentedButtons}
      />

      <Divider />

      {activeTab === 'search' && (
        <Searchbar
          placeholder="Search for users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
          loading={searchLoading}
        />
      )}

      {loading ? (
        <LoadingState message="Loading..." />
      ) : activeTab === 'search' ? (
        searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => renderUserItem(item, 'search')}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : searchQuery && !searchLoading ? (
          <EmptyState
            icon="search-outline"
            title="No Users Found"
            message="Try a different search term."
          />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Search for Friends"
            message="Enter a name or username to find people."
          />
        )
      ) : activeTab === 'requests' ? (
        receivedRequests.length > 0 ? (
          <FlatList
            data={receivedRequests}
            renderItem={({ item }) => renderRequestItem(item)}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            icon="mail-outline"
            title="No Pending Requests"
            message="Friend requests you receive will appear here."
          />
        )
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={({ item }) => renderUserItem(item, 'friend')}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon="people-outline"
          title="No Friends Yet"
          message="Search for people to add as friends."
          actionLabel="Find Friends"
          onAction={() => setActiveTab('search')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  segmentedButtons: {
    marginHorizontal: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
  },
  searchbar: {
    marginHorizontal: AppTheme.spacing.md,
    marginVertical: AppTheme.spacing.sm,
    elevation: 0,
    backgroundColor: AppTheme.colors.surfaceVariant,
    borderRadius: AppTheme.borderRadius.md,
  },
  listContent: {
    padding: AppTheme.spacing.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm,
    borderRadius: AppTheme.borderRadius.md,
    backgroundColor: AppTheme.colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: AppTheme.spacing.sm,
  },
  userName: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  username: {
    color: AppTheme.colors.textSecondary,
  },
  actionButton: {
    borderRadius: AppTheme.borderRadius.full,
  },
  removeButton: {
    borderColor: AppTheme.colors.error,
    borderRadius: AppTheme.borderRadius.full,
  },
  requestButtons: {
    flexDirection: 'row',
  },
});
