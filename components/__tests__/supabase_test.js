//This is an example on how to query the Supabase using the DB - it calls all the profile IDs. 
//See API Docs on the Supabase website for more information on how to query the DB.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://utreebqeudeznsggsbry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cmVlYnFldWRlem5zZ2dzYnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDMzMTksImV4cCI6MjA0NjI3OTMxOX0.UkAIxSqYHt4hq-oG5WMujeUKloCx02jhR--O42GH_q0';

// Create a single instance of the client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchProfiles() {
  let { data: profiles, error } = await supabase
    .from('profiles')
    .select('id');

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles:', profiles);
  }
}

// Call the function
fetchProfiles();