import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, Button, FlatList } from 'react-native';

const avatarPic = { uri: 'https://cf-st.sc-cdn.net/3d/render/765808989-101026212098_3-s5-v1.webp?ua=2'};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

type ProfileStackParamList = {
    Profile: undefined;
    Onboarding: undefined;
    OnboardingScreen2: undefined;
    OnboardingScreen3: undefined;
    OnboardingScreen4: undefined;
  };  

const ProfileStack = createStackNavigator();

export default function ({ navigation }: { navigation: ProfileScreenNavigationProp }) {
    return (
      <ProfileStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <ProfileStack.Screen name="Profile" component={Profile} />
        <ProfileStack.Screen name="Onboarding" component={Onboarding} />
        <ProfileStack.Screen name="OnboardingScreen2" component={OnboardingScreen2} />
        <ProfileStack.Screen name="OnboardingScreen3" component={OnboardingScreen3} />
        <ProfileStack.Screen name="OnboardingScreen4" component={OnboardingScreen4} />
      </ProfileStack.Navigator>
    );
  }
  

function Profile({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
            <Image
            source={avatarPic} // Replace this with your avatar image
            style={styles.avatar}
            resizeMode="cover"
            />
            <View style={styles.infoContainer}>
            <Text style={styles.name}>Josh Shih</Text>
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                <Text style={styles.statNumber}>345</Text>
                <Text style={styles.statLabel}>Groups</Text>
                </View>
                <View style={styles.stat}>
                <Text style={styles.statNumber}>13</Text>
                <Text style={styles.statLabel}>Interests</Text>
                </View>
                <View style={styles.stat}>
                <Text style={styles.statNumber}>256</Text>
                <Text style={styles.statLabel}>RSVPs</Text>
                </View>
            </View>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.editButton}>
                <Text style={styles.buttonText}>Edit profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.buttonText}>Share profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.setupButton}
                    onPress={() => navigation.navigate('Onboarding')}>
                    <Text style={styles.setUpText}>Set up your account!</Text>
                 </TouchableOpacity>
            </View>
            </View>
        </View>

        {/* Soccer Rank Section */}
        <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Soccer</Text>
            <Text style={styles.rankLabel}>Rank</Text>
            </View>
            <View style={styles.progressContainer}>
            <Text style={styles.rankStart}>XX</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '30%' }]} />
            </View>
            <Text style={styles.rankEnd}>XXI</Text>
            </View>
            <Text style={styles.progressText}>9124/30000</Text>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.progressContainer}>
            <Text style={styles.experienceLabel}>⭐</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '67%' }]} />
            </View>
            <Text style={styles.experiencePoints}>6734/10000</Text>
            </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
            <Text style={styles.achievementsLabel}>Achievements</Text>
            <Text style={styles.achievementsPoints}>758/900</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <TextInput
            style={styles.descriptionInput}
            placeholder="Enter your description here"
            multiline
            />
        </View>
        </View>
    </ScrollView>
  );
}

function Onboarding({ navigation }: { navigation: ProfileScreenNavigationProp }) {
    const sportsOptions = [
        { id: '1', label: 'Basketball' },
        { id: '2', label: 'Soccer' },
        { id: '3', label: 'Tennis' },
        { id: '4', label: 'Football' },
        { id: '5', label: 'Badminton' },
        { id: '6', label: 'Cricket' },
      ];    
    
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const toggleOption = (id: string) => {
        if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
        } else {
        setSelectedOptions([...selectedOptions, id]);
        }
    };

    const renderItem = ({ item }: { item: { id: string; label: string } }) => (
        <TouchableOpacity
        style={[
            styles.optionContainer,
            selectedOptions.includes(item.id) && styles.selectedOption,
        ]}
        onPress={() => toggleOption(item.id)}
        >
        <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        <View style={styles.obProgressBar}>
            <View style={[styles.progressStep, styles.completedStep]} />
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
        </View>
        <Text style={styles.sectionTitle}>Choose sports you’d like to join!</Text>
        <Text style={styles.subtitle}>We recommend selecting 3.</Text>
        <FlatList
            data={sportsOptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.optionsList}
        />
        <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('OnboardingScreen2')}
        >
            <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        </View>
    );
}  

