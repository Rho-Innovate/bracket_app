/**
 * Backward compatibility re-export
 *
 * This file re-exports all functions from the modular supabase folder.
 * New code should import from '@/lib/supabase' (which points to lib/supabase/index.ts)
 * or directly from the specific module (e.g., '@/lib/supabase/auth').
 */
export * from './supabase/index';
