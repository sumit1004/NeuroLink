const SUPABASE_URL =
  window.SUPABASE_URL || "https://tspfjhwcatqdvbkejica.supabase.co";
const SUPABASE_ANON_KEY =
  window.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGZqaHdjYXRxZHZia2VqaWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTU1OTgsImV4cCI6MjA3ODY5MTU5OH0.zMWUklUmtIMvmDAC1Ec2si_TosZplxcbef134kz9ihk";

// Wait for Supabase UMD bundle to load
if (typeof window.supabase === "undefined") {
  throw new Error(
    "Supabase client script missing. Please include it in index.html before loading this module."
  );
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      headers: {
        "x-client-info": "neuro-link-family-dashboard",
      },
    },
  }
);

export { supabaseClient };

