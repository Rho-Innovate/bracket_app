import { supabase } from './client';
import type { Conversation, Message } from './types';

/**
 * Get conversation for a game
 */
export const getGameConversation = async (gameId: number): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('game_id', gameId)
      .eq('type', 'game')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting game conversation:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(msg => ({
      ...msg,
      sender: msg.profiles
    })).reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  conversationId: number,
  senderId: string,
  content: string,
  messageType: Message['message_type'] = 'text'
): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType
      })
      .select(`
        *,
        profiles!messages_sender_id_fkey(id, username, first_name, last_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return {
      ...data,
      sender: data.profiles
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Subscribe to new messages in a conversation
 */
export const subscribeToConversation = (
  conversationId: number,
  callback: (message: Message) => void
) => {
  return supabase
    .channel(`conversation_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();

        callback({
          ...payload.new as Message,
          sender: sender || undefined
        });
      }
    )
    .subscribe();
};

/**
 * Get all game conversations for a user
 */
export const getUserGameConversations = async (userId: string): Promise<Array<Conversation & { game?: any; unread_count?: number }>> => {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations(
          id,
          type,
          game_id,
          created_at,
          game_requests(id, description, sport_id, game_state, requested_time)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return (data || [])
      .filter((item: any) => item.conversations?.type === 'game')
      .map((item: any) => ({
        ...item.conversations,
        game: item.conversations.game_requests,
        last_read_at: item.last_read_at
      }));
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

/**
 * Update last read timestamp for a conversation
 */
export const markConversationRead = async (conversationId: number, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking conversation read:', error);
    throw error;
  }
};
