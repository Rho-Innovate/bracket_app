-- Fix RLS policies for profiles table

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for cases where trigger doesn't work)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix Storage RLS policies for avatars bucket

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar select policy" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their avatars
CREATE POLICY "Avatar update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow public read access to avatars
CREATE POLICY "Avatar select policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
CREATE POLICY "Avatar delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
