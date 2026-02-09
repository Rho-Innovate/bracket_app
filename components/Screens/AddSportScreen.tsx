import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppTheme, skillLevelColors } from '../../constants/theme';
import { SPORT_NAMES } from '../../constants/sports';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import {
  supabase,
  fetchOwnProfile,
  addNewSport,
} from '../../lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const SKILL_DESCRIPTIONS: Record<string, string> = {
  Beginner: 'New to the sport or still learning fundamentals',
  Intermediate: 'Comfortable with basics, developing strategy',
  Advanced: 'Strong technical skills and competitive experience',
};

type ProfileStackParamList = {
  Profile: undefined;
  AddSport: undefined;
};

type AddSportScreenProps = {
  navigation: StackNavigationProp<ProfileStackParamList, 'AddSport'>;
};

export default function AddSportScreen({ navigation }: AddSportScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableSports();
  }, []);

  const loadAvailableSports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await fetchOwnProfile(user.id);
      const existingSports = profile?.sports_preferences?.map(
        (p: { sport: string }) => p.sport
      ) || [];

      // Filter out sports already selected by user
      const remaining = SPORT_NAMES.filter(
        (sport) => !existingSports.includes(sport)
      );
      setAvailableSports(remaining);
    } catch (error) {
      console.error('Error loading sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSport = async () => {
    if (!selectedSport || !selectedLevel) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      await addNewSport(user.id, selectedSport, selectedLevel);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add sport');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading sports..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Add Sport"
        showDivider
        leftAction={{
          icon: 'arrow-left',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableSports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={AppTheme.colors.accent}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              All Sports Added
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              You've added all available sports to your profile.
            </Text>
          </View>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select a Sport
            </Text>

            <View style={styles.sportsGrid}>
              {availableSports.map((sport) => {
                const isSelected = selectedSport === sport;
                return (
                  <Button
                    key={sport}
                    mode={isSelected ? 'contained' : 'outlined'}
                    onPress={() => setSelectedSport(sport)}
                    style={[
                      styles.sportButton,
                      isSelected && styles.sportButtonSelected,
                    ]}
                    labelStyle={[
                      styles.sportButtonLabel,
                      isSelected && styles.sportButtonLabelSelected,
                    ]}
                    buttonColor={isSelected ? AppTheme.colors.primary : undefined}
                  >
                    {sport}
                  </Button>
                );
              })}
            </View>

            {selectedSport && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Your Skill Level
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  This sets your starting rating - it will adjust as you play
                </Text>

                <View style={styles.levelsContainer}>
                  {SKILL_LEVELS.map((level) => {
                    const isSelected = selectedLevel === level;
                    return (
                      <Surface
                        key={level}
                        style={[
                          styles.levelCard,
                          isSelected && {
                            borderColor: AppTheme.colors.primary,
                            borderWidth: 2,
                          },
                        ]}
                        elevation={0}
                      >
                        <Button
                          mode="text"
                          onPress={() => setSelectedLevel(level)}
                          style={styles.levelButton}
                          contentStyle={styles.levelButtonContent}
                        >
                          <View style={styles.levelContent}>
                            <Chip
                              mode="flat"
                              style={{
                                backgroundColor: skillLevelColors[level],
                              }}
                              textStyle={styles.levelChipText}
                            >
                              {level}
                            </Chip>
                            <Text
                              variant="bodySmall"
                              style={styles.levelDescription}
                            >
                              {SKILL_DESCRIPTIONS[level]}
                            </Text>
                          </View>
                        </Button>
                      </Surface>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {availableSports.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleAddSport}
            disabled={!selectedSport || !selectedLevel || saving}
            loading={saving}
            buttonColor={AppTheme.colors.primary}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
          >
            Add Sport
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.md,
  },
  sectionSubtitle: {
    color: AppTheme.colors.textSecondary,
    marginBottom: AppTheme.spacing.md,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppTheme.spacing.sm,
  },
  sportButton: {
    borderRadius: AppTheme.borderRadius.lg,
    borderColor: AppTheme.colors.border,
  },
  sportButtonSelected: {
    borderColor: AppTheme.colors.primary,
  },
  sportButtonLabel: {
    color: AppTheme.colors.text,
    fontSize: 14,
  },
  sportButtonLabelSelected: {
    color: '#fff',
  },
  levelsContainer: {
    gap: AppTheme.spacing.sm,
  },
  levelCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  levelButton: {
    borderRadius: 0,
  },
  levelButtonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
  levelContent: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: AppTheme.spacing.sm,
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  levelDescription: {
    color: AppTheme.colors.textSecondary,
    marginTop: AppTheme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.xl * 2,
  },
  emptyTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginTop: AppTheme.spacing.md,
  },
  emptyMessage: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: AppTheme.spacing.sm,
  },
  footer: {
    padding: AppTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.divider,
  },
  addButton: {
    borderRadius: AppTheme.borderRadius.md,
  },
  addButtonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
});
