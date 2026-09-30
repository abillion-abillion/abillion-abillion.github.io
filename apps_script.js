const SPREADSHEET_ID = '1BtKqxIasoh9WviC8_UznfRsCDi9G_QlcIq3NOLXZI6w';
const NOTIFY_EMAIL   = 'njw852@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'seminar') return seminarSubmit_(data);

    // ── 전자책 신청 ────────────────────────────────────────────
    if (data.type === 'ebook') {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let ebookSheet = ss.getSheetByName('전자책신청');
      if (!ebookSheet) {
        ebookSheet = ss.insertSheet('전자책신청');
        ebookSheet.appendRow(['제출일시', '이름', '연락처', '이메일']);
      }
      const now2 = new Date();
      const dateStr2 = Utilities.formatDate(now2, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      ebookSheet.appendRow([dateStr2, data.name || '', data.phone || '', data.email || '']);

      const tgMsg2 = `📚 [전자책 신청]\n이름: ${data.name}\n연락처: ${data.phone}\n이메일: ${data.email}\n일시: ${dateStr2}`;
      const BOT_TOKEN2 = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
      const CHAT_ID2 = PropertiesService.getScriptProperties().getProperty('CHAT_ID');
      if (BOT_TOKEN2 && CHAT_ID2) {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN2}/sendMessage`, {
          method: 'post', contentType: 'application/json',
          payload: JSON.stringify({ chat_id: CHAT_ID2, text: tgMsg2 })
        });
      }

      if (data.email) {
        const EBOOK_URL = 'https://jwfinancial.co.kr/assets/2039_asset_guide.pdf';
        MailApp.sendEmail({
          to: data.email,
          subject: '[허머니] 무료 전자책이 도착했습니다 📚',
          body: `안녕하세요, ${data.name}님!\n\n자산관리사 허머니의 무료 전자책 「2039 자산관리 지침서」를 보내드립니다.\n\n아래 링크에서 다운로드하세요:\n${EBOOK_URL}\n\n감사합니다.\n─\nJW Financial Consulting · 자산관리사 허머니\nhttps://jwfinancial.co.kr`
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 재무진단 결과 ─────────────────────────────────────────
    if (data.type === 'diagnosis') {
      const ss2 = SpreadsheetApp.openById(SPREADSHEET_ID);
      let diagSheet = ss2.getSheetByName('재무진단');
      if (!diagSheet) {
        diagSheet = ss2.insertSheet('재무진단');
        diagSheet.appendRow(['제출일시', '이름', '연락처', '이메일', '연령대', '성별', '직업', '총점', '영역별점수']);
      }
      const now3 = new Date();
      const dateStr3 = Utilities.formatDate(now3, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      diagSheet.appendRow([dateStr3, data.name||'', data.phone||'', data.email||'', data.age||'', data.gender||'', data.job||'', data.totalScore||'', data.areaResults||'']);

      const tgMsg3 = `🔍 [재무진단 완료]\n이름: ${data.name}\n연락처: ${data.phone}\n이메일: ${data.email}\n${data.age} ${data.gender} ${data.job}\n총점: ${data.totalScore}점\n영역: ${data.areaResults}\n일시: ${dateStr3}`;
      const BOT_TOKEN3 = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
      const CHAT_ID3 = PropertiesService.getScriptProperties().getProperty('CHAT_ID');
      if (BOT_TOKEN3 && CHAT_ID3) {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN3}/sendMessage`, {
          method: 'post', contentType: 'application/json',
          payload: JSON.stringify({ chat_id: CHAT_ID3, text: tgMsg3 })
        });
      }

      if (data.email) {
        MailApp.sendEmail({
          to: data.email,
          subject: `[허머니] ${data.name}님의 재무진단 결과 — ${data.totalScore}점`,
          body: `안녕하세요, ${data.name}님!\n\n무료 재무진단 결과를 안내드립니다.\n\n총점: ${data.totalScore}점\n영역별: ${data.areaResults}\n\n더 자세한 분석과 맞춤 전략은 1:1 무료 상담에서 확인하세요.\n👉 https://jwfinancial.co.kr/consult.html\n\n감사합니다.\n─\nJW Financial Consulting · 자산관리사 허머니\nhttps://jwfinancial.co.kr`
        });
      }

      return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    // ① 스프레드시트 저장
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '제출일시','이름','추천인/유입','연락처','MBTI',
        '성별','연령대','결혼여부','직업·경력','거주지',
        '금융컨설팅 경험','관심분야','보유 금융상품',
        '월평균 수입','월평균 지출','저축가능금액',
        '자산 현황','부채 현황','주거 현황',
        '미리 알려주실 내용','신청 계기·고민','얻어가고 싶은 것'
      ]);
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

    sheet.appendRow([
      dateStr,
      data.name     || '',
      data.referral || '',
      data.contact  || '',
      data.mbti     || '',
      data.gender   || '',
      data.age      || '',
      data.married  || '',
      data.job      || '',
      data.region   || '',
      data.exp      || '',
      data.interest || '',
      data.products || '',
      data.income   || '',
      data.expense  || '',
      data.save     || '',
      data.asset    || '',
      data.debt     || '',
      data.housing  || '',
      data.preinfo  || '',
      data.reason   || '',
      data.goal     || '',
    ]);

    // ② Gmail 알림 전송
    const subject = '📋 새 상담 신청: ' + (data.name || '이름없음') + '님 (' + dateStr + ')';
    const body =
      '[새 상담 신청이 접수되었습니다]\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '▶ 기본 정보\n' +
      '이름: '        + (data.name     || '') + '\n' +
      '연락처: '      + (data.contact  || '') + '\n' +
      '추천인/유입: '  + (data.referral || '') + '\n' +
      'MBTI: '        + (data.mbti     || '') + '\n' +
      '성별: '        + (data.gender   || '') + '\n' +
      '연령대: '      + (data.age      || '') + '\n' +
      '결혼여부: '    + (data.married  || '') + '\n' +
      '직업·경력: '   + (data.job      || '') + '\n' +
      '거주지: '      + (data.region   || '') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '▶ 관심 & 경험\n' +
      '금융컨설팅 경험: ' + (data.exp      || '') + '\n' +
      '관심분야: '        + (data.interest || '') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '▶ 재무 현황\n' +
      '보유 금융상품: '  + (data.products || '') + '\n' +
      '월평균 수입: '    + (data.income   || '') + '\n' +
      '월평균 지출: '    + (data.expense  || '') + '\n' +
      '저축가능금액: '   + (data.save     || '') + '\n' +
      '자산 현황: '      + (data.asset    || '') + '\n' +
      '부채 현황: '      + (data.debt     || '') + '\n' +
      '주거 현황: '      + (data.housing  || '') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '▶ 주관식\n' +
      '[미리 알려주실 내용]\n' + (data.preinfo || '') + '\n\n' +
      '[신청 계기 / 가장 큰 고민]\n' + (data.reason || '') + '\n\n' +
      '[얻어가고 싶은 것]\n' + (data.goal || '') + '\n' +
      '━━━━━━━━━━━━━━━━━━━━\n';

    MailApp.sendEmail({
      to:      NOTIFY_EMAIL,
      subject: subject,
      body:    body,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && ['seminar_health', 'seminar_status'].indexOf(e.parameter.action) >= 0) return seminarGet_(e);
  return ContentService
    .createTextOutput('Apps Script 작동 중 ✅')
    .setMimeType(ContentService.MimeType.TEXT);
}


