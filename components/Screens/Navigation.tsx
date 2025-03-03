import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, StyleSheet } from 'react-native'; // Import View and StyleSheet
import EventCreationPage from "./EventCreationPage";
import FriendsScreen from "./FriendsScreen";
import HomeScreen from "./HomeScreen";
import LeaderboardsScreen from "./LeaderboardsScreen";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 60 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'rgba(39, 75, 13, 1)',
        tabBarInactiveTintColor: 'rgba(39, 75, 13, 0.6)',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}> {/* Enclosing View */}
              <Ionicons
                name={focused ? "home-sharp" : "home-outline"}
                size={28}
                color={color}
                style={{ marginBottom: -12 }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}> {/* Enclosing View */}
              <Ionicons
                name={focused ? "people-sharp" : "people-outline"}
                size={28}
                color={color}
                style={{ marginBottom: -12 }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Create Event"
        component={EventCreationPage}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}> {/* Enclosing View */}
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={28}
                color={color}
                style={{ marginBottom: -12 }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboards"
        component={LeaderboardsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}> {/* Enclosing View */}
              <Ionicons
                name={focused ? "podium-sharp" : "podium-outline"}
                size={28}
                color={color}
                style={{ marginBottom: -12 }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? "person-sharp" : "person-outline"}
                size={28}
                color={color}
                style={{ marginBottom: -12 }}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: 86,
    height: 40,
  },
});