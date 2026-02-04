import { useState, useEffect, useCallback } from 'react';
import { getGameRequests } from '@/lib/supabase';

interface GameRequest {
  id: number;
  description: string;
  requested_time: string;
  sport_id: number;
  current_players: number;
  max_players: number;
  creator_id: string;
  game_state?: string;
  status: 'Open' | 'Closed';
}

interface UseGameRequestsFilters {
  creator_id?: string;
  sport_id?: number;
  status?: 'Open' | 'Closed';
  game_id?: number;
}

interface UseGameRequestsResult {
  games: GameRequest[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage game requests with optional filters
 */
export function useGameRequests(filters?: UseGameRequestsFilters): UseGameRequestsResult {
  const [games, setGames] = useState<GameRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getGameRequests(filters || {});
      setGames(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch games'));
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
  };
}

/**
 * Hook specifically for open game requests
 */
export function useOpenGameRequests() {
  return useGameRequests({ status: 'Open' });
}

/**
 * Hook for fetching a user's own game requests
 */
export function useMyGameRequests(userId: string | undefined) {
  return useGameRequests(userId ? { creator_id: userId } : undefined);
}

export default useGameRequests;
