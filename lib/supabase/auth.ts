import { supabase } from './client';

/**
 * Signs up a user and creates a profile.
 */
export const signUpAndCreateProfile = async (
  email: string,
  password: string,
  profileData: {
    username: string;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    location: { lat: number; lng: number };
  }
) => {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'bracket://auth/callback',
    },
  });

  if (signUpError) {
    console.error('Error during sign-up:', signUpError.message);
    throw signUpError;
  }

  const user = signUpData.user;

  if (!user) {
    throw new Error('User was not created during sign-up.');
  }

  const { username, first_name, last_name, age, gender, location } = profileData;

  console.log('Profile data to save:', { username, first_name, last_name, age, gender });

  // Small delay to ensure the trigger has created the profile
  await new Promise(resolve => setTimeout(resolve, 500));

  // Use RPC function to bypass RLS (user may not be fully authenticated yet)
  const { error: rpcError } = await supabase.rpc('update_profile_on_signup', {
    p_user_id: user.id,
    p_username: username,
    p_first_name: first_name,
    p_last_name: last_name,
    p_age: age,
    p_gender: gender,
    p_location_lng: location.lng,
    p_location_lat: location.lat,
  });

  if (rpcError) {
    console.error('Error updating profile via RPC:', rpcError.message, rpcError);

    // Fallback to direct update (might work if user is authenticated)
    console.log('Trying direct update as fallback...');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username,
        first_name,
        last_name,
        age,
        gender,
        location: `SRID=4326;POINT(${location.lng} ${location.lat})`,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Fallback update also failed:', profileError.message);
      throw profileError;
    }
  } else {
    console.log('Profile updated successfully via RPC');
  }

  return { user, profile: { ...profileData, id: user.id } };
};

/**
 * Sign into account
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

/**
 * Delete user account and corresponding profile
 */
export const deleteUserAccount = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error(userError?.message || 'No user is logged in.');
    }

    const userId = user.id;

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Error deleting user from auth: ${authError.message}`);
    }

    console.log('User and profile deleted successfully.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting user account:', error.message);
    }
    throw error;
  }
};

/**
 * Resend verification email to user
 */
export const resendVerificationEmail = async (email: string) => {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: 'bracket://auth/callback',
    },
  });
};
