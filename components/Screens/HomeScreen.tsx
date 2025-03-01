import { joinGameRequest, searchGameRequests } from '@/lib/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../App';
import ActiveGameJoinRequests from './ActiveGameJoinRequests';
import { Text as Quicksand } from '../text';

const GrayBG = { uri: 'https://digitalassets.daltile.com/content/dam/AmericanOlean/AO_ImageFiles/minimum/AO_MN44_12x24_Gray_Matte.jpg/jcr:content/renditions/cq5dam.web.570.570.jpeg' };

// Update the sport mapping code
const sportIdToName: Record<number, string> = {
  1: 'Tennis',
  2: 'Basketball',
  3: 'Soccer'
};

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [joining, setJoining] = useState<{ [key: number]: boolean }>({});
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await searchGameRequests({
        status: 'Open',
        sort_by: 'recency',
        sort_order: 'desc',
        location: {
          lat: 47.606209,
          lng: 122.332069
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
        <TouchableOpacity 
          style={styles.myEventsButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Quicksand style={styles.myEventsButtonText}>My Events</Quicksand>
        </TouchableOpacity>
        <TextInput 
          style={styles.searchBar} 
          placeholder="Search events..." 
          placeholderTextColor="#64748B" 
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Quicksand style={styles.modalTitle}>My Events</Quicksand>
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Quicksand style={styles.closeButtonText}>×</Quicksand>
              </TouchableOpacity>
            </View>
            <ActiveGameJoinRequests />
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.refreshButton]} 
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#2F622A" />
            ) : (
              <Quicksand style={styles.refreshButtonText}>↻</Quicksand>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : (
          <View style={styles.eventsContainer}>
            {events.map((event, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.eventCard}
                onPress={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
              >
                <View style={styles.eventHeader}>
                  <Quicksand style={styles.sportTag}>
                    {sportIdToName[event.sport_id] || 'Sport'}
                  </Quicksand>
                  <Quicksand style={styles.playerCount}>
                    {event.current_players}/{event.max_players} players
                  </Quicksand>
                </View>

                <Quicksand style={styles.eventTitle}>
                  {event.description || 'No description available'}
                </Quicksand>
                
                <Quicksand style={styles.eventDate}>
                  {event.requested_time ? formatDate(event.requested_time) : 'Time TBD'}
                </Quicksand>

                {expandedEvent === event.id && (
                  <View style={styles.expandedContent}>
                    <TouchableOpacity
                      style={[
                        styles.joinButton,
                        (joining[event.id] || event.current_players >= event.max_players) && 
                        styles.disabledButton
                      ]}
                      onPress={() => handleJoinEvent(event.id)}
                      disabled={joining[event.id] || event.current_players >= event.max_players}
                    >
                      <Quicksand style={styles.joinButtonText}>
                        {event.current_players >= event.max_players 
                          ? 'Full' 
                          : joining[event.id] 
                            ? 'Joining...' 
                            : 'Join Event'}
                      </Quicksand>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  myEventsButton: {
    backgroundColor: '#2F622A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  myEventsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: 'Quicksand',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButtonText: {
    color: '#2F622A',
    fontSize: 20,
  },
  loader: {
    marginTop: 40,
  },
  eventsContainer: {
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportTag: {
    backgroundColor: '#E8F5E9',
    color: '#2F622A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  playerCount: {
    color: '#666',
    fontSize: 14,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  joinButton: {
    backgroundColor: '#2F622A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F622A',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
});

export default HomeScreen;