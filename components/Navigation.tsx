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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

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
const FriendsStack = createStackNavigator();
const ExploreStack = createStackNavigator();

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

type FriendsStackParamList = {
  Map: undefined;
  Chat: undefined;
};

type FriendsScreenNavigationProp = StackNavigationProp<FriendsStackParamList>;

function FriendsScreen() {
  return (
    <FriendsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none'  // This disables the slide animation
      }}
    >
      <FriendsStack.Screen name="Map" component={MapScreen} />
      <FriendsStack.Screen name="Chat" component={ChatScreen} />
    </FriendsStack.Navigator>
  );
}

// function MapScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
//   return (
//   <View>
//     <View style={styles.topContainer}> 
//       <View style={styles.MapChatContainer}>
//           <TouchableOpacity style={styles.Choice} onPress={() => console.log('Map pressed')}>
//             <Text style={styles.ChoiceText}>Map</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Chat")}>
//             <Text style={styles.unChoiceText}>Chat</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
     
//     <View style={styles.blueCircle} />
//     <View style={styles.whiteCircle} />

//     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleContainer}>
//       {Array.from({ length: 10 }).map((_, index) => (
//         <View key={index} style={styles.grayCircle} />
//       ))}
//     </ScrollView>

//     <Image source={Map} style={styles.map} />
//   </View>
//   );
// }

function MapScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
  return (
    <View style={styles.mapContainer}>
      <View style={styles.topChatContainer}> 
        <View style={styles.MapChatContainer}>
          <TouchableOpacity style={styles.Choice} onPress={() => console.log('Map pressed')}>
            <Text style={styles.ChoiceText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Chat")}>
            <Text style={styles.unChoiceText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <MapView
        style={styles.realMap}
        initialRegion={{
          latitude: 47.65920150265706,
          longitude: -122.30776244608923,
          latitudeDelta: 0.04,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: 47.65920150265706, longitude: -122.30776244608923 }}
          title="YOU ARE HERE"
        />
      </MapView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleContainer}>
        {Array.from({ length: 10 }).map((_, index) => (
          <View key={index} style={styles.grayCircle} />
        ))}
      </ScrollView>
    </View>
  );
}


function ChatScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
  const contacts = [
    { name: "Gaurang Pendharkar", lastMessage: "Reacted 🔥 to your message • 1m" },
    { name: "Jenny Pyon", lastMessage: "Hello happy new years! • 2h" },
    { name: "Inchara Chetan", lastMessage: "that’s what i’ve been doing • 5h" },
    { name: "Chaitanya Sekhar", lastMessage: "the login should work now • 11h" },
    { name: "Summer Logan", lastMessage: "Where are we meeting tmr? • 22h" },
    { name: "Rachel Nguyen", lastMessage: "Ok just try to get there asap... • 1d" },
    { name: "Ian Chiu", lastMessage: "Nvm we will stick with Monday • 1d" },
    { name: "Daisy Hu", lastMessage: "Update we r here pls come • 2d" },
    { name: "Siena Ko", lastMessage: "Wait josh hav you heard of r... • 2d" },
  ];

  return (
    <View style={styles.chatContainer}>
      <View style={styles.topChatContainer}> 
        <View style={styles.MapChatContainer}>
          <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Map")}>
            <Text style={styles.unChoiceText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.Choice} onPress={() => console.log('Chat pressed')}>
            <Text style={styles.ChoiceText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.contactList}>
        {contacts.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <View style={styles.profilePic} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.lastMessage}>{contact.lastMessage}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type ExploreScreenNavigationProp = StackNavigationProp<ExploreStackParamList>;

function ExploreScreen() {
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none'  // This disables the slide animation
      }}
    >
      <ExploreStack.Screen name="Join" component={JoinScreen} />
      <ExploreStack.Screen name="Host" component={HostScreen} />
    </ExploreStack.Navigator>
  );
}

function JoinScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
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
    <View style={styles.minimapContainer}>
      <View style={styles.MapChatContainer}>
        <TouchableOpacity style={styles.Choice} onPress={() => console.log('Join pressed')}>
          <Text style={styles.ChoiceText}>Join</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Host")}>
          <Text style={styles.unChoiceText}>Host</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.relSearchTopContainer}>
          <TextInput
            style={styles.relSearchBar}
            placeholder="Search events (ex. batting practice)"
            placeholderTextColor="#64748B"
          />
        </View>
        <Text style={styles.exploreTitle}>Events near University District</Text>
        <MapView
          style={styles.minimap}
          initialRegion={{
            latitude: 47.65920150265706,
            longitude: -122.30776244608923,
            latitudeDelta: 0.004,
            longitudeDelta: 0.002,
          }}
        />
        <Marker
            coordinate={{ latitude: 47.65920150265706, longitude: -122.30776244608923 }}
            title="YOU ARE HERE"
          />
        <View style={styles.exploreButtonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => console.log('1s pressed')}>
            <Text style={styles.buttonText}>1v1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('2s pressed')}>
            <Text style={styles.buttonText}>2v2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Team pressed')}>
            <Text style={styles.buttonText}>Team</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Today pressed')}>
            <Text style={styles.buttonText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Tomorrow pressed')}>
            <Text style={styles.buttonText}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Weekend pressed')}>
            <Text style={styles.buttonText}>Weekend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Racket pressed')}>
            <Text style={styles.buttonText}>Racket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => console.log('Poker pressed')}>
            <Text style={styles.buttonText}>Poker</Text>
          </TouchableOpacity>
        </View>     

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
  )
}

function HostScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
  return (
    <View style={styles.minimapContainer}>
      <View style={styles.MapChatContainer}>
          <TouchableOpacity style={styles.unChoice} onPress={() => navigation.navigate("Join")}>
            <Text style={styles.unChoiceText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.Choice} onPress={() => console.log('Host pressed')}>
            <Text style={styles.ChoiceText}>Host</Text>
          </TouchableOpacity>
      </View>
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

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  );
}
type ExploreStackParamList = {
  Map: undefined;
  Chat: undefined;
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  topContainer: {
    alignItems: 'center', // Center items horizontally
    justifyContent: 'flex-start', // Align items at the top
    flex: 1,
  },
  topChatContainer: {
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
    marginBottom: 5, // Space below button categories
  },
  unChoice: {
    zIndex: 2,
    // position: 'absolute', // Fixes the header at the top
    // marginBottom: 8,
    marginRight: 4,
    marginLeft: 4,
    // alignItems:'center', // Center items horizontally
    justifyContent: 'center',
    backgroundColor: '#F1F1F1', // Set your desired background color
    paddingVertical: 8, // Vertical padding for the button
    paddingHorizontal: 67, // Horizontal padding for the button
    borderRadius: 10, // Rounded corners
    elevation: 3, // Shadow effect for Android
  },
  Choice: {
    zIndex: 2,
    // position: 'absolute', // Fixes the header at the top
    // marginBottom: 8,
    marginRight: 4,
    marginLeft: 4,
    // alignItems:'center', // Center items horizontally
    justifyContent: 'center',
    backgroundColor: '#000', // Set your desired background color
    paddingVertical: 8, // Vertical padding for the button
    paddingHorizontal: 67, // Horizontal padding for the button
    borderRadius: 10, // Rounded corners
    elevation: 3
  },
  unChoiceText: {
    color: '#000', // Text color
    fontWeight:'bold',
    fontSize: 16, // Font size
    textAlign: 'center', // Center text alignment
  },
  ChoiceText: {
    color: '#fff', // Text color
    fontWeight:'bold',
    fontSize: 16, // Font size
    textAlign: 'center', // Center text alignment
  },
  circleContainer: {
    position: 'absolute', // Position it above the map
    bottom: 32, // Adjust this value to place it above the navigation bar
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
    paddingHorizontal: 16,
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

  chatContainer: {
      flex: 1,
      backgroundColor: '#fff',
    },
    contactList: {
      flex: 1,
      marginTop: 72,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 35,
      padding: 14,
      // borderBottomWidth: 1,
      // borderBottomColor: '#f0f0f0',
    },
    profilePic: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: '#ccc',
      marginRight: 20,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    lastMessage: {
      fontSize: 14,
      color: '#777',
    },
    mapContainer: {
      flex: 1,
      backgroundColor: '#fff'
    },
    realMap: {
      flex: 1,
    },
    relSearchBar: {
      height: 45,
      width: '100%',
      borderColor: '#f1f1f1',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 16,
    },
    relSearchTopContainer: {
      // alignItems: 'flex-start',
      width: '100%',
      paddingTop: 80,
      paddingBottom: 20,
      paddingHorizontal: 35,
    },
    JoinHostContainer: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'center',
      marginBottom: 20,
    },
    minimap: {
      width: '100%',
      height: 180,
      marginTop: 10,
      paddingHorizontal: 35,
      borderRadius: 10,
    },
    exploreTitle: {
      paddingLeft: 35,
      fontSize: 14,
      fontWeight: 'bold',
      // marginTop: 20,
      // marginBottom: 4, // Space below the title
      alignSelf: 'flex-start', 
    },
    minimapContainer: {
      backgroundColor: '#fff'
    },
    exploreButtonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center', // Space buttons evenly
      marginTop: 24,
      marginBottom: 16, // Space below button categories
      paddingHorizontal: 20,
    },
  
  }
);
