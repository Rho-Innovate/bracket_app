import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TrueSkill Algorithm Implementation
// Based on Microsoft TrueSkill: https://www.microsoft.com/en-us/research/project/trueskill-ranking-system/

// Constants for the TrueSkill algorithm
const DEFAULT_MU = 25.0;
const DEFAULT_SIGMA = 8.333; // 25/3
const DEFAULT_BETA = 4.1667; // 25/6 - performance variance
const DEFAULT_TAU = 0.0833;  // 25/300 - skill drift
const EPSILON = 0.0001;

// Gaussian math functions
function gaussianPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function gaussianCdf(x: number): number {
  // Approximation of the cumulative distribution function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

function vFunction(t: number, epsilon: number = EPSILON): number {
  // V function for TrueSkill
  const denom = gaussianCdf(t - epsilon);
  if (denom < EPSILON) return -t + epsilon;
  return gaussianPdf(t - epsilon) / denom;
}

function wFunction(t: number, epsilon: number = EPSILON): number {
  // W function for TrueSkill
  const denom = gaussianCdf(t - epsilon);
  if (denom < EPSILON) return 1;
  const v = vFunction(t, epsilon);
  return v * (v + t - epsilon);
}

interface Player {
  userId: string;
  mu: number;
  sigma: number;
  team: number;
}

interface SportConfig {
  beta: number;
  tau: number;
  drawProbability: number;
  isTeamSport: boolean;
  teamSize: number;
}

interface UpdateResult {
  userId: string;
  muBefore: number;
  sigmaBefore: number;
  muAfter: number;
  sigmaAfter: number;
}

/**
 * Calculate TrueSkill updates for a 1v1 or team match
 */
function calculateTrueSkillUpdate(
  team1: Player[],
  team2: Player[],
  team1Won: boolean,
  isDraw: boolean,
  config: SportConfig
): UpdateResult[] {
  const results: UpdateResult[] = [];

  const beta = config.beta;
  const tau = config.tau;

  // Calculate team ratings (average of players)
  const team1Mu = team1.reduce((sum, p) => sum + p.mu, 0) / team1.length;
  const team1Sigma = Math.sqrt(team1.reduce((sum, p) => sum + p.sigma * p.sigma, 0) / team1.length);

  const team2Mu = team2.reduce((sum, p) => sum + p.mu, 0) / team2.length;
  const team2Sigma = Math.sqrt(team2.reduce((sum, p) => sum + p.sigma * p.sigma, 0) / team2.length);

  // Calculate c (total uncertainty)
  const c = Math.sqrt(
    2 * beta * beta +
    team1Sigma * team1Sigma +
    team2Sigma * team2Sigma
  );

  // Calculate the skill difference
  let t: number;
  if (isDraw) {
    // For draws, use absolute difference
    t = (team1Mu - team2Mu) / c;
  } else if (team1Won) {
    t = (team1Mu - team2Mu) / c;
  } else {
    t = (team2Mu - team1Mu) / c;
  }

  // Calculate v and w for the update
  const v = vFunction(t);
  const w = wFunction(t);

  // Update each player's rating
  const updateTeam = (players: Player[], isWinner: boolean, teamMu: number, teamSigma: number) => {
    for (const player of players) {
      const muBefore = player.mu;
      const sigmaBefore = player.sigma;

      // Apply tau (skill drift) - adds a small amount to sigma between games
      const sigmaWithDrift = Math.sqrt(sigmaBefore * sigmaBefore + tau * tau);

      // Calculate individual contribution
      const sigmaFactor = sigmaWithDrift * sigmaWithDrift / c;

      // Calculate new mu
      let muDelta = sigmaFactor * v;
      if (!isDraw && !isWinner) {
        muDelta = -muDelta;
      }
      const muAfter = muBefore + muDelta;

      // Calculate new sigma
      const sigmaSquaredAfter = sigmaWithDrift * sigmaWithDrift * (1 - (sigmaFactor / c) * w);
      const sigmaAfter = Math.sqrt(Math.max(EPSILON, sigmaSquaredAfter));

      results.push({
        userId: player.userId,
        muBefore,
        sigmaBefore,
        muAfter,
        sigmaAfter
      });
    }
  };

  // Determine winners and losers
  if (isDraw) {
    // Both teams get smaller updates towards each other
    updateTeam(team1, true, team1Mu, team1Sigma);
    updateTeam(team2, true, team2Mu, team2Sigma);
  } else {
    updateTeam(team1, team1Won, team1Mu, team1Sigma);
    updateTeam(team2, !team1Won, team2Mu, team2Sigma);
  }

  return results;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const { gameId } = await req.json();

    if (!gameId) {
      return new Response(
        JSON.stringify({ error: "gameId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Get game details
    const { data: game, error: gameError } = await supabase
      .from("game_requests")
      .select("*")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: "Game not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Get game result
    const { data: result, error: resultError } = await supabase
      .from("game_results")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (resultError || !result) {
      return new Response(
        JSON.stringify({ error: "Game result not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Get sport configuration
    const { data: sportConfig, error: configError } = await supabase
      .from("sport_trueskill_config")
      .select("*")
      .eq("sport_id", game.sport_id)
      .single();

    const config: SportConfig = sportConfig ? {
      beta: sportConfig.beta,
      tau: sportConfig.tau,
      drawProbability: sportConfig.draw_probability,
      isTeamSport: sportConfig.is_team_sport,
      teamSize: sportConfig.team_size
    } : {
      beta: DEFAULT_BETA,
      tau: DEFAULT_TAU,
      drawProbability: 0,
      isTeamSport: false,
      teamSize: 1
    };

    // 4. Get all participants with their current ratings
    const { data: participants, error: partError } = await supabase
      .from("game_participants")
      .select("user_id, team")
      .eq("game_id", gameId);

    if (partError || !participants || participants.length === 0) {
      return new Response(
        JSON.stringify({ error: "No participants found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Get current TrueSkill ratings for each participant
    const playerRatings: Map<string, { mu: number; sigma: number }> = new Map();

    for (const p of participants) {
      const { data: rating } = await supabase
        .from("trueskill_ratings")
        .select("mu, sigma")
        .eq("user_id", p.user_id)
        .eq("sport_id", game.sport_id)
        .single();

      if (rating) {
        playerRatings.set(p.user_id, { mu: rating.mu, sigma: rating.sigma });
      } else {
        // Initialize with defaults if no rating exists
        playerRatings.set(p.user_id, { mu: DEFAULT_MU, sigma: DEFAULT_SIGMA });
      }
    }

    // 6. Split participants into teams
    const team1: Player[] = participants
      .filter(p => p.team === 1)
      .map(p => ({
        userId: p.user_id,
        mu: playerRatings.get(p.user_id)!.mu,
        sigma: playerRatings.get(p.user_id)!.sigma,
        team: 1
      }));

    const team2: Player[] = participants
      .filter(p => p.team === 2)
      .map(p => ({
        userId: p.user_id,
        mu: playerRatings.get(p.user_id)!.mu,
        sigma: playerRatings.get(p.user_id)!.sigma,
        team: 2
      }));

    // Handle case where teams aren't assigned (1v1 games with no team assignment)
    if (team1.length === 0 && team2.length === 0 && participants.length === 2) {
      // Assign first participant to team 1, second to team 2
      team1.push({
        userId: participants[0].user_id,
        mu: playerRatings.get(participants[0].user_id)!.mu,
        sigma: playerRatings.get(participants[0].user_id)!.sigma,
        team: 1
      });
      team2.push({
        userId: participants[1].user_id,
        mu: playerRatings.get(participants[1].user_id)!.mu,
        sigma: playerRatings.get(participants[1].user_id)!.sigma,
        team: 2
      });
    }

    if (team1.length === 0 || team2.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid team configuration" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Calculate TrueSkill updates
    const team1Won = result.winner_team === 1;
    const isDraw = result.is_draw || result.winner_team === 0;

    const updates = calculateTrueSkillUpdate(team1, team2, team1Won, isDraw, config);

    // 8. Update ratings in database
    for (const update of updates) {
      // Update game_participants with before/after ratings
      await supabase
        .from("game_participants")
        .update({
          mu_before: update.muBefore,
          sigma_before: update.sigmaBefore,
          mu_after: update.muAfter,
          sigma_after: update.sigmaAfter
        })
        .eq("game_id", gameId)
        .eq("user_id", update.userId);

      // Upsert TrueSkill rating
      await supabase
        .from("trueskill_ratings")
        .upsert({
          user_id: update.userId,
          sport_id: game.sport_id,
          mu: update.muAfter,
          sigma: update.sigmaAfter,
          games_played: supabase.rpc("increment", { x: 1 }),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,sport_id"
        });

      // Increment games_played separately since we can't use rpc in upsert
      await supabase
        .from("trueskill_ratings")
        .update({ games_played: supabase.rpc("increment", { x: 1 }) })
        .eq("user_id", update.userId)
        .eq("sport_id", game.sport_id);
    }

    // 9. Update profile games_played count
    for (const p of participants) {
      await supabase.rpc("increment_profile_games", { user_id: p.user_id });
    }

    // 10. Record match history
    await supabase
      .from("match_history")
      .upsert({
        game_id: gameId,
        sport_id: game.sport_id,
        team1_user_ids: team1.map(p => p.userId),
        team2_user_ids: team2.map(p => p.userId),
        winner_team: result.winner_team,
        team1_score: result.score_team1,
        team2_score: result.score_team2,
        played_at: new Date().toISOString()
      }, {
        onConflict: "game_id"
      });

    return new Response(
      JSON.stringify({
        success: true,
        updates: updates.map(u => ({
          userId: u.userId,
          muBefore: u.muBefore.toFixed(2),
          muAfter: u.muAfter.toFixed(2),
          sigmaBefore: u.sigmaBefore.toFixed(2),
          sigmaAfter: u.sigmaAfter.toFixed(2),
          conservativeRatingBefore: (u.muBefore - 3 * u.sigmaBefore).toFixed(2),
          conservativeRatingAfter: (u.muAfter - 3 * u.sigmaAfter).toFixed(2)
        }))
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error updating TrueSkill ratings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
