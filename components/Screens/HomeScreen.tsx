import { joinGameRequest, searchGameRequests } from '@/lib/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Image, Animated, Easing } from 'react-native';
import { RootStackParamList } from '../../App';
import ActiveGameJoinRequests from './ActiveGameJoinRequests';
import { Text as Text } from '../text';
import commonStyles from '../styles';

const sportIdToName: Record<number, string> = {
  1: 'Tennis',
  2: 'Basketball',
  3: 'Soccer'
};

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
const [searchQuery, setSearchQuery] = useState('');

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
  fetchEvents();
};

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

const filteredEvents = events.filter(event =>
  event.description.toLowerCase().includes(searchQuery.toLowerCase())
);

const opacity = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(100)).current;

const fadeIn = () => {
  opacity.setValue(0);
  translateY.setValue(5000);
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start();

};

const fadeOut = () => {
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 5000,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start(() => {
    setIsModalVisible(false);
  });
};

const animatedOverlayStyle = {
  opacity: opacity,
};

const animatedContentStyle = {
  transform: [{ translateY: translateY }],
};

useEffect(() => {
  if (isModalVisible) {
    fadeIn();
  }
}, [isModalVisible]);

return (
<View style={styles.container}>
  <View style={styles.header}>
    <View style={styles.searchContainer}>
      <TextInput 
        style={styles.searchBar} 
        placeholder="Search events..." 
        placeholderTextColor="#64748B" 
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={handleRefresh}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#2F622A" />
        ) : (
          <Text style={styles.refreshButtonText}>⟳</Text>
        )}
      </TouchableOpacity>
    </View>
    <TouchableOpacity 
      style={styles.myEventsButton}
      onPress={() => setIsModalVisible(true)}
    >
      <Text style={styles.myEventsButtonText}>My Events</Text>
    </TouchableOpacity>
  </View>
  <Modal
    animationType="none"
    transparent={true}
    visible={isModalVisible}
    onRequestClose={fadeOut}
  >
    <Animated.View style={[styles.modalOverlay, animatedOverlayStyle]}>
      <Animated.View style={[styles.modalContent, animatedContentStyle]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>My Events</Text>
          <TouchableOpacity onPress={fadeOut}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        <ActiveGameJoinRequests />
      </Animated.View>
    </Animated.View>
  </Modal>

    <ScrollView contentContainerStyle={styles.scrollContent}>
      {loading ? (
        <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
      ) : (
        <View style={styles.eventsContainer}>
          {filteredEvents.map((event, index) => (
            <View key={index}>
              <TouchableOpacity 
                style={styles.eventCard}
                onPress={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                activeOpacity={1}
              >
                <View style={styles.eventContent}>
                  <View style={styles.leftContainer}>
                    <Text style={styles.eventTitle}>
                      {event.description || 'No description provided'}
                    </Text>
                    <Text style={styles.eventDate}>
                      {event.requested_time ? formatDate(event.requested_time) : 'Time TBD'}
                    </Text>
                    <Text style={styles.hostName}>Player</Text>
                  </View>
                  
                  <View style={styles.rightContainer}>
                    <Image
                      style={styles.profilePicture}
                      source={require("../../assets/images/default-avatar.jpg")}
                    />
                  </View>
                </View>

                <View style={styles.eventHeader}>
                  <Text style={styles.sportTag}>
                    {sportIdToName[event.sport_id] || 'Sport'}
                  </Text>
                  <Text style={styles.playerCount}>
                    {event.current_players}/{event.max_players}
                  </Text>
                </View>

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
                      <Text style={styles.joinButtonText}>
                        {event.current_players >= event.max_players 
                          ? 'Full' 
                          : joining[event.id] 
                            ? 'Joining...' 
                            : 'Join Event'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
              {index < filteredEvents.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
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
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 8,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  myEventsButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    // paddingVertical: 16,
    height: 50,
    borderRadius: 999,
    position: 'absolute',
    justifyContent: 'center',
    bottom: '-1400%',
    zIndex: 1,
    alignSelf: 'center',
    borderColor: '#2F622A',
    borderWidth: 2,
  },
  myEventsButtonText: {
    color: '#274b0d',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '000',
    zIndex: 1,
  },
  searchBar: {
    height: 50,
    flex: 1,
    borderRadius: 999,
    borderColor: '#E5E5E5',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // marginBottom: 16,
    fontSize: 14,
    letterSpacing: -0.4,
    fontFamily: 'Montserrat',
    fontWeight: '500',
    color: '#000',
    backgroundColor: '#fff',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingLeft: 4,
    paddingTop: 4,
    marginLeft: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(39, 75, 13, 0.28)',
    borderWidth: 2,
  },
  refreshButtonText: {
    color: 'fff',
    fontSize: 32,
  },
  loader: {
    marginTop: 40,
  },
  eventsContainer: {
    marginTop: 58,
    // paddingHorizontal: 28,
  },
  eventCard: {
    backgroundColor: '#fff',
    // borderRadius: 28,
    padding: 28,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sportTag: {
    backgroundColor: 'rgba(39, 75, 13, 0.04)',
    color: 'rgba(39, 75, 13, 1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '600',
  },
  playerCount: {
    color: 'rgba(0, 0, 0, 0.64)',
    fontSize: 14,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  eventDate: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.48)',
    fontWeight: '600',
    marginBottom: 4,
  },
  expandedContent: {
    paddingTop: 36,
    borderTopColor: '#E5E5E5',
  },
  joinButton: {
    backgroundColor: '#2F622A',
    padding: 12,
    borderRadius: 28,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    height: '86%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(39, 75, 13, 1)',
  },
  closeButtonText: {
    fontSize: 40,
    color: '#666',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  hostName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.48)',
    marginBottom: 24,
  },
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftContainer: {
    flex: 1,
  },
  rightContainer: {
    alignSelf: 'flex-start',
  },
  separator: {
    height: 2,
    backgroundColor: '#E5E5E5',
    width: '100%',
  },
});

export default HomeScreen;