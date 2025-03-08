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

type EmailSignupProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Signup({ visible, onClose }: EmailSignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const[lastName, setLastName] = useState('');

  const handleSignUp = async () => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
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
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* Sign Up Title */}
          <Text style={styles.title}>SIGN UP</Text>
          <Text style={styles.subtitle}>To get started, create your account.</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          {/* Input Fields */}
          <TextInput 
            style={styles.input} 
            placeholder="First Name" 
            value={firstName} 
            onChangeText={setFirstName} 
            placeholderTextColor="#B0B0B0"
          />

          {/* Input Fields */}
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

          {/* Green Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleSignUp}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} />
            <TouchableOpacity style={styles.socialButton} />
            <TouchableOpacity style={styles.socialButton} />
          </View>

          {/* Login Link */}
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 8,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F622A',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
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
    width: '50%', 
    height: '100%',
    backgroundColor: '#2F622A',
    borderRadius: 2,
  },
  input: {
    width: '90%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginBottom: 35, 
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  continueButton: {
    backgroundColor: '#2F622A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
    marginTop: 10,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
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
    fontSize: 14,
    color: '#777',
    marginTop: 16,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2F622A',
  },
});