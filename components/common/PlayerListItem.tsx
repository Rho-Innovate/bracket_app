import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, Button, IconButton } from 'react-native-paper';
import { AppTheme } from '@/constants/theme';
import UserAvatar from './UserAvatar';

interface PlayerListItemProps {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  rating?: number;
  ratingChange?: number;
}

/**
 * Reusable player list item component
 */
export default function PlayerListItem({
  firstName,
  lastName,
  username,
  avatarUrl,
  rightContent,
  onPress,
  rating,
  ratingChange,
}: PlayerListItemProps) {
  return (
    <Surface style={styles.container} elevation={0}>
      <UserAvatar avatarUrl={avatarUrl} firstName={firstName} size={48} />

      <View style={styles.info}>
        <Text variant="titleSmall" style={styles.name}>
          {firstName} {lastName ? `${lastName.charAt(0)}.` : ''}
        </Text>
        {username && (
          <Text variant="bodySmall" style={styles.username}>
            @{username}
          </Text>
        )}
        {rating !== undefined && (
          <View style={styles.ratingRow}>
            <Text variant="bodySmall" style={styles.rating}>
              Rating: {Math.round(rating)}
            </Text>
            {ratingChange !== undefined && ratingChange !== 0 && (
              <Text
                variant="bodySmall"
                style={[
                  styles.ratingChange,
                  { color: ratingChange > 0 ? AppTheme.colors.accent : AppTheme.colors.error },
                ]}
              >
                {ratingChange > 0 ? '+' : ''}
                {ratingChange.toFixed(1)}
              </Text>
            )}
          </View>
        )}
      </View>

      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </Surface>
  );
}

// Pre-built action buttons for common use cases
export function AddFriendButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      buttonColor={AppTheme.colors.primary}
      style={styles.actionButton}
    >
      Add
    </Button>
  );
}

export function RemoveFriendButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      mode="outlined"
      onPress={onPress}
      textColor={AppTheme.colors.error}
      style={[styles.actionButton, styles.removeButton]}
    >
      Remove
    </Button>
  );
}

export function AcceptRejectButtons({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.requestButtons}>
      <IconButton
        icon="close"
        iconColor={AppTheme.colors.error}
        size={20}
        onPress={onReject}
      />
      <IconButton
        icon="check"
        iconColor={AppTheme.colors.primary}
        size={20}
        onPress={onAccept}
        style={{ backgroundColor: `${AppTheme.colors.primary}15` }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm,
    borderRadius: AppTheme.borderRadius.md,
    backgroundColor: AppTheme.colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: AppTheme.spacing.sm,
  },
  name: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  username: {
    color: AppTheme.colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.xs,
  },
  rating: {
    color: AppTheme.colors.textSecondary,
  },
  ratingChange: {
    fontWeight: '500',
  },
  rightContent: {
    marginLeft: AppTheme.spacing.sm,
  },
  actionButton: {
    borderRadius: AppTheme.borderRadius.full,
  },
  removeButton: {
    borderColor: AppTheme.colors.error,
  },
  requestButtons: {
    flexDirection: 'row',
  },
});
