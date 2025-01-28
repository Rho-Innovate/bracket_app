import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Leaderboard() {
  const [mode, setMode] = useState('friends'); // 'friends' or 'all'

  const friendsData = [
    { id: '1', name: 'jpyon', score: 432, rank: 1, medal: 'gold' },
    { id: '2', name: 'gaurangp', score: 321, rank: 2, medal: 'silver' },
    { id: '3', name: 'incharac', score: 303, rank: 3, medal: 'bronze' },
    { id: '4', name: 'joesh', score: 294, rank: 4 },
    { id: '5', name: 'ianchiu', score: 286, rank: 5 },
    { id: '6', name: 'racheln', score: 275, rank: 6 },
    { id: '7', name: 'summerl', score: 243, rank: 7 },
    { id: '8', name: 'dayze', score: 209, rank: 8 },
    { id: '9', name: 'ccsekhar', score: 209, rank: 9 },
  ];

  const allPlayersData = [
    { id: '1', name: 'tennispro100', score: 43200, rank: 1, medal: 'gold' },
    { id: '2', name: 'slamdunker05', score: 32100, rank: 2, medal: 'silver' },
    { id: '3', name: 'samsmith', score: 30300, rank: 3, medal: 'bronze' },
    { id: '4', name: 'mikeross', score: 29400, rank: 4 },
    { id: '5', name: 'winstonxgamer', score: 28600, rank: 5 },
    { id: '6', name: 'katiew', score: 27500, rank: 6 },
    { id: '7', name: 'bob10', score: 24300, rank: 7 },
    { id: '8', name: 'ronaldj', score: 20900, rank: 8 },
    { id: '9', name: 'stevethegolfer', score: 20900, rank: 9 },
    { id: '10', name: 'travisscott', score: 20900, rank: 10 },
    { id: '11', name: 'miacook', score: 20900, rank: 11 },
    { id: '12', name: 'dontoliver', score: 20900, rank: 12 },
    { id: '13', name: 'georget', score: 20900, rank: 13 },
  ];

  const displayedData = mode === 'friends' ? friendsData : allPlayersData;

  const renderMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank + (rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th');
    }
  };

  type LeaderboardItem = {
    id: string;
    name: string;
    score: number;
    rank: number;
    medal?: string; // Optional property
  };  

  const renderItem = ({ item }: { item: LeaderboardItem }) => (
    <View
      style={[
        styles.itemContainer,
        mode === 'friends' && item.rank === 4 && styles.greenBackground, // Apply green background only in friends mode and for the 4th player
      ]}
    >
      <Text
        style={[
          styles.rank,
          mode === 'friends' && item.rank === 4 && styles.whiteText, // Apply white text to the rank of the 4th player
        ]}
      >
        {renderMedal(item.rank)}
      </Text>
      <Text
        style={[
          styles.name,
          mode === 'friends' && item.rank === 4 && styles.whiteText, // Apply white text to the name of the 4th player
        ]}
      >
        {item.name}
      </Text>
      <Text
        style={[
          styles.score,
          mode === 'friends' && item.rank === 4 && styles.whiteText, // Apply white text to the score of the 4th player
        ]}
      >
        {item.score}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Leaderboard</Text>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'friends' && styles.activeButton]}
          onPress={() => setMode('friends')}
        >
          <Text style={[styles.toggleText, mode === 'friends' && styles.activeText]}>
            Friends Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'all' && styles.activeButton]}
          onPress={() => setMode('all')}
        >
          <Text style={[styles.toggleText, mode === 'all' && styles.activeText]}>
            All Players
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard */}
      <FlatList
        data={displayedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontWeight:'bold',
    fontSize: 16, // Font size
    textAlign: 'center', // Center text alignment
    marginBottom: 30,
    marginTop: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#0C5B00',
  },
  toggleText: {
    fontSize: 12,
    color: '#000',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 32, 
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 10,
  },
  greenBackground: {
    backgroundColor: '#0C5B00',
    borderRadius: 10,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 3,
    // elevation: 5,
  },
  rank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000', 
    textAlign: 'right',
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Neuzeit Grotesk',
    color: '#000',
    flex: 1,
    marginLeft: 36,
    textAlign: 'left',
  },
  score: {
    fontSize: 14,
    fontFamily: 'Neuzeit Grotesk',
    color: '#333',
    textAlign: 'right',
    width: 80,
    marginRight: 10,
  },
  whiteText: {
    color: '#fff', 
    fontFamily: 'Lexend Deca',
  },
});

