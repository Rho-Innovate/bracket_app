import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppTheme } from '../../constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={icon as any}
        size={64}
        color={AppTheme.colors.textMuted}
        style={styles.icon}
      />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          buttonColor={AppTheme.colors.primary}
          style={styles.button}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: AppTheme.spacing.xl,
    paddingVertical: AppTheme.spacing.xl * 2,
  },
  icon: {
    marginBottom: AppTheme.spacing.md,
  },
  title: {
    color: AppTheme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: AppTheme.spacing.sm,
  },
  message: {
    color: AppTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: AppTheme.spacing.lg,
  },
  button: {
    borderRadius: AppTheme.borderRadius.md,
  },
});
