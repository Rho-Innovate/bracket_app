import { useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export const useDeepLinking = () => {
  const handleUrl = useCallback(async (url: string) => {
    try {
      const parsed = Linking.parse(url);
      console.log('Deep link received:', parsed);

      // Handle auth callback from email verification
      if (parsed.path === 'auth/callback' || parsed.hostname === 'auth') {
        // Extract tokens from URL if present
        const accessToken = parsed.queryParams?.access_token as string;
        const refreshToken = parsed.queryParams?.refresh_token as string;

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from deep link:', error);
          } else {
            console.log('Session established from email verification');
          }
        } else {
          // If no tokens in URL, the session might be established automatically
          // by Supabase's auth listener. Just refresh the session.
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
          } else if (data.session) {
            console.log('Session found after deep link');
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }, []);

  useEffect(() => {
    // Handle URL when app is opened from a link
    const handleUrlEvent = (event: { url: string }) => {
      handleUrl(event.url);
    };

    // Subscribe to incoming links
    const subscription = Linking.addEventListener('url', handleUrlEvent);

    // Check if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);
};

export default useDeepLinking;
