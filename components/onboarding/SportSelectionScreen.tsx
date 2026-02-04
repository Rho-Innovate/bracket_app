import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '../../constants/theme';
import { SPORTS } from '../../constants/sports';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SportSelectionScreenProps {
  onContinue: (selectedSports: string[]) => void;
  onBack: () => void;
}

export default function SportSelectionScreen({
  onContinue,
  onBack,
}: SportSelectionScreenProps) {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const toggleSport = (sportName: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportName)
        ? prev.filter((s) => s !== sportName)
        : [...prev, sportName]
    );
  };

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
          progress={0.33}
          color={AppTheme.colors.primary}
          style={styles.progressBar}
        />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          What sports do you play?
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Select all that apply. You can add more later.
        </Text>

        <ScrollView
          style={styles.sportsContainer}
          contentContainerStyle={styles.sportsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sportsGrid}>
            {SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport.name);
              return (
                <Button
                  key={sport.id}
                  mode={isSelected ? 'contained' : 'outlined'}
                  onPress={() => toggleSport(sport.name)}
                  style={[
                    styles.sportButton,
                    isSelected && styles.sportButtonSelected,
                  ]}
                  labelStyle={[
                    styles.sportButtonLabel,
                    isSelected && styles.sportButtonLabelSelected,
                  ]}
                  buttonColor={isSelected ? AppTheme.colors.primary : undefined}
                  icon={() => (
                    <Ionicons
                      name={sport.icon as any}
                      size={20}
                      color={isSelected ? '#fff' : AppTheme.colors.primary}
                    />
                  )}
                >
                  {sport.name}
                </Button>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.selectionCount}>
          {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
        </Text>
        <Button
          mode="contained"
          onPress={() => onContinue(selectedSports)}
          disabled={selectedSports.length === 0}
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
