import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import { AppTheme } from '@/constants/theme';

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string;
  size?: number;
  style?: object;
}

/**
 * Reusable user avatar component that displays either an image or initials
 */
export default function UserAvatar({
  avatarUrl,
  firstName,
  size = 48,
  style,
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <Avatar.Image
        size={size}
        source={{ uri: avatarUrl }}
        style={style}
      />
    );
  }

  return (
    <Avatar.Text
      size={size}
      label={firstName?.charAt(0)?.toUpperCase() || '?'}
      style={[styles.placeholder, style]}
      labelStyle={styles.placeholderLabel}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: AppTheme.colors.surfaceVariant,
  },
  placeholderLabel: {
    color: AppTheme.colors.textSecondary,
  },
});
