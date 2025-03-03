import React, { useEffect } from 'react';
import { Text as DefaultText, TextProps, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';

export function Text(props: TextProps) {
  return <DefaultText {...props} style={[props.style, { fontFamily: 'Montserrat' }, { letterSpacing: -.4 }]} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat': require('../assets/fonts/Montserrat-VariableFont_wght.ttf'),
    'Quicksand': require('../assets/fonts/Quicksand-VariableFont_wght.ttf'),
  });
  useEffect(() => {
    if (!fontsLoaded) {
      SplashScreen.preventAutoHideAsync();
    } else {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Text style={{ fontSize: 24 }}>Main Heading</Text>
        <Text style={styles.subheading}>Quicksand Subheading</Text>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  subheading: {
    fontFamily: 'Quicksand',
    fontSize: 18,
    fontWeight: 'bold',
  },
});