import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Modal,
  SafeAreaView,
  Image
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Text as CustomText } from '../text';

type EmailSignupProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Signup({ visible, onClose }: EmailSignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSignUp = async () => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (signUpError) throw signUpError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      Alert.alert('Success', 'Account created and logged in successfully!');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        
        {/* Back Button & Green Logo */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <CustomText style={styles.backText}>←</CustomText>
          </TouchableOpacity>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
        </View>

        <View style={styles.contentContainer}>
          
          <CustomText style={styles.title}>Create an account</CustomText>
          {/* <CustomText style={styles.subtitle}>To get started, create your account.</CustomText> */}

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          {/* Input Fields */}
          <TextInput 
            style={styles.input} 
            placeholder="Full Name" 
            value={fullName} 
            onChangeText={setFullName} 
            placeholderTextColor="#B0B0B0"
          />

          {/* Input Fields */}
          {/* <TextInput 
            style={styles.input} 
            placeholder="Last Name" 
            value={fullName} 
            onChangeText={setFullName} 
            placeholderTextColor="#B0B0B0"
          /> */}

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

          {/* Green Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleSignUp}>
            <CustomText style={styles.continueButtonText}>Continue</CustomText>
          </TouchableOpacity>

          {/* OR Divider
          <View style={styles.orContainer}>
            <View style={styles.line} />
            <CustomText style={styles.orText}>OR</CustomText>
            <View style={styles.line} />
          </View>

          {/* Social Login Buttons */}
          {/* <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} />
            <TouchableOpacity style={styles.socialButton} />
            <TouchableOpacity style={styles.socialButton} />
          </View> */}

          {/* Login Link */}
          {/* <CustomText style={styles.loginText}>
            Already have an account? <CustomText style={styles.loginLink}>Log In</CustomText>
          </CustomText> */}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    // marginTop: 10,
  },
  backButton: {
    borderRadius: 8,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#rgba(39, 75, 13, 1)',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 28,
    alignItems: 'center',
    // justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#rgba(39, 75, 13, 1)',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 60,
  },
  progressBar: {
    width: '50%', 
    height: '100%',
    backgroundColor: '#rgba(39, 75, 13, 1)',
    borderRadius: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "##rgba(0, 0, 0, .04)",
    borderRadius: 8,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#rgba(0, 0, 0, .02)',
  },
  continueButton: {
    backgroundColor: '#rgba(39, 75, 13, 1)',
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    width: '100%',
    marginTop: 40,
    height: 50,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#777',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '90%',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 10,
    backgroundColor: '#F9F9F9',
  },
  loginText: {
    // position: 'absolute',
    // bottom: 0,
    fontSize: 12,
    color: '#777',
    marginTop: 40,
  },
  loginLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#rgba(39, 75, 13, 1)',
  },
  inputField: {
    fontSize: 12,
    textAlign: "left",
    letterSpacing: -0.4, // Add letter spacing
    fontFamily: 'Montserrat', // Add font family
  },
});