import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';

export default function Profile() {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image
          source={require('./placeholder.png')} // Replace this with your avatar image
          style={styles.avatar}
          resizeMode="stretch"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>Josh Shih</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>345</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>13</Text>
              <Text style={styles.statLabel}>Interests</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>256</Text>
              <Text style={styles.statLabel}>RSVPs</Text>
            </View>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.buttonText}>Share profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Soccer Rank Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Soccer</Text>
          <Text style={styles.rankLabel}>Rank</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.rankStart}>XX</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '30%' }]} />
          </View>
          <Text style={styles.rankEnd}>XXI</Text>
        </View>
        <Text style={styles.progressText}>9124/30000</Text>
      </View>

      {/* Experience Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.experienceLabel}>⭐</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '67%' }]} />
          </View>
          <Text style={styles.experiencePoints}>6734/10000</Text>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsLabel}>Achievements</Text>
        <Text style={styles.achievementsPoints}>758/900</Text>
      </View>

      {/* Description Section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionLabel}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Enter your description here"
          multiline
        />
      </View>
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
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 166.8, 
    height: 360, 
    marginRight: 20,
    backgroundColor: '#ddd', 
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 70,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  buttonsContainer: {
    flexDirection: 'column', 
    justifyContent: 'center',
    alignItems: 'stretch', 
  },
  editButton: {
    backgroundColor: '#f3f3f3',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  shareButton: {
    backgroundColor: '#f3f3f3',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankLabel: {
    fontSize: 16,
    color: '#555',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rankStart: {
    fontSize: 16,
    marginRight: 10,
  },
  rankEnd: {
    fontSize: 16,
    marginLeft: 10,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6A0DAD',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  experienceLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  experiencePoints: {
    fontSize: 16,
    marginLeft: 10,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderColor: '#0C5B00',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  achievementsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C5B00',
  },
  achievementsPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 80,
    padding: 10,
    textAlignVertical: 'top',
  },
});
