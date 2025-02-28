import { joinGameRequest, searchGameRequests } from '@/lib/supabase';
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

function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null); // Track expanded event
  const [joining, setJoining] = useState<{ [key: number]: boolean }>({}); // Track joining state

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await searchGameRequests({
        status: 'Open',
        sort_by: 'recency',
        sort_order: 'desc',
        location: {
          lat: 0,
          lng: 0
        },
        radius: 0
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    fetchEvents();   // Fetch with refresh flag
  };

  // Function to handle joining an event
  const handleJoinEvent = async (eventId: number) => {
    try {
      setJoining((prev) => ({ ...prev, [eventId]: true }));

      const updatedEvent = await joinGameRequest(eventId);
      setEvents((prevEvents) =>
        prevEvents.map((event) => (event.id === eventId ? updatedEvent : event))
      );
    } catch (error) {
      console.error('Error joining event:', error);
    } finally {
      setJoining((prev) => ({ ...prev, [eventId]: false }));
    }
  };

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
          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]} 
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#2F622A" />
            ) : (
              <Text style={[styles.buttonText, styles.refreshButtonText]}>↻</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          ['Tennis', 'Basketball', 'Soccer'].map((category) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.title}>{category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                {events
                  .filter((event) => event.sport_id === getSportId(category))
                  .map((event, index) => (
                    <View key={index} style={styles.eventItem}>
                      <TouchableOpacity onPress={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}>
                        <Image source={GrayBG} style={styles.image} />
                      </TouchableOpacity>
                      <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{event.description || 'No description available'}</Text>
                        <Text style={styles.eventDate}>{event.requested_time ? formatDate(event.requested_time) : 'Time TBD'}</Text>
                        <Text style={styles.eventLocation}>{`Players: ${event.current_players || 0}/${event.max_players || '∞'}`}</Text>

                        {expandedEvent === event.id && (
                          <View style={styles.dropdown}>
                            <Text style={styles.detailsText}>More details about this event...</Text>
                            <TouchableOpacity
                              style={styles.joinButton}
                              onPress={() => handleJoinEvent(event.id)}
                              disabled={joining[event.id] || event.current_players >= event.max_players}
                            >
                              <Text style={styles.joinButtonText}>
                                {event.current_players >= event.max_players ? 'Full' : joining[event.id] ? 'Joining...' : 'Join Event'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
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
  refreshButton: {
    width: 32,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#2F622A',
    fontSize: 16,
  },
  dropdown: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
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
  eventLocation: {
    fontSize: 12,
    color: '#666',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default HomeScreen;
