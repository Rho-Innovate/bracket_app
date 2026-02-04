import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Matchmaking Algorithm
// Finds compatible players in the queue and creates match proposals

// Calculate conservative rating (mu - 3 * sigma)
function conservativeRating(mu: number, sigma: number): number {
  return mu - 3 * sigma;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if two time ranges overlap
function timeRangesOverlap(
  start1: Date | null,
  end1: Date | null,
  start2: Date | null,
  end2: Date | null
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return true; // If no preference, consider it overlapping
  return start1 <= end2 && start2 <= end1;
}

interface QueueEntry {
  id: string;
  user_id: string;
  sport_id: number;
  lat: number | null;
  lng: number | null;
  search_radius_km: number;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  skill_range_min: number | null;
  skill_range_max: number | null;
  is_active: boolean;
  joined_at: string;
  rating?: number;
  trust_score?: number;
}

interface MatchScore {
  player1: QueueEntry;
  player2: QueueEntry;
  score: number;
  distance: number | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Initialize Supabase client inside handler (env vars are auto-injected)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  console.log("Env check - URL exists:", !!supabaseUrl, "Key exists:", !!supabaseServiceKey);

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment variables" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { sportId, runForAll } = await req.json();

    // Get all active queue entries for the sport (or all sports if runForAll)
    // Use RPC to extract coordinates from PostGIS geometry
    const sportFilter = sportId && !runForAll ? sportId : null;

    const { data: queueEntries, error: queueError } = await supabase.rpc(
      'get_matchmaking_queue_with_coords',
      { p_sport_id: sportFilter }
    );

    if (queueError) {
      console.error('RPC error:', queueError);
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!queueEntries || queueEntries.length < 2) {
      return new Response(
        JSON.stringify({ message: "Not enough players in queue", matched: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group entries by sport
    const sportGroups: Map<number, QueueEntry[]> = new Map();
    for (const entry of queueEntries) {
      const sportEntries = sportGroups.get(entry.sport_id) || [];
      sportEntries.push(entry);
      sportGroups.set(entry.sport_id, sportEntries);
    }

    const proposalsCreated: number[] = [];

    // Process each sport group
    for (const [sport, entries] of sportGroups) {
      if (entries.length < 2) continue;

      // Fetch TrueSkill ratings and trust scores for all users
      const userIds = entries.map(e => e.user_id);

      const { data: ratings } = await supabase
        .from("trueskill_ratings")
        .select("user_id, mu, sigma")
        .eq("sport_id", sport)
        .in("user_id", userIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, trust_score")
        .in("id", userIds);

      // Create rating and trust maps
      const ratingMap: Map<string, number> = new Map();
      const trustMap: Map<string, number> = new Map();

      for (const r of ratings || []) {
        ratingMap.set(r.user_id, conservativeRating(r.mu, r.sigma));
      }

      for (const p of profiles || []) {
        trustMap.set(p.id, p.trust_score || 100);
      }

      // Enrich entries with ratings and trust
      const enrichedEntries: QueueEntry[] = entries.map(e => ({
        ...e,
        rating: ratingMap.get(e.user_id) || 0, // Default for new players
        trust_score: trustMap.get(e.user_id) || 100
      }));

      // Calculate match scores for all pairs
      const matchScores: MatchScore[] = [];

      for (let i = 0; i < enrichedEntries.length; i++) {
        for (let j = i + 1; j < enrichedEntries.length; j++) {
          const p1 = enrichedEntries[i];
          const p2 = enrichedEntries[j];

          // Check if already in a pending proposal together
          const { data: existingProposal } = await supabase
            .from("match_proposals")
            .select("id")
            .eq("sport_id", sport)
            .eq("status", "pending")
            .or(`and(player1_id.eq.${p1.user_id},player2_id.eq.${p2.user_id}),and(player1_id.eq.${p2.user_id},player2_id.eq.${p1.user_id})`)
            .single();

          if (existingProposal) continue;

          // Calculate distance if both have locations
          let distance: number | null = null;
          if (p1.lat !== null && p1.lng !== null && p2.lat !== null && p2.lng !== null) {
            distance = calculateDistance(
              p1.lat, p1.lng,
              p2.lat, p2.lng
            );

            // Skip if outside both players' search radius
            if (distance > p1.search_radius_km || distance > p2.search_radius_km) {
              continue;
            }
          }

          // Check time overlap
          const timeOverlap = timeRangesOverlap(
            p1.preferred_time_start ? new Date(p1.preferred_time_start) : null,
            p1.preferred_time_end ? new Date(p1.preferred_time_end) : null,
            p2.preferred_time_start ? new Date(p2.preferred_time_start) : null,
            p2.preferred_time_end ? new Date(p2.preferred_time_end) : null
          );

          if (!timeOverlap) continue;

          // Check skill range compatibility
          const p1InRange = (p1.skill_range_min === null || p2.rating! >= p1.skill_range_min) &&
                           (p1.skill_range_max === null || p2.rating! <= p1.skill_range_max);
          const p2InRange = (p2.skill_range_min === null || p1.rating! >= p2.skill_range_min) &&
                           (p2.skill_range_max === null || p1.rating! <= p2.skill_range_max);

          if (!p1InRange || !p2InRange) continue;

          // Calculate match score (higher is better)
          // Factors: skill similarity, trust scores, queue time, distance
          const skillDiff = Math.abs(p1.rating! - p2.rating!);
          const avgTrust = (p1.trust_score! + p2.trust_score!) / 2;
          const p1WaitTime = (Date.now() - new Date(p1.joined_at).getTime()) / (1000 * 60); // minutes
          const p2WaitTime = (Date.now() - new Date(p2.joined_at).getTime()) / (1000 * 60);
          const avgWaitTime = (p1WaitTime + p2WaitTime) / 2;

          // Score formula:
          // - Lower skill diff is better (invert and scale)
          // - Higher trust is better
          // - Longer wait time is prioritized
          // - Closer distance is better
          let score = 0;
          score += Math.max(0, 100 - skillDiff * 2); // Skill similarity (0-100)
          score += avgTrust * 0.5; // Trust factor (0-50)
          score += Math.min(avgWaitTime, 60) * 0.5; // Wait time factor, capped at 30 points
          if (distance !== null) {
            score += Math.max(0, 30 - distance); // Distance bonus (0-30)
          }

          matchScores.push({ player1: p1, player2: p2, score, distance });
        }
      }

      // Sort by score (highest first)
      matchScores.sort((a, b) => b.score - a.score);

      // Create match proposals for top matches
      // Only create one proposal per player to avoid overwhelming users
      const usersWithProposals = new Set<string>();

      for (const match of matchScores) {
        if (usersWithProposals.has(match.player1.user_id) || usersWithProposals.has(match.player2.user_id)) {
          continue;
        }

        // Calculate proposed time (midpoint of overlapping times or now + 1 hour)
        let proposedTime = new Date(Date.now() + 60 * 60 * 1000); // Default: 1 hour from now
        if (match.player1.preferred_time_start && match.player2.preferred_time_start) {
          const start1 = new Date(match.player1.preferred_time_start);
          const start2 = new Date(match.player2.preferred_time_start);
          proposedTime = new Date(Math.max(start1.getTime(), start2.getTime()));
        }

        // Calculate proposed location (midpoint if both have locations)
        let proposedLocation = null;
        const p1HasLoc = match.player1.lat !== null && match.player1.lng !== null;
        const p2HasLoc = match.player2.lat !== null && match.player2.lng !== null;

        if (p1HasLoc && p2HasLoc) {
          proposedLocation = `SRID=4326;POINT(${
            (match.player1.lng! + match.player2.lng!) / 2
          } ${
            (match.player1.lat! + match.player2.lat!) / 2
          })`;
        } else if (p1HasLoc) {
          proposedLocation = `SRID=4326;POINT(${match.player1.lng} ${match.player1.lat})`;
        } else if (p2HasLoc) {
          proposedLocation = `SRID=4326;POINT(${match.player2.lng} ${match.player2.lat})`;
        }

        // Create match proposal
        const { data: proposal, error: proposalError } = await supabase
          .from("match_proposals")
          .insert({
            sport_id: sport,
            player1_id: match.player1.user_id,
            player2_id: match.player2.user_id,
            proposed_time: proposedTime.toISOString(),
            proposed_location: proposedLocation,
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Expires in 5 minutes
            status: "pending"
          })
          .select()
          .single();

        if (!proposalError && proposal) {
          proposalsCreated.push(proposal.id);
          usersWithProposals.add(match.player1.user_id);
          usersWithProposals.add(match.player2.user_id);
        }
      }
    }

    // Clean up expired queue entries
    await supabase
      .from("matchmaking_queue")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Clean up expired proposals
    await supabase
      .from("match_proposals")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        matched: proposalsCreated.length,
        proposalIds: proposalsCreated
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in matchmaking:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
