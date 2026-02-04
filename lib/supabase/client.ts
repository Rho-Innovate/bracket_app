import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - uses environment variables with fallback
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://schntuzosnfmsakhsyjv.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaG50dXpvc25mbXNha2hzeWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzMzMzMsImV4cCI6MjA4NDM0OTMzM30.AVwHvkDXzSBYbuLqulp5Phsgnh7VqUFL-T1hNRYw6Ao';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
