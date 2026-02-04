import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import EventCreationPage from "./EventCreationPage";
import FriendsScreen from "./FriendsScreen";
import HomeScreen from "./HomeScreen";
import LeaderboardsScreen from "./LeaderboardsScreen";
import MatchmakingScreen from "./MatchmakingScreen";
import ProfileScreen from "./ProfileScreen";
import GameDetailScreen from "./GameDetailScreen";
import ResultSubmissionScreen from "./ResultSubmissionScreen";
import GameChatScreen from "./GameChatScreen";
import MyEventsScreen from "./MyEventsScreen";
import { AppTheme } from "../../constants/theme";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack with game detail screens
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ headerShown: true, title: 'Game Details' }}
      />
      <Stack.Screen
        name="ResultSubmission"
        component={ResultSubmissionScreen}
        options={{ headerShown: true, title: 'Submit Result' }}
      />
      <Stack.Screen
        name="GameChat"
        component={GameChatScreen}
        options={{ headerShown: true, title: 'Game Chat' }}
      />
    </Stack.Navigator>
  );
}

// Matchmaking stack
function MatchmakingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MatchmakingMain" component={MatchmakingScreen} />
      <Stack.Screen
        name="GameDetail"
        component={GameDetailScreen}
        options={{ headerShown: true, title: 'Game Details' }}
      />
    </Stack.Navigator>
  );
}

// Create stack - includes event creation and my events
function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateMain" component={EventCreationPage} />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppTheme.colors.background,
          borderTopWidth: 1,
          borderTopColor: AppTheme.colors.divider,
        },
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: AppTheme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Matchmaking':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Leaderboards':
              iconName = focused ? 'podium' : 'podium-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Matchmaking"
        component={MatchmakingStack}
        options={{ tabBarLabel: 'Find' }}
      />
      <Tab.Screen
        name="Create"
        component={CreateStack}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen
        name="Leaderboards"
        component={LeaderboardsScreen}
        options={{ tabBarLabel: 'Ranks' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
