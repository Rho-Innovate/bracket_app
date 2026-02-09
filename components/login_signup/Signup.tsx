import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  IconButton,
  HelperText,
  ProgressBar,
  Avatar,
  SegmentedButtons,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { signUpAndCreateProfile } from "@/lib/supabase";
import EmailVerificationScreen from "./EmailVerificationScreen";
import { AppTheme } from "../../constants/theme";

const theme = {
  colors: {
    primary: AppTheme.colors.primary,
  },
};

type CombinedSignupProfileProps = {
  visible: boolean;
  onClose: () => void;
};

export default function CombinedSignupProfile({ visible, onClose }: CombinedSignupProfileProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);

  // Step 1: Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: Profile creation details
  const [playerName, setPlayerName] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Request location permission and get coordinates
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied, using default');
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting location:', error);
      }
    };

    if (visible) {
      requestLocationPermission();
    }
  }, [visible]);

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!playerName.trim()) newErrors.playerName = "Username is required";
    if (!birthdate) newErrors.birthdate = "Birthdate is required";
    if (!gender) newErrors.gender = "Please select your gender";

    if (birthdate && calculateAge(birthdate) < 18) {
      newErrors.birthdate = "You must be at least 18 years old";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };


  const handleCreateAccount = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const computedAge = calculateAge(birthdate!);
      // Use actual location if available, otherwise use a default (Seattle)
      const location = userLocation || { lat: 47.606209, lng: -122.332069 };
      const profileData = {
        username: playerName,
        first_name: firstName,
        last_name: lastName,
        age: computedAge,
        gender: gender,
        location,
      };
      const { user } = await signUpAndCreateProfile(email, password, profileData);

      // Note: Avatar upload is deferred until after email verification
      // Users can add a profile photo from their profile screen after signing in
      // This is because storage RLS requires a fully authenticated session

      // Show verification screen instead of closing
      setShowVerificationScreen(true);
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || "";
      if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        Alert.alert("Error", "An account with this email already exists.");
      } else {
        Alert.alert("Error", error.message || "There was an issue creating your account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      onClose();
    } else {
      setStep(1);
    }
  };

  const handleBackToLogin = () => {
    setShowVerificationScreen(false);
    onClose();
  };

  // Show verification screen after successful signup
  if (showVerificationScreen) {
    return (
      <Modal visible={visible} animationType="slide">
        <EmailVerificationScreen
          email={email}
          onBackToLogin={handleBackToLogin}
        />
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
            iconColor={theme.colors.primary}
          />
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
          <View style={{ width: 40 }} />
        </View>

        <ProgressBar
          progress={step === 1 ? 0.5 : 1}
          color={theme.colors.primary}
          style={styles.progressBar}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <Text variant="headlineMedium" style={styles.title}>
                Create Account
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Enter your details to get started
              </Text>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors({...errors, firstName: ""}); }}
                    mode="outlined"
                    error={!!errors.firstName}
                    style={styles.input}
                    outlineColor="#ccc"
                    activeOutlineColor={theme.colors.primary}
                  />
                  <HelperText type="error" visible={!!errors.firstName}>
                    {errors.firstName}
                  </HelperText>
                </View>
                <View style={styles.halfInput}>
                  <TextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors({...errors, lastName: ""}); }}
                    mode="outlined"
                    error={!!errors.lastName}
                    style={styles.input}
                    outlineColor="#ccc"
                    activeOutlineColor={theme.colors.primary}
                  />
                  <HelperText type="error" visible={!!errors.lastName}>
                    {errors.lastName}
                  </HelperText>
                </View>
              </View>

              <TextInput
                label="Email"
                value={email}
                onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({...errors, email: ""}); }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
                outlineColor="#ccc"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="email-outline" />}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              <TextInput
                label="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({...errors, password: ""}); }}
                mode="outlined"
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                error={!!errors.password}
                style={styles.input}
                outlineColor="#ccc"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={secureTextEntry ? "eye-off" : "eye"}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleContinue}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.primary}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Text variant="headlineMedium" style={styles.title}>
                Profile Setup
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Tell us a bit about yourself
              </Text>

              <View style={styles.avatarContainer}>
                <Avatar.Image
                  size={100}
                  source={require("../../assets/images/default_pfp.png")}
                />
                <Text variant="bodySmall" style={styles.avatarHint}>
                  You can add a photo later
                </Text>
              </View>

              <TextInput
                label="Username"
                value={playerName}
                onChangeText={(t) => { setPlayerName(t); if (errors.playerName) setErrors({...errors, playerName: ""}); }}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.playerName}
                style={styles.input}
                outlineColor="#ccc"
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="account-outline" />}
              />
              <HelperText type="error" visible={!!errors.playerName}>
                {errors.playerName}
              </HelperText>

              <Text variant="labelLarge" style={styles.label}>Gender</Text>
              <SegmentedButtons
                value={gender}
                onValueChange={(value) => { setGender(value); if (errors.gender) setErrors({...errors, gender: ""}); }}
                buttons={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                style={styles.segmentedButtons}
              />
              <HelperText type="error" visible={!!errors.gender}>
                {errors.gender}
              </HelperText>

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                contentStyle={styles.dateButtonContent}
                icon="calendar"
                textColor={birthdate ? "#000" : "#666"}
              >
                {birthdate ? birthdate.toLocaleDateString() : "Select Birthdate"}
              </Button>
              <HelperText type="error" visible={!!errors.birthdate}>
                {errors.birthdate}
              </HelperText>

              {showDatePicker && Platform.OS === 'ios' && (
                <View style={styles.datePickerInline}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                      }
                    }}
                    style={styles.datePicker}
                  />
                  <View style={styles.datePickerButtons}>
                    <Button
                      mode="text"
                      onPress={() => setShowDatePicker(false)}
                      textColor="#666"
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setBirthdate(tempDate);
                        setShowDatePicker(false);
                        if (errors.birthdate) setErrors({...errors, birthdate: ""});
                      }}
                      buttonColor={theme.colors.primary}
                    >
                      Confirm
                    </Button>
                  </View>
                </View>
              )}

              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setBirthdate(selectedDate);
                      if (errors.birthdate) setErrors({...errors, birthdate: ""});
                    }
                  }}
                />
              )}

              <Button
                mode="contained"
                onPress={handleCreateAccount}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={theme.colors.primary}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  progressBar: {
    marginHorizontal: 24,
    marginTop: 8,
    height: 4,
    borderRadius: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    backgroundColor: "#fff",
  },
  label: {
    marginBottom: 8,
    color: "#333",
  },
  segmentedButtons: {
    marginBottom: 4,
  },
  dateButton: {
    borderColor: "#ccc",
    borderRadius: 4,
  },
  dateButtonContent: {
    paddingVertical: 8,
    justifyContent: "flex-start",
  },
  datePickerInline: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  datePicker: {
    height: 150,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  avatarContainer: {
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarHint: {
    marginTop: 8,
    color: "#888",
  },
});
