const SPREADSHEET_ID = '1BtKqxIasoh9WviC8_UznfRsCDi9G_QlcIq3NOLXZI6w';
const NOTIFY_EMAIL   = 'njw852@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

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
  return ContentService
    .createTextOutput('Apps Script 작동 중 ✅')
    .setMimeType(ContentService.MimeType.TEXT);
}
