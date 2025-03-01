import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import React from 'react';
import Auth from '../components/login_signup/Auth';
import ActiveGameJoinRequests from '../components/Screens/ActiveGameJoinRequests';
import { supabase } from '../lib/supabase';
import LoginNav from '../components/login_signup/Login Nav';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from '../components/text';

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);

  const [fontsLoaded] = useFonts({
    'Montserrat': require('../assets/fonts/Montserrat-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (!fontsLoaded) {
      SplashScreen.preventAutoHideAsync();
    } else {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (session && session.user) {
    return (
      <NavigationIndependentTree>
       <LoginNav session={session} />
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
  Montserrat: {
    fontFamily: 'Montserrat',
  },
});