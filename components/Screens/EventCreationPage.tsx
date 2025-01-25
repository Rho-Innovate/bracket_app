import { createStackNavigator } from '@react-navigation/stack';
import { createClient } from '@supabase/supabase-js';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

const SUPABASE_URL = 'https://utreebqeudeznsggsbry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmVlYnFldWRlem5zZ2dzYnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDMzMTksImV4cCI6MjA0NjI3OTMxOX0.UkAIxSqYHt4hq-oG5WMujeUKloCx02jhR--O42GH_q0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const handleSubmit = async () => {
    try {
      // Insert into the 'events' table with all necessary fields
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            name: eventName,
            date: eventDate, // Ensure format is 'YYYY-MM-DD'
            location: eventLocation,
            description: eventDescription,
            category: 'General', // Example category (update as needed)
            organizer_id: '12345', // Example organizer_id (update dynamically)
          },
        ]);
  
      if (error) {
        throw error; // If an error occurs, throw it
      }
  
      Alert.alert('Success', 'Event created successfully!');
      setEventName('');
      setEventDate('');
      setEventLocation('');
      setEventDescription('');
    } catch (error: any) {
      Alert.alert('Error', error.message); // Display error message
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
