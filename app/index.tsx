import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Account from '../components/Account';
import Home from '../components/Navigation';
import Auth from '../components/Auth';
import { supabase } from '../lib/supabase';
import { NavigationContainer } from '@react-navigation/native';
import Navigation from '../components/Login Nav';
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
        {/* <NavigationContainer> */}
          <Navigation session={session} />
        {/* </NavigationContainer> */}
      </NavigationIndependentTree>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>BRACKET</Text>
        <Auth />
      </View>
    </View>
  );

  // return <Home />;
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
  authContainer: {
    width: '100%',
  }
});