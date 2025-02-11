import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Auth from '../components/login_signup/Auth';
import { supabase } from '../lib/supabase';
import Navigation from '../components/login_signup/Login Nav';
import { NavigationIndependentTree } from '@react-navigation/native';

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (session && session.user) {
    return (
      <NavigationIndependentTree>
        <Navigation session={session} />
      </NavigationIndependentTree>
    );
  }

  return (
    <View style={styles.container}>
      <Auth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#fff', 
  },
});