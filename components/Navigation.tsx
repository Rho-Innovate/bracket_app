import { Text, View, StyleSheet, TextInput, ScrollView, Button, TouchableOpacity, TextProps, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import { Image } from 'expo-image';
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// interface CustomTextProps extends TextProps {
//   style?: object; // Optional style prop
// }

// const CustomText: React.FC<CustomTextProps> = ({ style, ...props }) => {
//   return <Text style={[fonts.text, style]} {...props} />;
// };

// const fonts = StyleSheet.create({
//   text: {
//     fontFamily: 'Uber Move', // Use the font family name here
//   },
// });

// const loadFonts = async () => {
//   await Font.loadAsync({
//     'Uber Move Bold': require('Uber Fonts\UberMoveBold.otf'),
//     'Uber Move Medium': require('Uber Fonts\UberMoveMedium.otf'),
//   });
// };

// const App = () => {
//   const [fontsLoaded, setFontsLoaded] = useState(false);

//   useEffect(() => {
//     const loadFontsAsync = async () => {
//       await loadFonts();
//       setFontsLoaded(true);
//     };

//     loadFontsAsync();
//   }, []);

//   if (!fontsLoaded) {
//     return null; // Or a loading spinner/component while fonts are loading
//   }

//   return (
//     // Your main app component goes here
//     <CustomText style={{ fontSize: 20 }}>Hello World</CustomText>
//   );
// };

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof Ionicons>['name']>) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}

const Tab = createBottomTabNavigator();
const GrayBG = { uri: 'https://digitalassets.daltile.com/content/dam/AmericanOlean/AO_ImageFiles/minimum/AO_MN44_12x24_Gray_Matte.jpg/jcr:content/renditions/cq5dam.web.570.570.jpeg'};
const Map = { uri: 'https://as1.ftcdn.net/v2/jpg/03/16/80/62/1000_F_316806230_ju6zw7TgOnp2xTG6Q2i8DF4lfR67wMIW.jpg'};
const Stack = createStackNavigator();

