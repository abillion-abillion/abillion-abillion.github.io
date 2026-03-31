# abillion-abillion.github.io

## 역할
JW Financial Consulting 메인 홈페이지 (jwfinancial.co.kr)
GitHub Pages 정적 사이트 — push 즉시 라이브 반영됨

## 브랜치
- 메인: main (확인 필요: `git branch -a`)

## 주요 파일
- index.html: 메인 홈페이지
- consult.html: 상담 예약 폼 (Cal.com 연동)
- pension_simulator_v3.html: 변액연금 vs ETF 시뮬레이터

## 기술 스택
- HTML / CSS / JS (순수 정적)
- GitHub Pages 자동 배포

## 배포 방법
```bash
git add .
git commit -m "update"
git push origin main
# → jwfinancial.co.kr 자동 반영
```

## 주의사항
- push = 즉시 라이브. 반드시 로컬 확인 후 push
- OG/meta 태그 있음 (KakaoTalk 미리보기 영향)

## 현재 진행 중 / 미완료
- [ ] Cal.com 예약 연동 마무리
- [ ] Notion DB 필드 매핑
