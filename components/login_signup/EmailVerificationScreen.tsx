import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { AppTheme } from '../../constants/theme';
import { resendVerificationEmail } from '../../lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

interface EmailVerificationScreenProps {
  email: string;
  onBackToLogin: () => void;
}

export default function EmailVerificationScreen({
  email,
  onBackToLogin,
}: EmailVerificationScreenProps) {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setResendMessage('');

    try {
      const { error } = await resendVerificationEmail(email);
      if (error) {
        setResendMessage('Failed to resend email. Please try again.');
      } else {
        setResendMessage('Verification email sent!');
        setResendCooldown(60);
      }
    } catch (error) {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBackToLogin}
          iconColor={AppTheme.colors.primary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="mail-outline"
            size={80}
            color={AppTheme.colors.primary}
          />
        </View>

        <Text variant="headlineMedium" style={styles.title}>
          Check Your Email
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          We've sent a verification link to:
        </Text>

        <Text variant="titleMedium" style={styles.email}>
          {email}
        </Text>

        <Text variant="bodyMedium" style={styles.instructions}>
          Click the link in the email to verify your account and complete your
          registration.
        </Text>

        <View style={styles.divider} />

        <Text variant="bodyMedium" style={styles.didntReceive}>
          Didn't receive the email?
        </Text>

        <Button
          mode="contained"
          onPress={handleResendEmail}
          loading={resending}
          disabled={resending || resendCooldown > 0}
          buttonColor={AppTheme.colors.primary}
          style={styles.resendButton}
          contentStyle={styles.resendButtonContent}
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend Email'}
        </Button>

        {resendMessage && (
          <Text
            variant="bodySmall"
            style={[
              styles.resendMessage,
              resendMessage.includes('Failed')
                ? styles.errorMessage
                : styles.successMessage,
            ]}
          >
            {resendMessage}
          </Text>
        )}

        <Button
          mode="text"
          onPress={onBackToLogin}
          textColor={AppTheme.colors.textSecondary}
          style={styles.backButton}
        >
          Back to Sign In
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: AppTheme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: AppTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${AppTheme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.lg,
  },
  title: {
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.md,
    textAlign: 'center',
  },
  description: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  email: {
    color: AppTheme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: AppTheme.spacing.md,
  },
  instructions: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: AppTheme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: AppTheme.colors.divider,
    width: '100%',
    marginVertical: AppTheme.spacing.lg,
  },
  didntReceive: {
    color: AppTheme.colors.textSecondary,
    marginBottom: AppTheme.spacing.md,
  },
  resendButton: {
    borderRadius: AppTheme.borderRadius.md,
    minWidth: 200,
  },
  resendButtonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
  resendMessage: {
    marginTop: AppTheme.spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    color: AppTheme.colors.accent,
  },
  errorMessage: {
    color: AppTheme.colors.error,
  },
  backButton: {
    marginTop: AppTheme.spacing.lg,
  },
});
