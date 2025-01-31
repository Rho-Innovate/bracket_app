import { serve } from "https://deno.land/x/sift/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Elo calculation function
function calculateElo(playerRating: number, opponentRating: number, score: number, kFactor = 32): number {
  const expectedScore = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  return Math.round(playerRating + kFactor * (score - expectedScore));
}

serve(async (req) => {
  try {
    const { player1Id, player2Id, score1, score2, sportId } = await req.json();

    // Fetch current ratings for both players for the specific sport
    const { data: player1Elo, error: error1 } = await supabase
      .from("elo_ratings")
      .select("*")
      .eq("user_id", player1Id)
      .eq("sport_id", sportId)
      .single();

    const { data: player2Elo, error: error2 } = await supabase
      .from("elo_ratings")
      .select("*")
      .eq("user_id", player2Id)
      .eq("sport_id", sportId)
      .single();

    if (error1 || error2 || !player1Elo || !player2Elo) {
      return new Response("Player Elo data not found", { status: 404 });
    }

    // Calculate new Elo ratings
    const player1NewRating = calculateElo(player1Elo.rating, player2Elo.rating, score1 / (score1 + score2));
    const player2NewRating = calculateElo(player2Elo.rating, player1Elo.rating, score2 / (score1 + score2));

    // Update Elo ratings in the database
    await supabase
      .from("elo_ratings")
      .update({ rating: player1NewRating })
      .eq("user_id", player1Id)
      .eq("sport_id", sportId);

    await supabase
      .from("elo_ratings")
      .update({ rating: player2NewRating })
      .eq("user_id", player2Id)
      .eq("sport_id", sportId);

    // Insert match history
    const { error: matchError } = await supabase
      .from("match_history")
      .insert([
        {
          sport_id: sportId,
          player1_id: player1Id,
          player2_id: player2Id,
          score1: score1,
          score2: score2,
          winner_id: score1 > score2 ? player1Id : player2Id,
        },
      ]);

    if (matchError) {
      throw matchError;
    }

    return new Response(
      JSON.stringify({
        player1NewRating,
        player2NewRating,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating Elo:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
