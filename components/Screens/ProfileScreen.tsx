import { createStackNavigator, StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchOwnProfile, signOut, supabase, updateProfile, uploadAvatar } from '../../lib/supabase'; // <-- import from your supabase code

type ProfileStackParamList = {
  Profile: undefined;
  Onboarding: undefined;
  OnboardingScreen2: { selectedSports: string[] };
  OnboardingScreen3: { 
    selectedSports: string[];
    skillLevels: Record<string, string>;
  };
  OnboardingScreen4: {
    selectedSports: string[];
    skillLevels: Record<string, string>;
    availability: string[];
  };
  ResultsScreen: {
    selectedSports: string[];
    skillLevels: Record<string, string>;
    availability: string[];
    locations: string[];
  };
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Add this interface near the top of the file
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  description?: string;
  sports_preferences?: {
    sport: string;
    skill_level: string;
    years_experience: number;
    preferred_position?: string;
  }[];
  availability?: string[];
  preferred_locations?: string[];
}

// -------------------------------------------------
// Main exported Navigator component
// -------------------------------------------------
export default function ({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={Profile} />
      <ProfileStack.Screen name="Onboarding" component={Onboarding} />
      <ProfileStack.Screen name="OnboardingScreen2" component={OnboardingScreen2} />
      <ProfileStack.Screen name="OnboardingScreen3" component={OnboardingScreen3} />
      <ProfileStack.Screen name="OnboardingScreen4" component={OnboardingScreen4} />
      <ProfileStack.Screen name="ResultsScreen" component={ResultsScreen} />
    </ProfileStack.Navigator>
  );
}

