// Fill these two values with your Supabase project settings.
const SUPABASE_URL = "https://vmfookihftmxxhvtpzpn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtZm9va2loZnRteHhodnRwenBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDc4NjMsImV4cCI6MjA4OTk4Mzg2M30.lH4U6s4f8tmHreLkXNpP-5VDR_oFdt24Xv0DGDo06nQ
";


const hasConfig =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_PROJECT") &&
  !SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY");

window.db = hasConfig ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
