import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { createGameRequest } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '@/constants/theme';
import { SPORTS_DROPDOWN } from '@/constants/sports';
import Header from '../common/Header';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { requestCurrentLocation, LocationCoordinates } from '@/utils/location';
import { validateEventCreation } from '@/utils/validation';
import { showError, showSuccess } from '@/utils/errorHandler';

export default function EventCreationPage() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [eventName, setEventName] = useState('');
  const [selectedSport, setSelectedSport] = useState('1');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [loading, setLoading] = useState(false);

  // Date and time picker states
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Location state
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleUseMyLocation = async () => {
    setLoadingLocation(true);
    try {
      const coords = await requestCurrentLocation();
      if (coords) {
        setLocation(coords);
        Alert.alert('Location Set', 'Your current location has been captured.');
      } else {
        Alert.alert(
          'Location Unavailable',
          'Could not get your location. Please ensure location services are enabled.'
        );
      }
    } catch (error: unknown) {
      showError(error, 'Location Error');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCreate = async () => {
    // Validate using the validation utility
    const validationError = validateEventCreation({
      eventName,
      locationText,
      location,
      maxPlayers,
      dateSelected,
      timeSelected,
    });

    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    // Check authentication using the context
    if (!session?.user?.id) {
      Alert.alert('Error', 'Please sign in to create an event');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const eventDateTime = new Date(date);
      eventDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

      // Use actual location if available, otherwise use a default with location text in description
      const eventLocation = location || { lat: 0, lng: 0 };

      await createGameRequest({
        creator_id: session.user.id,
        sport_id: parseInt(selectedSport, 10),
        location: eventLocation,
        requested_time: eventDateTime.toISOString(),
        description: `${eventName}\n\nLocation: ${locationText}\n\n${description}`,
        max_players: parseInt(maxPlayers, 10) || 4,
      });

      showSuccess('Event created successfully!');

      // Reset form
      setEventName('');
      setLocationText('');
      setDescription('');
      setMaxPlayers('4');
      setDate(new Date());
      setTime(new Date());
      setDateSelected(false);
      setTimeSelected(false);
      setLocation(null);
    } catch (error: unknown) {
      showError(error, 'Failed to Create Event');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      setDateSelected(true);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
      setTime(selectedTime);
      setTimeSelected(true);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (t: Date) => {
    return t.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create Event"
        rightActions={[
          { icon: 'help-circle-outline', onPress: () => setShowHelpModal(true) }
        ]}
      />

      {/* My Events Button */}
      <TouchableOpacity
        style={styles.myEventsButton}
        onPress={() => navigation.navigate('MyEvents')}
      >
        <Ionicons name="list" size={20} color={AppTheme.colors.primary} />
        <Text style={styles.myEventsText}>View My Events</Text>
        <Ionicons name="chevron-forward" size={20} color={AppTheme.colors.textSecondary} />
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <TextInput
          label="Event Name"
          value={eventName}
          onChangeText={setEventName}
          mode="outlined"
          style={styles.input}
        />

        <Text style={styles.label}>Sport</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={SPORTS_DROPDOWN}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select a sport"
          value={selectedSport}
          onChange={(item) => setSelectedSport(item.value)}
        />

        <TextInput
          label="Location (address or place name)"
          value={locationText}
          onChangeText={setLocationText}
          mode="outlined"
          style={styles.input}
          placeholder="e.g. Central Park Tennis Courts"
        />

        <TouchableOpacity
          style={[
            styles.locationButton,
            location && styles.locationButtonActive,
          ]}
          onPress={handleUseMyLocation}
          disabled={loadingLocation}
        >
          <Ionicons
            name={location ? 'location' : 'location-outline'}
            size={20}
            color={location ? AppTheme.colors.primary : AppTheme.colors.textSecondary}
          />
          <Text
            style={[
              styles.locationButtonText,
              location && styles.locationButtonTextActive,
            ]}
          >
            {loadingLocation
              ? 'Getting location...'
              : location
              ? 'Location captured'
              : 'Use my current location'}
          </Text>
          {location && (
            <Ionicons name="checkmark-circle" size={18} color={AppTheme.colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pickerButton, styles.halfInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerLabel}>Date</Text>
            <Text style={dateSelected ? styles.pickerValue : styles.pickerPlaceholder}>
              {dateSelected ? formatDate(date) : 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={AppTheme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, styles.halfInput]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerLabel}>Time</Text>
            <Text style={timeSelected ? styles.pickerValue : styles.pickerPlaceholder}>
              {timeSelected ? formatTime(time) : 'Select time'}
            </Text>
            <Ionicons name="time-outline" size={20} color={AppTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        <TextInput
          label="Max Players"
          value={maxPlayers}
          onChangeText={setMaxPlayers}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          placeholder="Any additional details..."
        />

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={loading}
          disabled={loading}
          style={styles.button}
          buttonColor={AppTheme.colors.primary}
        >
          Create Event
        </Button>
      </ScrollView>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Events Work</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={AppTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.helpSectionTitle}>Creating an Event</Text>
              <Text style={styles.helpText}>
                Create an event to invite others to play a sport with you. Fill in the details about what sport you want to play, where, and when.
              </Text>

              <Text style={styles.helpSectionTitle}>How Matchmaking Works</Text>
              <Text style={styles.helpText}>
                1. Create an event with your preferred sport, location, date, and time.{'\n\n'}
                2. Other players can browse and request to join your event.{'\n\n'}
                3. You'll receive notifications when someone wants to join. You can accept or decline requests.{'\n\n'}
                4. Once your event is full (reaches max players), it automatically closes.{'\n\n'}
                5. After the game, both players submit the result. If you agree, your skill ratings update automatically.
              </Text>

              <Text style={styles.helpSectionTitle}>Tips</Text>
              <Text style={styles.helpText}>
                {'\u2022'} Be specific about the location (court name, address){'\n'}
                {'\u2022'} Add details in the description (skill level, equipment needed){'\n'}
                {'\u2022'} Check "My Events" to manage requests and track your games
              </Text>
            </ScrollView>

            <Button
              mode="contained"
              onPress={() => setShowHelpModal(false)}
              style={styles.modalButton}
              buttonColor={AppTheme.colors.primary}
            >
              Got it!
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  myEventsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    gap: 8,
  },
  myEventsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: AppTheme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  locationButtonActive: {
    borderColor: AppTheme.colors.primary,
    borderStyle: 'solid',
    backgroundColor: `${AppTheme.colors.primary}08`,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
  },
  locationButtonTextActive: {
    color: AppTheme.colors.primary,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  dropdown: {
    height: 56,
    borderColor: AppTheme.colors.border,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: AppTheme.colors.textSecondary,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: AppTheme.colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerButton: {
    height: 56,
    borderColor: AppTheme.colors.border,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerLabel: {
    position: 'absolute',
    top: -8,
    left: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 4,
    fontSize: 12,
    color: AppTheme.colors.textSecondary,
  },
  pickerValue: {
    fontSize: 14,
    color: AppTheme.colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
    flex: 1,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  modalScroll: {
    marginBottom: 16,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: AppTheme.colors.text,
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 8,
  },
});
