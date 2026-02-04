import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  getGameParticipants,
  reportUser,
  submitGameResult,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '../text';
import { showError, showSuccess } from '@/utils/errorHandler';
import { GameParticipant } from '@/lib/supabase/types';

interface ResultSubmissionParams {
  gameId: number;
}

type RootStackParamList = {
  ResultSubmission: ResultSubmissionParams;
  GameDetail: { gameId: number };
};

// Extended participant type with profile info
interface ParticipantWithProfile extends GameParticipant {
  profiles?: {
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string;
  };
}

export default function ResultSubmissionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResultSubmission'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { gameId } = route.params;
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);

  // Form state
  const [winnerTeam, setWinnerTeam] = useState<number | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState('');
  const [scoreTeam2, setScoreTeam2] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [selectedReportUser, setSelectedReportUser] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('result_dispute');

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getGameParticipants(gameId);
        setParticipants(data);
      } catch (error) {
        showError(error, 'Failed to Load Participants');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [gameId]);

  const team1 = participants.filter(p => p.team === 1);
  const team2 = participants.filter(p => p.team === 2);
  const hasTeams = team1.length > 0 && team2.length > 0;

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    if (winnerTeam === null) {
      Alert.alert('Error', 'Please select the winner');
      return;
    }

    try {
      setSubmitting(true);
      await submitGameResult(
        gameId,
        session.user.id,
        winnerTeam,
        scoreTeam1 ? parseInt(scoreTeam1) : undefined,
        scoreTeam2 ? parseInt(scoreTeam2) : undefined
      );
      Alert.alert('Success', 'Result submitted!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: unknown) {
      showError(error, 'Failed to Submit Result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!session?.user?.id || !selectedReportUser) return;

    try {
      await reportUser(
        session.user.id,
        selectedReportUser,
        reportReason as 'result_dispute' | 'no_show' | 'unsportsmanlike' | 'cheating' | 'other',
        gameId,
        'Result dispute'
      );
      showSuccess('Thank you for your report. Our team will review it.', 'Report Submitted');
      setShowDispute(false);
      setSelectedReportUser(null);
    } catch (error: unknown) {
      showError(error, 'Failed to Submit Report');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F622A" />
      </View>
    );
  }

  const renderTeamOption = (team: number, label: string, teamMembers: any[]) => (
    <TouchableOpacity
      style={[
        styles.teamOption,
        winnerTeam === team && styles.teamOptionSelected,
      ]}
      onPress={() => setWinnerTeam(team)}
    >
      <View style={styles.teamHeader}>
        <View style={[styles.radioOuter, winnerTeam === team && styles.radioOuterSelected]}>
          {winnerTeam === team && <View style={styles.radioInner} />}
        </View>
        <Text style={[styles.teamLabel, winnerTeam === team && styles.teamLabelSelected]}>
          {label}
        </Text>
      </View>
      {teamMembers.length > 0 && (
        <View style={styles.teamMembers}>
          {teamMembers.map((member) => (
            <Text key={member.user_id} style={styles.memberName}>
              {member.profiles?.first_name} {member.profiles?.last_name?.charAt(0)}.
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderOpponents = () => {
    // For reporting, show opponents (not the current user)
    const currentUserTeam = participants.find(p => p.user_id === session?.user?.id)?.team;
    const opponents = participants.filter(
      p => p.user_id !== session?.user?.id && (currentUserTeam ? p.team !== currentUserTeam : true)
    );

    return opponents.map((opponent) => (
      <TouchableOpacity
        key={opponent.user_id}
        style={[
          styles.reportUserOption,
          selectedReportUser === opponent.user_id && styles.reportUserOptionSelected,
        ]}
        onPress={() => setSelectedReportUser(opponent.user_id)}
      >
        <View style={styles.radioOuter}>
          {selectedReportUser === opponent.user_id && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.reportUserName}>
          {opponent.profiles?.first_name} {opponent.profiles?.last_name}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Submit Result</Text>
          <Text style={styles.subtitle}>Select who won the game</Text>

          {/* Winner selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Winner</Text>

            {hasTeams ? (
              <>
                {renderTeamOption(1, 'Team 1', team1)}
                {renderTeamOption(2, 'Team 2', team2)}
              </>
            ) : (
              <>
                {participants.map((p, index) => (
                  <TouchableOpacity
                    key={p.user_id}
                    style={[
                      styles.teamOption,
                      winnerTeam === index + 1 && styles.teamOptionSelected,
                    ]}
                    onPress={() => setWinnerTeam(index + 1)}
                  >
                    <View style={styles.teamHeader}>
                      <View style={[
                        styles.radioOuter,
                        winnerTeam === index + 1 && styles.radioOuterSelected
                      ]}>
                        {winnerTeam === index + 1 && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[
                        styles.teamLabel,
                        winnerTeam === index + 1 && styles.teamLabelSelected
                      ]}>
                        {p.profiles?.first_name} {p.profiles?.last_name?.charAt(0)}.
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Draw option */}
            <TouchableOpacity
              style={[
                styles.teamOption,
                winnerTeam === 0 && styles.teamOptionSelected,
              ]}
              onPress={() => setWinnerTeam(0)}
            >
              <View style={styles.teamHeader}>
                <View style={[styles.radioOuter, winnerTeam === 0 && styles.radioOuterSelected]}>
                  {winnerTeam === 0 && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.teamLabel, winnerTeam === 0 && styles.teamLabelSelected]}>
                  Draw
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Score input (optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score (Optional)</Text>
            <View style={styles.scoreInputs}>
              <View style={styles.scoreInputWrapper}>
                <Text style={styles.scoreLabel}>{hasTeams ? 'Team 1' : 'Player 1'}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={scoreTeam1}
                  onChangeText={setScoreTeam1}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.scoreSeparator}>-</Text>
              <View style={styles.scoreInputWrapper}>
                <Text style={styles.scoreLabel}>{hasTeams ? 'Team 2' : 'Player 2'}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={scoreTeam2}
                  onChangeText={setScoreTeam2}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Dispute section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.disputeToggle}
              onPress={() => setShowDispute(!showDispute)}
            >
              <Text style={styles.disputeToggleText}>
                {showDispute ? 'Hide dispute form' : 'Report a problem?'}
              </Text>
            </TouchableOpacity>

            {showDispute && (
              <View style={styles.disputeForm}>
                <Text style={styles.disputeTitle}>Report User</Text>
                <Text style={styles.disputeSubtitle}>
                  Select the user you want to report and the reason
                </Text>

                <View style={styles.reportUsers}>
                  {renderOpponents()}
                </View>

                <View style={styles.reportReasons}>
                  {[
                    { value: 'result_dispute', label: 'Result Dispute' },
                    { value: 'no_show', label: 'No Show' },
                    { value: 'unsportsmanlike', label: 'Unsportsmanlike Conduct' },
                  ].map((reason) => (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonOption,
                        reportReason === reason.value && styles.reasonOptionSelected,
                      ]}
                      onPress={() => setReportReason(reason.value)}
                    >
                      <Text style={[
                        styles.reasonText,
                        reportReason === reason.value && styles.reasonTextSelected
                      ]}>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.reportButton,
                    !selectedReportUser && styles.reportButtonDisabled,
                  ]}
                  onPress={handleReport}
                  disabled={!selectedReportUser}
                >
                  <Text style={styles.reportButtonText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, winnerTeam === null && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={winnerTeam === null || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Result'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  teamOption: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamOptionSelected: {
    borderColor: '#274B0D',
    backgroundColor: '#E8F5E9',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#274B0D',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#274B0D',
  },
  teamLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  teamLabelSelected: {
    color: '#274B0D',
  },
  teamMembers: {
    marginTop: 8,
    marginLeft: 36,
  },
  memberName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInputWrapper: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  scoreInput: {
    width: 80,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginHorizontal: 20,
  },
  disputeToggle: {
    padding: 12,
    alignItems: 'center',
  },
  disputeToggleText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '500',
  },
  disputeForm: {
    backgroundColor: '#FFF3F3',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 4,
  },
  disputeSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  reportUsers: {
    marginBottom: 16,
  },
  reportUserOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reportUserOptionSelected: {
    borderColor: '#f44336',
  },
  reportUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  reportReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  reasonOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reasonOptionSelected: {
    borderColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
  },
  reasonTextSelected: {
    color: '#f44336',
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: '#274B0D',
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
