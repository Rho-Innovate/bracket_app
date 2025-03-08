import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Auth from '../components/login_signup/Auth';
import ActiveGameJoinRequests from '../components/Screens/ActiveGameJoinRequests';
import { supabase } from '../lib/supabase';
<<<<<<< HEAD
import Navigation from '../components/Login Nav';
import { NavigationIndependentTree } from '@react-navigation/native';
import LoadingScreen from '../components/LoadingScreen';
=======
import LoginNav from '../components/login_signup/Login Nav';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
>>>>>>> 6c7d2b9fb509f14193091e0bea1fddd2f3c3ad6c

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
      <Auth/>
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