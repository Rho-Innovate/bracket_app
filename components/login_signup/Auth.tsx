import { Button, Input } from "@rneui/themed";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { supabase } from "../../lib/supabase";
import Signup from './Signup';

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [showEmailSignup, setShowEmailSignup] = useState(false);
 

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  const openSignUpModal = () => {
    setShowSignUpModal(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300, 
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeSignUpModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300, 
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => setShowSignUpModal(false));
  };

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0], // Starts below screen and slides up
  });

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
          <Image
            source={require("../../assets/images/logo.png")} // Replace with your logo path
            style={styles.logo}
          />
          <Text style={styles.title}>Sign in</Text>
          <View style={styles.inputContainer}>
  <View style={styles.fieldsContainer}>
    <Input
      labelStyle={styles.inputLabel}
      inputStyle={styles.inputField}
      inputContainerStyle={styles.roundedInputContainer}
      onChangeText={setEmail}
      value={email}
      placeholder="Email"
      autoCapitalize={"none"}
    />
    <Input
      labelStyle={styles.inputLabel}
      inputStyle={styles.inputField}
      inputContainerStyle={styles.roundedInputContainer}
      onChangeText={(text) => setPassword(text)}
      value={password}
      secureTextEntry={true}
      placeholder="Password"
      autoCapitalize={"none"}
    />
  </View>
  <Button
    title="Log in"
    buttonStyle={styles.loginButton}
    titleStyle={styles.loginButtonText}
    disabled={loading}
    onPress={signInWithEmail}
  />
</View>
   <TouchableOpacity onPress={openSignUpModal} style={styles.signUpContainer}>
            <Text style={styles.signupText}>
              Don’t have an account? <Text style={styles.signupLink}>Sign up!</Text>
            </Text>
          </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Sign-Up Modal */}
      {showSignUpModal && (
        <Modal transparent animationType="none" visible={showSignUpModal}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: modalTranslateY }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sign up</Text>
                <TouchableOpacity onPress={closeSignUpModal}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <Button
                title="Continue with email"
                buttonStyle={styles.modalButton}
                onPress={() => {
                  // First hide the sign up modal
                  Animated.timing(modalAnimation, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                  }).start(() => {
                    setShowSignUpModal(false);
                    setShowEmailSignup(true);
                  });
                }}
              />
              <Button
                title="Continue with phone"
                buttonStyle={styles.modalSecondaryButton}
                titleStyle={styles.modalSecondaryButtonText}
                onPress={() => {
                  closeSignUpModal();
                }}
              />
              <Text style={styles.termsText}>
                Terms & Conditions and Privacy Policy apply.
              </Text>
            </Animated.View>
          </View>
        </Modal>
      )}
      {showEmailSignup && (
        <Signup
          visible={showEmailSignup}
          onClose={() => setShowEmailSignup(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 40,
    alignSelf: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 10,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 16,
    color: "#000",
    textAlign: "left",
  },
  inputField: {
    fontSize: 16,
    textAlign: "left",
  },
  inputContainerStyle: { //??
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  loginButton: {
    backgroundColor: "#2F622A",
    borderRadius: 10,
    paddingVertical: 12,
    width: "100%",
    alignSelf: "center",
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  signUpContainer: {
    alignSelf: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    color: "#000",
  },
  signupLink: {
    color: "#2F622A",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingTop:  0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 18,
    color: "#666",
  },
  modalButton: {
    backgroundColor: "#2F622A",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  modalSecondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  modalSecondaryButtonText: {
    color: "#000",
  },
  termsText: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  roundedInputContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 8,
    width: '100%',
  },
  fieldsContainer: {
    width: '92%',
    alignItems: "center",
  },
});