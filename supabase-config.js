// Fill these two values with your Supabase project settings.
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const hasConfig =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_PROJECT") &&
  !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY");

window.db = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
