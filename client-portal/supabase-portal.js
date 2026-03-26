(() => {
  const rawUrl = typeof SUPABASE_URL !== "undefined" ? String(SUPABASE_URL) : "";
  const rawKey = typeof SUPABASE_ANON_KEY !== "undefined" ? String(SUPABASE_ANON_KEY) : "";
  const url = rawUrl.trim();
  const key = rawKey.trim();

  if (!url || !key || url.includes("YOUR_PROJECT")) {
    window.portalInitError = "Supabase 설정이 없습니다. supabase-config.js를 먼저 설정하세요.";
    window.portalDb = null;
    return;
  }

  window.portalDb = window.supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();
