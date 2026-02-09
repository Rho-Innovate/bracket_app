import { decode } from 'base64-arraybuffer';
import { supabase } from './client';

/**
 * Upload avatar image and update profile
 */
export const uploadAvatar = async (userId: string, base64Image: string) => {
  try {
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64Image), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 31536000); // URL valid for 1 year

    if (!urlData?.signedUrl) {
      throw new Error('Failed to get signed URL');
    }

    const avatarUrl = urlData.signedUrl;
    console.log('Generated signed URL:', avatarUrl);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return avatarUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};
