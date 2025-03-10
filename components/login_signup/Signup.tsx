import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";
import { signUpAndCreateProfile } from "@/lib/supabase";

type CombinedSignupProfileProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CombinedSignupProfile({ visible, onClose }: CombinedSignupProfileProps) {
  // Step state: 1 for basic sign-up info, 2 for profile creation details.
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Profile creation details
  const [playerName, setPlayerName] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState("");
  // We no longer rely on a static age state. We'll compute it from the birthdate.
  const [gender, setGender] = useState(null);

  const genderOptions = [
    { label: "-", value: null},
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  // Helper function to calculate age from a Date object
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Event handler for Step 1 "CONTINUE" button
  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all the required fields");
      return;
    }
    // Basic email format validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }
    setStep(2);
  };

  // Event handler for Step 2 "CREATE ACCOUNT" button
  const handleCreateAccount = async () => {
    if (!playerName.trim() || !birthdate || gender === null) {
      Alert.alert("Error", "Please fill in all the required fields");
      return;
    }
    const computedAge = calculateAge(birthdate);
    if (computedAge < 18) {
      Alert.alert("Error", "You must be at least 18 years old to create an account.");
      return;
    }
    try {
      const profileData = {
        username: playerName,
        first_name: firstName,
        last_name: lastName,
        age: computedAge,
        gender: gender,
        // Example fixed location. Update as needed.
        location: { lat: 47.606209, lng: 122.332069 },
      };
      const data = await signUpAndCreateProfile(email, password, profileData);
      Alert.alert("Success", "Account created and logged in successfully!");
      onClose();
    } catch (error) {
      Alert.alert("Error", "There was an issue creating your account. Please try again.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 1) {
                onClose();
              } else {
                setStep(1);
              }
            }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {step === 1 && (
            <>
              <Text style={styles.title}>SIGN UP</Text>
              <Text style={styles.subtitle}>To get started, create your account.</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: "50%" }]} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>CONTINUE</Text>
              </TouchableOpacity>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.title}>PROFILE CREATION</Text>
              <Text style={styles.subtitle}>Your player profile is how others will get to know you!</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: "100%" }]} />
              </View>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require("../../assets/images/default_pfp.png")}
                  style={styles.profileImage}
                />
                <TouchableOpacity style={styles.editIcon}>
                  <Text style={styles.editIconText}>+</Text>
                </TouchableOpacity>
              </View>
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
                onChange={(item) => setGender(item.value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                onChangeText={setPlayerName}
                value={playerName}
                placeholderTextColor="#B0B0B0"
              />
              {/* Birthdate Field Using Date Picker */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthdate ? styles.selectedDateText : styles.placeholderText}>
                  {birthdate ? birthdate.toLocaleDateString() : "Select Birthdate"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthdate || new Date(2000, 0, 1)}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setBirthdate(selectedDate);
                    }
                  }}
                />
              )}
              <TextInput
                style={styles.bioInput}
                multiline
                numberOfLines={4}
                placeholder="Write something about yourself..."
                onChangeText={setBio}
                value={bio}
                placeholderTextColor="#B0B0B0"
              />
              <TouchableOpacity style={styles.createButton} onPress={handleCreateAccount}>
                <Text style={styles.createButtonText}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: { padding: 10, borderRadius: 8 },
  backText: { fontSize: 24, fontWeight: "bold", color: "#2F622A" },
  logo: { width: 40, height: 40, resizeMode: "contain" },
  scrollContainer: { flexGrow: 1, padding: 16, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2F622A",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },
  progressBarContainer: {
    width: "90%",
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    marginBottom: 30,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2F622A",
    borderRadius: 2,
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
  placeholderText: { color: "#B0B0B0", fontSize: 16 },
  selectedDateText: { fontSize: 16, color: "#000" },
  continueButton: {
    backgroundColor: "#2F622A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
    marginTop: 10,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
  editIconText: { color: "white", fontSize: 16 },
  dropdown: {
    width: "90%",
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 35,
    backgroundColor: "#F9F9F9",
  },
  placeholderStyle: { fontSize: 16, color: "#B0B0B0" },
  selectedTextStyle: { fontSize: 16 },
  iconStyle: { width: 20, height: 20 },
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
  createButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
