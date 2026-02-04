import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { AppTheme } from '../../constants/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export default function LoadingState({
  message,
  size = 'large',
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={AppTheme.colors.primary} />
      {message && (
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
  },
  message: {
    marginTop: AppTheme.spacing.md,
    color: AppTheme.colors.textSecondary,
  },
});
