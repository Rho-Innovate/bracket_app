import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton, ProgressBar, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme, skillLevelColors } from '../../constants/theme';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const SKILL_DESCRIPTIONS: Record<string, string> = {
  Beginner: 'New to the sport or still learning fundamentals',
  Intermediate: 'Comfortable with basics, developing strategy',
  Advanced: 'Strong technical skills and competitive experience',
};

interface SkillLevelScreenProps {
  selectedSports: string[];
  onContinue: (skillLevels: Record<string, string>) => void;
  onBack: () => void;
}

export default function SkillLevelScreen({
  selectedSports,
  onContinue,
  onBack,
}: SkillLevelScreenProps) {
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});

  const setSkillLevel = (sport: string, level: string) => {
    setSkillLevels((prev) => ({
      ...prev,
      [sport]: level,
    }));
  };

  const allSportsHaveLevel = selectedSports.every(
    (sport) => skillLevels[sport]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBack}
          iconColor={AppTheme.colors.primary}
        />
        <ProgressBar
          progress={0.66}
          color={AppTheme.colors.primary}
          style={styles.progressBar}
        />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          What's your skill level?
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          This helps us match you with players of similar ability
        </Text>

        <ScrollView
          style={styles.sportsContainer}
          contentContainerStyle={styles.sportsContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedSports.map((sport) => (
            <Surface key={sport} style={styles.sportCard} elevation={0}>
              <Text variant="titleMedium" style={styles.sportName}>
                {sport}
              </Text>
              <View style={styles.levelsContainer}>
                {SKILL_LEVELS.map((level) => {
                  const isSelected = skillLevels[sport] === level;
                  return (
                    <Chip
                      key={`${sport}-${level}`}
                      mode="flat"
                      selected={isSelected}
                      onPress={() => setSkillLevel(sport, level)}
                      style={[
                        styles.levelChip,
                        isSelected && {
                          backgroundColor: skillLevelColors[level],
                        },
                      ]}
                      textStyle={[
                        styles.levelChipText,
                        isSelected && styles.levelChipTextSelected,
                      ]}
                      showSelectedCheck={false}
                    >
                      {level}
                    </Chip>
                  );
                })}
              </View>
              {skillLevels[sport] && (
                <Text variant="bodySmall" style={styles.levelDescription}>
                  {SKILL_DESCRIPTIONS[skillLevels[sport]]}
                </Text>
              )}
            </Surface>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.selectionCount}>
          {Object.keys(skillLevels).length} of {selectedSports.length} sports rated
        </Text>
        <Button
          mode="contained"
          onPress={() => onContinue(skillLevels)}
          disabled={!allSportsHaveLevel}
          buttonColor={AppTheme.colors.primary}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginTop: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
  },
  subtitle: {
    color: AppTheme.colors.textSecondary,
    marginBottom: AppTheme.spacing.lg,
  },
  sportsContainer: {
    flex: 1,
  },
  sportsContent: {
    paddingBottom: AppTheme.spacing.md,
    gap: AppTheme.spacing.md,
  },
  sportCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.md,
  },
  sportName: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.sm,
  },
  levelsContainer: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    flexWrap: 'wrap',
  },
  levelChip: {
    backgroundColor: AppTheme.colors.surfaceVariant,
    borderRadius: AppTheme.borderRadius.full,
  },
  levelChipText: {
    color: AppTheme.colors.textSecondary,
    fontSize: 13,
  },
  levelChipTextSelected: {
    color: AppTheme.colors.text,
    fontWeight: '600',
  },
  levelDescription: {
    color: AppTheme.colors.textSecondary,
    marginTop: AppTheme.spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: AppTheme.spacing.lg,
    paddingBottom: AppTheme.spacing.lg,
    paddingTop: AppTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.divider,
  },
  selectionCount: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  button: {
    borderRadius: AppTheme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
});
