import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Text as CustomText } from '../text';

export default function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <CustomText style={styles.comingSoonText}>📊 Coming Soon!</CustomText>
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


// export default function Leaderboard() {
//   const [mode, setMode] = useState('friends'); // Current mode ('friends' or 'all')
//   const [friendsData, setFriendsData] = useState([]); // Friends leaderboard data
//   const [allPlayersData, setAllPlayersData] = useState([]); // Global leaderboard data

//   // Fetch leaderboard data from the database
//   useEffect(() => {
//     if (mode === 'friends') {
//       // Fetch friends leaderboard data from the database
//       fetchFriendsData();
//     } else {
//       // Fetch global leaderboard data from the database
//       fetchAllPlayersData();
//     }
//   }, [mode]);

//   const fetchFriendsData = async () => {
//     try {
//       // Replace this with your database query/API call
//       // Example: const response = await fetch('https://your-api.com/friends-leaderboard');
//       // const data = await response.json();
//       const data = [
//         { id: '1', name: 'jpyon', score: 432, rank: 1, medal: 'gold' },
//         { id: '2', name: 'gaurangp', score: 321, rank: 2, medal: 'silver' },
//         { id: '3', name: 'incharac', score: 303, rank: 3, medal: 'bronze' },
//         { id: '4', name: 'joesh', score: 294, rank: 4 },
//         { id: '5', name: 'ianchiu', score: 286, rank: 5 },
//       ];
//       setFriendsData(data); // Update state with fetched data
//     } catch (error) {
//       console.error('Error fetching friends leaderboard data:', error);
//     }
//   };

//   const fetchAllPlayersData = async () => {
//     try {
//       // Replace this with your database query/API call
//       // Example: const response = await fetch('https://your-api.com/global-leaderboard');
//       // const data = await response.json();
//       const data = [
//         { id: '1', name: 'tennispro100', score: 43200, rank: 1, medal: 'gold' },
//         { id: '2', name: 'slamdunker05', score: 32100, rank: 2, medal: 'silver' },
//         { id: '3', name: 'samsmith', score: 30300, rank: 3, medal: 'bronze' },
//         { id: '4', name: 'mikeross', score: 29400, rank: 4 },
//         { id: '5', name: 'winstonxgamer', score: 28600, rank: 5 },
//       ];
//       setAllPlayersData(data); // Update state with fetched data
//     } catch (error) {
//       console.error('Error fetching global leaderboard data:', error);
//     }
//   };

//   const displayedData = mode === 'friends' ? friendsData : allPlayersData;

//   // Render medal or rank as text
//   const renderMedal = (rank: number) => {
//     switch (rank) {
//       case 1:
//         return '🥇';
//       case 2:
//         return '🥈';
//       case 3:
//         return '🥉';
//       default:
//         return rank + (rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th');
//     }
//   };

//   // Render individual leaderboard item
//   const renderItem = ({ item }: { item: typeof friendsData[0] }) => (
//     <View
//       style={[
//         styles.itemContainer,
//         mode === 'friends' && item.rank === 4 && styles.greenBackground, // Highlight 4th-ranked friend
//       ]}
//     >
//       <Text style={[styles.rank, mode === 'friends' && item.rank === 4 && styles.whiteText]}>
//         {renderMedal(item.rank)}
//       </Text>
//       <Text style={[styles.name, mode === 'friends' && item.rank === 4 && styles.whiteText]}>
//         {item.name}
//       </Text>
//       <Text style={[styles.score, mode === 'friends' && item.rank === 4 && styles.whiteText]}>
//         {item.score}
//       </Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Title */}
//       <Text style={styles.title}>Leaderboard</Text>

//       {/* Toggle between modes */}
//       <View style={styles.toggleContainer}>
//         <TouchableOpacity
//           style={[styles.toggleButton, mode === 'friends' && styles.activeButton]}
//           onPress={() => setMode('friends')}
//         >
//           <Text style={[styles.toggleText, mode === 'friends' && styles.activeText]}>Friends Only</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.toggleButton, mode === 'all' && styles.activeButton]}
//           onPress={() => setMode('all')}
//         >
//           <Text style={[styles.toggleText, mode === 'all' && styles.activeText]}>All Players</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Leaderboard list */}
//       <FlatList
//         data={displayedData}
//         renderItem={renderItem}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.list}
//       />
//     </View>
//   );
// }

// // Stylesheet
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10 },
//   title: { fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 30, marginTop: 15 },
//   toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
//   toggleButton: { flex: 1, paddingVertical: 10, backgroundColor: '#ddd', marginHorizontal: 5, borderRadius: 10, alignItems: 'center' },
//   activeButton: { backgroundColor: '#0C5B00' },
//   toggleText: { fontSize: 12, color: '#000' },
//   activeText: { color: '#fff', fontWeight: 'bold' },
//   list: { paddingBottom: 20 },
//   itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
//   greenBackground: { backgroundColor: '#0C5B00', borderRadius: 10 },
//   rank: { fontSize: 14, fontWeight: 'bold', color: '#000', textAlign: 'right', marginLeft: 10 },
//   name: { fontSize: 14, color: '#000', flex: 1, marginLeft: 36, textAlign: 'left' },
//   score: { fontSize: 14, color: '#333', textAlign: 'right', width: 80, marginRight: 10 },
//   whiteText: { color: '#fff' },
// });