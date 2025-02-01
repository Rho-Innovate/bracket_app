/**
 * ExploreScreen
 * This component defines a stack navigator with two screens: JoinScreen and HostScreen.
 * - JoinScreen: Displays events near the user's location with category filters and a mini-map.
 * - HostScreen: Placeholder screen for hosting events.
 */

import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type ExploreScreenNavigationProp = StackNavigationProp<ExploreStackParamList>;

type ExploreStackParamList = {
  Join: undefined;
  Host: undefined;
};

const ExploreStack = createStackNavigator();
const GrayBG = {
  uri: 'https://digitalassets.daltile.com/content/dam/AmericanOlean/AO_ImageFiles/minimum/AO_MN44_12x24_Gray_Matte.jpg/jcr:content/renditions/cq5dam.web.570.570.jpeg',
};

export default function ExploreScreen() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <ExploreStack.Screen name="Join" component={JoinScreen} />
      <ExploreStack.Screen name="Host" component={HostScreen} />
    </ExploreStack.Navigator>
  );
}

// JoinScreen: Displays events with category filters and a mini-map
function JoinScreen({ navigation }: { navigation: ExploreScreenNavigationProp }) {
  const events = [
    { title: "Event 1", date: "FRI, SEP 6 • 9:00 AM", location: "Orange County Great Park" },
    { title: "Event 2", date: "SAT, SEP 7 • 10:00 AM", location: "Location 2" },
    { title: "Event 3", date: "SUN, SEP 8 • 11:00 AM", location: "Location 3" },
  ];

  return (
    <View style={styles.minimapContainer}>
      {/* Navigation buttons */}
      <View style={styles.MapChatContainer}>
        <TouchableOpacity style={styles.Choice}>
          <Text style={styles.ChoiceText}>Join</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Host")}>
          <Text style={styles.unChoiceText}>Host</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <ScrollView contentContainerStyle={styles.MapChatContainer}>
        <View style={styles.relSearchTopContainer}>
          <TextInput
            style={styles.relSearchBar}
            placeholder="Search events (ex. batting practice)"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* Mini-map */}
        <Text style={styles.exploreTitle}>Events near University District</Text>
        <MapView
          style={styles.minimap}
          initialRegion={{
            latitude: 47.6592,
            longitude: -122.3078,
            latitudeDelta: 0.004,
            longitudeDelta: 0.002,
          }}
        >
          <Marker coordinate={{ latitude: 47.6592, longitude: -122.3078 }} title="YOU ARE HERE" />
        </MapView>

        {/* Event categories */}
        <View style={styles.exploreButtonContainer}>
          {["1v1", "2v2", "Team", "Today", "Tomorrow", "Weekend"].map((filter) => (
            <TouchableOpacity key={filter} style={styles.button}>
              <Text style={styles.buttonText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event list */}
        {["Tennis", "Basketball", "Soccer"].map((category) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.title}>{category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
              {events.map((event, index) => (
                <View key={index} style={styles.eventItem}>
                  <Image source={GrayBG} style={styles.image} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// HostScreen: Placeholder for hosting events
function HostScreen({ navigation }: { navigation: ExploreScreenNavigationProp }) {
  return (
    <View style={styles.minimapContainer}>
      <View style={styles.MapChatContainer}>
        <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Join")}>
          <Text style={styles.unChoiceText}>Join</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.Choice}>
          <Text style={styles.ChoiceText}>Host</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Stylesheet
const styles = StyleSheet.create({
  minimapContainer: { flex: 1, backgroundColor: '#fff' },
  MapChatContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  Choice: { backgroundColor: '#000', padding: 8, borderRadius: 10, marginHorizontal: 4 },
  unChoice: { backgroundColor: '#F1F1F1', padding: 8, borderRadius: 10, marginHorizontal: 4 },
  ChoiceText: { color: '#fff', fontWeight: 'bold' },
  unChoiceText: { color: '#000', fontWeight: 'bold' },
  relSearchTopContainer: { paddingHorizontal: 35, paddingVertical: 20 },
  relSearchBar: { height: 45, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16 },
  exploreTitle: { paddingLeft: 35, fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  minimap: { width: '100%', height: 180, borderRadius: 10 },
  exploreButtonContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 16 },
  button: { backgroundColor: '#F1F1F1', padding: 6, borderRadius: 10, marginHorizontal: 8 },
  buttonText: { fontSize: 12, color: '#000', textAlign: 'center' },
  categoryContainer: { marginBottom: 20 },
  title: { paddingLeft: 35, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  scrollContainer: { paddingLeft: 35 },
  eventItem: { marginRight: 12, flexDirection: 'column' },
  image: { width: 220, height: 130, borderRadius: 10, marginBottom: 5 },
  eventContent: { alignItems: 'flex-start' },
  eventTitle: { fontSize: 14, fontWeight: 'bold' },
  eventDate: { color: '#555', fontSize: 12, marginTop: 5 },
  eventLocation: { color: '#777', fontSize: 12, marginTop: 2 },
});