/**
 * FriendsScreen
 * This component defines a stack navigator with two screens: MapScreen and ChatScreen.
 * - MapScreen: Displays a map with a marker and navigation to the Chat screen.
 * - ChatScreen: Displays a list of contacts with navigation to the Map screen.
 */

import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const FriendsStack = createStackNavigator();

type FriendsStackParamList = {
  Map: undefined;
  Chat: undefined;
};

type FriendsScreenNavigationProp = StackNavigationProp<FriendsStackParamList>;

export default function FriendsScreen() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <FriendsStack.Screen name="Map" component={MapScreen} />
      <FriendsStack.Screen name="Chat" component={ChatScreen} />
    </FriendsStack.Navigator>
  );
}

// MapScreen: Displays a map with a marker and navigation button for Chat screen
function MapScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
  return (
    <View style={styles.mapContainer}>
      {/* Header navigation buttons */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.selectedTab}>
          <Text style={styles.selectedTabText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Chat")}>
          <Text style={styles.tabText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Map with a marker */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.6592,
          longitude: -122.3078,
          latitudeDelta: 0.04,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude: 47.6592, longitude: -122.3078 }} title="YOU ARE HERE" />
      </MapView>

      {/* Horizontal scrollable circles */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleContainer}>
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} style={styles.circle} />
        ))}
      </ScrollView>
    </View>
  );
}

// ChatScreen: Displays a list of contacts and navigation button for Map screen
function ChatScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
  const contacts = [
    { name: "Gaurang Pendharkar", lastMessage: "Reacted 🔥 to your message • 1m" },
    { name: "Jenny Pyon", lastMessage: "Hello happy new years! • 2h" },
    // Add remaining contacts here
  ];

  return (
    <View style={styles.container}>
      {/* Header navigation buttons */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Map")}>
          <Text style={styles.tabText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectedTab}>
          <Text style={styles.selectedTabText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* List of contacts */}
      <ScrollView>
        {contacts.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <View style={styles.profilePic} />
            <View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.lastMessage}>{contact.lastMessage}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Stylesheet for consistent design
const styles = StyleSheet.create({
  mapContainer: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  tab: {
    backgroundColor: '#F1F1F1',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  selectedTab: {
    backgroundColor: '#000',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  tabText: { color: '#000', fontWeight: 'bold' },
  selectedTabText: { color: '#fff', fontWeight: 'bold' },
  map: { flex: 1 },
  circleContainer: { position: 'absolute', bottom: 32, flexDirection: 'row', paddingHorizontal: 10 },
  circle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ccc', marginRight: 10 },
  container: { flex: 1, backgroundColor: '#fff' },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  profilePic: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#ccc', marginRight: 20 },
  contactName: { fontWeight: 'bold', marginBottom: 8 },
  lastMessage: { color: '#777' },
});