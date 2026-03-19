const GUIDE_SUMMARIES = {
  guide01: '월급 관리의 핵심은 많이 아끼는 것보다 먼저 나눠 두는 구조를 만드는 데 있습니다. 이 가이드는 처음 재무 습관을 잡는 분도 바로 실행할 수 있게 흐름 중심으로 정리했습니다.',
  guide02: '비상금은 투자보다 먼저 점검해야 하는 안전장치입니다. 예상치 못한 지출이 생겼을 때 계획을 무너뜨리지 않도록 현실적인 기준으로 설명합니다.',
  guide03: '대출과 투자는 숫자만 비교하면 답이 단순해 보이지만 실제 결정은 금리, 현금흐름, 심리적 안정까지 함께 봐야 합니다. 이 기준을 어렵지 않게 풀어둔 가이드입니다.',
  guide04: 'ETF는 가장 많이 묻는 투자 입문 주제 중 하나입니다. 상품 이름보다 왜 쓰는지, 어떤 역할을 맡기는지가 먼저 이해되도록 정리했습니다.',
  guide05: '결혼자금은 단기 목표처럼 보이지만 생활비 구조와 함께 설계해야 부담이 줄어듭니다. 준비 기간별로 현실적인 우선순위를 잡아보는 내용입니다.',
  guide06: '집을 사야 할지 고민될 때는 시장 전망보다 내 자금 여력과 거주 계획의 일치 여부가 더 중요합니다. 판단 기준을 차분하게 점검하도록 구성했습니다.',
  guide07: 'ISA, IRP, 연금저축은 절세 효과가 있지만 목적과 기간이 다릅니다. 이 가이드는 비교표처럼 한 번에 보고 내 상황에 맞게 고를 수 있도록 정리했습니다.',
  guide08: '적립식 투자는 거창한 기술보다 흔들리지 않는 구조를 만드는 방식에 가깝습니다. 왜 매달 조금씩 사는 전략이 유리한지 생활 언어로 풀어냈습니다.',
  guide09: '금리 변화는 뉴스로 접하면 멀게 느껴지지만 예금, 대출, 투자자산에 모두 연결됩니다. 내 돈 흐름과 어떤 식으로 맞닿는지 중심으로 설명합니다.',
  guide10: '분산투자는 수익을 포기하는 전략이 아니라 큰 실수를 줄이는 장치입니다. 처음 투자하는 분도 이해할 수 있게 역할별 자산 배분의 개념을 정리했습니다.',
  guide11: '노후 준비는 나중에 시작할수록 부담이 커지는 대표적인 주제입니다. 30대부터 왜 준비가 필요한지 숫자와 흐름 중심으로 정리했습니다.',
  guide12: '수익률이 낮게 느껴질 때는 상품보다 투자 방식에 이유가 있는 경우가 많습니다. 성과를 갉아먹는 습관과 점검 포인트를 짚어주는 가이드입니다.',
  guide13: '보험은 많이 가입하는 것보다 오래 유지할 수 있는 구조가 중요합니다. 꼭 남길 것과 정리할 것을 구분하는 기준을 복잡하지 않게 설명합니다.',
  guide14: '수입이 들쭉날쭉한 분은 일반적인 예산표가 오히려 맞지 않을 수 있습니다. 변동소득에 맞는 통장 구조와 우선순위를 잡는 데 초점을 맞췄습니다.',
  guide15: '신용점수는 단기간에 올리는 비법보다 기본 원칙을 꾸준히 지키는 것이 중요합니다. 점수보다 관리 습관을 만들 수 있게 정리한 가이드입니다.',
  guide16: '연말정산은 매년 반복되지만 놓치는 항목에 따라 차이가 커질 수 있습니다. 직장인이 바로 확인할 수 있는 실무 체크포인트 중심으로 구성했습니다.',
  guide17: '포트폴리오는 정답을 맞히는 문제가 아니라 내 목적과 성향에 맞는 균형을 찾는 작업입니다. 투자 성향별로 큰 틀을 잡는 데 도움을 주는 가이드입니다.',
  guide18: '경제적 자유는 막연한 구호가 아니라 필요한 생활비와 자산 규모를 계산하는 문제입니다. 목표를 숫자로 바꾸는 연습에 초점을 맞췄습니다.',
  guide19: '금융사기는 정보가 부족해서가 아니라 순간의 압박과 불안 때문에 당하는 경우가 많습니다. 실제로 피해야 할 신호와 확인 습관을 차분하게 정리했습니다.',
  guide20: '청약통장은 오래 가지고만 있다고 끝나는 상품이 아닙니다. 점수, 납입, 전략을 함께 봐야 해서 헷갈리기 쉬운 내용을 쉽게 풀어둔 가이드입니다.'
};

function buildGuideTheme() {
  const nav = document.querySelector('.site-nav');
  const mobileMenu = document.querySelector('.site-mobile-menu');
  const backWrap = document.querySelector('.guide-back-wrap');
  const chip = document.querySelector('.chip');
  const title = document.querySelector('h1');
  const subtitle = document.querySelector('.subtitle');

  if (!nav || !mobileMenu || !backWrap || !title) return;
  if (document.querySelector('.guide-shell')) return;

  const shell = document.createElement('main');
  shell.className = 'guide-shell';

  const hero = document.createElement('section');
  hero.className = 'guide-hero';

  if (chip) hero.appendChild(chip);
  hero.appendChild(title);
  if (subtitle) hero.appendChild(subtitle);

  const fileKey = (location.pathname.match(/guide\d+/i) || [''])[0].toLowerCase();
  const summary = GUIDE_SUMMARIES[fileKey];
  if (summary) {
    const note = document.createElement('div');
    note.className = 'guide-advisor-note';
    note.innerHTML = `
      <div class="guide-advisor-label">Advisor's Note</div>
      <p>${summary}</p>
    `;
    hero.appendChild(note);
  }

  const article = document.createElement('article');
  article.className = 'guide-article';

  const collected = [];
  let node = mobileMenu.nextSibling;
  while (node && node !== backWrap) {
    const next = node.nextSibling;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node;
      if (element.tagName !== 'SCRIPT') {
        collected.push(element);
      }
    }
    node = next;
  }

  collected.forEach((element) => article.appendChild(element));
  shell.append(hero, article);
  backWrap.parentNode.insertBefore(shell, backWrap);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildGuideTheme);
} else {
  buildGuideTheme();
}
