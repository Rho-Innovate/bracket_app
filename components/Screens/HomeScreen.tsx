import { createJoinRequest, searchGameRequests, joinGameRequest } from '@/lib/supabase';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Image, Animated, Easing, Dimensions } from 'react-native';
import { RootStackParamList } from '../../App';
import ActiveGameJoinRequests from './ActiveGameJoinRequests';
import { Text as Text } from '../text';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
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
const [session, setSession] = useState<Session | null>(null);
const [searchBarFocused, setSearchBarFocused] = useState(false);


useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Current session:', session?.user?.id);
    setSession(session);
  });
}, []);

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
  if (!session?.user?.id) {
    console.error('No user session found');
    return;
  }

  try {
    console.log('Starting join event for eventId:', eventId);
    setJoining((prev) => ({ ...prev, [eventId]: true }));

    // First create the join request
    console.log('Calling createJoinRequest...');
    const joinResult = await createJoinRequest(eventId, session.user.id);
    console.log('Response from createJoinRequest:', joinResult);

    // Then update the player count - HELLA BOOF NEED SOME OTHER ROUTE TO UPDATE PLAYER SCORE INSTEAD OF THIS WACK SHIT
    console.log('Calling joinGameRequest...');
    const gameResult = await joinGameRequest(eventId);
    console.log('Response from joinGameRequest:', gameResult);

    // Update the UI to show both changes
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        if (event.id === eventId) {
          return {
            ...event,
            has_requested: true,
            current_players: gameResult.current_players // Update player count
          };
        }
        return event;
      })
    );

    alert('Success - Your request to join has been submitted');
  } catch (error) {
    console.error('Error joining event:', error);
    alert('Error - Failed to join event');
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

  const placeholderText = searchBarFocused ? "Search events..." : "⌕";
  const placeholderTextColor = searchBarFocused ? "rgba(100, 116, 139, .48)" : "#000";
  const searchBarFontSize = searchBarFocused ? 14 : 32;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.headerText, { flex: 1 }]}>Home</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchBar,
              searchBarFocused ? { flex: 1 } : {},
              { fontSize: searchBarFontSize }
            ]}
            placeholder={placeholderText}
            placeholderTextColor={placeholderTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            onFocus={() => setSearchBarFocused(true)}
            onBlur={() => setSearchBarFocused(false)}
          />
           <TouchableOpacity
            style={styles.myEventsButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.myEventsButtonText}>Me</Text>
          </TouchableOpacity>
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
      </View>
      <View style={styles.headerSeparator} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#2F622A" style={styles.loader} />
        ) : (
          <View style={styles.eventsContainer}>
            {filteredEvents.map((event, index) => (
              <View key={index}>
                <TouchableOpacity
                  style={styles.eventCard}
                  onPress={() => {
                    console.log('Event card pressed:', event.id);
                    setExpandedEvent(expandedEvent === event.id ? null : event.id);
                  }}
                  activeOpacity={0.7}
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
                </TouchableOpacity>

                {expandedEvent === event.id && (
                  <View style={styles.expandedContent}>
                    <TouchableOpacity
                      style={[
                        styles.joinButton,
                        (joining[event.id] || event.current_players >= event.max_players) && 
                        styles.disabledButton
                      ]}
                      onPress={() => {
                        console.log('Join button pressed for event:', event.id);
                        console.log('Event details:', {
                          eventId: event.id,
                          isJoining: joining[event.id],
                          currentPlayers: event.current_players,
                          maxPlayers: event.max_players,
                          isDisabled: joining[event.id] || event.current_players >= event.max_players
                        });
                        handleJoinEvent(event.id);
                      }}
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
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      

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
            <View style={styles.modalHeaderSeparator} />
            <ActiveGameJoinRequests />
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 22.25,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '000',
  },
  headerSeparator: {
    borderBottomWidth: 4,
    borderBottomColor: 'rgb(229, 229, 229)',
    // marginBottom: 32,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 120,
    backgroundColor: 'transparent',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  myEventsButton: {
    backgroundColor: '#rgba(39, 75, 13, 0.08)',
    height: 50,
    width: 50,
    borderRadius: 25,
    // paddingLeft: 4,
    // paddingTop: 4,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // borderColor: 'rgba(39, 75, 13, 0.28)',
    // borderWidth: 2,
  },
  myEventsButtonText: {
    color: '#000',
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
    width: 50,
    borderRadius: 999,
    // borderColor: '#ccc',
    // borderWidth: 2,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    letterSpacing: -0.4,
    fontFamily: 'Montserrat',
    fontWeight: '500',
    color: '#000',
    backgroundColor: '#rgba(1, 1, 1, .08)',
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
    marginLeft: 8,
    backgroundColor: '#rgba(1, 61, 90, .08)',
    justifyContent: 'center',
    alignItems: 'center',
    // borderColor: 'rgba(39, 75, 13, 0.28)',
    // borderWidth: 2,
  },
  refreshButtonText: {
    color: 'fff',
    fontSize: 32,
  },
  loader: {
    marginTop: 40,
  },
  eventsContainer: {
    // marginTop: 36,
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 28,
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
    paddingTop: 12,
  },
  modalHeader: {
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  modalHeaderSeparator: {
    borderBottomWidth: 4,
    borderBottomColor: 'rgb(229, 229, 229)',
    marginBottom: 32,
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
  bottomContainer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  }
});

export default HomeScreen;