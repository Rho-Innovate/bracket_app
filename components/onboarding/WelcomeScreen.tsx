import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '../../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface WelcomeScreenProps {
  onContinue: () => void;
  firstName?: string;
}

export default function WelcomeScreen({ onContinue, firstName }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        <Text variant="headlineLarge" style={styles.title}>
          Welcome to Bracket{firstName ? `, ${firstName}` : ''}!
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Let's get you set up to start competing
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="trophy-outline" size={24} color={AppTheme.colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text variant="titleSmall" style={styles.featureTitle}>
                Compete & Improve
              </Text>
              <Text variant="bodySmall" style={styles.featureDesc}>
                Track your skill level and climb the leaderboards
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="people-outline" size={24} color={AppTheme.colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text variant="titleSmall" style={styles.featureTitle}>
                Find Players
              </Text>
              <Text variant="bodySmall" style={styles.featureDesc}>
                Match with players at your skill level
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar-outline" size={24} color={AppTheme.colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text variant="titleSmall" style={styles.featureTitle}>
                Schedule Games
              </Text>
              <Text variant="bodySmall" style={styles.featureDesc}>
                Create or join games in your area
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={onContinue}
          buttonColor={AppTheme.colors.primary}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Get Started
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
  content: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
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
  },
  features: {
    gap: AppTheme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${AppTheme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppTheme.spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: 2,
  },
  featureDesc: {
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
