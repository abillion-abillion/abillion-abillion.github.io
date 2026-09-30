# 현직자 세미나 배포

배포 대상: https://jwfinancial.co.kr/advisor-seminar.html

최종 업로드 HTML을 기준으로 CSS·이미지를 포함한 단일 HTML로 변환했습니다.
Meta Pixel 1568491221231346은 페이지 로드에 PageView를 보내고,
신청이 시트에 저장되었다는 서버 확인 이후에만 Lead를 보냅니다.

## 신청 서버 적용

1. 현재 운영 중인 Google Apps Script 프로젝트의 소스를 먼저 확인하고 백업합니다.
2. `apps_script.js`의 세미나 전용 함수를 기존 코드에 추가합니다. 현재 운영 코드를 통째로 덮어쓰지 않습니다.
3. 기존 doPost에서 JSON 파싱 후 `data.type === 'seminar'`이면 `seminarSubmit_(data)`를 반환합니다.
4. 기존 doGet에서 `seminar_health`, `seminar_status` 액션이면 `seminarGet_(e)`를 반환합니다. doGet이 없다면 이 라우팅과 기본 응답을 추가합니다.
5. 프로젝트의 Script Properties에 `SEMINAR_SPREADSHEET_ID`를 설정합니다. 기존 SPREADSHEET_ID 상수가 있으면 이를 재사용합니다.
6. `SEMINAR_NOTIFY_EMAIL`을 설정하거나 기존 NOTIFY_EMAIL을 재사용합니다. 기존 BOT_TOKEN·CHAT_ID가 있으면 Telegram 알림도 재사용합니다. 토큰을 HTML에 넣지 않습니다.
7. 현재 운영 웹 앱 배포를 새 버전으로 갱신하여 기존 URL을 유지합니다. 실행 주체와 공개 접근 설정을 확인합니다.
8. `seminar_health`에서 `protocol: seminar-v1`, `ready: true`를 확인합니다.
9. 테스트로 신청 한 건을 저장하고 `현직자세미나` 시트·알림·저장 확인 응답을 확인합니다.
10. 중복 request_id를 재전송하여 추가 행·알림이 생기지 않는지 확인합니다.

JSONP 조회는 저장 여부만 제공합니다. 신청자의 이름·연락처를 반환하지 않습니다.
네트워크 재시도에는 동일 request_id를 유지합니다. 광고 유입 정보는 전용 시트에 별도 열로 저장합니다.
알림 실패가 저장 성공을 취소하지 않습니다. 알림 오류는 Apps Script 실행 로그에서 확인합니다.

## 홈페이지·Meta 연결

서버 연결 확인 후 HTML·메뉴를 main에 반영합니다. GitHub Pages 배포 완료 후 모바일·데스크톱과 실제 신청을 다시 확인합니다.
Meta 이벤트 관리자에서 PageView·Lead 수신을 확인하고 광고세트의 전환 이벤트를 Lead로 설정합니다.
광고 목적·고용 카테고리·일 예산 25,000원·소재 A/B는 기존 인계 설정을 유지합니다.
자동 테스트는 실제 Meta 이벤트를 보내지 않으며, 실제 수신 확인은 Meta 이벤트 관리자에서 진행합니다.

광고 A 추적 예시:
https://jwfinancial.co.kr/advisor-seminar.html?utm_source=meta&utm_medium=paid_social&utm_campaign=advisor_seminar_2609&utm_content=700_A

광고 B 추적 예시:
https://jwfinancial.co.kr/advisor-seminar.html?utm_source=meta&utm_medium=paid_social&utm_campaign=advisor_seminar_2609&utm_content=savings_B
