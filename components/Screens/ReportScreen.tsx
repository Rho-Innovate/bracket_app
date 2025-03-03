//Need routes to report scores

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

type Scores = {
  [key: string]: {
    player1: number;
    player2: number;
  };
};

type ScoreButtonProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const ScoreButton = ({ value, onIncrement, onDecrement }: ScoreButtonProps) => (
  <View style={styles.scoreContainer}>
    <TouchableOpacity style={styles.controlButton} onPress={onIncrement}>
      <Text style={styles.controlButtonText}>+</Text>
    </TouchableOpacity>
    <Text style={styles.scoreText}>{value}</Text>
    <TouchableOpacity style={styles.controlButton} onPress={onDecrement}>
      <Text style={styles.controlButtonText}>-</Text>
    </TouchableOpacity>
  </View>
);

export default function ReportScreen() {
  const [numSets, setNumSets] = useState(3);
  const [scores, setScores] = useState<Scores>({
    set1: { player1: 0, player2: 0 },
    set2: { player1: 0, player2: 0 },
    set3: { player1: 0, player2: 0 },
  });

  const handleSubmit = () => {
    console.log('Scores submitted:', scores);
  };

  const updateScore = (set: number, player: 'player1' | 'player2', increment: boolean) => {
    setScores(prev => {
      const currentScore = prev[`set${set}`][player];
      const newScore = increment 
        ? Math.min(currentScore + 1, 6)
        : Math.max(currentScore - 1, 0);
      
      return {
        ...prev,
        [`set${set}`]: {
          ...prev[`set${set}`],
          [player]: newScore
        }
      };
    });
  };

  const addSet = () => {
    if (numSets < 5) {
      setNumSets(prev => prev + 1);
      setScores(prev => ({
        ...prev,
        [`set${numSets + 1}`]: { player1: 0, player2: 0 }
      }));
    }
  };

  const removeSet = () => {
    if (numSets > 1) {
      const newScores = { ...scores };
      delete newScores[`set${numSets}`];
      setScores(newScores);
      setNumSets(prev => prev - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How'd the game go?</Text>
      
      <View style={styles.scoreTable}>
        <View style={styles.headerRow}>
          <Text style={styles.headerCell}>Set</Text>
          <Text style={styles.headerCell}>Player 1</Text>
          <Text style={styles.headerCell}>Player 2</Text>
        </View>

        {[...Array(numSets)].map((_, index) => (
          <View key={index + 1} style={styles.row}>
            <Text style={styles.cell}>{index + 1}</Text>
            <View style={styles.scoreCell}>
              <ScoreButton
                value={scores[`set${index + 1}`].player1}
                onIncrement={() => updateScore(index + 1, 'player1', true)}
                onDecrement={() => updateScore(index + 1, 'player1', false)}
              />
            </View>
            <View style={styles.scoreCell}>
              <ScoreButton
                value={scores[`set${index + 1}`].player2}
                onIncrement={() => updateScore(index + 1, 'player2', true)}
                onDecrement={() => updateScore(index + 1, 'player2', false)}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.setControls}>
        <TouchableOpacity 
          style={[styles.setControlButton, numSets <= 1 && styles.disabledButton]}
          onPress={removeSet}
          disabled={numSets <= 1}
        >
          <Text style={styles.setControlText}>- Remove Set</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.setControlButton, numSets >= 5 && styles.disabledButton]}
          onPress={addSet}
          disabled={numSets >= 5}
        >
          <Text style={styles.setControlText}>+ Add Set</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Submit Scores</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F622A',
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreTable: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2F622A',
    padding: 12,
  },
  headerCell: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 12,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginHorizontal: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
  },
  controlButton: {
    width: 30,
    height: 30,
    backgroundColor: '#2F622A',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 18,
    color: '#2F622A',
    fontWeight: 'bold',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  setControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  setControlButton: {
    backgroundColor: '#2F622A',
    padding: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  setControlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: '#2F622A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});