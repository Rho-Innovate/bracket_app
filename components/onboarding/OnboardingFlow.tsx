import React, { useState } from 'react';
import { Alert } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import SportSelectionScreen from './SportSelectionScreen';
import SkillLevelScreen from './SkillLevelScreen';
import OnboardingCompleteScreen from './OnboardingCompleteScreen';
import {
  updateProfile,
  initializeTrueSkillFromOnboarding,
  completeOnboarding,
} from '../../lib/supabase';

interface OnboardingFlowProps {
  userId: string;
  firstName?: string;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'sports' | 'skills' | 'complete';

export default function OnboardingFlow({
  userId,
  firstName,
  onComplete,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSportsSelected = (sports: string[]) => {
    setSelectedSports(sports);
    setCurrentStep('skills');
  };

  const handleSkillLevelsSet = (levels: Record<string, string>) => {
    setSkillLevels(levels);
    setCurrentStep('complete');
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Create sports preferences array
      const sportsPreferences = selectedSports.map((sport) => ({
        sport,
        skill_level: skillLevels[sport],
        years_experience: 0,
      }));

      // Update profile with sports preferences
      await updateProfile(userId, {
        sports_preferences: sportsPreferences,
      });

      // Initialize TrueSkill ratings for each sport
      await initializeTrueSkillFromOnboarding(userId, sportsPreferences);

      // Mark onboarding as complete
      await completeOnboarding(userId);

      // Navigate to main app
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          firstName={firstName}
          onContinue={() => setCurrentStep('sports')}
        />
      );

    case 'sports':
      return (
        <SportSelectionScreen
          onContinue={handleSportsSelected}
          onBack={() => setCurrentStep('welcome')}
        />
      );

    case 'skills':
      return (
        <SkillLevelScreen
          selectedSports={selectedSports}
          onContinue={handleSkillLevelsSet}
          onBack={() => setCurrentStep('sports')}
        />
      );

    case 'complete':
      return (
        <OnboardingCompleteScreen
          onComplete={handleComplete}
          loading={loading}
        />
      );

    default:
      return null;
  }
}
