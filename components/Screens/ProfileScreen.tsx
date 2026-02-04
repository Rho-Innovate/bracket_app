import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import {
  fetchOwnProfile,
  updateProfile,
  uploadAvatar,
  getUserAllTrueSkillRatings,
  calculateConservativeRating,
  sportNameToId,
  TrueSkillRating,
} from '../../lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AppTheme } from '../../constants/theme';
import Header from '../common/Header';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import AddSportScreen from './AddSportScreen';

type ProfileStackParamList = {
  Profile: undefined;
  AddSport: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

const ProfileStack = createStackNavigator<ProfileStackParamList>();

interface Profile {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  avatar_url?: string;
  description?: string;
  onboarding_completed?: boolean;
  sports_preferences?: {
    sport: string;
    skill_level: string;
    years_experience: number;
  }[];
}

export default function ProfileScreenNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreenContent} />
      <ProfileStack.Screen name="AddSport" component={AddSportScreen} />
    </ProfileStack.Navigator>
  );
}

function ProfileScreenContent({ navigation }: { navigation: ProfileScreenNavigationProp }) {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trueSkillRatings, setTrueSkillRatings] = useState<TrueSkillRating[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfileData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const data = await fetchOwnProfile(session.user.id);
      setProfile(data);

      // Fetch TrueSkill ratings
      const ratings = await getUserAllTrueSkillRatings(session.user.id);
      setTrueSkillRatings(ratings);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (profile?.description) {
      setDescription(profile.description);
    }
  }, [profile]);

  // Refresh data when navigating back from AddSport
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (session?.user?.id) {
        fetchProfileData();
      }
    });
    return unsubscribe;
  }, [navigation, session]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  // Initial data load
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session?.user?.id]);

  const handleSaveDescription = async () => {
    try {
      if (!session?.user?.id) return;

      setSaving(true);

      await updateProfile(session.user.id, {
        description: description.trim()
      });

      const updatedData = await fetchOwnProfile(session.user.id);
      setProfile(updatedData);
      setIsEditing(false);

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save description. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64 && session?.user?.id) {
        setLoading(true);
        try {
          const newAvatarUrl = await uploadAvatar(session.user.id, result.assets[0].base64);
          setProfile((prev: Profile | null) => prev ? {
            ...prev,
            avatar_url: newAvatarUrl
          } : null);
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTrueSkillForSport = (sportName: string): TrueSkillRating | undefined => {
    const sportId = sportNameToId[sportName];
    return trueSkillRatings.find(r => r.sport_id === sportId);
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="person-outline"
          title="No Profile Found"
          message="We couldn't find your profile data."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Profile" showDivider />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar and Name */}
        <View style={styles.profileHeader}>
          <Button
            onPress={handleAvatarPress}
            style={styles.avatarButton}
            contentStyle={styles.avatarButtonContent}
          >
            {profile.avatar_url ? (
              <Avatar.Image
                size={100}
                source={{ uri: profile.avatar_url }}
              />
            ) : (
              <Avatar.Text
                size={100}
                label={profile.first_name?.charAt(0) || '?'}
                style={{ backgroundColor: AppTheme.colors.surfaceVariant }}
                labelStyle={{ color: AppTheme.colors.textSecondary }}
              />
            )}
          </Button>
          <Text variant="headlineSmall" style={styles.name}>
            {profile.first_name} {profile.last_name}
          </Text>
          {profile.username && (
            <Text variant="bodyMedium" style={styles.username}>
              @{profile.username}
            </Text>
          )}
        </View>

        {/* User Details */}
        <Surface style={styles.detailsCard} elevation={0}>
          <View style={styles.detailsGrid}>
            {session?.user?.email && (
              <View style={styles.detailItem}>
                <Text variant="labelSmall" style={styles.detailLabel}>Email</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{session.user.email}</Text>
              </View>
            )}
            {profile.age && (
              <View style={styles.detailItem}>
                <Text variant="labelSmall" style={styles.detailLabel}>Age</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>{profile.age} years old</Text>
              </View>
            )}
            {profile.gender && (
              <View style={styles.detailItem}>
                <Text variant="labelSmall" style={styles.detailLabel}>Gender</Text>
                <Text variant="bodyMedium" style={styles.detailValue}>
                  {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </Surface>

        {/* About Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>About</Text>
          {isEditing ? (
            <View>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Write something about yourself..."
                style={styles.descriptionInput}
                outlineColor={AppTheme.colors.border}
                activeOutlineColor={AppTheme.colors.primary}
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDescription(profile?.description || '');
                    setIsEditing(false);
                  }}
                  style={styles.cancelEditButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveDescription}
                  loading={saving}
                  disabled={saving}
                  buttonColor={AppTheme.colors.primary}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <Surface style={styles.descriptionCard} elevation={0}>
              <Text variant="bodyMedium" style={styles.descriptionText}>
                {profile.description || 'No description provided'}
              </Text>
            </Surface>
          )}
        </View>

        {/* Sports Preferences - Locked/Read-only */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>My Sports</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('AddSport')}
              textColor={AppTheme.colors.primary}
              compact
            >
              + Add Sport
            </Button>
          </View>

          {(!profile?.sports_preferences || !Array.isArray(profile.sports_preferences) || profile.sports_preferences.length === 0) ? (
            <EmptyState
              icon="tennisball-outline"
              title="No Sports Added"
              message="Add sports to start competing and track your progress."
              actionLabel="Add Sport"
              onAction={() => navigation.navigate('AddSport')}
              style={styles.emptyStateInline}
            />
          ) : (
            profile.sports_preferences.map((pref, index) => {
              const trueSkill = getTrueSkillForSport(pref.sport);
              const conservativeRating = trueSkill
                ? calculateConservativeRating(trueSkill.mu, trueSkill.sigma)
                : null;

              return (
                <Surface key={index} style={styles.sportCard} elevation={0}>
                  <View style={styles.sportHeader}>
                    <View style={styles.sportInfo}>
                      <Text variant="titleMedium" style={styles.sportName}>{pref.sport}</Text>
                    </View>
                    {conservativeRating !== null && (
                      <View style={styles.ratingContainer}>
                        <Text variant="bodySmall" style={styles.ratingLabel}>Rating</Text>
                        <Text variant="titleMedium" style={styles.ratingValue}>
                          {Math.round(conservativeRating)}
                        </Text>
                        {trueSkill && (
                          <Text variant="bodySmall" style={styles.gamesPlayed}>
                            {trueSkill.games_played} games
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </Surface>
              );
            })
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="outlined"
            onPress={() => setIsEditing(true)}
            style={styles.actionButton}
            textColor={AppTheme.colors.text}
          >
            Edit Profile
          </Button>

          <Button
            mode="contained"
            onPress={handleSignOut}
            buttonColor={AppTheme.colors.error}
            style={styles.actionButton}
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  scrollContent: {
    padding: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.lg,
  },
  avatarButton: {
    marginBottom: AppTheme.spacing.sm,
  },
  avatarButtonContent: {
    padding: 0,
  },
  name: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  username: {
    color: AppTheme.colors.textSecondary,
    marginTop: AppTheme.spacing.xs,
  },
  detailsCard: {
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
    marginBottom: AppTheme.spacing.lg,
  },
  detailsGrid: {
    gap: AppTheme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: AppTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: AppTheme.colors.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: AppTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.sm,
  },
  descriptionCard: {
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
  },
  descriptionText: {
    color: AppTheme.colors.textSecondary,
  },
  descriptionInput: {
    backgroundColor: AppTheme.colors.background,
    marginBottom: AppTheme.spacing.sm,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: AppTheme.spacing.sm,
  },
  cancelEditButton: {
    borderColor: AppTheme.colors.border,
  },
  emptyStateInline: {
    paddingVertical: AppTheme.spacing.lg,
  },
  sportCard: {
    backgroundColor: AppTheme.colors.surface,
    padding: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.lg,
    marginBottom: AppTheme.spacing.sm,
  },
  sportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sportInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppTheme.spacing.sm,
  },
  sportName: {
    fontWeight: '600',
    color: AppTheme.colors.text,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 10,
  },
  ratingValue: {
    color: AppTheme.colors.primary,
    fontWeight: '700',
  },
  gamesPlayed: {
    color: AppTheme.colors.textMuted,
    fontSize: 10,
  },
  buttonsContainer: {
    marginTop: AppTheme.spacing.md,
    gap: AppTheme.spacing.sm,
  },
  actionButton: {
    borderRadius: AppTheme.borderRadius.full,
  },
});
