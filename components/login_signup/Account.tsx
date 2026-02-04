import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View, ScrollView } from 'react-native'
import { TextInput, Button, Text, Avatar as PaperAvatar, ActivityIndicator } from 'react-native-paper'
import { supabase, updateProfile, fetchOwnProfile } from '../../lib/supabase'
import Avatar from './Avatar'
import { NavigationProp, RootStackParamList } from './Login Nav'
import { AppTheme } from '../../constants/theme'

type AccountScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Account'>;
  route: RouteProp<RootStackParamList, 'Account'>;
};

export default function Account({ route }: AccountScreenProps) {
  const { session } = route.params;
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`first_name, last_name, username, avatar_url`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setFirstName(data.first_name)
        setLastName(data.last_name)
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile_ = async ({
    firstName,
    lastName,
    username,
    avatar_url,
  }: {
    firstName: string,
    lastName: string,
    username: string
    avatar_url: string
  }) => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');
      const updates = {
        id: session?.user.id,
        firstName,
        lastName,
        username,
        avatar_url,
        updated_at: new Date(),
      }
      await updateProfile(session?.user.id, updates);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text variant="headlineMedium" style={styles.title}>
        Your Profile
      </Text>

      <View style={styles.avatarContainer}>
        <Avatar
          size={120}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url)
            updateProfile_({ firstName, lastName, username, avatar_url: url })
          }}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          label="First Name"
          value={firstName || ''}
          onChangeText={setFirstName}
          mode="outlined"
          style={styles.input}
          outlineColor={AppTheme.colors.border}
          activeOutlineColor={AppTheme.colors.primary}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          label="Last Name"
          value={lastName || ''}
          onChangeText={setLastName}
          mode="outlined"
          style={styles.input}
          outlineColor={AppTheme.colors.border}
          activeOutlineColor={AppTheme.colors.primary}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          label="Email"
          value={session?.user?.email || ''}
          mode="outlined"
          disabled
          style={styles.input}
          outlineColor={AppTheme.colors.border}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          label="Username"
          value={username || ''}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          outlineColor={AppTheme.colors.border}
          activeOutlineColor={AppTheme.colors.primary}
        />
      </View>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Home')}
        style={styles.button}
        contentStyle={styles.buttonContent}
        buttonColor={AppTheme.colors.primary}
      >
        Continue
      </Button>

      <Button
        mode="outlined"
        onPress={() => supabase.auth.signOut()}
        style={styles.signOutButton}
        contentStyle={styles.buttonContent}
        textColor={AppTheme.colors.textSecondary}
      >
        Sign Out
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  contentContainer: {
    padding: AppTheme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    color: AppTheme.colors.text,
    marginBottom: AppTheme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.xl,
  },
  inputContainer: {
    marginBottom: AppTheme.spacing.md,
  },
  input: {
    backgroundColor: AppTheme.colors.background,
  },
  button: {
    marginTop: AppTheme.spacing.lg,
    borderRadius: AppTheme.borderRadius.md,
  },
  buttonContent: {
    paddingVertical: AppTheme.spacing.sm,
  },
  signOutButton: {
    marginTop: AppTheme.spacing.md,
    borderRadius: AppTheme.borderRadius.md,
    borderColor: AppTheme.colors.border,
  },
})
