import { searchGameRequests } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
                        <Text style={styles.eventTitle}>{event.description}</Text>
                        <Text style={styles.eventDate}>{formatDate(event.requested_time)}</Text>
                        <Text style={styles.eventLocation}>{`Players: ${event.current_players}/${event.max_players}`}</Text>
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
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