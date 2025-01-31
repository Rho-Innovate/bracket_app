import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase URL and anon key from the Supabase dashboard
const supabaseUrl = 'https://utreebqeudeznsggsbry.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmVlYnFldWRlem5zZ2dzYnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDMzMTksImV4cCI6MjA0NjI3OTMxOX0.UkAIxSqYHt4hq-oG5WMujeUKloCx02jhR--O42GH_q0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auth queries

//POST
export const signUpAndCreateProfile = 
async (email: string, password: string, profileData: { username: string, first_name: string, last_name: string, age: Int, avatar_url?: string }) => {
  const {  data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw new Error(signUpError.message);

  const user = signUpData.user;

  if (user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id, // Use the same ID as `auth.users`
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      avatar_url: profileData.avatar_url || null,
    });

    if (profileError) throw new Error(profileError.message);
  }

  return signUpData;

}

//POST
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

//POST
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

//Profile queries

//PUT


// Game Request queries

//POST
