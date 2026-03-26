(function () {
  function getSavingsRate(s) {
    if (!s || !s.total_monthly_income) return 0;
    return (Number(s.savings_capacity || 0) / Number(s.total_monthly_income || 1)) * 100;
  }

  function getDebtRatio(s) {
    if (!s || !s.total_assets) return 0;
    return (Number(s.total_debt || 0) / Number(s.total_assets || 1)) * 100;
  }

  function analyzeSnapshots(snapshotsDesc) {
    if (!Array.isArray(snapshotsDesc) || snapshotsDesc.length === 0) {
      return {
        swot: {
          strengths: ["데이터가 없어 분석을 시작할 수 없습니다."],
          weaknesses: ["첫 스냅샷 업로드가 필요합니다."],
          opportunities: ["스냅샷이 쌓이면 추세 기반 제안이 제공됩니다."],
          threats: ["현재는 위험 요인을 판단할 수 없습니다."],
        },
        praise: ["첫 데이터를 등록하면 맞춤 분석이 시작됩니다."],
        improvements: ["재무제표를 업로드해 주세요."],
      };
    }

    const latest = snapshotsDesc[0];
    const previous = snapshotsDesc[1] || null;

    const strengths = [];
    const weaknesses = [];
    const opportunities = [];
    const threats = [];
    const praise = [];
    const improvements = [];

    const savingsRate = getSavingsRate(latest);
    const debtRatio = getDebtRatio(latest);

    if (savingsRate >= 20) {
      strengths.push(`저축률이 ${savingsRate.toFixed(1)}%로 양호합니다.`);
      praise.push(`저축률 ${savingsRate.toFixed(1)}%를 유지하고 있습니다.`);
    } else {
      weaknesses.push(`저축률이 ${savingsRate.toFixed(1)}%로 낮습니다.`);
      improvements.push("저축률을 20% 이상으로 올리도록 지출 조정이 필요합니다.");
    }

    if (latest.net_assets > 0) {
      strengths.push("순자산이 플러스 상태입니다.");
      praise.push("순자산이 양수로 유지되고 있습니다.");
    } else {
      weaknesses.push("순자산이 0 이하입니다.");
      improvements.push("부채/지출 구조 재조정으로 순자산 전환이 필요합니다.");
    }

    if (debtRatio >= 40) {
      threats.push(`부채비율이 ${debtRatio.toFixed(1)}%로 높습니다.`);
      improvements.push("부채 상환 우선순위를 다시 잡는 것이 좋습니다.");
    } else {
      strengths.push("부채비율이 과도하지 않습니다.");
      praise.push("부채비율이 안정 구간에 있습니다.");
    }

    if (latest.overall_return_rate > 0) {
      strengths.push(`총자산 수익률이 ${Number(latest.overall_return_rate).toFixed(2)}%입니다.`);
      praise.push(`총자산 수익률 ${Number(latest.overall_return_rate).toFixed(2)}%를 달성했습니다.`);
    } else {
      threats.push("총자산 수익률 개선 여지가 큽니다.");
      improvements.push("포트폴리오 리밸런싱과 상품 점검이 필요합니다.");
    }

    if (previous) {
      if (latest.total_monthly_income > previous.total_monthly_income) {
        opportunities.push("소득 증가 흐름을 투자 확대로 연결할 수 있습니다.");
        praise.push("직전 대비 월소득이 증가했습니다.");
      } else if (latest.total_monthly_income < previous.total_monthly_income) {
        threats.push("소득이 감소 추세입니다.");
      }

      if (latest.total_debt < previous.total_debt) {
        opportunities.push("부채 감소 추세를 유지하면 재무건전성이 빠르게 개선됩니다.");
      } else if (latest.total_debt > previous.total_debt) {
        threats.push("부채가 증가 추세입니다.");
      }

      if (latest.net_assets > previous.net_assets) {
        opportunities.push("순자산 상승 흐름입니다.");
      } else if (latest.net_assets < previous.net_assets) {
        threats.push("순자산이 감소 추세입니다.");
      }
    } else {
      opportunities.push("2회차부터 비교 기반 개선 방향이 더 정확해집니다.");
    }

    if (praise.length === 0) praise.push("현재 데이터에서 즉시 칭찬 포인트는 제한적입니다.");
    if (improvements.length === 0) improvements.push("현재는 급한 개선 경고가 크지 않습니다.");
    if (strengths.length === 0) strengths.push("추가 데이터가 필요합니다.");
    if (weaknesses.length === 0) weaknesses.push("현재 뚜렷한 약점은 제한적입니다.");
    if (opportunities.length === 0) opportunities.push("추가 스냅샷 등록 시 기회 분석이 강화됩니다.");
    if (threats.length === 0) threats.push("현재 뚜렷한 위협 지표는 제한적입니다.");

    return {
      swot: { strengths, weaknesses, opportunities, threats },
      praise,
      improvements,
    };
  }

  window.portalSwot = { analyzeSnapshots };
})();
