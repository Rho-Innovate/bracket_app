import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import ActiveGameJoinRequests from './components/Screens/ActiveGameJoinRequests';
import HomeScreen from './components/Screens/HomeScreen';
import LeaderboardsScreen from './components/Screens/LeaderboardsScreen';
import ProfileScreen from './components/Screens/ProfileScreen';

export type RootStackParamList = {
  Home: undefined;
  ActiveGameJoinRequests: undefined;
  Profile: undefined;
  Leaderboards: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="ActiveGameJoinRequests" 
          component={ActiveGameJoinRequests}
          options={{ title: 'My Events' }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Leaderboards" component={LeaderboardsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 