const SPREADSHEET_ID = '1BtKqxIasoh9WviC8_UznfRsCDi9G_QlcIq3NOLXZI6w';
const NOTIFY_EMAIL   = 'njw852@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'seminar') return saveSeminar(data);

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
  if (e && e.parameter && e.parameter.action === 'seminar_status') return seminarStatus(e);
  return ContentService
    .createTextOutput('Apps Script 작동 중 ✅')
    .setMimeType(ContentService.MimeType.TEXT);
}


// 보험설계사 세미나 전용 저장·확인. 기존 상담/전자책/진단 분기는 유지합니다.
function seminarResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function seminarStatus(e) {
  var id = String(e.parameter.request_id || '');
  var callback = String(e.parameter.callback || '');
  var result = {result:'pending',request_id:id};
  if (/^[a-f0-9-]{36}$/.test(id)) {
    var cached = CacheService.getScriptCache().get('seminar:' + id);
    if (cached) result = JSON.parse(cached);
  } else result = {result:'error'};
  result.protocol = 'seminar-v1';
  if (/^seminarReceipt_[a-f0-9]{32}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return seminarResponse(result);
}
function saveSeminar(data) {
  var id = String(data.request_id || '');
  var phone = String(data.phone || '').replace(/[^0-9]/g,'');
  var name = String(data.name || '').trim();
  var exp = String(data.experience || '');
  var concern = String(data.concern || '');
  if (data.consent !== true || name.length < 2 || name.length > 30 || !/^01[016789][0-9]{7,8}$/.test(phone) || !/^[a-f0-9-]{36}$/.test(id) || ['', '신입', '3년 미만', '3~7년', '7년 이상', '관리자'].indexOf(exp) < 0 || ['', '700종신 이후 영업', '1,200%룰 이후 수익 구조', '자산관리 상담 방식', '방송DB, 투자DB 제공량 및 활용법'].indexOf(concern) < 0) {
    return seminarResponse({result:'error'});
  }
  function cell(value, limit) {
    var s = String(value || '').slice(0, limit || 500);
    return /^[\s]*[=+@-]/.test(s) ? "'" + s : s;
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var sheet, row, duplicate = false;
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    sheet = ss.getSheetByName('보험설계사세미나');
    if (!sheet) {
      sheet = ss.insertSheet('보험설계사세미나');
      sheet.appendRow(['접수일시','접수ID','이름','휴대전화','경력','관심주제','개인정보동의','UTM source','UTM medium','UTM campaign','UTM content','UTM term','fbclid','클라이언트접수일시','알림상태']);
      sheet.setFrozenRows(1);
    }
    if (sheet.getLastRow() > 1) {
      var found = sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();
      if (found) { row = found.getRow(); duplicate = true; }
    }
    if (!duplicate) {
      sheet.appendRow([Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd HH:mm:ss'),id,cell(name,30),"'"+phone,cell(exp),cell(concern),'동의',cell(data.utm_source),cell(data.utm_medium),cell(data.utm_campaign),cell(data.utm_content),cell(data.utm_term),cell(data.fbclid),cell(data.submitted_at), '대기']);
      row = sheet.getLastRow();
      SpreadsheetApp.flush();
    }
    CacheService.getScriptCache().put('seminar:' + id, JSON.stringify({result:'success',request_id:id}),21600);
  } finally { lock.releaseLock(); }
  if (!duplicate) {
    var notified = [];
    var message = '[보험설계사 세미나 신청]\n이름: ' + name + '\n연락처: ' + phone + '\n경력: ' + exp + '\n관심주제: ' + concern;
    try { MailApp.sendEmail({to:NOTIFY_EMAIL,subject:'[세미나 신청] '+name+'님',body:message}); notified.push('이메일 완료'); } catch (err) { notified.push('이메일 실패'); }
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('BOT_TOKEN'), chat = props.getProperty('CHAT_ID');
    if (token && chat) {
      try {
        var response = UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'post',contentType:'application/json',payload:JSON.stringify({chat_id:chat,text:message}),muteHttpExceptions:true});
        notified.push(response.getResponseCode()===200 ? '텔레그램 완료' : '텔레그램 실패');
      } catch (err) { notified.push('텔레그램 실패'); }
    }
    sheet.getRange(row,15).setValue(notified.join(' / '));
  }
  return seminarResponse({result:'success',request_id:id,duplicate:duplicate});
}
