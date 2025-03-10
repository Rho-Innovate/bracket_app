import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Button, Input } from '@rneui/themed'
import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { supabase, updateProfile, fetchOwnProfile } from '../../lib/supabase'
import Avatar from './Avatar'
import { NavigationProp, RootStackParamList } from './Login Nav'

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
  
  const getProfile_ = async () => {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');
      const data = await fetchOwnProfile(session?.user.id)
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
    

  async function updateProfile__({
    firstName,
    lastName,
    username,
   
    avatar_url,
  }: {
    firstName: string,
    lastName: string,
    username: string
    
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        firstName,
        lastName,
        username,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
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

      const data = await updateProfile(session?.user.id, updates);

      console.log(data);
    }
    catch (error) {

    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Add Avatar component */}
      <View style={styles.verticallySpaced}>
        <Avatar
          size={200}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url)
            updateProfile_({ firstName, lastName, username, avatar_url: url })
          }}
        />
      </View>
    
      <View style={styles.verticallySpaced}>
        <Input label="First Name" value={firstName || ''} onChangeText={(text) => setFirstName(text)} />
      </View>
      <View style={styles.verticallySpaced}>
        <Input label="Last Name" value={lastName || ''} onChangeText={(text) => setLastName(text)} />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input label="Email" value={session?.user?.email} disabled />
      </View>
      <View style={styles.verticallySpaced}>
        <Input label="Username" value={username || ''} onChangeText={(text) => setUsername(text)} />
      </View>

      {/* <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={loading ? 'Loading ...' : 'Update'}
          onPress={() => updateProfile({ firstName, lastName, username, avatar_url: avatarUrl })}
          disabled={loading}
        />
      </View> */}

      <View style={styles.verticallySpaced}>
      <Button title="Continue" onPress={() => navigation.navigate('Home')} />
      </View>

      <View style={styles.verticallySpaced}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})