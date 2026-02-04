import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { AppTheme, gameStateColors, gameStateLabels } from '@/constants/theme';
import { getSportName } from '@/constants/sports';
import { formatDate } from '@/utils/formatters';
import UserAvatar from './UserAvatar';
import type { GameState } from '@/lib/supabase/types';

interface GameCardProps {
  id: number;
  description?: string;
  requestedTime?: string;
  sportId: number;
  currentPlayers: number;
  maxPlayers: number;
  gameState?: GameState;
  host?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  onPress?: () => void;
  children?: React.ReactNode;
}

/**
 * Reusable game card component for displaying game/event information
 */
export default function GameCard({
  description,
  requestedTime,
  sportId,
  currentPlayers,
  maxPlayers,
  gameState,
  host,
  onPress,
  children,
}: GameCardProps) {
  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.title}>
              {description || 'No description provided'}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {requestedTime ? formatDate(requestedTime) : 'Time TBD'}
            </Text>
            <Text variant="bodySmall" style={styles.hostName}>
              {host
                ? `Host: ${host.first_name || 'Unknown'}${host.last_name ? ` ${host.last_name.charAt(0)}.` : ''}`
                : 'Host: Unknown'}
            </Text>
          </View>
          <UserAvatar
            avatarUrl={host?.avatar_url}
            firstName={host?.first_name}
            size={50}
          />
        </View>

        <View style={styles.tagsRow}>
          <Chip mode="flat" style={styles.sportChip} textStyle={styles.sportChipText}>
            {getSportName(sportId, 'Sport')}
          </Chip>
          {gameState && gameState !== 'scheduled' && (
            <Chip
              mode="flat"
              style={[styles.stateChip, { backgroundColor: gameStateColors[gameState] }]}
              textStyle={styles.stateChipText}
            >
              {gameStateLabels[gameState]}
            </Chip>
          )}
          <Text variant="labelMedium" style={styles.playerCount}>
            {currentPlayers}/{maxPlayers}
          </Text>
        </View>

        {children}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: AppTheme.spacing.sm,
    backgroundColor: AppTheme.colors.background,
    borderRadius: AppTheme.borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppTheme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: AppTheme.spacing.sm,
  },
  title: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.xs,
  },
  date: {
    color: AppTheme.colors.textSecondary,
    marginBottom: 2,
  },
  hostName: {
    color: AppTheme.colors.secondary,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
  },
  sportChip: {
    backgroundColor: `${AppTheme.colors.primary}15`,
  },
  sportChipText: {
    color: AppTheme.colors.primary,
    fontSize: 12,
  },
  stateChip: {
    backgroundColor: '#2196F3',
  },
  stateChipText: {
    color: '#fff',
    fontSize: 12,
  },
  playerCount: {
    color: AppTheme.colors.textSecondary,
    marginLeft: 'auto',
  },
});
