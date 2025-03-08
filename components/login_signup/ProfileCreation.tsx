
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert
} from "react-native";
import { Button } from "@rneui/themed";
import { Dropdown } from 'react-native-element-dropdown';
import { signUpAndCreateProfile } from "@/lib/supabase";

type ProfileCreationProps = {
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  visible: boolean;
  onClose: () => void;
};


export default function ProfileCreation({email, password, firstName, lastName, visible, onClose}: ProfileCreationProps) {
  const [playerName, setPlayerName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState(18);
  const [gender, setGender] = useState('other');

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const handleProfileCreation = async () => {
    try {
      const profileData = {
        username: playerName,
        first_name: firstName,
        last_name: lastName,
        age: age,
        gender: gender,
        location: {
          lat: 47.606209,
          lng: 122.332069
        }
      }
      const data = await signUpAndCreateProfile(email, password, profileData);
      onClose();
      return data
    }
    catch(error) {
      Alert.alert('Error', 'Issue in handleProfileCreation.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Title & Subtitle */}
        <Text style={styles.title}>PROFILE CREATION</Text>
        <Text style={styles.subtitle}>Your player profile is how others will get to know you!</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar} />
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={require("../../assets/images/default_pfp.png")}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editIconText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Gender Dropdown */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          iconStyle={styles.iconStyle}
          data={genderOptions}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select gender"
          value={gender}
          onChange={item => {
            setGender(item.value);
          }}
        />
        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          onChangeText={setPlayerName}
          value={playerName}
          placeholderTextColor="#B0B0B0"
        />
        <TextInput
          style={styles.input}
          placeholder="MM/DD/YYYY"
          onChangeText={setBirthdate}
          value={birthdate}
          placeholderTextColor="#B0B0B0"
        />
        <TextInput
          style={styles.bioInput}
          multiline
          numberOfLines={4}
          placeholder="Write something about yourself..."
          onChangeText={setBio}
          value={bio}
          placeholderTextColor="#B0B0B0"
        />

        {/* Create Account Button */}
        <TouchableOpacity style={styles.createButton} onPress={handleProfileCreation}>
          <Text style={styles.createButtonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F622A",
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2F622A',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '90%',
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 30,
  },
  progressBar: {
    width: '100%', 
    height: '100%',
    backgroundColor: '#2F622A',
    borderRadius: 2,
  },
  profileImageContainer: {
    marginBottom: 30,
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2F622A",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editIconText: {
    color: "white",
    fontSize: 16,
  },
  input: {
    width: "90%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginBottom: 35,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  bioInput: {
    width: "90%",
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#F9F9F9",
    fontSize: 16,
    marginBottom: 35,
  },
  createButton: {
    backgroundColor: "#2F622A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
    marginTop: 10,
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  dropdown: {
    width: "90%",
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 35,
    backgroundColor: "#F9F9F9",
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#B0B0B0',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});