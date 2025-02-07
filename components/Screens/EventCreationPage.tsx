import { createStackNavigator } from '@react-navigation/stack';
import { createClient } from '@supabase/supabase-js';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { createGameRequest } from '@/lib/supabase';


type ExploreStackParamList = {
  Join: undefined;
  Host: undefined;
};

const ExploreStack = createStackNavigator<ExploreStackParamList>();

export default function EventCreationPage() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ExploreStack.Screen name="Host" component={HostPage} />
    </ExploreStack.Navigator>
  );
}

function HostPage() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventMaxPlayers, setEventMaxPlayers] = useState('');

  const handleSubmit = async () => {
    try {
      // Fetch the authenticated user's data
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !sessionData?.session) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
      }
  
      const user = sessionData.session.user;
      
      const handleCreateGameRequest = async () => {
        try {
            const gameData = {
            creator_id: user.id,
            sport_id: 1,
            location: {lat: 47.606209, lng: 122.332069},
            requested_time: eventDate,
            description: eventDescription,
            max_players: parseInt(eventMaxPlayers, 10),
            }
          const data = await createGameRequest(gameData)
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      };

      handleCreateGameRequest();
  
      Alert.alert('Success', 'Event created successfully!');
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
      setEventMaxPlayers('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Event</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Name</Text>
        <TextInput
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
          placeholder="Enter event name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Date</Text>
        <TextInput
          style={styles.input}
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Location</Text>
        <TextInput
          style={styles.input}
          value={eventLocation}
          onChangeText={setEventLocation}
          placeholder="Enter event location"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={eventDescription}
          onChangeText={setEventDescription}
          placeholder="Enter event description"
          multiline
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Players</Text>
        <TextInput
          style={styles.input}
          value={eventMaxPlayers}
          onChangeText={setEventMaxPlayers}
          placeholder="Enter Max Players"
          keyboardType="numeric"
        />
      </View>

      <Button title="Create Event" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
