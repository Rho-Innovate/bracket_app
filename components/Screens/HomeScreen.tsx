import { Text, View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import React from 'react';

const GrayBG = { uri: 'https://digitalassets.daltile.com/content/dam/AmericanOlean/AO_ImageFiles/minimum/AO_MN44_12x24_Gray_Matte.jpg/jcr:content/renditions/cq5dam.web.570.570.jpeg' };

export default function HomeScreen() {
  const events = [
    { title: "Event 1", date: "FRI, SEP 6 • 9:00 AM", location: "Orange County Great Park" },
    { title: "Event 2", date: "SAT, SEP 7 • 10:00 AM", location: "Location 2" },
    { title: "Event 3", date: "SUN, SEP 8 • 11:00 AM", location: "Location 3" },
    { title: "Event 4", date: "MON, SEP 9 • 12:00 PM", location: "Location 4" },
    { title: "Event 5", date: "TUE, SEP 10 • 1:00 PM", location: "Location 5" }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput style={styles.searchBar} placeholder="Search home..." placeholderTextColor="#64748B" />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.buttonContainer}>
          {['Events', 'Matchups', 'Going', 'Saved'].map((label) => (
            <TouchableOpacity key={label} style={styles.button} onPress={() => console.log(`${label} pressed`)}>
              <Text style={styles.buttonText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {['Tennis', 'Basketball', 'Soccer'].map((category) => (
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    // alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
  },
  searchBar: {
    height: 45,
    width: 355,
    borderColor: '#f1f1f1',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: 35,
  },
  buttonContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-around',
    marginTop: 40,
    marginBottom: 16,
    marginLeft: 35,
  },
  button: {
    backgroundColor: '#F1F1F1',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    marginRight: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryContainer: {
    height: 250,
    marginBottom: 20,
    borderRadius: 8,
  },
  title: {
    paddingLeft: 35,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  scrollContainer: {
    paddingLeft: 35,
    paddingRight: 10,
    flexGrow: 1,
  },
  eventItem: {
    marginRight: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  image: {
    width: 220,
    height: 130,
    borderRadius: 10,
    marginBottom: 5,
  },
  eventContent: {
    alignItems: 'flex-start',
  },
  eventTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#555',
    fontSize: 12,
    marginTop: 5,
  },
  eventLocation: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
});