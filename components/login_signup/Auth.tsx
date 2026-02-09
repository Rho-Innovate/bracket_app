import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  IconButton,
} from "react-native-paper";
import { supabase } from "../../lib/supabase";
import Signup from './Signup';
import { AppTheme } from '../../constants/theme';

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  async function signInWithEmail() {
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      Alert.alert("Sign In Error", error.message);
    }
    setLoading(false);
  }

  const openSignUpModal = () => {
    setShowSignUpModal(true);
  };

  const closeSignUpModal = () => {
    setShowSignUpModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign in to continue
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!emailError}
            style={styles.input}
            outlineColor="#ccc"
            activeOutlineColor={AppTheme.colors.primary}
            left={<TextInput.Icon icon="email-outline" />}
          />
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            mode="outlined"
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            error={!!passwordError}
            style={styles.input}
            outlineColor="#ccc"
            activeOutlineColor={AppTheme.colors.primary}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>

          <Button
            mode="contained"
            onPress={signInWithEmail}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
            buttonColor={AppTheme.colors.primary}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <View style={styles.signupContainer}>
            <Text variant="bodyMedium" style={styles.signupText}>
              Don't have an account?{" "}
            </Text>
            <Button
              mode="text"
              onPress={openSignUpModal}
              labelStyle={styles.signupLink}
              compact
            >
              Sign up
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Sign-Up Modal */}
      <Modal
        visible={showSignUpModal}
        transparent
        animationType="fade"
        onRequestClose={closeSignUpModal}
      >
        <TouchableWithoutFeedback onPress={closeSignUpModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Create Account
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={closeSignUpModal}
                  />
                </View>

                <Text variant="bodyMedium" style={styles.modalSubtitle}>
                  Choose how you'd like to sign up
                </Text>

                <Button
                  mode="contained"
                  onPress={() => {
                    closeSignUpModal();
                    setShowEmailSignup(true);
                  }}
                  style={styles.modalButton}
                  contentStyle={styles.modalButtonContent}
                  buttonColor={AppTheme.colors.primary}
                  icon="email-outline"
                >
                  Continue with Email
                </Button>

                <Button
                  mode="outlined"
                  onPress={closeSignUpModal}
                  style={styles.modalSecondaryButton}
                  contentStyle={styles.modalButtonContent}
                  textColor="#333"
                  icon="phone-outline"
                >
                  Continue with Phone
                </Button>

                <Text variant="bodySmall" style={styles.termsText}>
                  By signing up, you agree to our Terms & Conditions and Privacy Policy.
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {showEmailSignup && (
        <Signup
          visible={showEmailSignup}
          onClose={() => setShowEmailSignup(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signupText: {
    color: "#666",
  },
  signupLink: {
    color: "#2F622A",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: "700",
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 24,
  },
  modalButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  modalSecondaryButton: {
    marginBottom: 12,
    borderRadius: 8,
    borderColor: "#ccc",
  },
  modalButtonContent: {
    paddingVertical: 8,
  },
  termsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 16,
  },
});