// Add these functions to the current Apps Script project.
// Route data.type === 'seminar' to seminarSubmit_(data) inside its existing doPost.
// Route seminar_health / seminar_status to seminarGet_(e) inside its existing doGet.
const SEMINAR_PROTOCOL = 'seminar-v1';
const SEMINAR_HEADERS = ['제출일시', '이름', '휴대전화', '설계사 경력', '관심 주제',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid',
  'request_id', '동의 버전', '동의 일시', '랜딩페이지'];

function seminarJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function seminarSpreadsheet_() {
  const configured = PropertiesService.getScriptProperties().getProperty('SEMINAR_SPREADSHEET_ID');
  const fallback = typeof SPREADSHEET_ID !== 'undefined' ? SPREADSHEET_ID : '';
  if (!configured && !fallback) throw new Error('세미나 스프레드시트 설정이 없습니다.');
  return SpreadsheetApp.openById(configured || fallback);
}
function seminarSheet_(create) {
  const ss = seminarSpreadsheet_();
  let sheet = ss.getSheetByName('현직자세미나');
  if (!sheet && create) {
    sheet = ss.insertSheet('현직자세미나');
    sheet.appendRow(SEMINAR_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function seminarStored_(sheet, requestId) {
  if (!sheet || sheet.getLastRow() < 2) return false;
  return !!sheet.getRange(2, 12, sheet.getLastRow() - 1, 1)
    .createTextFinder(requestId).matchEntireCell(true).useRegularExpression(false).findNext();
}
function seminarIdValid_(id) { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || ''); }
function seminarText_(value, length) {
  const text = String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').slice(0, length);
  // Avoid spreadsheet formula evaluation in user-controlled fields.
  return /^[=+@-]/.test(text) ? "'" + text : text;
}
function seminarSubmit_(data) {
  const requestId = String(data.request_id || '');
  const name = String(data.name || '').trim();
  const phone = String(data.phone || '').trim();
  const digits = phone.replace(/\D/g, '');
  const experiences = ['', '신입', '3년 미만', '3~7년', '7년 이상', '관리자'];
  const concerns = ['', '700종신 이후 영업', '1,200%룰 이후 수익 구조', '자산관리 상담 방식', '방송DB, 투자DB 제공량 및 활용법'];
  if (!seminarIdValid_(requestId) || data.consent !== true || data.website || name.length < 2 || name.length > 30 ||
      !/^(01[016789]\d{7,8}|8201[016789]\d{7,8}|821[016789]\d{7,8})$/.test(digits) ||
      experiences.indexOf(data.experience || '') < 0 || concerns.indexOf(data.concern || '') < 0) {
    return seminarJson_({ result: 'error', code: 'validation', stored: false });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let duplicate = false;
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  try {
    const sheet = seminarSheet_(true);
    duplicate = seminarStored_(sheet, requestId);
    if (!duplicate) {
      sheet.appendRow([now, seminarText_(name, 30), seminarText_(phone, 30),
        seminarText_(data.experience, 40), seminarText_(data.concern, 100),
        ...['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].map(key => seminarText_(data[key], 500)),
        requestId, seminarText_(data.consent_version, 80), now, seminarText_(data.landing_url, 500)]);
      SpreadsheetApp.flush();
    }
  } finally { lock.releaseLock(); }
  if (!duplicate) seminarNotify_(data, now);
  return seminarJson_({ protocol: SEMINAR_PROTOCOL, result: 'success', stored: true, request_id: requestId, duplicate });
}
function seminarNotify_(data, now) {
  const properties = PropertiesService.getScriptProperties();
  const text = '[현직자 세미나 신청]\n이름: ' + data.name + '\n연락처: ' + data.phone +
    '\n경력: ' + (data.experience || '미선택') + '\n관심 주제: ' + (data.concern || '미선택') +
    '\n캠페인: ' + (data.utm_campaign || '') + '\n소재: ' + (data.utm_content || '') + '\n일시: ' + now;
  const email = properties.getProperty('SEMINAR_NOTIFY_EMAIL') ||
    (typeof NOTIFY_EMAIL !== 'undefined' ? NOTIFY_EMAIL : '');
  if (email) {
    try { MailApp.sendEmail(email, '[현직자 세미나] 새 신청: ' + data.name, text); }
    catch (error) { console.error('세미나 이메일 알림 실패: ' + error); }
  }
  const token = properties.getProperty('BOT_TOKEN');
  const chatId = properties.getProperty('CHAT_ID');
  if (token && chatId) {
    try {
      const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'post', contentType: 'application/json',
        payload: JSON.stringify({ chat_id: chatId, text }), muteHttpExceptions: true
      });
      if (response.getResponseCode() >= 300) console.error('세미나 Telegram 알림 실패');
    } catch (_) { console.error('세미나 Telegram 알림 실패'); }
  }
}
function seminarGet_(e) {
  const params = e.parameter || {};
  const callback = String(params.callback || '');
  if (!/^_seminar_cb_[A-Za-z0-9_]{1,80}$/.test(callback)) return seminarJson_({ result: 'error' });
  let result = { protocol: SEMINAR_PROTOCOL, ready: false };
  try {
    if (params.action === 'seminar_health') {
      seminarSpreadsheet_();
      result.ready = true;
    } else if (params.action === 'seminar_status' && seminarIdValid_(params.request_id)) {
      result = { protocol: SEMINAR_PROTOCOL, request_id: params.request_id,
        stored: seminarStored_(seminarSheet_(false), params.request_id) };
    }
  } catch (_) { result = { protocol: SEMINAR_PROTOCOL, ready: false }; }
  // Read-only receipt only. Never expose application details through JSONP.
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
