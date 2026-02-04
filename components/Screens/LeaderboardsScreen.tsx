import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import {
  getAllSportsConfig,
  getSportLeaderboard,
  SportConfig,
  TrueSkillRating,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '../../constants/theme';
import { getSportName } from '../../constants/sports';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';

interface LeaderboardEntry extends TrueSkillRating {
  conservative_rating: number;
  rank: number;
  profiles?: {
    username?: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export default function LeaderboardsScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState<SportConfig[]>([]);
  const [selectedSport, setSelectedSport] = useState<number>(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const data = await getAllSportsConfig();
        setSports(data);
        if (data.length > 0) {
          setSelectedSport(data[0].sport_id);
        }
      } catch (error) {
        console.error('Error fetching sports:', error);
      }
    };
    fetchSports();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getSportLeaderboard(selectedSport, 50);
        setLeaderboard(data);

        if (session?.user?.id) {
          const userEntry = data.find((entry) => entry.user_id === session.user.id);
          setUserRank(userEntry?.rank || null);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSport) {
      fetchLeaderboard();
    }
  }, [selectedSport, session?.user?.id]);

  const renderMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `#${rank}`;
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user_id === session?.user?.id;

    return (
      <View
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
        ]}
      >
        <View style={styles.rankContainer}>
          <Text
            style={[
              styles.rankText,
              item.rank <= 3 && styles.topRankText,
            ]}
          >
            {renderMedal(item.rank)}
          </Text>
        </View>

        {item.profiles?.avatar_url ? (
          <Image
            source={{ uri: item.profiles.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.profiles?.first_name?.charAt(0) || '?'}
            </Text>
          </View>
        )}

        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isCurrentUser && styles.currentUserText]}>
            {item.profiles?.first_name} {item.profiles?.last_name?.charAt(0)}.
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.gamesPlayed}>
            {item.games_played} game{item.games_played !== 1 ? 's' : ''} played
          </Text>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, isCurrentUser && styles.currentUserText]}>
            {item.conservative_rating.toFixed(0)}
          </Text>
          <Text style={styles.ratingLabel}>Rating</Text>
        </View>
      </View>
    );
  };

  const renderSportTabs = () => (
    <View style={styles.sportTabsContainer}>
      <FlatList
        horizontal
        data={sports}
        keyExtractor={(item) => item.sport_id.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.sportTab,
              selectedSport === item.sport_id && styles.sportTabActive,
            ]}
            onPress={() => setSelectedSport(item.sport_id)}
          >
            <Text
              style={[
                styles.sportTabText,
                selectedSport === item.sport_id && styles.sportTabTextActive,
              ]}
            >
              {item.sport_name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.sportTabsContent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Leaderboards" />

      {renderSportTabs()}

      {loading ? (
        <LoadingState message="Loading rankings..." />
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon="podium-outline"
          title="No Rankings Yet"
          message={`Be the first to play ${getSportName(selectedSport)}!`}
        />
      ) : (
        <>
          {userRank && (
            <View style={styles.userRankCard}>
              <Text style={styles.userRankLabel}>Your Rank</Text>
              <Text style={styles.userRankValue}>#{userRank}</Text>
              <Text style={styles.userRankSport}>
                in {getSportName(selectedSport)}
              </Text>
            </View>
          )}

          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={10}
            getItemLayout={(_, index) => ({
              length: 64, // Approximate item height
              offset: 64 * index,
              index,
            })}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  sportTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: AppTheme.colors.divider,
  },
  sportTabsContent: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.sm,
  },
  sportTab: {
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: AppTheme.spacing.sm,
    borderRadius: AppTheme.borderRadius.full,
    backgroundColor: AppTheme.colors.surfaceVariant,
    marginRight: AppTheme.spacing.sm,
  },
  sportTabActive: {
    backgroundColor: AppTheme.colors.primaryDark,
  },
  sportTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppTheme.colors.textSecondary,
  },
  sportTabTextActive: {
    color: '#fff',
  },
  userRankCard: {
    backgroundColor: `${AppTheme.colors.accent}20`,
    margin: AppTheme.spacing.md,
    padding: AppTheme.spacing.lg,
    borderRadius: AppTheme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppTheme.colors.primaryDark,
  },
  userRankLabel: {
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
    marginBottom: AppTheme.spacing.xs,
  },
  userRankValue: {
    fontSize: 32,
    fontWeight: '700',
    color: AppTheme.colors.primaryDark,
  },
  userRankSport: {
    fontSize: 14,
    color: AppTheme.colors.textSecondary,
    marginTop: AppTheme.spacing.xs,
  },
  listContent: {
    padding: AppTheme.spacing.md,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppTheme.spacing.sm,
    paddingHorizontal: AppTheme.spacing.md,
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    marginBottom: AppTheme.spacing.sm,
  },
  currentUserItem: {
    backgroundColor: `${AppTheme.colors.accent}20`,
    borderWidth: 2,
    borderColor: AppTheme.colors.primaryDark,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppTheme.colors.textSecondary,
  },
  topRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppTheme.colors.primary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: AppTheme.spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppTheme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppTheme.spacing.sm,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: AppTheme.colors.textSecondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: 2,
  },
  currentUserText: {
    color: AppTheme.colors.primaryDark,
  },
  gamesPlayed: {
    fontSize: 12,
    color: AppTheme.colors.textMuted,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  ratingLabel: {
    fontSize: 10,
    color: AppTheme.colors.textMuted,
  },
});
