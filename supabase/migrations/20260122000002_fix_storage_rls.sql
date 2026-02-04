-- Migration: Fix storage RLS policies for avatars
-- Adds path-based ownership so users can only manage files in their own folder

-- ============================================================================
-- DROP EXISTING OVERLY PERMISSIVE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar select policy" ON storage.objects;

-- ============================================================================
-- CREATE PATH-BASED OWNERSHIP POLICIES
-- ============================================================================

-- Expected file path pattern: avatars/{user_id}/filename.ext
-- Users can only manage files in their own folder

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all avatars (they need to be viewable by everyone)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- ENSURE BUCKET EXISTS AND IS CONFIGURED CORRECTLY
-- ============================================================================

-- Update bucket to ensure it's public for read access
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';