// -------------------------------------------------
// Simplified Profile Screen (fetches from database)
// -------------------------------------------------
function Profile({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    // 1) Grab current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session || null);
    });
  }, []);

  useEffect(() => {
    // 2) Once we have session, fetch the user's profile
    if (!session?.user?.id) return;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchOwnProfile(session.user.id);
        setProfile(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  useEffect(() => {
    if (profile?.description) {
      setDescription(profile.description);
    }
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut(); // from supabase lib
      // Optionally navigate somewhere after sign-out:
      // navigation.navigate('SomeOtherScreen');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleSaveDescription = async () => {
    try {
      if (!session?.user?.id) return;
      
      setLoading(true); // Add loading state while saving
      
      // Update the profile
      await updateProfile(session.user.id, {
        description: description.trim() // Trim whitespace
      });
      
      // Fetch the updated profile data
      const updatedData = await fetchOwnProfile(session.user.id);
      setProfile(updatedData);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Save error:', error); // Log the actual error
      Alert.alert('Error', 'Failed to save description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64 && session?.user?.id) {
        setLoading(true);
        try {
          // Upload the image and get URL
          const newAvatarUrl = await uploadAvatar(session.user.id, result.assets[0].base64);
          console.log('New avatar URL:', newAvatarUrl); // Debug log
          
          // Update local state immediately with new URL
          setProfile((prev: Profile | null) => prev ? {
            ...prev,
            avatar_url: newAvatarUrl
          } : null);
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No profile data found.</Text>
      </View>
    );
  }

  const renderDescription = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About Me</Text>
      {isEditing ? (
        <View>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Write something about yourself..."
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => {
                setDescription(profile?.description || '');
                setIsEditing(false);
              }}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleSaveDescription}
            >
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.description}>
          {profile.description || 'No description provided'}
        </Text>
      )}
    </View>
  );

  const renderSportsPreferences = () => {
    if (!profile?.sports_preferences?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Sports</Text>
        {profile.sports_preferences.map((pref, index) => (
          <View key={index} style={styles.sportPreferenceCard}>
            <View style={styles.sportHeader}>
              <Text style={styles.sportNameLarge}>{pref.sport}</Text>
              <View style={[
                styles.skillLevelBadge,
                pref.skill_level === 'Beginner' && styles.beginnerBadge,
                pref.skill_level === 'Intermediate' && styles.intermediateBadge,
                pref.skill_level === 'Advanced' && styles.advancedBadge,
              ]}>
                <Text style={styles.skillLevelText}>{pref.skill_level}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header - Avatar & Name */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarPress}>
          <Image
            source={
              profile.avatar_url
                ? { uri: profile.avatar_url }
                : { uri: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }
            }
            style={[
              styles.avatar,
              loading && { opacity: 0.7 }
            ]}
            defaultSource={{ uri: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
            onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#0C5B00" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name}
          </Text>
          {/* You can display more fields here as needed */}
        </View>
      </View>

      {renderDescription()}
      {renderSportsPreferences()}

      {/* Buttons (Edit Profile, Onboarding, Sign Out) */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.setupButtonText}>Run Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// -------------------------------------------------
// Onboarding & Results (unchanged, or minimal edits)
// -------------------------------------------------
function Onboarding({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const sports = [
    'Basketball', 'Soccer', 'Tennis', 'Volleyball', 
    'Baseball', 'Swimming', 'Running', 'Golf'
  ];

  return (
    <View style={styles.onboardingContainer}>
      <Text style={styles.onboardingTitle}>What sports do you play?</Text>
      <Text style={styles.onboardingSubtitle}>Select all that apply</Text>
      
      <ScrollView style={styles.optionsContainer}>
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportOption,
              selectedSports.includes(sport) && styles.sportOptionSelected
            ]}
            onPress={() => {
              setSelectedSports(prev => 
                prev.includes(sport)
                  ? prev.filter(s => s !== sport)
                  : [...prev, sport]
              );
            }}
          >
            <Text style={[
              styles.sportOptionText,
              selectedSports.includes(sport) && styles.sportOptionTextSelected
            ]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.nextButton,
          selectedSports.length === 0 && styles.nextButtonDisabled
        ]}
        disabled={selectedSports.length === 0}
        onPress={() => navigation.navigate('OnboardingScreen2', { selectedSports })}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

function OnboardingScreen2({ 
  navigation,
  route
}: StackScreenProps<ProfileStackParamList, 'OnboardingScreen2'>) {
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) return;

      // Create sports preferences array
      const sports_preferences = route.params.selectedSports.map(sport => ({
        sport,
        skill_level: skillLevels[sport],
        years_experience: 0
      }));

      // Update profile with new sports preferences
      await updateProfile(user.id, {
        sports_preferences: sports_preferences
      });

      // Refresh profile data and navigate back
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.onboardingContainer}>
      <Text style={styles.onboardingTitle}>What's your skill level?</Text>
      <Text style={styles.onboardingSubtitle}>Select for each sport</Text>

      <ScrollView style={styles.optionsContainer}>
        {route.params.selectedSports.map((sport) => (
          <View key={sport} style={styles.sportSkillContainer}>
            <Text style={styles.sportTitle}>{sport}</Text>
            <View style={styles.levelOptions}>
              {levels.map((level) => (
                <TouchableOpacity
                  key={`${sport}-${level}`}
                  style={[
                    styles.levelOption,
                    skillLevels[sport] === level && styles.levelOptionSelected
                  ]}
                  onPress={() => setSkillLevels(prev => ({
                    ...prev,
                    [sport]: level
                  }))}
                >
                  <Text style={[
                    styles.levelOptionText,
                    skillLevels[sport] === level && styles.levelOptionTextSelected
                  ]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.nextButton,
          (Object.keys(skillLevels).length !== route.params.selectedSports.length || loading) && styles.nextButtonDisabled
        ]}
        disabled={Object.keys(skillLevels).length !== route.params.selectedSports.length || loading}
        onPress={handleComplete}
      >
        <Text style={styles.nextButtonText}>
          {loading ? 'Saving...' : 'Complete'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function OnboardingScreen3({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  // ... same as before
  return <View />;
}

function OnboardingScreen4({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  // ... same as before
  return <View />;
}

function ResultsScreen({ navigation }: { navigation: any }) {
  // ... same as before
  return <View />;
}

// -------------------------------------------------
// Styles
// -------------------------------------------------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  buttonsContainer: {
    marginTop: 16,
  },
  editProfileButton: {
    backgroundColor: '#f3f3f3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  setupButton: {
    backgroundColor: '#0C5B00',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f3f3f3',
  },
  saveButton: {
    backgroundColor: '#0C5B00',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
    
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 60,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  sportOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportOptionSelected: {
    borderColor: '#0C5B00',
    backgroundColor: '#E8F5E9',
  },
  sportOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sportOptionTextSelected: {
    color: '#0C5B00',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#0C5B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sportSkillContainer: {
    marginBottom: 24,
  },
  sportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  levelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelOptionSelected: {
    borderColor: '#0C5B00',
    backgroundColor: '#E8F5E9',
  },
  levelOptionText: {
    fontSize: 14,
    color: '#333',
  },
  levelOptionTextSelected: {
    color: '#0C5B00',
    fontWeight: '600',
  },
  sportPreferenceCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportNameLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  skillLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },
  beginnerBadge: {
    backgroundColor: '#FFE0B2',
  },
  intermediateBadge: {
    backgroundColor: '#C8E6C9',
  },
  advancedBadge: {
    backgroundColor: '#BBDEFB',
  },
  skillLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
