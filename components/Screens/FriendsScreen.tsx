import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.comingSoonText}>👥 Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});


// const FriendsStack = createStackNavigator();

// type FriendsStackParamList = {
//   Map: undefined;
//   Chat: undefined;
// };

// type FriendsScreenNavigationProp = StackNavigationProp<FriendsStackParamList>;

// export default function FriendsScreen() {
//   return (
//     <FriendsStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
//       <FriendsStack.Screen name="Map" component={MapScreen} />
//       {/* <FriendsStack.Screen name="Chat" component={ChatScreen} /> */}
//     </FriendsStack.Navigator>
//   );
// }

// function MapScreen({ navigation }: { navigation: FriendsScreenNavigationProp }) {
//   const [showComingSoon, setShowComingSoon] = useState(false);

//   return (
//     <View style={styles.mapContainer}>
//       {/* Map with a marker */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: 47.6592,
//           longitude: -122.3078,
//           latitudeDelta: 0.04,
//           longitudeDelta: 0.02,
//         }}
//       >
//         <Marker coordinate={{ latitude: 47.6592, longitude: -122.3078 }} title="YOU ARE HERE" />
//       </MapView>

//       {/* Horizontal scrollable circles */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleContainer}>
//         {Array.from({ length: 10 }).map((_, index) => (
//           <View key={index} style={styles.circle} />
//         ))}
//       </ScrollView>

//       {/* Header navigation buttons as absolute at the bottom */}
//       <View style={styles.headerContainer}>
//         <TouchableOpacity style={styles.selectedTab}>
//           <Text style={styles.selectedTabText}>Map</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.tab} onPress={() => navigation.navigate("Chat") }>
//           <Text style={styles.tabText}>Chat</Text>
//         </TouchableOpacity>
//       </View>

//       {showComingSoon && (
//         <Modal visible={true} transparent animationType="fade">
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalText}>Coming Soon!</Text>
//             </View>
//           </View>
//         </Modal>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   mapContainer: { flex: 1, backgroundColor: '#fff' },
//   headerContainer: { 
//     flexDirection: 'row', 
//     justifyContent: 'center', 
//     position: 'absolute', 
//     bottom: 20, 
//     left: 0, 
//     right: 0, 
//     zIndex: 10 
//   },
//   tab: {
//     backgroundColor: '#F1F1F1',
//     padding: 10,
//     marginHorizontal: 4,
//     borderRadius: 10,
//   },
//   selectedTab: {
//     backgroundColor: '#000',
//     padding: 10,
//     marginHorizontal: 4,
//     borderRadius: 10,
//   },
//   tabText: { color: '#000', fontWeight: 'bold' },
//   selectedTabText: { color: '#fff', fontWeight: 'bold' },
//   map: { flex: 1 },
//   circleContainer: { position: 'absolute', bottom: 80, flexDirection: 'row', paddingHorizontal: 10 },
//   circle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ccc', marginRight: 10 },
//   modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
//   modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
//   modalText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
// });
