(function () {
  const HEADER_KEYWORDS = [
    "구분",
    "용도",
    "종류",
    "상환법",
    "기간",
    "대출총액",
    "월상환액",
    "상품명",
    "계약자",
    "피보험자",
    "보험료",
    "합계",
    "총",
    "순자산",
    "부채",
    "지출액",
    "시, 구, 동",
    "SKT / KT / LG",
    "월평성과",
    "재무목표",
    "연락처",
    "E-mail",
    "성명",
    "성별",
    "직업",
    "생년월일",
  ];

  function safeNum(val) {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number" && Number.isFinite(val)) return val;
    const text = String(val).replace(/,/g, "").replace(/\s/g, "").replace(/%/g, "");
    const n = Number(text);
    return Number.isFinite(n) ? n : 0;
  }

  function safeStr(val) {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\r?\n/g, " ").trim();
  }

  function normalizeRate(val) {
    const n = safeNum(val);
    if (n > 0 && n < 1) return Math.round(n * 10000) / 100;
    return n;
  }

  function looksLikeHeader(text) {
    if (!text) return false;
    return HEADER_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  function normalizeGender(raw) {
    if (!raw) return "";
    if (raw.includes("남")) return "남";
    if (raw.includes("여")) return "여";
    return raw.replace(/\s/g, "");
  }

  function normalizeBirthYear(raw) {
    if (typeof raw === "string") {
      const digits = raw.replace(/\D/g, "");
      if (digits.length >= 6) {
        const first4 = Number(digits.slice(0, 4));
        const nowYear = new Date().getFullYear();
        if (first4 >= 1900 && first4 <= nowYear) return first4;
        const yy = Number(digits.slice(0, 2));
        if (!Number.isNaN(yy)) {
          const century = yy <= nowYear % 100 ? 2000 : 1900;
          return century + yy;
        }
      }
      if (digits.length === 5) {
        const yy = Number(digits.slice(0, 2));
        const nowYear = new Date().getFullYear();
        const century = yy <= nowYear % 100 ? 2000 : 1900;
        return century + yy;
      }
      if (digits.length >= 4) {
        const year = Number(digits.slice(0, 4));
        const nowYear = new Date().getFullYear();
        if (year >= 1900 && year <= nowYear) return year;
      }
      if (digits.length === 2) {
        raw = Number(digits);
      }
    }

    const n = safeNum(raw);
    if (!n) return null;

    const currentYear = new Date().getFullYear();
    const nDigits = String(Math.trunc(Math.abs(n)));
    if (nDigits.length >= 6) {
      const first4 = Number(nDigits.slice(0, 4));
      if (first4 >= 1900 && first4 <= currentYear) return first4;
      const yy = Number(nDigits.slice(0, 2));
      const century = yy <= currentYear % 100 ? 2000 : 1900;
      return century + yy;
    }
    if (nDigits.length === 5) {
      const yy = Number(nDigits.slice(0, 2));
      const century = yy <= currentYear % 100 ? 2000 : 1900;
      return century + yy;
    }
    if (n >= 30000 && n <= 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + n * 86400000);
      const year = date.getUTCFullYear();
      if (year >= 1900 && year <= currentYear) return year;
    }
    if (n >= 1900 && n <= currentYear) return Math.round(n);
    if (n >= 0 && n < 100) {
      const twoDigits = Math.round(n);
      const century = twoDigits <= currentYear % 100 ? 2000 : 1900;
      return century + twoDigits;
    }
    return null;
  }

  function extractPhone(raw) {
    const text = raw || "";
    const match = text.match(/01[016789][ -]?\d{3,4}[ -]?\d{4}/);
    const candidate = match ? match[0] : text;
    const digits = candidate.replace(/\D/g, "");
    if (!digits) return "";
    if (/^0100{7,8}$/.test(digits)) return "";
    return digits;
  }

  function getInitialPassword(phone) {
    const digits = (phone || "").replace(/\D/g, "");
    if (digits.length >= 4) return digits.slice(-4);
    return "0000";
  }

  function scoreSheet(name, ws) {
    let score = 0;
    if (/^PC$/i.test(name)) score += 300;
    if (/^FS/i.test(name)) score += 200;
    if (/상담일지|포트폴리오|지표|인쇄|SWOT|청약|금융계획|사업자|FP/i.test(name)) score -= 400;

    const d6 = safeStr(ws["D6"]?.v);
    const h6 = ws["H6"]?.v ?? ws["I6"]?.v;
    const j6 = safeStr(ws["J6"]?.v ?? ws["K6"]?.v);
    const d24 = safeNum(ws["D24"]?.v);
    const j14 = safeNum(ws["J14"]?.v);
    const j17 = safeNum(ws["J17"]?.v);
    const f40 = safeNum(ws["F40"]?.v);

    if (d6 && !looksLikeHeader(d6)) score += 120;
    if (normalizeBirthYear(h6)) score += 80;
    if (normalizeGender(j6)) score += 50;
    if (d24 > 0) score += 120;
    if (j14 > 0) score += 40;
    if (j17 > 0) score += 40;
    if (f40 > 0) score += 30;
    return score;
  }

  function selectFinancialSheet(workbook) {
    const names = workbook.SheetNames || [];
    const exactGd = names.find((name) => String(name).trim().toUpperCase() === "GD");
    if (exactGd) return workbook.Sheets[exactGd];

    const gdAfter = names.find((name) => /^GD/i.test(name) && name.includes("후"));
    if (gdAfter) return workbook.Sheets[gdAfter];

    const gdAny = names.find((name) => /^GD/i.test(name));
    if (gdAny) return workbook.Sheets[gdAny];

    let bestName = names[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    names.forEach((name) => {
      const ws = workbook.Sheets[name];
      const score = scoreSheet(name, ws);
      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    });

    return workbook.Sheets[bestName];
  }

  function sumAssetValue(list) {
    return list.reduce((sum, item) => sum + (item.accumulated > 0 ? item.accumulated : item.amount), 0);
  }

  async function parseFinancialExcel(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const ws = selectFinancialSheet(workbook);

    function cell(ref) {
      const c = ws[ref];
      return c ? c.v : null;
    }

    const nameCandidate = safeStr(cell("D6")) || safeStr(cell("E6")) || safeStr(cell("D5"));
    const name = looksLikeHeader(nameCandidate.replace(/\s/g, "")) ? "미상" : nameCandidate || "미상";
    const birthYear = normalizeBirthYear(cell("H6")) ?? normalizeBirthYear(cell("I6"));
    const gender = normalizeGender(safeStr(cell("J6")) || safeStr(cell("K6")) || safeStr(cell("J5")));
    const job = safeStr(cell("L6")) || safeStr(cell("M6")) || safeStr(cell("L5"));
    const phone = extractPhone(safeStr(cell("R8")) || safeStr(cell("S8")));
    const address = safeStr(cell("R5"));
    const email = safeStr(cell("R7"));
    const financialGoal = safeStr(cell("D8"));

    const salarySelf = safeNum(cell("J14")) || safeNum(cell("H14"));
    const salarySpouse = safeNum(cell("J17"));
    const otherIncome = safeNum(cell("J19")) || safeNum(cell("J20"));
    const bonus = safeNum(cell("I24"));
    const monthlyIncome = safeNum(cell("D24"));

    const fixedExpenses = [];
    for (let row = 31; row <= 34; row += 1) {
      fixedExpenses.push({
        category: safeStr(cell(`B${row}`)).replace(/\s/g, "") || `고정지출${row - 30}`,
        amount: safeNum(cell(`E${row}`)),
      });
    }
    const variableExpenses = [];
    for (let row = 31; row <= 34; row += 1) {
      variableExpenses.push({
        category: safeStr(cell(`G${row}`)).replace(/\s/g, "") || `변동지출${row - 30}`,
        amount: safeNum(cell(`J${row}`)),
      });
    }

    const safeAssets = [];
    for (let row = 14; row <= 23; row += 1) {
      const product = safeStr(cell(`N${row}`));
      const amount = safeNum(cell(`R${row}`));
      const accumulated = safeNum(cell(`Z${row}`));
      const returnRate = normalizeRate(cell(`AB${row}`));
      if (!product || looksLikeHeader(product)) continue;
      if (product.includes("예시") && amount === 0 && accumulated === 0 && returnRate === 0) continue;
      safeAssets.push({
        name: product,
        amount,
        accumulated,
        return_rate: returnRate,
      });
    }

    const investAssets = [];
    for (let row = 28; row <= 39; row += 1) {
      const product = safeStr(cell(`N${row}`));
      const amount = safeNum(cell(`R${row}`));
      const accumulated = safeNum(cell(`Z${row}`));
      const returnRate = normalizeRate(cell(`AB${row}`));
      if (!product || looksLikeHeader(product)) continue;
      if (product.includes("예시") && amount === 0 && accumulated === 0 && returnRate === 0) continue;
      investAssets.push({
        name: product,
        amount,
        accumulated,
        return_rate: returnRate,
      });
    }

    const realEstateTotal = (() => {
      let sum = 0;
      for (let row = 6; row <= 10; row += 1) {
        sum += safeNum(cell(`AN${row}`));
      }
      return sum;
    })();

    const debtsTotal = safeNum(cell("AL24"));
    const netAssets = safeNum(cell("AL26"));
    const insurancePremium = safeNum(cell("AL42"));
    const totalExpense = safeNum(cell("F40")) || fixedExpenses.reduce((s, i) => s + i.amount, 0) + variableExpenses.reduce((s, i) => s + i.amount, 0);
    const savingsCapacity = safeNum(cell("F42")) || monthlyIncome - totalExpense;

    const safeTotal = sumAssetValue(safeAssets);
    const investTotal = sumAssetValue(investAssets);
    const totalAssets = safeTotal + investTotal + realEstateTotal;

    const weightedDenominator = safeAssets.concat(investAssets).reduce((s, item) => s + (item.accumulated > 0 ? item.accumulated : item.amount), 0);
    const weightedNumerator = safeAssets.concat(investAssets).reduce((s, item) => {
      const base = item.accumulated > 0 ? item.accumulated : item.amount;
      return s + base * item.return_rate;
    }, 0);
    const overallReturnRate = weightedDenominator > 0 ? weightedNumerator / weightedDenominator : 0;

    return {
      customer: {
        name,
        birth_year: birthYear,
        gender: gender || "미정",
        job,
        address,
        email,
        phone,
        financial_goal: financialGoal,
      },
      snapshot: {
        salary_self: salarySelf,
        salary_spouse: salarySpouse,
        other_income: otherIncome,
        bonus,
        total_monthly_income: monthlyIncome,
        total_expense: totalExpense,
        savings_capacity: savingsCapacity,
        safe_assets: safeTotal,
        investment_assets: investTotal,
        real_estate_total: realEstateTotal,
        total_debt: debtsTotal,
        net_assets: netAssets || totalAssets - debtsTotal,
        total_assets: totalAssets,
        overall_return_rate: Math.round(overallReturnRate * 100) / 100,
        insurance_premium: insurancePremium,
      },
      accountHint: {
        initialPassword: getInitialPassword(phone),
      },
      raw: {
        fixed_expenses: fixedExpenses,
        variable_expenses: variableExpenses,
      },
    };
  }

  function buildLabel(birthYear, gender, name, firstUploadMonth) {
    const birthPart = birthYear ? String(birthYear).slice(-2).padStart(2, "0") : "00";
    const genderPart = normalizeGender(gender) || "미정";
    const namePart = String(name || "미상").replace(/\s+/g, "");
    return `${birthPart}_${genderPart}_${namePart}_${firstUploadMonth}`;
  }

  function getCurrentUploadMonth() {
    const now = new Date();
    return `${String(now.getFullYear()).slice(-2)}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function extractUploadMonthFromLabel(label) {
    if (!label) return null;
    const found = String(label).match(/_(\d{2}\.\d{2})$/);
    return found ? found[1] : null;
  }

  window.portalParser = {
    parseFinancialExcel,
    buildLabel,
    getCurrentUploadMonth,
    extractUploadMonthFromLabel,
  };
})();
