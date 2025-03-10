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
import EmailSignup from './Signup';
import { Text as CustomText } from '../text';

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
      {/* <Text style={styles.title}>Sign in</Text> */}
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
        <CustomText style={styles.signupText}>
          <CustomText style={styles.signupLink}>Create an account</CustomText>
        </CustomText>
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
                <CustomText style={styles.modalTitle}>Sign up</CustomText>
                <TouchableOpacity onPress={closeSignUpModal}>
                  <CustomText style={styles.closeButton}>✕</CustomText>
                </TouchableOpacity>
              </View>
              <View style={styles.modalHeaderSeparator} />
              <Button
                title="Continue with email"
                titleStyle={styles.modalPrimaryButtonText}
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
              <CustomText style={styles.termsText}>
                Terms & Conditions and Privacy Policy apply.
              </CustomText>
            </Animated.View>
          </View>
        </Modal>
      )}
      {showEmailSignup && (
        <EmailSignup
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
    padding: 28,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 60,
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 40,
    alignSelf: "center",
  },
  inputContainer: {
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 12,
    color: "#000",
    textAlign: "left",
  },
  inputField: {
    fontSize: 12,
    textAlign: "left",
    letterSpacing: -0.4, // Add letter spacing
    fontFamily: 'Montserrat', // Add font family
  },
  inputContainerStyle: { //??
    borderBottomWidth: 0,
    borderBottomColor: "#ccc",
  },
  loginButton: {
    height: 50,
    backgroundColor: "#rgba(39, 75, 13, 1)",
    borderRadius: 999,
    // paddingVertical: 12,
    width: 360,
    alignSelf: "center",
  },
  loginButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: -0.4, // Add letter spacing
    fontFamily: 'Montserrat', // Add font family
  },
  signUpContainer: {
    position: "absolute",
    bottom: 0,
    height: 50,
    // backgroundColor: "#rgba(39, 75, 13, 1)",
    borderWidth: 2,
    borderColor: "#rgba(39, 75, 13, 1)",
    borderRadius: 999,
    width: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  signupText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#rgba(39, 75, 13, 1)",
  },
  signupLink: {
    color: "#rgba(39, 75, 13, 1)",
    fontWeight: "700",
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 30,
    padding: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  modalButton: {
    backgroundColor: "#rgba(39, 75, 13, 1)",
    borderRadius: 8,
    height: 50,
    marginBottom: 10,
    width: 360,
    alignSelf: "center",
  },
  modalSecondaryButton: {
    backgroundColor: "#fff",
    // borderWidth: 1,
    // borderColor: "#ccc",
    // borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  modalPrimaryButtonText: {
    fontWeight: "500",
    color: "#fff",
    letterSpacing: -0.4, // Add letter spacing
    fontFamily: 'Montserrat',
    fontSize: 12,
  },
  modalSecondaryButtonText: {
    fontWeight: "500",
    color: "#000",
    letterSpacing: -0.4, // Add letter spacing
    fontFamily: 'Montserrat',
    fontSize: 12,
  },
  termsText: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  roundedInputContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: "##rgba(0, 0, 0, .04)",
    borderRadius: 8,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: -16,
    backgroundColor: '#rgba(0, 0, 0, .02)',
  },
  fieldsContainer: {
    // width: '92%',
    alignItems: "center",
    marginBottom: 40,
  },
  modalHeaderSeparator: {
    borderBottomWidth: 4,
    borderBottomColor: 'rgb(229, 229, 229)',
    marginBottom: 32,
  },
});