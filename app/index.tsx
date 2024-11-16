import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Account from '../components/Account';
import Auth from '../components/Auth';
import { supabase } from '../lib/supabase';

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
    return <Account key={session.user.id} session={session} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>B R A C K E T</Text>
        <Auth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 960,
    marginHorizontal: 'auto',
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 36,
    color: '#38434D',
  },
});
