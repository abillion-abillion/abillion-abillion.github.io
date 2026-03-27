(function () {
  const db = window.portalDb;
  const parser = window.portalParser;
  const swot = window.portalSwot;

  const state = {
    profile: null,
    authUserId: null,
    activeCustomerId: null,
    customers: [],
    pendingUsers: [],
    approvedUsers: [],
    snapshots: [],
    files: [],
    executionTasks: {},
    executionStorageAvailable: true,
    executionStorageMessage: "",
    strategyConfig: null,
    strategyStorageAvailable: true,
    strategyStorageMessage: "",
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
    customerSubtitle: document.getElementById("customer-subtitle"),
    customerMeta: document.getElementById("customer-meta"),
    customerLastUpdated: document.getElementById("customer-last-updated"),
    summaryCards: document.getElementById("summary-cards"),
    diagnosticHighlights: document.getElementById("diagnostic-highlights"),
    priorityList: document.getElementById("priority-list"),
    roadmapList: document.getElementById("roadmap-list"),
    stageProgressBoard: document.getElementById("stage-progress-board"),
    portfolioStrategyBoard: document.getElementById("portfolio-strategy-board"),
    debtControlBoard: document.getElementById("debt-control-board"),
    protectionBoard: document.getElementById("protection-board"),
    executionChecklist: document.getElementById("execution-checklist"),
    trendCaption: document.getElementById("trend-caption"),
    snapshotTableBody: document.getElementById("snapshot-table-body"),
    portfolioList: document.getElementById("portfolio-list"),
    praiseList: document.getElementById("praise-list"),
    improveList: document.getElementById("improve-list"),
    swotS: document.getElementById("swot-s"),
    swotW: document.getElementById("swot-w"),
    swotO: document.getElementById("swot-o"),
    swotT: document.getElementById("swot-t"),
    trendCanvas: document.getElementById("trend-chart"),
    healthScoreRing: document.getElementById("health-score-ring"),
    healthScoreValue: document.getElementById("health-score-value"),
    healthScoreCaption: document.getElementById("health-score-caption"),
    allocationList: document.getElementById("allocation-list"),
    healthMetrics: document.getElementById("health-metrics"),
    activityTimeline: document.getElementById("activity-timeline"),
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  function setMessage(target, text, isError) {
    if (!target) return;
    target.textContent = text || "";
    target.style.color = isError ? "#d0465a" : "#607089";
  }

  function fmtNumber(value, digits = 0) {
    return Number(value || 0).toLocaleString("ko-KR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function fmtPercent(value, digits = 1) {
    return `${fmtNumber(value, digits)}%`;
  }

  function fmtMonths(value) {
    const months = Math.max(0, Math.round(Number(value) || 0));
    if (months < 12) return `${months}개월`;
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return rest ? `${years}년 ${rest}개월` : `${years}년`;
  }

  function fmtDate(value, withTime = true) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(withTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        : {}),
    }).format(date);
  }

  function getUserDisplayName(user) {
    return String(user?.display_name || "").trim() || user?.auth_user_id || "미입력";
  }

  function getFileExtension(name) {
    const match = String(name || "").match(/\.([a-zA-Z0-9]{1,10})$/);
    return match ? `.${match[1].toLowerCase()}` : "";
  }

  function buildStorageObjectPath(customerId, originalName) {
    const extension = getFileExtension(originalName);
    const rawToken = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const safeToken = String(rawToken).replace(/[^a-zA-Z0-9_-]/g, "");
    return `customer_${customerId}/${Date.now()}_${safeToken}${extension}`;
  }

  function renderList(target, values) {
    if (!target) return;
    target.innerHTML = values.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function getSavingsRate(snapshot) {
    if (!snapshot?.total_monthly_income) return 0;
    return (Number(snapshot.savings_capacity || 0) / Number(snapshot.total_monthly_income || 1)) * 100;
  }

  function getDebtRatio(snapshot) {
    if (!snapshot?.total_assets) return 0;
    return (Number(snapshot.total_debt || 0) / Number(snapshot.total_assets || 1)) * 100;
  }

  function getInvestmentRatio(snapshot) {
    if (!snapshot?.total_financial_assets) return 0;
    return (Number(snapshot.investment_assets || 0) / Number(snapshot.total_financial_assets || 1)) * 100;
  }

  function describeChange(current, previous, unit, digits, inverse) {
    if (previous === null || previous === undefined) {
      return { text: "첫 기록", tone: "neutral" };
    }

    const diff = Number(current || 0) - Number(previous || 0);
    if (Math.abs(diff) < 0.001) {
      return { text: "변동 없음", tone: "neutral" };
    }

    return {
      text: `${diff > 0 ? "+" : ""}${fmtNumber(diff, digits)}${unit}`,
      tone: (inverse ? diff < 0 : diff > 0) ? "good" : "bad",
    };
  }

  function getHealthSummary(snapshot) {
    if (!snapshot) {
      return {
        score: 0,
        label: "스냅샷이 등록되면 점수를 계산합니다.",
      };
    }

    const savingsRate = getSavingsRate(snapshot);
    const debtRatio = getDebtRatio(snapshot);
    const investmentRatio = getInvestmentRatio(snapshot);
    const returnRate = Number(snapshot.overall_return_rate || 0);

    const savingsScore = clamp((savingsRate / 25) * 100, 0, 100);
    const debtScore = clamp(100 - (debtRatio / 60) * 100, 0, 100);
    const returnScore = clamp(((returnRate + 2) / 8) * 100, 0, 100);
    const balanceScore = clamp(100 - Math.abs(investmentRatio - 45) * 1.7, 0, 100);
    const score = Math.round(
      savingsScore * 0.35 +
      debtScore * 0.35 +
      returnScore * 0.15 +
      balanceScore * 0.15,
    );

    let label = "우선순위 점검이 필요한 상태입니다.";
    if (score >= 80) label = "안정적으로 관리되고 있습니다.";
    else if (score >= 65) label = "전반적으로 양호하지만 세부 조정이 필요합니다.";
    else if (score >= 50) label = "방향은 맞지만 실행 강도가 더 필요합니다.";

    return { score, label };
  }

  function getStageStatus(progress) {
    if (progress >= 90) return { status: "done", label: "완료" };
    if (progress >= 60) return { status: "focus", label: "진행" };
    return { status: "next", label: "대기" };
  }

  function buildPlanningModel(customer, latest, previous, files) {
    if (!latest) {
      return {
        highlights: [],
        priorities: [],
        roadmap: [],
        stageProgress: [],
        overallProgress: 0,
      };
    }

    const savingsRate = getSavingsRate(latest);
    const debtRatio = getDebtRatio(latest);
    const investmentRatio = getInvestmentRatio(latest);
    const returnRate = Number(latest.overall_return_rate || 0);
    const health = getHealthSummary(latest);
    const priorities = [];

    if (savingsRate < 15) {
      priorities.push({
        rank: "우선 1",
        tone: "bad",
        title: "현금흐름 재정렬",
        copy: `저축률이 ${fmtPercent(savingsRate)}로 낮아 지출 구조 조정이 먼저 필요합니다. 고정지출과 보험료, 생활비부터 재배치하는 흐름이 맞습니다.`,
      });
    }

    if (debtRatio >= 40) {
      priorities.push({
        rank: `우선 ${priorities.length + 1}`,
        tone: "bad",
        title: "부채 부담 완화",
        copy: `부채 비중이 ${fmtPercent(debtRatio)}입니다. 상환 우선순위와 금리 구조를 다시 짜지 않으면 자산 확장보다 방어가 먼저입니다.`,
      });
    }

    if (investmentRatio < 25 || investmentRatio > 70) {
      priorities.push({
        rank: `우선 ${priorities.length + 1}`,
        tone: "warn",
        title: "투자 배분 재설계",
        copy: `투자 비중이 ${fmtPercent(investmentRatio)}입니다. 안전자산과 투자자산의 역할 분리를 다시 설계해야 수익률 변동을 줄일 수 있습니다.`,
      });
    }

    if (returnRate <= 1) {
      priorities.push({
        rank: `우선 ${priorities.length + 1}`,
        tone: "warn",
        title: "수익률 점검",
        copy: `현재 수익률이 ${fmtPercent(returnRate, 2)}입니다. 보유 상품 성과와 리밸런싱 기준을 다시 설정할 필요가 있습니다.`,
      });
    }

    if (!files.length) {
      priorities.push({
        rank: `우선 ${priorities.length + 1}`,
        tone: "good",
        title: "실행 자료 축적",
        copy: "포트폴리오 보고서나 실행 기록 파일이 아직 없습니다. 상담 후 실행 자료를 남기면 다음 점검 설계가 훨씬 정교해집니다.",
      });
    }

    if (!priorities.length) {
      priorities.push({
        rank: "우선 1",
        tone: "good",
        title: "유지 관리 단계",
        copy: "핵심 수치가 급하게 무너지지 않았습니다. 지금은 대규모 수정보다 리밸런싱과 점검 주기 관리가 더 중요합니다.",
      });
    }

    const highlights = [
      {
        label: "건강도",
        value: `${health.score}점`,
        note: health.label,
        tone: health.score >= 75 ? "good" : health.score >= 55 ? "warn" : "bad",
      },
      {
        label: "핵심 과제",
        value: priorities[0].title,
        note: priorities[0].copy,
        tone: priorities[0].tone,
      },
      {
        label: "최근 변화",
        value: previous ? `${describeChange(latest.net_assets, previous.net_assets, "만원", 0, false).text}` : "첫 분석",
        note: previous
          ? `직전 대비 순자산 흐름을 기준으로 현재 방향성을 해석했습니다.`
          : `${customer.name || "고객"}님의 첫 스냅샷 기준점입니다.`,
        tone: previous
          ? describeChange(latest.net_assets, previous.net_assets, "만원", 0, false).tone === "good" ? "good" : "warn"
          : "good",
      },
    ];

    const assetModel = buildAssetManagementModel(latest, previous, files, state.strategyConfig);
    const allocationRows = assetModel.portfolio?.rows || [];
    const checklist = assetModel.checklist || [];
    const completedChecklistCount = checklist.filter((item) => Boolean(state.executionTasks[item.key]?.is_completed)).length;
    const executionProgress = checklist.length
      ? Math.round((completedChecklistCount / checklist.length) * 100)
      : files.length
        ? 50
        : 25;
    const avgGapPercent = allocationRows.length
      ? allocationRows.reduce((sum, row) => sum + Math.abs(Number(row.gapPercent || 0)), 0) / allocationRows.length
      : 0;
    const managementProgressRaw = 100 - avgGapPercent * 2.8 - clamp(Math.max(debtRatio - 25, 0) * 1.3, 0, 35);
    const managementProgress = clamp(Math.round(managementProgressRaw), 30, 96);
    const designProgressBase = priorities[0]?.tone === "bad"
      ? 58
      : priorities[0]?.tone === "warn"
        ? 72
        : 88;
    const designProgress = clamp(Math.round(designProgressBase + (state.strategyConfig ? 8 : 0)), 45, 96);
    const thinkingProgress = 100;

    const stageProgress = [
      {
        stage: "사고",
        progress: thinkingProgress,
        note: `건강도 ${health.score}점 기준 진단이 완료되었습니다.`,
      },
      {
        stage: "설계",
        progress: designProgress,
        note: state.strategyConfig
          ? "전략 프로필이 저장되어 설계 기준이 고정되었습니다."
          : "핵심 우선순위 확정 후 전략 프로필 저장을 권장합니다.",
      },
      {
        stage: "자산관리",
        progress: managementProgress,
        note: `목표-현재 자산배분 평균 괴리 ${fmtPercent(avgGapPercent, 1)} 기준입니다.`,
      },
      {
        stage: "실행",
        progress: executionProgress,
        note: `체크리스트 ${completedChecklistCount}/${checklist.length || 0}, 실행 자료 ${files.length}건`,
      },
    ].map((item) => {
      const status = getStageStatus(item.progress);
      return {
        ...item,
        status: status.status,
        statusLabel: status.label,
      };
    });

    const overallProgress = Math.round(
      stageProgress.reduce((sum, item) => sum + item.progress, 0) / Math.max(stageProgress.length, 1),
    );
    const stageMap = Object.fromEntries(stageProgress.map((item) => [item.stage, item]));

    const roadmap = [
      {
        stage: "사고",
        index: "01",
        title: "현재 상태를 읽고 문제를 정의합니다",
        status: stageMap["사고"]?.status || "done",
        statusLabel: stageMap["사고"]?.statusLabel || "완료",
        summary: `최근 스냅샷 ${latest.snapshot_label || "점검"} 기준으로 건강도 ${health.score}점을 산출했습니다.`,
        detail: `저축률 ${fmtPercent(savingsRate)}, 부채 비중 ${fmtPercent(debtRatio)}, 투자 비중 ${fmtPercent(investmentRatio)}를 현재 프레임으로 사용합니다.`,
        metric: `기준 스냅샷 · ${fmtDate(latest.snapshot_at, false)} · 진행률 ${stageMap["사고"]?.progress || 0}%`,
      },
      {
        stage: "설계",
        index: "02",
        title: "우선순위를 설계합니다",
        status: stageMap["설계"]?.status || "focus",
        statusLabel: stageMap["설계"]?.statusLabel || "진행",
        summary: priorities[0].title,
        detail: priorities[0].copy,
        metric: `1순위 아젠다 · ${priorities[0].rank} · 진행률 ${stageMap["설계"]?.progress || 0}%`,
      },
      {
        stage: "자산관리",
        index: "03",
        title: "포트폴리오와 부채를 조정합니다",
        status: stageMap["자산관리"]?.status || "focus",
        statusLabel: stageMap["자산관리"]?.statusLabel || "진행",
        summary: debtRatio >= 40
          ? "부채 구조 조정이 자산 확장보다 우선입니다."
          : investmentRatio < 25
            ? "투자자산 비중이 낮아 성장 자산 설계가 필요합니다."
            : "현재 자산배분은 유지 가능하지만 상품별 점검이 필요합니다.",
        detail: `안전자산 ${fmtNumber(latest.safe_assets)}만원, 투자자산 ${fmtNumber(latest.investment_assets)}만원, 부동산 ${fmtNumber(latest.real_estate_total)}만원을 기준으로 재배분합니다.`,
        metric: `실행 기준 · 수익률 ${fmtPercent(returnRate, 2)} · 진행률 ${stageMap["자산관리"]?.progress || 0}%`,
      },
      {
        stage: "실행",
        index: "04",
        title: "다음 점검 전 실행 항목을 정리합니다",
        status: stageMap["실행"]?.status || "next",
        statusLabel: stageMap["실행"]?.statusLabel || "대기",
        summary: files.length
          ? `실행 자료 ${files.length}건이 등록되어 있습니다.`
          : "아직 실행 자료가 없어 다음 상담 전 산출물 정리가 필요합니다.",
        detail: files.length
          ? `가장 최근 파일은 ${files[0].original_name || "실행 자료"}이며, 상담 결과를 문서로 이어가고 있습니다.`
          : "리밸런싱 보고서, 실행 체크리스트, 상담 기록 중 하나부터 우선 남기면 다음 설계가 쉬워집니다.",
        metric: `업로드 자료 · ${files.length}건 · 진행률 ${stageMap["실행"]?.progress || 0}%`,
      },
    ];

    return {
      highlights,
      priorities: priorities.slice(0, 4),
      roadmap,
      stageProgress,
      overallProgress,
    };
  }

  function getStrategyPresets() {
    return {
      defensive: {
        code: "defensive",
        label: "방어형",
        tone: "bad",
        target: { safe: 50, invest: 25, real: 25 },
        summary: "현금흐름 안정과 부채 관리가 우선입니다. 안전자산 비중을 먼저 확보합니다.",
      },
      balanced: {
        code: "balanced",
        label: "균형형",
        tone: "warn",
        target: { safe: 35, invest: 45, real: 20 },
        summary: "안전자산과 성장자산을 함께 관리하는 균형 전략이 적합합니다.",
      },
      growth: {
        code: "growth",
        label: "성장형",
        tone: "good",
        target: { safe: 25, invest: 55, real: 20 },
        summary: "현금흐름이 안정적이어서 성장자산 중심의 전략을 시도할 수 있습니다.",
      },
    };
  }

  function getCustomProfileFromRatios(ratios) {
    return {
      code: "custom",
      label: "커스텀",
      tone: "warn",
      target: ratios,
      summary: "상담자가 직접 지정한 목표 배분입니다.",
    };
  }

  function pickAutoProfile(latest) {
    const presets = getStrategyPresets();
    const debtRatio = getDebtRatio(latest);
    const savingsRate = getSavingsRate(latest);
    const returnRate = Number(latest?.overall_return_rate || 0);

    if (debtRatio >= 45 || savingsRate < 12) return presets.defensive;
    if (debtRatio <= 30 && savingsRate >= 20 && returnRate >= 1.5) return presets.growth;
    return presets.balanced;
  }

  function normalizeStrategyRatios(rawSafe, rawInvest, rawReal) {
    const safe = Number(rawSafe);
    const invest = Number(rawInvest);
    const real = Number(rawReal);
    if ([safe, invest, real].some((value) => !Number.isFinite(value))) return null;

    const rounded = {
      safe: Math.round(safe * 10) / 10,
      invest: Math.round(invest * 10) / 10,
      real: Math.round(real * 10) / 10,
    };
    const sum = Math.round((rounded.safe + rounded.invest + rounded.real) * 10) / 10;
    if (Math.abs(sum - 100) > 0.1) return null;
    return rounded;
  }

  function isMissingTableError(error) {
    const message = String(error?.message || "");
    return error?.code === "42P01" || /does not exist/i.test(message);
  }

  async function loadStrategyConfig(customerId) {
    state.strategyConfig = null;
    state.strategyStorageMessage = "";

    const { data, error } = await db
      .from("portal_customer_strategy_configs")
      .select("profile_code, target_safe_ratio, target_invest_ratio, target_real_ratio, updated_at")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        state.strategyStorageAvailable = false;
        state.strategyStorageMessage = "전략 저장 테이블이 없어 자동 분석 모드로 동작합니다.";
      } else {
        state.strategyStorageAvailable = false;
        state.strategyStorageMessage = `전략 저장 상태 조회 실패: ${error.message}`;
      }
      return;
    }

    state.strategyStorageAvailable = true;
    if (!data) return;

    const ratios = normalizeStrategyRatios(
      data.target_safe_ratio,
      data.target_invest_ratio,
      data.target_real_ratio,
    );
    if (!ratios) return;

    const presets = getStrategyPresets();
    const preset = presets[data.profile_code] || null;
    state.strategyConfig = {
      profileCode: preset ? data.profile_code : "custom",
      profile: preset ? preset : getCustomProfileFromRatios(ratios),
      target: ratios,
      updatedAt: data.updated_at || null,
    };
  }

  function applyStrategyPresetToInputs(profileCode) {
    const form = elements.portfolioStrategyBoard?.querySelector("form[data-strategy-form]");
    if (!form) return;

    const safeInput = form.querySelector("input[name='target_safe']");
    const investInput = form.querySelector("input[name='target_invest']");
    const realInput = form.querySelector("input[name='target_real']");
    if (!safeInput || !investInput || !realInput) return;

    if (profileCode === "custom") return;

    let preset = null;
    if (profileCode === "auto") {
      preset = pickAutoProfile(state.snapshots[0]);
    } else {
      preset = getStrategyPresets()[profileCode];
    }
    if (!preset) return;

    safeInput.value = String(preset.target.safe);
    investInput.value = String(preset.target.invest);
    realInput.value = String(preset.target.real);
  }

  async function saveStrategyConfigFromForm(form) {
    if (!state.activeCustomerId) return false;

    const profileSelect = form.querySelector("select[name='strategy_profile']");
    const safeInput = form.querySelector("input[name='target_safe']");
    const investInput = form.querySelector("input[name='target_invest']");
    const realInput = form.querySelector("input[name='target_real']");
    if (!profileSelect || !safeInput || !investInput || !realInput) return false;

    const presets = getStrategyPresets();
    const selected = profileSelect.value;
    if (selected === "auto") {
      state.strategyConfig = null;
      state.strategyStorageMessage = "";

      if (state.strategyStorageAvailable) {
        const { error } = await db
          .from("portal_customer_strategy_configs")
          .delete()
          .eq("customer_id", state.activeCustomerId);

        if (error) {
          state.strategyStorageMessage = `전략 초기화 실패: ${error.message}`;
          return false;
        }
      }
      return true;
    }

    const ratios = selected === "custom"
      ? normalizeStrategyRatios(safeInput.value, investInput.value, realInput.value)
      : presets[selected]?.target || null;
    if (!ratios) {
      state.strategyStorageMessage = "목표 비중 합계는 100이어야 합니다.";
      return false;
    }

    const profile = selected === "custom"
      ? getCustomProfileFromRatios(ratios)
      : (presets[selected] || getCustomProfileFromRatios(ratios));
    const profileCode = selected === "custom" ? "custom" : profile.code;

    const nowIso = new Date().toISOString();
    state.strategyConfig = {
      profileCode,
      profile,
      target: ratios,
      updatedAt: nowIso,
    };

    if (!state.strategyStorageAvailable) return true;

    const payload = {
      customer_id: state.activeCustomerId,
      profile_code: profileCode,
      target_safe_ratio: ratios.safe,
      target_invest_ratio: ratios.invest,
      target_real_ratio: ratios.real,
      updated_at: nowIso,
      updated_by: state.authUserId || null,
    };

    const { error } = await db
      .from("portal_customer_strategy_configs")
      .upsert(payload, { onConflict: "customer_id" });

    if (error) {
      state.strategyStorageMessage = `전략 저장 실패: ${error.message}`;
      return false;
    }

    state.strategyStorageMessage = "";
    return true;
  }

  function buildAssetManagementModel(latest, previous, files, strategyConfig) {
    if (!latest) {
      return {
        portfolio: null,
        debt: null,
        protection: null,
        checklist: [],
      };
    }

    const totalAssets = Math.max(Number(latest.total_assets || 0), 1);
    const totalDebt = Number(latest.total_debt || 0);
    const savingsRate = getSavingsRate(latest);
    const debtRatio = getDebtRatio(latest);
    const investmentRatio = getInvestmentRatio(latest);
    const returnRate = Number(latest.overall_return_rate || 0);
    const insuranceRatio = latest.total_monthly_income
      ? (Number(latest.insurance_premium || 0) / Number(latest.total_monthly_income || 1)) * 100
      : 0;
    const emergencyMonths = latest.total_expense
      ? Number(latest.safe_assets || 0) / Number(latest.total_expense || 1)
      : 0;

    const autoProfile = pickAutoProfile(latest);
    const profile = strategyConfig?.profile || autoProfile;
    const strategySource = strategyConfig ? "수동 설정" : "자동 분석";

    const currentAllocation = {
      safe: (Number(latest.safe_assets || 0) / totalAssets) * 100,
      invest: (Number(latest.investment_assets || 0) / totalAssets) * 100,
      real: (Number(latest.real_estate_total || 0) / totalAssets) * 100,
    };

    const allocationRows = [
      ["안전자산", "safe", Number(latest.safe_assets || 0)],
      ["투자자산", "invest", Number(latest.investment_assets || 0)],
      ["부동산", "real", Number(latest.real_estate_total || 0)],
    ].map(([label, key, amount]) => {
      const current = currentAllocation[key];
      const target = profile.target[key];
      const gapPercent = target - current;
      const gapAmount = (gapPercent / 100) * totalAssets;
      return {
        label,
        key,
        amount,
        current,
        target,
        gapPercent,
        gapAmount,
      };
    });

    const monthlyPayCapacity = Math.max(Number(latest.savings_capacity || 0) * 0.6, 0);
    const estimatedMonths = monthlyPayCapacity > 0 ? totalDebt / monthlyPayCapacity : 0;
    const debtTone = debtRatio >= 45 ? "bad" : debtRatio >= 30 ? "warn" : "good";

    const protectionBand = {
      min: 8,
      max: 15,
      label: "권장 구간 8%~15%",
    };
    const protectionTone = insuranceRatio > protectionBand.max + 2
      ? "bad"
      : insuranceRatio < protectionBand.min - 1
        ? "warn"
        : "good";

    const debtGuides = [
      `상환 재원은 월 ${fmtNumber(monthlyPayCapacity)}만원(저축 가능액의 60%) 기준으로 계산했습니다.`,
      estimatedMonths
        ? `현재 총부채 ${fmtNumber(totalDebt)}만원이면 약 ${fmtMonths(estimatedMonths)}가 필요합니다.`
        : "상환 재원을 먼저 확보해야 기간 추정이 가능합니다.",
      emergencyMonths < 3
        ? "비상자금이 3개월 미만으로 추정됩니다. 상환만큼 유동성 확보를 함께 설계하세요."
        : `비상자금은 약 ${fmtNumber(emergencyMonths, 1)}개월 수준입니다. 상환과 병행 가능한 상태입니다.`,
    ];

    const protectionGuides = [
      `현재 보험료 비중은 ${fmtPercent(insuranceRatio)}입니다. ${protectionBand.label}을 기준으로 점검합니다.`,
      insuranceRatio > protectionBand.max + 2
        ? "보험료 부담이 높은 편입니다. 보장 중복, 갱신형 특약, 저효율 계약부터 정리하세요."
        : insuranceRatio < protectionBand.min - 1
          ? "보장비중이 낮아 핵심 위험(질병/사망/실손) 공백 여부를 먼저 확인하세요."
          : "보험료 비중은 적정 범위입니다. 보장 구조와 만기 구성을 유지 점검하세요.",
      previous && Number(previous.insurance_premium || 0) !== Number(latest.insurance_premium || 0)
        ? `직전 대비 보험료는 ${describeChange(latest.insurance_premium, previous.insurance_premium, "만원", 0, true).text} 변동했습니다.`
        : "최근 보험료 변동은 크지 않습니다.",
    ];

    const checklist = [
      {
        key: "portfolio_rebalance_plan",
        status: profile.tone === "bad" ? "bad" : "warn",
        label: profile.tone === "bad" ? "긴급" : "집중",
        title: "포트폴리오 목표 배분 확정",
        copy: `${profile.label} 전략 기준으로 안전/투자/부동산 목표 비중을 확정하고 리밸런싱 순서를 정리합니다.`,
      },
      {
        key: "debt_repayment_calendar",
        status: debtTone,
        label: debtTone === "bad" ? "긴급" : debtTone === "warn" ? "집중" : "관리",
        title: "부채 상환 캘린더 작성",
        copy: monthlyPayCapacity
          ? `월 ${fmtNumber(monthlyPayCapacity)}만원 상환 재원으로 고금리 부채부터 월별 상환 일정을 만듭니다.`
          : "현재 상환 재원이 부족해 지출 재조정과 추가 수입 계획을 먼저 확정합니다.",
      },
      {
        key: "insurance_coverage_review",
        status: protectionTone,
        label: protectionTone === "bad" ? "조정" : protectionTone === "warn" ? "확인" : "유지",
        title: "보장 포트폴리오 점검",
        copy: protectionGuides[1],
      },
      {
        key: "execution_docs_update",
        status: files.length ? "good" : "warn",
        label: files.length ? "진행" : "대기",
        title: "실행 문서 업데이트",
        copy: files.length
          ? `최근 실행 자료 ${files[0].original_name || "파일"} 기준으로 다음 상담 안건을 업데이트합니다.`
          : "리밸런싱 보고서 또는 실행 체크리스트 파일을 먼저 업로드해 다음 점검 자료를 만듭니다.",
      },
    ];

    return {
      portfolio: {
        profile,
        rows: allocationRows,
        source: strategySource,
      },
      debt: {
        debtRatio,
        estimatedMonths,
        emergencyMonths,
        monthlyPayCapacity,
        tone: debtTone,
        guides: debtGuides,
      },
      protection: {
        insuranceRatio,
        tone: protectionTone,
        band: protectionBand,
        guides: protectionGuides,
      },
      checklist,
    };
  }

  function getActiveCustomerForBoards() {
    return (
      state.customers.find((customer) => customer.id === state.activeCustomerId) ||
      { name: "고객" }
    );
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
    state.authUserId = session.user.id;
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

    elements.executionChecklist?.addEventListener("change", async (event) => {
      const input = event.target.closest("input[data-task-code]");
      if (!input) return;

      const taskCode = String(input.dataset.taskCode || "");
      if (!taskCode || !state.activeCustomerId) return;

      const nextChecked = input.checked;
      input.disabled = true;

      const result = await saveExecutionTask(taskCode, nextChecked);
      if (!result) {
        input.checked = !nextChecked;
      }

      input.disabled = false;
      renderPlanningBoards(getActiveCustomerForBoards(), state.snapshots[0], state.snapshots[1], state.files);
      renderAssetManagementBoards(state.snapshots[0], state.snapshots[1], state.files);
    });

    elements.portfolioStrategyBoard?.addEventListener("change", (event) => {
      const select = event.target.closest("select[data-strategy-profile]");
      if (!select) return;
      applyStrategyPresetToInputs(select.value);
    });

    elements.portfolioStrategyBoard?.addEventListener("submit", async (event) => {
      const form = event.target.closest("form[data-strategy-form]");
      if (!form) return;

      event.preventDefault();
      const result = await saveStrategyConfigFromForm(form);
      if (!result) return;
      renderPlanningBoards(getActiveCustomerForBoards(), state.snapshots[0], state.snapshots[1], state.files);
      renderAssetManagementBoards(state.snapshots[0], state.snapshots[1], state.files);
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
      elements.customerList.innerHTML = `<p class="message">고객 목록 조회 실패: ${escapeHtml(error.message)}</p>`;
      return;
    }

    state.customers = data || [];

    if (state.profile.role === "customer" && state.profile.customer_id) {
      const own = state.customers.find((c) => c.id === state.profile.customer_id);
      if (!own) {
        const { data: selfCustomer } = await db
          .from("portal_customers")
          .select("id, name, label, birth_year, gender, job, phone, created_at")
          .eq("id", state.profile.customer_id)
          .maybeSingle();
        if (selfCustomer) state.customers = [selfCustomer];
      } else {
        state.customers = [own];
      }
    }

    renderCustomerList();
    renderCustomerOptionsForAdmin();
  }

  function renderCustomerList() {
    if (!state.customers.length) {
      elements.customerList.innerHTML = `<p class="message">조회된 고객이 없습니다.</p>`;
      return;
    }

    elements.customerList.innerHTML = state.customers
      .map((customer) => {
        const activeClass = customer.id === state.activeCustomerId ? "active" : "";
        const profileBits = [
          customer.birth_year ? `${escapeHtml(customer.birth_year)}년생` : null,
          customer.gender,
          customer.job,
        ]
          .filter(Boolean)
          .map((item) => escapeHtml(item))
          .join(" · ");

        return `
          <button class="customer-item ${activeClass}" data-customer-id="${customer.id}" type="button">
            <div class="customer-item-head">
              <div>
                <strong>${escapeHtml(customer.name || "미상")}</strong>
                <div class="panel-note">${escapeHtml(customer.label || "-")}</div>
              </div>
              <span class="customer-chip">ID ${customer.id}</span>
            </div>
            <div class="customer-item-foot">
              <small>${profileBits || "기본 프로필 미입력"}</small>
              <small>${escapeHtml(customer.phone || "연락처 없음")}</small>
            </div>
          </button>
        `;
      })
      .join("");
  }

  function renderCustomerOptionsForAdmin() {
    if (state.profile.role !== "admin") return;
    const options = [
      `<option value="">고객 선택</option>`,
      ...state.customers.map(
        (customer) => `<option value="${customer.id}">${escapeHtml(customer.label || customer.name)}</option>`,
      ),
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
              <strong>${escapeHtml(getUserDisplayName(user))}</strong>
              <small>가입일: ${escapeHtml(fmtDate(user.created_at))}</small>
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
              <strong>${escapeHtml(getUserDisplayName(user))}</strong>
              <small>승인일시: ${escapeHtml(fmtDate(user.created_at))}</small>
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

  async function loadExecutionTasks(customerId) {
    state.executionTasks = {};
    state.executionStorageMessage = "";

    const { data, error } = await db
      .from("portal_execution_tasks")
      .select("task_code, is_completed, completed_at, updated_at")
      .eq("customer_id", customerId);

    if (error) {
      if (isMissingTableError(error)) {
        state.executionStorageAvailable = false;
        state.executionStorageMessage = "실행 체크리스트 저장 테이블이 없어 읽기 전용으로 표시됩니다.";
      } else {
        state.executionStorageAvailable = false;
        state.executionStorageMessage = `체크리스트 저장 상태 조회 실패: ${error.message}`;
      }
      return;
    }

    state.executionStorageAvailable = true;
    for (const row of data || []) {
      if (!row?.task_code) continue;
      state.executionTasks[row.task_code] = row;
    }
  }

  async function saveExecutionTask(taskCode, isCompleted) {
    if (!state.executionStorageAvailable || !state.activeCustomerId) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const payload = {
      customer_id: state.activeCustomerId,
      task_code: taskCode,
      is_completed: Boolean(isCompleted),
      completed_at: isCompleted ? nowIso : null,
      updated_at: nowIso,
      updated_by: state.authUserId || null,
    };

    const { data, error } = await db
      .from("portal_execution_tasks")
      .upsert(payload, { onConflict: "customer_id,task_code" })
      .select("task_code, is_completed, completed_at, updated_at")
      .single();

    if (error) {
      state.executionStorageMessage = `체크리스트 저장 실패: ${error.message}`;
      return false;
    }

    state.executionStorageMessage = "";
    state.executionTasks[taskCode] = data || payload;
    return true;
  }

  function renderCustomerHeader(customer, latest, files) {
    const subtitleBits = [
      customer.birth_year ? `${customer.birth_year}년생` : null,
      customer.gender || null,
      customer.job || null,
    ].filter(Boolean);

    const lastUpdated =
      latest?.snapshot_at ||
      files?.[0]?.created_at ||
      customer.updated_at ||
      customer.created_at;

    const metaEntries = [
      ["고객 라벨", customer.label || "-"],
      ["연락처", customer.phone || "미입력"],
      ["이메일", customer.email || "미입력"],
      ["재무 목표", customer.financial_goal || "미입력"],
    ];

    elements.customerTitle.textContent = customer.name || "고객 상세";
    elements.customerSubtitle.textContent =
      subtitleBits.join(" · ") || "기본 프로필과 상담 정보를 기반으로 관리합니다.";
    elements.customerLastUpdated.textContent = lastUpdated
      ? `최근 업데이트 ${fmtDate(lastUpdated, false)}`
      : "업데이트 기록 없음";
    elements.customerMeta.innerHTML = metaEntries
      .map(
        ([label, value]) => `
          <span class="meta-chip">
            <span class="meta-chip-label">${escapeHtml(label)}</span>
            <span class="meta-chip-value">${escapeHtml(value)}</span>
          </span>
        `,
      )
      .join("");

    const healthSummary = getHealthSummary(latest);
    elements.healthScoreRing.style.setProperty("--score", `${healthSummary.score}%`);
    elements.healthScoreValue.textContent = String(healthSummary.score);
    elements.healthScoreCaption.textContent = healthSummary.label;
  }

  function renderSummaryCards(latest, previous) {
    if (!latest) {
      elements.summaryCards.innerHTML = `<p class="message">스냅샷 데이터가 없습니다.</p>`;
      return;
    }

    const cards = [
      {
        label: "월 소득",
        value: fmtNumber(latest.total_monthly_income),
        unit: "만원",
        delta: describeChange(latest.total_monthly_income, previous?.total_monthly_income, "만원", 0, false),
        tone: "good",
      },
      {
        label: "월 지출",
        value: fmtNumber(latest.total_expense),
        unit: "만원",
        delta: describeChange(latest.total_expense, previous?.total_expense, "만원", 0, true),
        tone: "warn",
      },
      {
        label: "저축 가능액",
        value: fmtNumber(latest.savings_capacity),
        unit: "만원",
        delta: describeChange(latest.savings_capacity, previous?.savings_capacity, "만원", 0, false),
        tone: "good",
      },
      {
        label: "순자산",
        value: fmtNumber(latest.net_assets),
        unit: "만원",
        delta: describeChange(latest.net_assets, previous?.net_assets, "만원", 0, false),
        tone: "good",
      },
      {
        label: "투자 비중",
        value: fmtNumber(getInvestmentRatio(latest), 1),
        unit: "%",
        delta: describeChange(getInvestmentRatio(latest), previous ? getInvestmentRatio(previous) : null, "%p", 1, false),
        tone: "warn",
      },
      {
        label: "부채 비중",
        value: fmtNumber(getDebtRatio(latest), 1),
        unit: "%",
        delta: describeChange(getDebtRatio(latest), previous ? getDebtRatio(previous) : null, "%p", 1, true),
        tone: getDebtRatio(latest) >= 40 ? "bad" : "warn",
      },
    ];

    elements.summaryCards.innerHTML = cards
      .map(
        (card) => `
          <article class="summary-card" data-tone="${card.tone}">
            <div class="summary-head">
              <span class="summary-label">${escapeHtml(card.label)}</span>
              <span class="summary-delta ${card.delta.tone}">${escapeHtml(card.delta.text)}</span>
            </div>
            <div class="summary-value">${escapeHtml(card.value)}</div>
            <div class="summary-unit">${escapeHtml(card.unit)} · ${escapeHtml(latest.snapshot_label || "최근 스냅샷")}</div>
          </article>
        `,
      )
      .join("");
  }

  function renderPlanningBoards(customer, latest, previous, files) {
    const planning = buildPlanningModel(customer, latest, previous, files);

    if (!latest) {
      elements.diagnosticHighlights.innerHTML = `<p class="message">진단할 스냅샷이 없습니다.</p>`;
      elements.priorityList.innerHTML = `<p class="message">우선순위를 표시할 데이터가 없습니다.</p>`;
      elements.roadmapList.innerHTML = `<p class="message">로드맵을 생성할 데이터가 없습니다.</p>`;
      elements.stageProgressBoard.innerHTML = `<p class="message">진행률을 계산할 데이터가 없습니다.</p>`;
      return;
    }

    const overallTone = planning.overallProgress >= 85 ? "good" : planning.overallProgress >= 60 ? "warn" : "next";
    elements.stageProgressBoard.innerHTML = `
      <div class="stage-progress-head">
        <div class="stage-progress-title">전체 실행 진행률</div>
        <span class="stage-progress-pill ${overallTone}">${planning.overallProgress}%</span>
      </div>
      <div class="stage-progress-track">
        <div class="stage-progress-fill ${overallTone}" style="width: ${clamp(planning.overallProgress, 0, 100)}%;"></div>
      </div>
      <div class="stage-progress-list">
        ${planning.stageProgress
          .map(
            (item) => `
              <article class="stage-progress-item" data-tone="${item.status}">
                <div class="stage-progress-top">
                  <span class="stage-progress-name">${escapeHtml(item.stage)}</span>
                  <span class="stage-progress-meta">${item.progress}% · ${escapeHtml(item.statusLabel)}</span>
                </div>
                <div class="stage-progress-track compact">
                  <div class="stage-progress-fill ${item.status}" style="width: ${clamp(item.progress, 0, 100)}%;"></div>
                </div>
                <div class="stage-progress-note">${escapeHtml(item.note)}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    `;

    elements.diagnosticHighlights.innerHTML = planning.highlights
      .map(
        (item) => `
          <article class="diagnostic-card" data-tone="${item.tone}">
            <div class="diagnostic-label">${escapeHtml(item.label)}</div>
            <div class="diagnostic-value">${escapeHtml(item.value)}</div>
            <div class="diagnostic-note">${escapeHtml(item.note)}</div>
          </article>
        `,
      )
      .join("");

    elements.priorityList.innerHTML = planning.priorities
      .map(
        (item) => `
          <article class="priority-item">
            <div class="priority-rank ${item.tone}">${escapeHtml(item.rank)}</div>
            <div class="priority-body">
              <div class="priority-title">${escapeHtml(item.title)}</div>
              <div class="priority-copy">${escapeHtml(item.copy)}</div>
            </div>
          </article>
        `,
      )
      .join("");

    elements.roadmapList.innerHTML = planning.roadmap
      .map(
        (item) => `
          <article class="roadmap-item">
            <div class="roadmap-step">
              <div class="roadmap-index">${escapeHtml(item.index)}</div>
              <div class="roadmap-stage">${escapeHtml(item.stage)}</div>
            </div>
            <div class="roadmap-main">
              <div class="roadmap-top">
                <div class="roadmap-title">${escapeHtml(item.title)}</div>
                <div class="roadmap-status ${item.status}">${escapeHtml(item.statusLabel)}</div>
              </div>
              <div class="roadmap-summary">${escapeHtml(item.summary)}</div>
              <div class="roadmap-detail">${escapeHtml(item.detail)}</div>
              <div class="roadmap-metric">${escapeHtml(item.metric)}</div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function renderAssetManagementBoards(latest, previous, files) {
    const model = buildAssetManagementModel(latest, previous, files, state.strategyConfig);

    if (!latest || !model.portfolio || !model.debt || !model.protection) {
      elements.portfolioStrategyBoard.innerHTML = `<p class="message">전략을 계산할 스냅샷이 없습니다.</p>`;
      elements.debtControlBoard.innerHTML = `<p class="message">부채 플랜을 계산할 스냅샷이 없습니다.</p>`;
      elements.protectionBoard.innerHTML = `<p class="message">보장 점검을 계산할 스냅샷이 없습니다.</p>`;
      elements.executionChecklist.innerHTML = `<p class="message">실행 체크리스트를 생성할 데이터가 없습니다.</p>`;
      return;
    }

    const canEditStrategy = state.profile?.role === "admin";
    const strategyTarget = state.strategyConfig?.target || model.portfolio.profile.target;
    const strategyProfileCode = state.strategyConfig?.profileCode || "auto";
    const strategyStorageMessage = state.strategyStorageMessage
      ? `<div class="asset-guide-item">${escapeHtml(state.strategyStorageMessage)}</div>`
      : "";

    elements.portfolioStrategyBoard.innerHTML = `
      <div class="asset-header">
        <div class="asset-title">${escapeHtml(model.portfolio.profile.label)} 전략</div>
        <span class="asset-pill ${model.portfolio.profile.tone}">${escapeHtml(model.portfolio.source)}</span>
      </div>
      <form class="strategy-form" data-strategy-form>
        <div class="strategy-grid-form">
          <label class="strategy-field">
            <span>성향 프리셋</span>
            <select name="strategy_profile" data-strategy-profile ${canEditStrategy && state.strategyStorageAvailable ? "" : "disabled"}>
              <option value="auto" ${strategyProfileCode === "auto" ? "selected" : ""}>자동 분석</option>
              <option value="defensive" ${strategyProfileCode === "defensive" ? "selected" : ""}>방어형</option>
              <option value="balanced" ${strategyProfileCode === "balanced" ? "selected" : ""}>균형형</option>
              <option value="growth" ${strategyProfileCode === "growth" ? "selected" : ""}>성장형</option>
              <option value="custom" ${strategyProfileCode === "custom" ? "selected" : ""}>커스텀</option>
            </select>
          </label>
          <label class="strategy-field">
            <span>안전자산 목표(%)</span>
            <input name="target_safe" type="number" min="0" max="100" step="0.1" value="${fmtNumber(strategyTarget.safe, 1)}" ${canEditStrategy && state.strategyStorageAvailable ? "" : "disabled"}>
          </label>
          <label class="strategy-field">
            <span>투자자산 목표(%)</span>
            <input name="target_invest" type="number" min="0" max="100" step="0.1" value="${fmtNumber(strategyTarget.invest, 1)}" ${canEditStrategy && state.strategyStorageAvailable ? "" : "disabled"}>
          </label>
          <label class="strategy-field">
            <span>부동산 목표(%)</span>
            <input name="target_real" type="number" min="0" max="100" step="0.1" value="${fmtNumber(strategyTarget.real, 1)}" ${canEditStrategy && state.strategyStorageAvailable ? "" : "disabled"}>
          </label>
        </div>
        <div class="strategy-action-row">
          <span class="strategy-note">목표 비중 합계는 100이어야 합니다.</span>
          <button type="submit" class="ghost-button" ${canEditStrategy && state.strategyStorageAvailable ? "" : "disabled"}>전략 저장</button>
        </div>
      </form>
      ${strategyStorageMessage}
      <div class="asset-guide-item">${escapeHtml(model.portfolio.profile.summary)}</div>
      ${model.portfolio.rows
        .map((row) => {
          const gapText = row.gapAmount >= 0
            ? `+${fmtNumber(row.gapAmount)}만원`
            : `${fmtNumber(row.gapAmount)}만원`;
          return `
            <article class="asset-plan-item">
              <div class="asset-plan-top">
                <span class="asset-plan-name">${escapeHtml(row.label)}</span>
                <span class="asset-plan-copy">조정 ${gapText} (${row.gapPercent >= 0 ? "+" : ""}${fmtNumber(row.gapPercent, 1)}%p)</span>
              </div>
              <div class="asset-track-row">
                <span class="asset-track-tag">현재</span>
                <div class="asset-track"><div class="asset-track-fill current" style="width: ${clamp(row.current, 0, 100)}%;"></div></div>
              </div>
              <div class="asset-track-row">
                <span class="asset-track-tag">목표</span>
                <div class="asset-track"><div class="asset-track-fill target" style="width: ${clamp(row.target, 0, 100)}%;"></div></div>
              </div>
            </article>
          `;
        })
        .join("")}
    `;

    elements.debtControlBoard.innerHTML = `
      <div class="asset-kpi-grid">
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">부채 비중</div>
          <div class="asset-kpi-value">${fmtNumber(model.debt.debtRatio, 1)}%</div>
          <div class="asset-kpi-note">총자산 대비</div>
        </article>
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">예상 상환기간</div>
          <div class="asset-kpi-value">${model.debt.estimatedMonths ? fmtMonths(model.debt.estimatedMonths) : "-"}</div>
          <div class="asset-kpi-note">월 상환재원 기준</div>
        </article>
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">비상자금</div>
          <div class="asset-kpi-value">${fmtNumber(model.debt.emergencyMonths, 1)}개월</div>
          <div class="asset-kpi-note">월 지출 대비</div>
        </article>
      </div>
      <div class="asset-guides">
        ${model.debt.guides.map((copy) => `<div class="asset-guide-item">${escapeHtml(copy)}</div>`).join("")}
      </div>
    `;

    elements.protectionBoard.innerHTML = `
      <div class="asset-header">
        <div class="asset-title">보험료 비중 ${fmtNumber(model.protection.insuranceRatio, 1)}%</div>
        <span class="asset-pill ${model.protection.tone}">${escapeHtml(model.protection.band.label)}</span>
      </div>
      <div class="asset-kpi-grid">
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">현재 보험료</div>
          <div class="asset-kpi-value">${fmtNumber(latest.insurance_premium || 0)}만원</div>
          <div class="asset-kpi-note">월 기준</div>
        </article>
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">권장 최소</div>
          <div class="asset-kpi-value">${fmtNumber((Number(latest.total_monthly_income || 0) * model.protection.band.min) / 100)}만원</div>
          <div class="asset-kpi-note">소득의 ${model.protection.band.min}%</div>
        </article>
        <article class="asset-kpi-card">
          <div class="asset-kpi-label">권장 최대</div>
          <div class="asset-kpi-value">${fmtNumber((Number(latest.total_monthly_income || 0) * model.protection.band.max) / 100)}만원</div>
          <div class="asset-kpi-note">소득의 ${model.protection.band.max}%</div>
        </article>
      </div>
      <div class="asset-guides">
        ${model.protection.guides.map((copy) => `<div class="asset-guide-item">${escapeHtml(copy)}</div>`).join("")}
      </div>
    `;

    const checklistRows = model.checklist.map((item) => {
      const saved = state.executionTasks[item.key];
      const completed = Boolean(saved?.is_completed);
      const statusClass = completed ? "good" : item.status;
      const statusLabel = completed ? "완료" : item.label;
      const completedText = completed && saved?.completed_at
        ? `완료 시각 ${fmtDate(saved.completed_at)}`
        : "미완료";

      return `
        <article class="check-item">
          <label class="check-toggle">
            <input
              type="checkbox"
              data-task-code="${escapeHtml(item.key)}"
              ${completed ? "checked" : ""}
              ${state.executionStorageAvailable ? "" : "disabled"}
            >
            <span class="check-box"></span>
          </label>
          <span class="check-status ${statusClass}">${escapeHtml(statusLabel)}</span>
          <div class="check-main">
            <div class="check-title">${escapeHtml(item.title)}</div>
            <div class="check-copy">${escapeHtml(item.copy)}</div>
            <div class="check-meta">${escapeHtml(completedText)}</div>
          </div>
        </article>
      `;
    });

    const completedCount = model.checklist.filter((item) => Boolean(state.executionTasks[item.key]?.is_completed)).length;
    const progressText = `${completedCount}/${model.checklist.length} 완료`;
    const pendingItem = model.checklist.find((item) => !Boolean(state.executionTasks[item.key]?.is_completed));
    const nextActionText = pendingItem ? pendingItem.title : "모든 실행 항목이 완료되었습니다.";
    const snapshotDate = latest?.snapshot_at ? new Date(latest.snapshot_at) : null;
    let reviewLine = "다음 점검일을 계산할 수 없습니다.";
    let reviewTone = "warn";
    if (snapshotDate && !Number.isNaN(snapshotDate.getTime())) {
      const nextReviewDate = new Date(snapshotDate);
      nextReviewDate.setDate(nextReviewDate.getDate() + 30);
      const diffMs = nextReviewDate.getTime() - Date.now();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      reviewTone = daysLeft <= 7 ? "bad" : daysLeft <= 14 ? "warn" : "good";
      reviewLine = daysLeft >= 0
        ? `다음 점검 예정일 ${fmtDate(nextReviewDate, false)} (D-${daysLeft})`
        : `다음 점검 권장일 ${fmtDate(nextReviewDate, false)} (지연 ${Math.abs(daysLeft)}일)`;
    }
    const storageMessage = state.executionStorageMessage
      ? `<div class="asset-guide-item">${escapeHtml(state.executionStorageMessage)}</div>`
      : "";

    elements.executionChecklist.innerHTML = `
      <div class="asset-header">
        <div class="asset-title">실행 진행률 ${escapeHtml(progressText)}</div>
        <span class="asset-pill ${completedCount === model.checklist.length ? "good" : "warn"}">${escapeHtml(progressText)}</span>
      </div>
      <div class="asset-guide-item">
        <strong>다음 액션:</strong> ${escapeHtml(nextActionText)}<br>
        <span class="check-meta ${reviewTone === "bad" ? "tone-bad" : reviewTone === "warn" ? "tone-warn" : "tone-good"}">${escapeHtml(reviewLine)}</span>
      </div>
      ${storageMessage}
      ${checklistRows.join("")}
    `;
  }

  function renderAllocation(snapshot) {
    if (!snapshot) {
      elements.allocationList.innerHTML = `<p class="message">자산 구성을 계산할 스냅샷이 없습니다.</p>`;
      return;
    }

    const base = Math.max(Number(snapshot.total_assets || 0), 1);
    const entries = [
      ["안전자산", snapshot.safe_assets, clamp((Number(snapshot.safe_assets || 0) / base) * 100, 0, 100), "safe"],
      ["투자자산", snapshot.investment_assets, clamp((Number(snapshot.investment_assets || 0) / base) * 100, 0, 100), "invest"],
      ["부동산", snapshot.real_estate_total, clamp((Number(snapshot.real_estate_total || 0) / base) * 100, 0, 100), "real"],
      ["부채", snapshot.total_debt, clamp(getDebtRatio(snapshot), 0, 100), "debt"],
    ];

    elements.allocationList.innerHTML = entries
      .map(
        ([label, value, width, tone]) => `
          <div class="allocation-item">
            <div class="allocation-top">
              <span class="allocation-label">${escapeHtml(label)}</span>
              <span class="allocation-value">${escapeHtml(fmtNumber(value))}만원</span>
            </div>
            <div class="allocation-track">
              <div class="allocation-fill ${tone}" style="width: ${width}%;"></div>
            </div>
          </div>
        `,
      )
      .join("");
  }

  function renderHealthMetrics(snapshot) {
    if (!snapshot) {
      elements.healthMetrics.innerHTML = `<p class="message">핵심 지표를 계산할 스냅샷이 없습니다.</p>`;
      return;
    }

    const savingsRate = getSavingsRate(snapshot);
    const debtRatio = getDebtRatio(snapshot);
    const investmentRatio = getInvestmentRatio(snapshot);
    const returnRate = Number(snapshot.overall_return_rate || 0);
    const metrics = [
      ["저축률", fmtPercent(savingsRate), "월 소득 대비 저축 가능액", clamp((savingsRate / 30) * 100, 0, 100), "safe"],
      ["부채 비중", fmtPercent(debtRatio), "총자산 대비 총부채", clamp((debtRatio / 60) * 100, 0, 100), "debt"],
      ["투자 비중", fmtPercent(investmentRatio), "금융자산 내 투자자산 비율", clamp(investmentRatio, 0, 100), "invest"],
      ["수익률", fmtPercent(returnRate, 2), "총자산 기준 수익률", clamp(((returnRate + 2) / 8) * 100, 0, 100), "real"],
    ];

    elements.healthMetrics.innerHTML = metrics
      .map(
        ([label, value, note, width, tone]) => `
          <div class="metric-item">
            <div class="metric-top">
              <span class="metric-label">${escapeHtml(label)}</span>
              <span class="metric-value">${escapeHtml(value)}</span>
            </div>
            <div class="metric-track">
              <div class="metric-fill ${tone}" style="width: ${width}%;"></div>
            </div>
            <div class="metric-note">${escapeHtml(note)}</div>
          </div>
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
        (snapshot) => `
          <tr>
            <td>${escapeHtml(fmtDate(snapshot.snapshot_at))}</td>
            <td>${escapeHtml(snapshot.snapshot_label || "-")}</td>
            <td>${escapeHtml(fmtNumber(snapshot.total_monthly_income))}</td>
            <td>${escapeHtml(fmtNumber(snapshot.total_expense))}</td>
            <td>${escapeHtml(fmtNumber(snapshot.total_assets))}</td>
            <td>${escapeHtml(fmtNumber(snapshot.total_debt))}</td>
            <td>${escapeHtml(fmtNumber(snapshot.net_assets))}</td>
            <td>${escapeHtml(fmtPercent(snapshot.overall_return_rate, 2))}</td>
          </tr>
        `,
      )
      .join("");
  }

  function renderTrendChart(snapshotsDesc) {
    const snapshots = [...snapshotsDesc].reverse();
    elements.trendCaption.textContent = snapshots.length
      ? `최근 ${snapshots.length}회 점검 흐름`
      : "등록된 스냅샷 없음";

    const data = {
      labels: snapshots.map((item) => String(item.snapshot_label || fmtDate(item.snapshot_at, false))),
      datasets: [
        {
          label: "월 소득",
          data: snapshots.map((item) => Number(item.total_monthly_income || 0)),
          borderColor: "#2b6ff2",
          backgroundColor: "rgba(43, 111, 242, 0.14)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.3,
        },
        {
          label: "월 지출",
          data: snapshots.map((item) => Number(item.total_expense || 0)),
          borderColor: "#ef6b7f",
          backgroundColor: "rgba(239, 107, 127, 0.12)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.3,
        },
        {
          label: "순자산",
          data: snapshots.map((item) => Number(item.net_assets || 0)),
          borderColor: "#63d4b4",
          backgroundColor: "rgba(99, 212, 180, 0.12)",
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.3,
        },
      ],
    };

    if (state.trendChart) state.trendChart.destroy();

    state.trendChart = new Chart(elements.trendCanvas, {
      type: "line",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
            align: "start",
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              color: "#607089",
            },
          },
          title: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#71829a" },
          },
          y: {
            grid: { color: "rgba(217, 227, 240, 0.8)" },
            ticks: { color: "#71829a" },
          },
        },
      },
    });
  }

  function renderActivityTimeline(snapshots, files) {
    const events = [
      ...snapshots.map((snapshot) => ({
        date: snapshot.snapshot_at,
        type: "snapshot",
        title: `${snapshot.snapshot_label || "스냅샷"} 재무 점검`,
        meta: `순자산 ${fmtNumber(snapshot.net_assets)}만원 · 수익률 ${fmtPercent(snapshot.overall_return_rate, 2)}`,
      })),
      ...files.map((file) => ({
        date: file.created_at,
        type: "file",
        title: `${file.original_name || "파일"} 업로드`,
        meta: file.note || file.snapshot_label || "실행 자료 등록",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    if (!events.length) {
      elements.activityTimeline.innerHTML = `<p class="message">실행 이력이 없습니다.</p>`;
      return;
    }

    elements.activityTimeline.innerHTML = events
      .map(
        (event) => `
          <article class="activity-item">
            <div class="activity-marker ${event.type}">${event.type === "snapshot" ? "S" : "F"}</div>
            <div class="activity-body">
              <div class="activity-title">${escapeHtml(event.title)}</div>
              <div class="activity-meta">${escapeHtml(event.meta)}</div>
              <div class="activity-date">${escapeHtml(fmtDate(event.date))}</div>
            </div>
          </article>
        `,
      )
      .join("");
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
          ? `<img src="${signedUrl}" alt="${escapeHtml(file.original_name)}">`
          : `<span>${signedUrl ? "파일 열기" : "URL 생성 실패"}</span>`;

        return `
          <article class="portfolio-item">
            <a class="portfolio-thumb" href="${signedUrl || "#"}" target="_blank" rel="noreferrer">${thumb}</a>
            <div class="portfolio-meta">
              <strong>${escapeHtml(file.original_name)}</strong>
              <small>${escapeHtml(fmtDate(file.created_at))} · ${escapeHtml(file.snapshot_label || "라벨 미연결")}</small>
              <small>${escapeHtml(file.note || "메모 없음")}</small>
            </div>
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
          `<option value="${snapshot.id}">${escapeHtml(snapshot.snapshot_label || "스냅샷")} (${escapeHtml(
            fmtDate(snapshot.snapshot_at),
          )})</option>`,
      ),
    ];
    elements.portfolioSnapshotSelect.innerHTML = options.join("");
    if (snapshots[0]) {
      elements.portfolioSnapshotSelect.value = String(snapshots[0].id);
    }
  }

  async function loadCustomerDetail(customerId) {
    state.activeCustomerId = customerId;
    state.executionTasks = {};
    state.strategyConfig = null;
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
      elements.customerSubtitle.textContent = "데이터를 불러오는 중 오류가 발생했습니다.";
      elements.customerMeta.innerHTML = "";
      elements.summaryCards.innerHTML = `<p class="message">데이터 조회 중 오류가 발생했습니다.</p>`;
      return;
    }

    state.snapshots = snapshots || [];
    state.files = files || [];
    elements.customerDetail.classList.remove("hidden");
    await Promise.all([loadExecutionTasks(customerId), loadStrategyConfig(customerId)]);

    renderCustomerHeader(customer, state.snapshots[0], state.files);
    renderSummaryCards(state.snapshots[0], state.snapshots[1]);
    renderPlanningBoards(customer, state.snapshots[0], state.snapshots[1], state.files);
    renderAssetManagementBoards(state.snapshots[0], state.snapshots[1], state.files);
    renderAllocation(state.snapshots[0]);
    renderHealthMetrics(state.snapshots[0]);
    renderSnapshotTable(state.snapshots);
    renderTrendChart(state.snapshots);
    renderActivityTimeline(state.snapshots, state.files);

    const insight = swot.analyzeSnapshots(state.snapshots);
    renderList(elements.praiseList, insight.praise);
    renderList(elements.improveList, insight.improvements);
    renderList(elements.swotS, insight.swot.strengths);
    renderList(elements.swotW, insight.swot.weaknesses);
    renderList(elements.swotO, insight.swot.opportunities);
    renderList(elements.swotT, insight.swot.threats);

    await renderPortfolio(state.files);
    updateSnapshotSelect(state.snapshots);
    if (state.profile.role === "admin") {
      elements.portfolioCustomerSelect.value = String(customerId);
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
    const objectPath = buildStorageObjectPath(customerId, file.name);
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
