import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Chip, Divider, Surface, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme, skillLevelColors } from '@/constants/theme';
import { fetchOwnProfile } from '@/lib/supabase';

interface UserProfileModalProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

interface UserProfileData {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  description?: string;
  sports_preferences?: Array<{
    sport: string;
    skill_level: string;
    years_experience?: number;
  }>;
}

export default function UserProfileModal({ visible, userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadProfile();
    }
  }, [visible, userId]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await fetchOwnProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile && !loading) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Surface style={styles.container} elevation={4}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>Player Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={AppTheme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : profile ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeader}>
                {profile.avatar_url ? (
                  <Avatar.Image size={80} source={{ uri: profile.avatar_url }} />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={profile.first_name?.charAt(0) || '?'}
                    style={styles.avatarPlaceholder}
                    labelStyle={styles.avatarLabel}
                  />
                )}
                <View style={styles.nameContainer}>
                  <Text variant="titleLarge" style={styles.name}>
                    {profile.first_name} {profile.last_name}
                  </Text>
                  {profile.username && (
                    <Text variant="bodyMedium" style={styles.username}>
                      @{profile.username}
                    </Text>
                  )}
                </View>
              </View>

              {profile.description && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.sectionTitle}>About</Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {profile.description}
                  </Text>
                </>
              )}

              {profile.sports_preferences && profile.sports_preferences.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.sectionTitle}>Sports</Text>
                  <View style={styles.sportsContainer}>
                    {profile.sports_preferences.map((sport, index) => (
                      <View key={index} style={styles.sportItem}>
                        <Text variant="bodyMedium" style={styles.sportName}>
                          {sport.sport}
                        </Text>
                        <Chip
                          mode="flat"
                          style={{
                            backgroundColor: skillLevelColors[sport.skill_level] || AppTheme.colors.surfaceVariant,
                          }}
                          textStyle={styles.skillChipText}
                        >
                          {sport.skill_level}
                        </Chip>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Profile not found</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
            buttonColor={AppTheme.colors.primary}
          >
            Close
          </Button>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: AppTheme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: AppTheme.colors.textSecondary,
  },
  content: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: AppTheme.colors.surfaceVariant,
  },
  avatarLabel: {
    color: AppTheme.colors.textSecondary,
    fontSize: 32,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  username: {
    color: AppTheme.colors.primary,
    marginTop: 2,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: 8,
  },
  description: {
    color: AppTheme.colors.textSecondary,
    lineHeight: 22,
  },
  sportsContainer: {
    gap: 12,
  },
  sportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    padding: 12,
    borderRadius: AppTheme.borderRadius.md,
  },
  sportName: {
    fontWeight: '500',
    color: AppTheme.colors.text,
  },
  skillChipText: {
    fontSize: 12,
  },
  closeButton: {
    marginTop: 8,
  },
});
