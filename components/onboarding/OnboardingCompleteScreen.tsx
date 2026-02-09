import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface OnboardingCompleteScreenProps {
  onComplete: () => void;
  loading?: boolean;
}

export default function OnboardingCompleteScreen({
  onComplete,
  loading = false,
}: OnboardingCompleteScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <ProgressBar
          progress={1}
          color={AppTheme.colors.primary}
          style={styles.progressBar}
        />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={100}
            color={AppTheme.colors.accent}
          />
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          You're All Set!
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Your profile is ready. Start competing and climb the leaderboards!
        </Text>

        <View style={styles.tipsContainer}>
          <Text variant="titleSmall" style={styles.tipsTitle}>
            Quick Tips
          </Text>

          <View style={styles.tipItem}>
            <Ionicons
              name="search"
              size={20}
              color={AppTheme.colors.primary}
              style={styles.tipIcon}
            />
            <Text variant="bodyMedium" style={styles.tipText}>
              Use matchmaking to find players at your skill level
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons
              name="add-circle"
              size={20}
              color={AppTheme.colors.primary}
              style={styles.tipIcon}
            />
            <Text variant="bodyMedium" style={styles.tipText}>
              Create a game to host matches in your area
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons
              name="podium"
              size={20}
              color={AppTheme.colors.primary}
              style={styles.tipIcon}
            />
            <Text variant="bodyMedium" style={styles.tipText}>
              Check leaderboards to see how you rank
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={onComplete}
          loading={loading}
          disabled={loading}
          buttonColor={AppTheme.colors.primary}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Start Playing
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
    paddingHorizontal: AppTheme.spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: AppTheme.spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: AppTheme.colors.text,
    textAlign: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  subtitle: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: AppTheme.spacing.xl,
    paddingHorizontal: AppTheme.spacing.md,
  },
  tipsContainer: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.md,
    width: '100%',
  },
  tipsTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  tipIcon: {
    marginRight: AppTheme.spacing.sm,
  },
  tipText: {
    flex: 1,
    color: AppTheme.colors.textSecondary,
  },
  footer: {
    paddingHorizontal: AppTheme.spacing.lg,
    paddingBottom: AppTheme.spacing.lg,
  },
  button: {
    borderRadius: AppTheme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
});
