import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js';
import Account from './Account';
import Home from './Navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Account: { session: Session };
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const Navigation = ({ session }: { session: Session }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen 
        name="Account" 
        component={Account} 
        initialParams={{ session }} 
      />
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
};

export default Navigation;

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;