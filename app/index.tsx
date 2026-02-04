import '../shim';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import Auth from '../components/login_signup/Auth';
import LoginNav from '../components/login_signup/Login Nav';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import LoadingState from '../components/common/LoadingState';
import { NavigationIndependentTree } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useDeepLinking } from '../hooks/useDeepLinking';
import { AppTheme } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom theme for the app
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: AppTheme.colors.primary,
    secondary: AppTheme.colors.accent,
  },
};

function AppContent() {
  const { session, profile, isLoading, isOnboardingComplete, refreshProfile, setOnboardingComplete } = useAuth();

  // Initialize deep linking
  useDeepLinking();

  const [fontsLoaded] = useFonts({
    'Montserrat': require('../assets/fonts/Montserrat-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    // Hide splash screen once fonts are loaded AND session check is complete
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    setOnboardingComplete(true);
    await refreshProfile();
  };

  // Show loading screen while fonts or session are loading
  if (!fontsLoaded || isLoading) {
    return (
      <LoadingState message="Loading..." />
    );
  }

  // Not logged in - show auth screen
  if (!session || !session.user) {
    return (
      <View style={styles.container}>
        <Auth />
      </View>
    );
  }

  // Logged in but onboarding not completed - show onboarding
  if (session && session.user && !isOnboardingComplete) {
    return (
      <OnboardingFlow
        userId={session.user.id}
        firstName={profile?.first_name}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Logged in and onboarding completed - show main app
  return (
    <View style={styles.container}>
      <NavigationIndependentTree>
        <LoginNav session={session} />
      </NavigationIndependentTree>
    </View>
  );
}

export default function Page() {
  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <AppContent />
            <StatusBar style="dark" />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
});
