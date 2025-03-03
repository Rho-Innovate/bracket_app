import { createStackNavigator } from '@react-navigation/stack';
import { createClient } from '@supabase/supabase-js';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View, Keyboard, TouchableWithoutFeedback, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { createGameRequest } from '@/lib/supabase';
import { Text as CustomText } from '../text';

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
    // 
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <CustomText style={styles.header}>Create Event</CustomText>
        <View style={styles.separator}/>
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Event Name</CustomText >
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            placeholder="Enter name"
            placeholderTextColor="rgba(100, 116, 139, .48)"
          />
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Date</CustomText >
          <TextInput
            style={styles.input}
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(100, 116, 139, .48)"
          />
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Location</CustomText >
          <TextInput
            style={styles.input}
            value={eventLocation}
            onChangeText={setEventLocation}
            placeholder="Enter location"
            placeholderTextColor="rgba(100, 116, 139, .48)"
          />
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Description</CustomText >
          <TextInput
            style={[styles.input, styles.textArea]}
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder="Enter description"
            placeholderTextColor="rgba(100, 116, 139, .48)"
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <CustomText style={styles.label}>Max Players</CustomText >
          <TextInput
            style={styles.input}
            value={eventMaxPlayers}
            onChangeText={setEventMaxPlayers}
            placeholder="Enter max players"
            keyboardType="numeric"
            placeholderTextColor="rgba(100, 116, 139, .48)"
          />
        </View>
        </ScrollView>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
        >
          <CustomText style={styles.buttonText}>Host</CustomText>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 28,
    fontSize: 24,
    fontWeight: '700',
    color: '000',
    marginTop: 36,
    marginBottom: 16,
    fontFamily: 'Montserrat',
  },
  formGroup: {
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Montserrat',
    letterSpacing: -0.4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#274b0d',
    // paddingHorizontal: 20,
    // paddingVertical: 16,
    height: 50,
    width: '87%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    alignSelf: 'center',
    marginTop: 28,
    position: 'absolute',
    bottom: '2.7%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    borderBottomWidth: 4,
    borderBottomColor: 'rgb(229, 229, 229)',
    color: 'transparent',
    // marginBottom: 32,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 20,
  },
});