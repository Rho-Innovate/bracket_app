import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const FriendsStack = createStackNavigator();

type FriendsStackParamList = {
    Map: undefined;
    Chat: undefined;
  };
  
  type FriendsScreenNavigationProp = StackNavigationProp<FriendsStackParamList>;
  
  export default function FriendsScreen() {
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
