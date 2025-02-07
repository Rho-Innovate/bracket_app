import { searchGameRequests } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const GrayBG = { uri: 'https://digitalassets.daltile.com/content/dam/AmericanOlean/AO_ImageFiles/minimum/AO_MN44_12x24_Gray_Matte.jpg/jcr:content/renditions/cq5dam.web.570.570.jpeg' };

// Helper function to map sport names to IDs
function getSportId(sport: string) {
  const sportMap: Record<string, number> = { Tennis: 1, Basketball: 2, Soccer: 3 };
  return sportMap[sport] || 0;
}

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  searchBar: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
  },
  categoryContainer: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  eventItem: {
    width: 200,
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  eventContent: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
  },
  eventLocation: {
    fontSize: 14,
    color: '#888',
  },
});

export default function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await searchGameRequests({
          status: 'Open',
          sort_by: 'recency',
          sort_order: 'desc',
        });

        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          // Display categories (Tennis, Basketball, Soccer) from game_requests
          ['Tennis', 'Basketball', 'Soccer'].map((category) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.title}>{category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                {events
                  .filter((event) => event.sport_id === getSportId(category))
                  .map((event, index) => (
                    <View key={index} style={styles.eventItem}>
                      <Image source={GrayBG} style={styles.image} />
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.description || 'No description available'}</Text>
                        <Text style={styles.eventDate}>{event.requested_time ? formatDate(event.requested_time) : 'Time TBD'}</Text>
                        <Text style={styles.eventLocation}>{`Players: ${event.current_players || 0}/${event.max_players || '∞'}`}</Text>
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}