import { supabase } from './client';
import type { UserProfile, ReceivedFriendRequest, SentFriendRequest } from './types';

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    const { data: existingRequests, error: checkError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing friend requests:', checkError.message);
      throw checkError;
    }

    if (existingRequests && existingRequests.length > 0) {
      return { message: 'A friend request already exists between these users' };
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error sending friend request:', error.message);
      throw error;
    }

    return { message: 'Friend request sent successfully' };
  } catch (error) {
    console.error('Unexpected error sending friend request:', error);
    throw error;
  }
};

/**
 * Get all friend requests received by a user
 */
export const getReceivedFriendRequests = async (userId: string): Promise<ReceivedFriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        sender_id,
        profiles!friend_requests_sender_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching received friend requests:', error.message);
      throw error;
    }

    const transformedData = data.map(item => ({
      ...item,
      profiles: item.profiles as unknown as UserProfile
    }));

    return transformedData;
  } catch (error) {
    console.error('Unexpected error fetching received friend requests:', error);
    throw error;
  }
};

/**
 * Get all friend requests sent by a user
 */
export const getSentFriendRequests = async (userId: string): Promise<SentFriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        receiver_id,
        profiles!friend_requests_receiver_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching sent friend requests:', error.message);
      throw error;
    }

    const transformedData = data.map(item => ({
      ...item,
      profiles: item.profiles as unknown as UserProfile
    }));

    return transformedData;
  } catch (error) {
    console.error('Unexpected error fetching sent friend requests:', error);
    throw error;
  }
};

/**
 * Accept or reject a friend request
 */
export const respondToFriendRequest = async (requestId: number, userId: string, status: 'accepted' | 'rejected') => {
  try {
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching friend request:', fetchError.message);
      throw fetchError;
    }

    if (!request) {
      throw new Error('Friend request not found or you are not authorized to respond to it');
    }

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating friend request:', updateError.message);
      throw updateError;
    }

    return { message: `Friend request ${status}` };
  } catch (error) {
    console.error('Unexpected error responding to friend request:', error);
    throw error;
  }
};

/**
 * Get all friends of a user (accepted requests in either direction)
 */
export const getFriends = async (userId: string): Promise<UserProfile[]> => {
  try {
    const { data: receivedFriends, error: receivedError } = await supabase
      .from('friend_requests')
      .select(`
        sender_id,
        profiles!friend_requests_sender_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'accepted');

    if (receivedError) {
      console.error('Error fetching received friends:', receivedError.message);
      throw receivedError;
    }

    const { data: sentFriends, error: sentError } = await supabase
      .from('friend_requests')
      .select(`
        receiver_id,
        profiles!friend_requests_receiver_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('sender_id', userId)
      .eq('status', 'accepted');

    if (sentError) {
      console.error('Error fetching sent friends:', sentError.message);
      throw sentError;
    }

    const friends = [
      ...(receivedFriends || []).map(item => ({
        id: item.sender_id,
        ...(item.profiles as unknown as UserProfile)
      })),
      ...(sentFriends || []).map(item => ({
        id: item.receiver_id,
        ...(item.profiles as unknown as UserProfile)
      }))
    ];

    return friends;
  } catch (error) {
    console.error('Unexpected error fetching friends:', error);
    throw error;
  }
};

/**
 * Remove a friend (set status to 'removed' for the friendship)
 */
export const removeFriend = async (userId: string, friendId: string) => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({
        status: 'removed',
        updated_at: new Date().toISOString()
      })
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error removing friend:', error.message);
      throw error;
    }

    return { message: 'Friend removed successfully' };
  } catch (error) {
    console.error('Unexpected error removing friend:', error);
    throw error;
  }
};
