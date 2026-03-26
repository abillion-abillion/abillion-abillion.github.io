(function () {
  const form = document.getElementById("login-form");
  const idInput = document.getElementById("login-id");
  const passwordInput = document.getElementById("login-password");
  const submitButton = document.getElementById("login-submit");
  const message = document.getElementById("login-message");
  const db = window.portalDb;

  function setMessage(text, isError) {
    message.textContent = text || "";
    message.style.color = isError ? "#a82b2b" : "#5f6d81";
  }

  function toEmail(loginIdRaw) {
    const loginId = String(loginIdRaw || "").trim();
    if (!loginId) return "";
    if (loginId.includes("@")) return loginId.toLowerCase();
    return `${loginId.toLowerCase()}@clients.jwfinancial.local`;
  }

  async function redirectIfSignedIn() {
    if (!db || window.portalInitError) {
      setMessage(window.portalInitError || "Supabase 초기화 오류", true);
      submitButton.disabled = true;
      return;
    }

    const {
      data: { session },
    } = await db.auth.getSession();

    if (!session?.user?.id) return;

    const { data: profile } = await db
      .from("portal_users")
      .select("role, customer_id, is_active")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (profile?.is_active) {
      location.href = "./app.html";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db) return;

    setMessage("로그인 중입니다...", false);
    submitButton.disabled = true;

    try {
      const email = toEmail(idInput.value);
      const password = String(passwordInput.value || "");
      if (!email || !password) {
        setMessage("아이디와 비밀번호를 입력하세요.", true);
        return;
      }

      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("로그인에 실패했습니다. 아이디/비밀번호를 확인하세요.", true);
        return;
      }

      const authId = data?.user?.id;
      if (!authId) {
        setMessage("로그인 세션을 확인할 수 없습니다.", true);
        return;
      }

      const { data: profile, error: profileError } = await db
        .from("portal_users")
        .select("role, customer_id, is_active")
        .eq("auth_user_id", authId)
        .maybeSingle();

      if (profileError || !profile || !profile.is_active) {
        await db.auth.signOut();
        setMessage("포털 권한이 없습니다. 관리자에게 계정 연결을 요청하세요.", true);
        return;
      }

      location.href = "./app.html";
    } catch (_e) {
      setMessage("로그인 처리 중 오류가 발생했습니다.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  redirectIfSignedIn();
})();
