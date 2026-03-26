(function () {
  const db = window.portalDb;
  const parser = window.portalParser;
  const swot = window.portalSwot;

  const state = {
    profile: null,
    activeCustomerId: null,
    customers: [],
    pendingUsers: [],
    approvedUsers: [],
    snapshots: [],
    trendChart: null,
  };

  const elements = {
    sessionMeta: document.getElementById("session-meta"),
    logoutButton: document.getElementById("logout-button"),
    adminTools: document.getElementById("admin-tools"),
    searchForm: document.getElementById("customer-search-form"),
    searchInput: document.getElementById("customer-search-input"),
    customerList: document.getElementById("customer-list"),
    customerDetail: document.getElementById("customer-detail"),
    customerTitle: document.getElementById("customer-title"),
    summaryCards: document.getElementById("summary-cards"),
    snapshotTableBody: document.getElementById("snapshot-table-body"),
    portfolioList: document.getElementById("portfolio-list"),
    praiseList: document.getElementById("praise-list"),
    improveList: document.getElementById("improve-list"),
    swotS: document.getElementById("swot-s"),
    swotW: document.getElementById("swot-w"),
    swotO: document.getElementById("swot-o"),
    swotT: document.getElementById("swot-t"),
    trendCanvas: document.getElementById("trend-chart"),
    excelForm: document.getElementById("excel-upload-form"),
    excelFile: document.getElementById("excel-file"),
    snapshotLabel: document.getElementById("snapshot-label"),
    excelMessage: document.getElementById("excel-upload-message"),
    portfolioForm: document.getElementById("portfolio-upload-form"),
    portfolioFile: document.getElementById("portfolio-file"),
    portfolioNote: document.getElementById("portfolio-note"),
    portfolioCustomerSelect: document.getElementById("portfolio-customer-select"),
    portfolioSnapshotSelect: document.getElementById("portfolio-snapshot-select"),
    portfolioMessage: document.getElementById("portfolio-upload-message"),
    pendingUserList: document.getElementById("pending-user-list"),
    pendingUserMessage: document.getElementById("pending-user-message"),
    approvedUserList: document.getElementById("approved-user-list"),
    approvedUserMessage: document.getElementById("approved-user-message"),
  };

  function setMessage(target, text, isError) {
    if (!target) return;
    target.textContent = text || "";
    target.style.color = isError ? "#a82b2b" : "#5f6d81";
  }

  function fmtNumber(value) {
    const num = Number(value || 0);
    return num.toLocaleString("ko-KR");
  }

  function fmtDate(value) {
    if (!value) return "-";
    return String(value).replace("T", " ").slice(0, 16);
  }

  function getUserDisplayName(user) {
    return String(user?.display_name || "").trim() || user?.auth_user_id || "미입력";
  }

  function sanitizeFileName(name) {
    return String(name || "").replace(/[^\w.\-가-힣]/g, "_");
  }

  function renderList(target, values) {
    target.innerHTML = values.map((item) => `<li>${item}</li>`).join("");
  }

  async function ensureSession() {
    if (!db || window.portalInitError) {
      alert(window.portalInitError || "Supabase 초기화에 실패했습니다.");
      location.href = "./index.html";
      return null;
    }

    const {
      data: { session },
    } = await db.auth.getSession();

    if (!session?.user?.id) {
      location.href = "./index.html";
      return null;
    }

    const { data: profile, error } = await db
      .from("portal_users")
      .select("role, customer_id, is_active")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    if (error || !profile || !profile.is_active) {
      await db.auth.signOut();
      location.href = "./index.html";
      return null;
    }

    elements.sessionMeta.textContent =
      profile.role === "admin" ? "관리자 세션" : `고객 세션 · 고객ID ${profile.customer_id}`;

    state.profile = profile;
    return profile;
  }

  function bindEvents() {
    elements.logoutButton.addEventListener("click", async () => {
      await db.auth.signOut();
      location.href = "./index.html";
    });

    elements.searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loadCustomers(elements.searchInput.value.trim());
    });

    elements.customerList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-customer-id]");
      if (!button) return;
      const customerId = Number(button.dataset.customerId);
      if (!customerId) return;
      await loadCustomerDetail(customerId);
    });

    elements.excelForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleExcelUpload();
    });

    elements.portfolioCustomerSelect.addEventListener("change", async (event) => {
      const customerId = Number(event.target.value);
      if (!customerId) return;
      await loadCustomerDetail(customerId);
    });

    elements.portfolioForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handlePortfolioUpload();
    });

    elements.pendingUserList?.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-pending-user-id]");
      if (!button) return;

      const userId = Number(button.dataset.pendingUserId);
      if (!userId) return;

      await activatePendingCustomer(userId, button);
    });
  }

  async function loadCustomers(searchText) {
    let query = db
      .from("portal_customers")
      .select("id, name, label, birth_year, gender, job, phone, created_at")
      .order("created_at", { ascending: false });

    if (searchText) {
      query = query.or(`name.ilike.%${searchText}%,label.ilike.%${searchText}%`);
    }

    const { data, error } = await query;
    if (error) {
      elements.customerList.innerHTML = `<p class="message">고객 목록 조회 실패: ${error.message}</p>`;
      return;
    }

    state.customers = data || [];
    renderCustomerList();
    renderCustomerOptionsForAdmin();

    if (state.profile.role === "customer" && state.profile.customer_id) {
      const own = state.customers.find((c) => c.id === state.profile.customer_id);
      if (!own) {
        const { data: selfCustomer } = await db
          .from("portal_customers")
          .select("id, name, label, birth_year, gender, job, phone, created_at")
          .eq("id", state.profile.customer_id)
          .maybeSingle();
        if (selfCustomer) state.customers = [selfCustomer];
      }
      renderCustomerList();
    }
  }

  function renderCustomerList() {
    if (!state.customers.length) {
      elements.customerList.innerHTML = `<p class="message">조회된 고객이 없습니다.</p>`;
      return;
    }

    elements.customerList.innerHTML = state.customers
      .map((customer) => {
        const activeClass = customer.id === state.activeCustomerId ? "active" : "";
        return `
          <button class="customer-item ${activeClass}" data-customer-id="${customer.id}" type="button">
            <div>
              <strong>${customer.name || "미상"}</strong><br>
              <small>${customer.label || "-"}</small>
            </div>
            <small>${customer.birth_year || "-"} · ${customer.gender || "-"}</small>
          </button>
        `;
      })
      .join("");
  }

  function renderCustomerOptionsForAdmin() {
    if (state.profile.role !== "admin") return;
    const options = [
      `<option value="">고객 선택</option>`,
      ...state.customers.map((customer) => `<option value="${customer.id}">${customer.label || customer.name}</option>`),
    ];
    elements.portfolioCustomerSelect.innerHTML = options.join("");

    if (state.activeCustomerId) {
      elements.portfolioCustomerSelect.value = String(state.activeCustomerId);
    }
  }

  function renderPendingUsers() {
    if (state.profile.role !== "admin" || !elements.pendingUserList) return;

    if (!state.pendingUsers.length) {
      elements.pendingUserList.innerHTML = `<p class="message">미승인 고객이 없습니다.</p>`;
      return;
    }

    elements.pendingUserList.innerHTML = state.pendingUsers
      .map(
        (user) => `
          <article class="pending-user-item">
            <div class="pending-user-meta">
              <strong>${getUserDisplayName(user)}</strong>
              <small>가입일: ${fmtDate(user.created_at)}</small>
              <small>${user.customer_id ? `고객 ID: ${user.customer_id}` : "고객 정보 미연결"}</small>
            </div>
            <button type="button" class="ghost-button pending-activate-button" data-pending-user-id="${user.id}">활성화</button>
          </article>
        `,
      )
      .join("");
  }

  async function loadPendingCustomers() {
    if (state.profile.role !== "admin" || !elements.pendingUserList) return;

    const { data, error } = await db
      .from("portal_users")
      .select("id, auth_user_id, customer_id, display_name, created_at")
      .eq("role", "customer")
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    if (error) {
      state.pendingUsers = [];
      renderPendingUsers();
      setMessage(elements.pendingUserMessage, `미승인 고객 조회 실패: ${error.message}`, true);
      return;
    }

    state.pendingUsers = data || [];
    renderPendingUsers();
    setMessage(elements.pendingUserMessage, "", false);
  }

  function renderApprovedUsers() {
    if (state.profile.role !== "admin" || !elements.approvedUserList) return;

    if (!state.approvedUsers.length) {
      elements.approvedUserList.innerHTML = `<p class="message">승인 고객 목록이 비어 있습니다.</p>`;
      return;
    }

    elements.approvedUserList.innerHTML = state.approvedUsers
      .map(
        (user) => `
          <article class="pending-user-item">
            <div class="pending-user-meta">
              <strong>${getUserDisplayName(user)}</strong>
              <small>승인일시: ${fmtDate(user.created_at)}</small>
              <small>${user.customer_id ? `고객 ID: ${user.customer_id}` : "고객 매핑 없음"}</small>
            </div>
          </article>
        `,
      )
      .join("");
  }

  async function loadApprovedCustomers() {
    if (state.profile.role !== "admin" || !elements.approvedUserList) return;

    const { data, error } = await db
      .from("portal_users")
      .select("id, auth_user_id, customer_id, display_name, created_at")
      .eq("role", "customer")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      state.approvedUsers = [];
      renderApprovedUsers();
      setMessage(elements.approvedUserMessage, `승인 고객 목록 조회 실패: ${error.message}`, true);
      return;
    }

    state.approvedUsers = data || [];
    renderApprovedUsers();
    setMessage(elements.approvedUserMessage, "", false);
  }

  async function activatePendingCustomer(userId, button) {
    if (state.profile.role !== "admin") return;

    if (button) {
      button.disabled = true;
      button.textContent = "처리 중...";
    }

    const { error } = await db
      .from("portal_users")
      .update({ is_active: true })
      .eq("id", userId)
      .eq("role", "customer")
      .eq("is_active", false);

    if (error) {
      setMessage(elements.pendingUserMessage, `활성화 실패: ${error.message}`, true);
      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = "활성화";
      }
      return;
    }

    setMessage(elements.pendingUserMessage, "고객 계정을 활성화했습니다.", false);
    await Promise.all([loadPendingCustomers(), loadApprovedCustomers()]);
  }

  async function loadCustomerDetail(customerId) {
    state.activeCustomerId = customerId;
    renderCustomerList();

    const [{ data: customer, error: customerError }, { data: snapshots, error: snapshotsError }, { data: files, error: filesError }] =
      await Promise.all([
        db.from("portal_customers").select("*").eq("id", customerId).single(),
        db.from("portal_snapshots").select("*").eq("customer_id", customerId).order("snapshot_at", { ascending: false }),
        db.from("portal_portfolio_files").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
      ]);

    if (customerError || snapshotsError || filesError) {
      elements.customerDetail.classList.remove("hidden");
      elements.customerTitle.textContent = "고객 상세 조회 실패";
      elements.summaryCards.innerHTML = `<p class="message">데이터 조회 중 오류가 발생했습니다.</p>`;
      return;
    }

    state.snapshots = snapshots || [];
    elements.customerDetail.classList.remove("hidden");
    elements.customerTitle.textContent = `${customer.name} (${customer.label || "-"})`;

    renderSummaryCards(state.snapshots[0]);
    renderSnapshotTable(state.snapshots);
    renderTrendChart(state.snapshots);

    const insight = swot.analyzeSnapshots(state.snapshots);
    renderList(elements.praiseList, insight.praise);
    renderList(elements.improveList, insight.improvements);
    renderList(elements.swotS, insight.swot.strengths);
    renderList(elements.swotW, insight.swot.weaknesses);
    renderList(elements.swotO, insight.swot.opportunities);
    renderList(elements.swotT, insight.swot.threats);

    await renderPortfolio(files || []);
    updateSnapshotSelect(state.snapshots);
    if (state.profile.role === "admin") {
      elements.portfolioCustomerSelect.value = String(customerId);
    }
  }

  function renderSummaryCards(latest) {
    if (!latest) {
      elements.summaryCards.innerHTML = `<p class="message">스냅샷 데이터가 없습니다.</p>`;
      return;
    }

    const savingsRate = latest.total_monthly_income > 0
      ? ((latest.savings_capacity || 0) / latest.total_monthly_income) * 100
      : 0;

    const cards = [
      ["월 소득", fmtNumber(latest.total_monthly_income), "만원"],
      ["월 지출", fmtNumber(latest.total_expense), "만원"],
      ["저축 가능액", fmtNumber(latest.savings_capacity), "만원"],
      ["저축률", savingsRate.toFixed(1), "%"],
      ["총자산", fmtNumber(latest.total_assets), "만원"],
      ["총부채", fmtNumber(latest.total_debt), "만원"],
      ["순자산", fmtNumber(latest.net_assets), "만원"],
      ["총자산 수익률", Number(latest.overall_return_rate || 0).toFixed(2), "%"],
    ];

    elements.summaryCards.innerHTML = cards
      .map(
        ([key, value, unit]) => `
        <article class="summary-card">
          <div class="k">${key}</div>
          <div class="v">${value}</div>
          <div class="u">${unit}</div>
        </article>
      `,
      )
      .join("");
  }

  function renderSnapshotTable(snapshots) {
    if (!snapshots.length) {
      elements.snapshotTableBody.innerHTML = `<tr><td colspan="8">스냅샷 데이터가 없습니다.</td></tr>`;
      return;
    }
    elements.snapshotTableBody.innerHTML = snapshots
      .map(
        (s) => `
          <tr>
            <td>${fmtDate(s.snapshot_at)}</td>
            <td>${s.snapshot_label || "-"}</td>
            <td>${fmtNumber(s.total_monthly_income)}</td>
            <td>${fmtNumber(s.total_expense)}</td>
            <td>${fmtNumber(s.total_assets)}</td>
            <td>${fmtNumber(s.total_debt)}</td>
            <td>${fmtNumber(s.net_assets)}</td>
            <td>${Number(s.overall_return_rate || 0).toFixed(2)}%</td>
          </tr>
        `,
      )
      .join("");
  }

  function renderTrendChart(snapshotsDesc) {
    const snapshots = [...snapshotsDesc].reverse();
    const labels = snapshots.map((item) => String(item.snapshot_label || fmtDate(item.snapshot_at)));

    const data = {
      labels,
      datasets: [
        {
          label: "월 소득",
          data: snapshots.map((item) => item.total_monthly_income || 0),
          borderColor: "#2359b6",
          backgroundColor: "rgba(35,89,182,0.12)",
          tension: 0.25,
        },
        {
          label: "월 지출",
          data: snapshots.map((item) => item.total_expense || 0),
          borderColor: "#a82b2b",
          backgroundColor: "rgba(168,43,43,0.10)",
          tension: 0.25,
        },
        {
          label: "순자산",
          data: snapshots.map((item) => item.net_assets || 0),
          borderColor: "#227c5f",
          backgroundColor: "rgba(34,124,95,0.10)",
          tension: 0.25,
        },
      ],
    };

    if (state.trendChart) state.trendChart.destroy();

    state.trendChart = new Chart(elements.trendCanvas, {
      type: "line",
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: "재무 추이" },
        },
      },
    });
  }

  async function renderPortfolio(files) {
    if (!files.length) {
      elements.portfolioList.innerHTML = `<p class="message">업로드된 포트폴리오 파일이 없습니다.</p>`;
      return;
    }

    const signedResults = await Promise.all(
      files.map(async (file) => {
        const { data, error } = await db.storage
          .from(file.bucket_name || "portfolio-files")
          .createSignedUrl(file.object_path, 60 * 60);

        return {
          file,
          signedUrl: error ? "" : data?.signedUrl || "",
        };
      }),
    );

    elements.portfolioList.innerHTML = signedResults
      .map(({ file, signedUrl }) => {
        const mime = String(file.mime_type || "").toLowerCase();
        const isImage = mime.startsWith("image/");
        const thumb = isImage && signedUrl
          ? `<img src="${signedUrl}" alt="${file.original_name}">`
          : `<span>${signedUrl ? "파일 열기" : "URL 생성 실패"}</span>`;

        return `
          <article class="portfolio-item">
            <a class="portfolio-thumb" href="${signedUrl || "#"}" target="_blank" rel="noreferrer">${thumb}</a>
            <strong>${file.original_name}</strong>
            <small>${fmtDate(file.created_at)} · ${file.snapshot_label || "라벨 미연결"}</small>
            <small>${file.note || ""}</small>
          </article>
        `;
      })
      .join("");
  }

  function updateSnapshotSelect(snapshots) {
    const options = [
      `<option value="">연결 안함</option>`,
      ...snapshots.map(
        (snapshot) =>
          `<option value="${snapshot.id}">${snapshot.snapshot_label || "스냅샷"} (${fmtDate(snapshot.snapshot_at)})</option>`,
      ),
    ];
    elements.portfolioSnapshotSelect.innerHTML = options.join("");
    if (snapshots[0]) {
      elements.portfolioSnapshotSelect.value = String(snapshots[0].id);
    }
  }

  async function upsertCustomer(parsed) {
    let existingQuery = db
      .from("portal_customers")
      .select("*")
      .eq("name", parsed.customer.name);

    if (parsed.customer.birth_year === null || parsed.customer.birth_year === undefined) {
      existingQuery = existingQuery.is("birth_year", null);
    } else {
      existingQuery = existingQuery.eq("birth_year", parsed.customer.birth_year);
    }

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const firstUploadMonth =
      existing?.first_upload_month ||
      parser.extractUploadMonthFromLabel(existing?.label) ||
      parser.getCurrentUploadMonth();
    const label = parser.buildLabel(
      parsed.customer.birth_year,
      parsed.customer.gender,
      parsed.customer.name,
      firstUploadMonth,
    );

    const customerPayload = {
      name: parsed.customer.name,
      birth_year: parsed.customer.birth_year,
      gender: parsed.customer.gender,
      job: parsed.customer.job || null,
      address: parsed.customer.address || null,
      email: parsed.customer.email || null,
      phone: parsed.customer.phone || null,
      financial_goal: parsed.customer.financial_goal || null,
      label,
      first_upload_month: firstUploadMonth,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data: updated, error: updateError } = await db
        .from("portal_customers")
        .update(customerPayload)
        .eq("id", existing.id)
        .select("id, label")
        .single();

      if (updateError) throw new Error(updateError.message);
      return { customer: updated, isNew: false, passwordHint: parsed.accountHint.initialPassword };
    }

    customerPayload.created_at = new Date().toISOString();

    const { data: inserted, error: insertError } = await db
      .from("portal_customers")
      .insert(customerPayload)
      .select("id, label")
      .single();

    if (insertError) throw new Error(insertError.message);
    return { customer: inserted, isNew: true, passwordHint: parsed.accountHint.initialPassword };
  }

  async function insertSnapshot(customerId, parsed, snapshotLabel) {
    const totalFinancial = (parsed.snapshot.safe_assets || 0) + (parsed.snapshot.investment_assets || 0);
    const savingsRatio = parsed.snapshot.total_monthly_income > 0
      ? (parsed.snapshot.savings_capacity / parsed.snapshot.total_monthly_income) * 100
      : 0;
    const investmentRatio = totalFinancial > 0
      ? ((parsed.snapshot.investment_assets || 0) / totalFinancial) * 100
      : 0;

    const snapshotPayload = {
      customer_id: customerId,
      snapshot_label: snapshotLabel,
      snapshot_at: new Date().toISOString(),
      salary_self: parsed.snapshot.salary_self || 0,
      salary_spouse: parsed.snapshot.salary_spouse || 0,
      other_income: parsed.snapshot.other_income || 0,
      bonus: parsed.snapshot.bonus || 0,
      total_monthly_income: parsed.snapshot.total_monthly_income || 0,
      total_expense: parsed.snapshot.total_expense || 0,
      savings_capacity: parsed.snapshot.savings_capacity || 0,
      savings_ratio: Number(savingsRatio.toFixed(2)),
      safe_assets: parsed.snapshot.safe_assets || 0,
      investment_assets: parsed.snapshot.investment_assets || 0,
      total_financial_assets: totalFinancial,
      investment_ratio: Number(investmentRatio.toFixed(2)),
      real_estate_total: parsed.snapshot.real_estate_total || 0,
      total_debt: parsed.snapshot.total_debt || 0,
      net_assets: parsed.snapshot.net_assets || 0,
      total_assets: parsed.snapshot.total_assets || 0,
      overall_return_rate: parsed.snapshot.overall_return_rate || 0,
      insurance_premium: parsed.snapshot.insurance_premium || 0,
      raw_json: parsed.raw || {},
      created_by: null,
    };

    const { error } = await db.from("portal_snapshots").insert(snapshotPayload);
    if (error) throw new Error(error.message);
  }

  async function handleExcelUpload() {
    if (state.profile.role !== "admin") return;
    const file = elements.excelFile.files?.[0];
    if (!file) {
      setMessage(elements.excelMessage, "엑셀 파일을 선택하세요.", true);
      return;
    }

    const snapshotLabel = elements.snapshotLabel.value || "점검";
    setMessage(elements.excelMessage, "엑셀 파싱 및 저장 중...", false);

    try {
      const parsed = await parser.parseFinancialExcel(file);
      const { customer, isNew, passwordHint } = await upsertCustomer(parsed);
      await insertSnapshot(customer.id, parsed, snapshotLabel);

      let msg = `저장 완료: ${customer.label}`;
      if (isNew) {
        msg += ` / 초기 비밀번호 추천: ${passwordHint}`;
      }
      msg += " / 신규 고객 Auth 계정은 Supabase Dashboard에서 생성 후 portal_users에 연결하세요.";
      setMessage(elements.excelMessage, msg, false);

      await loadCustomers(elements.searchInput.value.trim());
      await loadCustomerDetail(customer.id);
      elements.excelForm.reset();
    } catch (error) {
      setMessage(elements.excelMessage, `저장 실패: ${error.message || "알 수 없는 오류"}`, true);
    }
  }

  async function handlePortfolioUpload() {
    if (state.profile.role !== "admin") return;
    const customerId = Number(elements.portfolioCustomerSelect.value);
    const file = elements.portfolioFile.files?.[0];
    if (!customerId || !file) {
      setMessage(elements.portfolioMessage, "대상 고객과 파일을 선택하세요.", true);
      return;
    }

    const snapshotId = elements.portfolioSnapshotSelect.value ? Number(elements.portfolioSnapshotSelect.value) : null;
    const note = elements.portfolioNote.value.trim();
    const objectPath = `customer_${customerId}/${Date.now()}_${sanitizeFileName(file.name)}`;
    const bucket = "portfolio-files";

    setMessage(elements.portfolioMessage, "파일 업로드 중...", false);

    try {
      const { error: uploadError } = await db.storage
        .from(bucket)
        .upload(objectPath, file, { upsert: false, contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const metadataPayload = {
        customer_id: customerId,
        snapshot_id: snapshotId,
        snapshot_label: state.snapshots.find((item) => item.id === snapshotId)?.snapshot_label || null,
        bucket_name: bucket,
        object_path: objectPath,
        original_name: file.name,
        mime_type: file.type || null,
        file_size: file.size || 0,
        note: note || null,
        uploaded_by: null,
      };

      const { error: metaError } = await db.from("portal_portfolio_files").insert(metadataPayload);
      if (metaError) throw metaError;

      setMessage(elements.portfolioMessage, "업로드 완료", false);
      elements.portfolioForm.reset();
      if (customerId === state.activeCustomerId) {
        await loadCustomerDetail(customerId);
      }
    } catch (error) {
      setMessage(elements.portfolioMessage, `업로드 실패: ${error.message || "알 수 없는 오류"}`, true);
    }
  }

  async function initialize() {
    const profile = await ensureSession();
    if (!profile) return;

    if (profile.role === "admin") {
      elements.adminTools.classList.remove("hidden");
      bindEvents();
      await Promise.all([loadCustomers(""), loadPendingCustomers(), loadApprovedCustomers()]);
      if (state.customers[0]) {
        await loadCustomerDetail(state.customers[0].id);
      }
      return;
    }

    bindEvents();
    await loadCustomers("");
    elements.searchForm.classList.add("hidden");
    if (profile.customer_id) {
      await loadCustomerDetail(profile.customer_id);
    }
  }

  initialize();
})();