export default function Home() {
  return (
    <Tab.Navigator
    screenOptions={{
      headerShown:false,
      tabBarStyle: {
        height: 60, // Adjust this value to your desired height
      },
    }}
    >
      <Tab.Screen
        component={HomeScreen}
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        component={FriendsScreen}
        name="Friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people-sharp' : 'people-outline'} color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        component={ExploreScreen}
        name="Explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search-sharp' : 'search-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tab.Screen
        component={LeaderboardsScreen}
        name="Leaderboards"
        options={{
          title: 'Leaderboards',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'podium-sharp' : 'podium-outline'} color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        component={ProfileScreen}
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-sharp' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function HomeScreen() {
  const events = [
    {
      title: "Event 1",
      date: "FRI, SEP 6 • 9:00 AM",
      location: "Orange County Great Park"
    },
    { title: "Event 2", date: "SAT, SEP 7 • 10:00 AM", location: "Location 2" },
    { title: "Event 3", date: "SUN, SEP 8 • 11:00 AM", location: "Location 3" },
    { title: "Event 4", date: "MON, SEP 9 • 12:00 PM", location: "Location 4" },
    { title: "Event 5", date: "TUE, SEP 10 • 1:00 PM", location: "Location 5" }
  ]; 

  return (
    <View style={styles.container}>
      {/* Fixed Header for Search Bar and Buttons */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search home..."
          placeholderTextColor="#64748B"
        />
      </View>

    <ScrollView contentContainerStyle={styles.container}>
      <TextInput/>
      {/* Button Categories */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Events pressed')}>
          <Text style={styles.buttonText}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Matchups pressed')}>
          <Text style={styles.buttonText}>Matchups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Going pressed')}>
          <Text style={styles.buttonText}>Going</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Saved pressed')}>
          <Text style={styles.buttonText}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* Tennis Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.title}>Tennis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            {events.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <Image source={GrayBG} style={styles.image} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
      </View>

      {/* Basketball Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.title}>Basketball</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {events.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Image source={GrayBG} style={styles.image} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Soccer Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.title}>Soccer</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {events.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Image source={GrayBG} style={styles.image} />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  );
}

function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore!</Text>
    </View>
  );
}

function LeaderboardsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Leaderboards</Text>
    </View>
  );
}



function FriendsScreen() {
  return (
    MapScreen()
  );
}

function MapScreen() {
  return (
    // <View style={styles.container}>
    // {/* Fixed Header for Search Bar and Buttons */}
    // <View style={styles.header}>
    //   <TextInput
    //     style={styles.searchBar}
    //     placeholder="Search home..."
    //     placeholderTextColor="#64748B"
    //   />
    // </View>
  <View>
    <View style={styles.topContainer}> 
      <View style={styles.MapChatContainer}>
          <TouchableOpacity style={styles.MapChat} onPress={() => console.log('Map pressed')}>
            <Text style={styles.MapChatText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.MapChat} onPress={() => console.log('Chat pressed')}>
            <Text style={styles.MapChatText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
     
    <View style={styles.blueCircle} />
    <View style={styles.whiteCircle} />

    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleContainer}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={index} style={styles.grayCircle} />
      ))}
    </ScrollView>

    <Image source={Map} style={styles.map} />
  </View>

  );
}

function ChatScreen() {
  <View style={styles.container}>
    <Text style={styles.text}>Chat!</Text>
  </View>

}

const styles = StyleSheet.create({
  topContainer: {
    flex: 1,
    alignItems: 'center', // Center items horizontally
    justifyContent: 'flex-start', // Align items at the top
  },
  MapChatContainer: {
    // left: '50%',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    position: 'absolute', // Fixes the header at the top
    marginTop: 20, // Space above buttons
    // justifyContent: 'space-around', // Space buttons evenly
    // marginTop: 40,
    // marginBottom: 16, // Space below button categories
  },
  MapChat: {
    zIndex: 2,
    // position: 'absolute', // Fixes the header at the top
    // marginBottom: 8,
    marginRight: 8,
    // alignItems:'center', // Center items horizontally
    backgroundColor: '#F1F1F1', // Set your desired background color
    paddingVertical: 8, // Vertical padding for the button
    paddingHorizontal: 68, // Horizontal padding for the button
    borderRadius: 10, // Rounded corners
    elevation: 3, // Shadow effect for Android
  },
  MapChatText: {
    color: '#000', // Text color
    fontWeight:'bold',
    fontSize: 16, // Font size
    textAlign: 'center', // Center text alignment
  },
  circleContainer: {
    position: 'absolute', // Position it above the map
    bottom: 10, // Adjust this value to place it above the navigation bar
    left: 0,
    right: 0,
    zIndex: 1, // Ensure it appears above other elements
    paddingHorizontal: 10, // Optional padding for aesthetics
  },
  grayCircle: {
    width: 60, // Set the width of the circle
    height: 60, // Set the height of the circle
    borderRadius: 30, // Half of width/height to make it circular
    backgroundColor: '#ccc', // Gray color for the circles
    marginRight: 10, // Space between circles
  },
  whiteCircle: {
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    width: 30, // Set the width of the circle
    height: 30, // Set the height of the circle
    marginLeft: -15, // Adjust left margin to half of width for true centering
    marginTop: -15, // Adjust top margin to half of height for true centering
    borderRadius: 15, // Half of width/height to make it circular
    backgroundColor: '#fff', // Apple blue color
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    position: 'absolute', // Allow absolute positioning of children
    zIndex: 1
  },
  blueCircle: {
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    width: 20, // Set the width of the circle
    height: 20, // Set the height of the circle
    marginLeft: -10, // Adjust left margin to half of width for true centering
    marginTop: -10, // Adjust top margin to half of height for true centering
    borderRadius: 10, // Half of width/height to make it circular
    backgroundColor: '#007AFF', // Apple blue color
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    position: 'absolute', // Allow absolute positioning of children
    zIndex: 2
  },
  map: {
    height: '100%', // Fill the height of the screen
    // transform: [{ rotate: '90deg' }],
  },


  // { Home }
  header: {
    
    position: 'absolute', // Fixes the header at the top
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure it is above other elements
    backgroundColor: '#fff', // Background color for header
    // paddingVertical: 10,
    // paddingHorizontal: 16,
    // elevation: 5, // Optional shadow for Android
    // shadowColor: '#000', // Optional shadow for iOS
    // shadowOffset: { width: 0, height: 2 }, // Optional shadow offset for iOS
    // shadowOpacity: 0.2, // Optional shadow opacity for iOS
    // shadowRadius: 2.5, // Optional shadow radius for iOS
  },

  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'semibold',
    color: '#000',
  },
  searchBar: {
    height: 45,
    width: 355, // Full width
    borderColor: '#f1f1f1',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16, // Space below the search bar
    alignSelf: 'flex-start', 
    marginLeft: 35, // Add space to the left
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space buttons evenly
    marginTop: 40,
    marginBottom: 16, // Space below button categories
  },
  eventContent: {
    alignItems: 'flex-start', // Center the image and text vertically
  },
   image: {
    width: 220,
    height: 130,
    borderRadius: 10,
    marginBottom: 5,
  },
  title: {
    paddingLeft: 35,
    fontSize: 18,
    fontWeight: 'bold',
    // marginTop: 20,
    marginBottom: 12, // Space below the title
    alignSelf: 'flex-start', 
  },
  eventItem: {
    marginRight: 12,
    flexDirection: 'column',
    alignItems:'flex-start', // Center items horizontally
    // height: 250,
    flexGrow: 1,
    // backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignSelf: 'flex-start', 
  },
  categoryContainer: {
    // marginLeft: 35,
    flexDirection: 'column',
    height: 250,
    marginBottom: 20, // Space between categories
    borderRadius: 8, // Optional rounded corners
  },
  button: {
    marginBottom: 8,
    fontSize: 12,
    marginRight: 8,
    alignItems:'flex-start', // Center items horizontally
    backgroundColor: '#F1F1F1', // Set your desired background color
    paddingVertical: 6, // Vertical padding for the button
    paddingHorizontal: 16, // Horizontal padding for the button
    borderRadius: 10, // Rounded corners
    elevation: 3, // Shadow effect for Android
    // shadowColor: '#000', // Shadow color for iOS
    // shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    // shadowOpacity: 0.2, // Shadow opacity for iOS
    // shadowRadius: 2.5, // Shadow radius for iOS
  },
  buttonText: {
    color: '#000', // Text color
    fontWeight:'semibold',
    fontSize: 12, // Font size
    textAlign: 'center', // Center text alignment
  },

  eventTitle:{
      color:'#000',
      fontSize: 14,
      fontWeight:'bold', // Make the title bold
      textAlign:'left', // Center the title
  },

  eventDate:{
      color:'#555', // Slightly lighter color for the date
      fontSize: 12,
      marginTop :5 , // Space between title and date
      fontWeight:'bold', // Make the title bold
      textAlign:'left', // Center the date
  },

  eventLocation:{
      color:'#777', // Even lighter color for the location
      fontSize: 12,
      marginTop :2 , // Space between date and location
      textAlign:'left', // Center the location
  },

  scrollContainer:{
    paddingLeft: 35, // Maintain left margin for scrolling content
    paddingRight: 10, // Optional right padding for aesthetics
    flexGrow: 1, // Allow content to grow properly in ScrollView
  },
});
