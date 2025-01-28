import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js';
import React from 'react';
import Account from './Account';
import Navigation from './Screens/Navigation';

export type RootStackParamList = {
  Account: { session: Session };
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const Nav = ({ session }: { session: Session }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Account" 
        component={Account} 
        initialParams={{ session }} 
      />
      <Stack.Screen
        name="Home"
        component={Navigation} />
    </Stack.Navigator>
  );
};

export default Nav;

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;