function OnboardingScreen2({ navigation }: { navigation: ProfileScreenNavigationProp }) {
    const sportsOptions = [
        { id: '1', label: 'Beginner' },
        { id: '2', label: 'Intermediate' },
        { id: '3', label: 'Seasoned' },
        { id: '4', label: 'Professional' },
        { id: '5', label: 'I\'m not sure' },
      ];    
    
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const toggleOption = (id: string) => {
        if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
        } else {
        setSelectedOptions([...selectedOptions, id]);
        }
    };

    const renderItem = ({ item }: { item: { id: string; label: string } }) => (
        <TouchableOpacity
        style={[
            styles.optionContainer,
            selectedOptions.includes(item.id) && styles.selectedOption,
        ]}
        onPress={() => toggleOption(item.id)}
        >
        <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        <View style={styles.obProgressBar}>
            <View style={styles.progressStep} />
            <View style={[styles.progressStep, styles.completedStep]} />
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
        </View>
        <Text style={styles.sectionTitle}>What's your tennis skill level?</Text>
        <Text style={styles.subtitle}>Please answer truthfully!</Text>
        <FlatList
            data={sportsOptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.optionsList}
        />
        <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('OnboardingScreen3')}
        >
            <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        </View>
    );  
}

function OnboardingScreen3({ navigation }: { navigation: ProfileScreenNavigationProp }) {
    const sportsOptions = [
        { id: '1', label: 'University District' },
        { id: '2', label: 'Bellevue' },
        { id: '3', label: 'Issaquah' },
        { id: '4', label: 'Capitol Hill' },
        { id: '5', label: 'My residence isn\'t listed' },
      ];    
    
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const toggleOption = (id: string) => {
        if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
        } else {
        setSelectedOptions([...selectedOptions, id]);
        }
    };

    const renderItem = ({ item }: { item: { id: string; label: string } }) => (
        <TouchableOpacity
        style={[
            styles.optionContainer,
            selectedOptions.includes(item.id) && styles.selectedOption,
        ]}
        onPress={() => toggleOption(item.id)}
        >
        <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        <View style={styles.obProgressBar}>
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
            <View style={[styles.progressStep, styles.completedStep]} />
            <View style={styles.progressStep} />
        </View>
        <Text style={styles.sectionTitle}>Select your area of residence.</Text>
        <Text style={styles.subtitle}></Text>
        <FlatList
            data={sportsOptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.optionsList}
        />
        <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('OnboardingScreen4')}
        >
            <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        </View>
    );  
}

function OnboardingScreen4({ navigation }: { navigation: ProfileScreenNavigationProp }) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    const toggleOption = (id: string) => {
        if (selectedOptions.includes(id)) {
        setSelectedOptions(selectedOptions.filter((optionId) => optionId !== id));
        } else {
        setSelectedOptions([...selectedOptions, id]);
        }
    };

    const renderItem = ({ item }: { item: { id: string; label: string } }) => (
        <TouchableOpacity
        style={[
            styles.optionContainer,
            selectedOptions.includes(item.id) && styles.selectedOption,
        ]}
        onPress={() => toggleOption(item.id)}
        >
        <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.obProgressBar}>
                <View style={styles.progressStep} />
                <View style={styles.progressStep} />
                <View style={styles.progressStep} />
                <View style={[styles.progressStep, styles.completedStep]} />
            </View>
            <View style={styles.centerContainer}>
                <Text style={styles.sectionTitle}>Turn on notifications?</Text>
                <Text style={styles.subtitle}>Don't miss your next event!</Text>
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.nextText}>Enable notifications</Text>
                </TouchableOpacity>
            </View>
        </View>
    );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
  },
  centerContainer: {
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    flex: 1,
    width: 166.8, 
    height: 280, 
    marginRight: 40,
    // backgroundColor: '#ddd', 
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 48,
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  statLabel: {
    fontSize: 10,
    color: '#555',
  },
  buttonsContainer: {
    flexDirection: 'column', 
    justifyContent: 'center',
    alignItems: 'stretch', 
  },
  editButton: {
    backgroundColor: '#f3f3f3',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  shareButton: {
    // backgroundColor: '#f3f3f3',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonText: {
    fontSize: 10,
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankLabel: {
    fontSize: 16,
    color: '#555',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rankStart: {
    fontSize: 12,
    marginRight: 10,
  },
  rankEnd: {
    fontSize: 12,
    marginLeft: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6A0DAD',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  experienceLabel: {
    fontSize: 12,
    marginRight: 10,
  },
  experiencePoints: {
    fontSize: 12,
    marginLeft: 10,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    borderColor: '#0C5B00',
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 10,
  },
  achievementsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C5B00',
  },
  achievementsPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C5B00',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 16,
    marginTop: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 120,
    padding: 10,
    textAlignVertical: 'top',
  },
  setupButton: {
    backgroundColor: '#0C5B00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 12,
    // borderWidth: 2,
    // borderColor: '#0C5B00',
  },
  setUpText: {
    fontSize: 10,
    color: '#fff',
  },
  obProgressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 40,
  },
  progressStep: {
    flex: 1,
    marginRight: 8,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  completedStep: {
    backgroundColor: '#0C5B00',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 40,
  },
  optionsList: {
    flexGrow: 1,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 20,
    paddingLeft: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
    borderColor: '#0C5B00',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
  },
  nextText: {
    fontSize: 14,
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#0C5B00',
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 12,
  }
});
