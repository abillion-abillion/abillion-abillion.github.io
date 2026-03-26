(function () {
  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");
  const showSignupButton = document.getElementById("show-signup");
  const showLoginButton = document.getElementById("show-login");

  const loginForm = document.getElementById("login-form");
  const loginIdInput = document.getElementById("login-id");
  const loginPasswordInput = document.getElementById("login-password");
  const loginSubmitButton = document.getElementById("login-submit");
  const loginMessage = document.getElementById("login-message");

  const signupForm = document.getElementById("signup-form");
  const signupNameInput = document.getElementById("signup-name");
  const signupEmailInput = document.getElementById("signup-email");
  const signupPasswordInput = document.getElementById("signup-password");
  const signupPasswordConfirmInput = document.getElementById("signup-password-confirm");
  const signupSubmitButton = document.getElementById("signup-submit");
  const signupMessage = document.getElementById("signup-message");

  const db = window.portalDb;

  function setMessage(target, text, isError) {
    if (!target) return;
    target.textContent = text || "";
    target.style.color = isError ? "#a82b2b" : "#5f6d81";
  }

  function clearMessages() {
    setMessage(loginMessage, "", false);
    setMessage(signupMessage, "", false);
  }

  function showMode(mode) {
    const signupMode = mode === "signup";
    loginView.classList.toggle("hidden", signupMode);
    signupView.classList.toggle("hidden", !signupMode);
    clearMessages();
  }

  function toEmail(loginIdRaw) {
    const loginId = String(loginIdRaw || "").trim();
    if (!loginId) return "";
    if (loginId.includes("@")) return loginId.toLowerCase();
    return `${loginId.toLowerCase()}@clients.jwfinancial.local`;
  }

  async function redirectIfSignedIn() {
    if (!db || window.portalInitError) {
      const initMessage = window.portalInitError || "Supabase 초기화 오류";
      setMessage(loginMessage, initMessage, true);
      setMessage(signupMessage, initMessage, true);
      loginSubmitButton.disabled = true;
      signupSubmitButton.disabled = true;
      showSignupButton.disabled = true;
      showLoginButton.disabled = true;
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
      return;
    }

    await db.auth.signOut();
    setMessage(loginMessage, "관리자 승인 후 로그인할 수 있습니다.", true);
  }

  showSignupButton.addEventListener("click", () => {
    showMode("signup");
  });

  showLoginButton.addEventListener("click", () => {
    showMode("login");
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db) return;

    setMessage(loginMessage, "로그인 처리 중입니다...", false);
    loginSubmitButton.disabled = true;

    try {
      const email = toEmail(loginIdInput.value);
      const password = String(loginPasswordInput.value || "");

      if (!email || !password) {
        setMessage(loginMessage, "아이디와 비밀번호를 입력해주세요.", true);
        return;
      }

      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(loginMessage, "로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요.", true);
        return;
      }

      const authId = data?.user?.id;
      if (!authId) {
        setMessage(loginMessage, "로그인 세션을 확인할 수 없습니다.", true);
        return;
      }

      const { data: profile, error: profileError } = await db
        .from("portal_users")
        .select("role, customer_id, is_active")
        .eq("auth_user_id", authId)
        .maybeSingle();

      if (profileError || !profile || !profile.is_active) {
        await db.auth.signOut();
        setMessage(loginMessage, "가입 승인 대기 상태입니다. 관리자에게 문의해주세요.", true);
        return;
      }

      location.href = "./app.html";
    } catch (_error) {
      setMessage(loginMessage, "로그인 처리 중 오류가 발생했습니다.", true);
    } finally {
      loginSubmitButton.disabled = false;
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!db) return;

    setMessage(signupMessage, "가입 처리 중입니다...", false);
    signupSubmitButton.disabled = true;

    try {
      const name = String(signupNameInput.value || "").trim();
      const email = String(signupEmailInput.value || "").trim().toLowerCase();
      const password = String(signupPasswordInput.value || "");
      const passwordConfirm = String(signupPasswordConfirmInput.value || "");

      if (!name || !email || !password || !passwordConfirm) {
        setMessage(signupMessage, "모든 항목을 입력해주세요.", true);
        return;
      }

      if (password !== passwordConfirm) {
        setMessage(signupMessage, "비밀번호와 비밀번호 확인이 일치하지 않습니다.", true);
        return;
      }

      const { error } = await db.auth.signUp({ email, password });
      if (error) {
        setMessage(signupMessage, error.message || "회원가입에 실패했습니다.", true);
        return;
      }

      await db.auth.signOut();
      signupForm.reset();
      setMessage(signupMessage, "가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.", false);
    } catch (_error) {
      setMessage(signupMessage, "회원가입 처리 중 오류가 발생했습니다.", true);
    } finally {
      signupSubmitButton.disabled = false;
    }
  });

  redirectIfSignedIn();
})();
