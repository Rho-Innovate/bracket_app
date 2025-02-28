/**
 * Navigation Component
 * This component sets up a stack navigator with two screens: Account and Home.
 * - Account: Displays the user's account details using a session object.
 * - Home: Navigates to the main application screens.
 * Database Integration: Use Supabase (or other database services) to pass the session to the Account screen for user authentication and data management.
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js'; // Supabase session for user authentication
import React from 'react';
import Account from './Account'; // Account screen component
import Navigation from '../Screens/Navigation'; // Home screen component
import ActiveGameJoinRequests from '../Screens/ActiveGameJoinRequests';
import Signup from './Signup';

// Define route parameters for the stack navigator
export type RootStackParamList = {
  Account: { session: Session }; // Pass session data to the Account screen
  Home: undefined; // Home screen with no additional parameters
  Signup: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const Nav = ({ session }: { session: Session }) => {
  return (
    <Stack.Navigator initialRouteName="Account"
      screenOptions={{
        headerShown: false, // Hide headers for a clean UI
      }}
    >
      {/* Account Screen */}
      <Stack.Screen
        name="Account"
        component={Account}
        initialParams={{ session }} // Pass session data as initial params
      />
      {/* Home Screen */}
      <Stack.Screen name="Home" component={ActiveGameJoinRequests} />
    </Stack.Navigator>
  );
};

export default Nav;

// Type definition for navigation props
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
