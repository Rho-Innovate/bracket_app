//Chai when you are navigating to this page pass the gameId with it so that this code can run

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Alert } from 'react-native';
import { updateEloAfterMatch, getJoinRequests, initializeElo } from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useRoute, RouteProp } from '@react-navigation/native';

type RouteParams = {
  ReportScreen: {
    gameRequestId: string;
  };
};


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
  const route = useRoute<RouteProp<RouteParams, 'ReportScreen'>>();
  const [numSets, setNumSets] = useState(3);
  const [session, setSession] = useState<Session | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [gameRequestId, setGameRequestId] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>({
    set1: { player1: 0, player2: 0 },
    set2: { player1: 0, player2: 0 },
    set3: { player1: 0, player2: 0 },
  });
  
  useEffect(() => {
    console.log('Route params:', route.params);
    console.log('Current gameRequestId:', gameRequestId);
  }, [route.params, gameRequestId]);

  useEffect(() => {
    const fetchOpponentId = async () => {
      if (!gameRequestId || !session?.user?.id) {
        console.log('Missing required data:', { gameRequestId, userId: session?.user?.id });
        return;
      }
      try {
        const joinRequests = await getJoinRequests(null, session?.user?.id || '', {
          game_request_ids: [Number(gameRequestId)]
        });
  
        // Find the accepted join request that isn't from the current user
        const opponentRequest = joinRequests?.find(request => 
          request.status === 'Accepted' && 
          request.user_id !== session?.user?.id
        );
  
        if (opponentRequest) {
          setOpponentId(opponentRequest.user_id);
          console.log('Found opponent ID:', opponentRequest.user_id);
        }
      } catch (error) {
        console.error('Error fetching opponent:', error);
      }
    };
  
    fetchOpponentId();
  }, [gameRequestId, session]);
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session?.user?.id);
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const handleSubmit = async () => {
    try {
      console.log('Scores submitted:', scores);
      
      // Calculate match result
      let hostWins = 0;
      let opponentWins = 0;
      
      Object.values(scores).forEach(set => {
        if (set.player1 > set.player2) hostWins++;
        if (set.player2 > set.player1) opponentWins++;
      });

      // Determine match result (-1, 0, 1)
      let result: -1 | 0 | 1;
      if (hostWins > opponentWins) {
        result = 1; // host win
      } else if (opponentWins > hostWins) {
        result = -1; // host loss
      } else {
        result = 0; // draw
      }

      console.log(opponentId)

      if (!session?.user?.id || !opponentId) {
        Alert.alert('Error', 'Cannot submit scores without opponent information');
        return;
      }

      try {
        await initializeElo(session.user.id, 1);
        await initializeElo(opponentId, 1);
      } catch (error) {
        // Ignore errors from initialization as they likely mean ratings already exist
        console.log('Elo initialization skipped');
      }

      const eloUpdate = await updateEloAfterMatch(
        session.user.id,
        opponentId,
        1, //Hardcoded this 1 in for tennis for now until we have other games
        result
      );

      console.log('Elo update result:', eloUpdate);
      Alert.alert('Success', 'Scores and ratings have been updated');

    } catch (error) {
      console.error('Error submitting scores:', error);
      Alert.alert('Error', 'Failed to submit scores');
    }
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
          <Text style={styles.headerCell}>Host</Text>
          <Text style={styles.headerCell}>Guest</Text>
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