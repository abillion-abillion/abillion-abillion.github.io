# LLM 작업 컨텍스트 (Compact)

## 0) 프로젝트
- 저장소: `abillion-abillion/abillion-abillion.github.io`
- 로컬 주요 경로:
  - 작업 경로: `C:\Users\njw85\OneDrive\바탕 화면\클로드코드\Codex`
  - 실제 사이트 경로: `C:\Users\njw85\OneDrive\바탕 화면\클로드코드\개인 홈페이지`
- 기본 원칙: 기존 디자인 시스템(색상/폰트/네비/컴포넌트 패턴) 유지

## 1) 사용자 요구 핵심
- 기존 스타일 유지한 금융 가이드 허브(`guides.html`) 구축
- 고객용/직원용 탭, 라이프스테이지 필터, 검색/공유 기능
- `guides/` 내 22개 자료 연결
- 가이드 개별 페이지들 네비게이션/복귀 버튼 적용
- `finance_news_auto.html`, `spending_diagnosis.html` 기능 동작 보완
- `finance_news_auto.html`는 고객 노출 제한(직원용/히든 성격)
- 가이드 20개 페이지 배경/톤을 메인(index)과 맞추고 더 전문적으로 개선
- 카카오 공유 썸네일/타이틀 일관화
  - “허머니” 문구 제거
  - 각 페이지 타이틀: `한글 타이틀 + JW Financial`
- 작업 완료 시 커밋/푸시까지 수행

## 2) 이미 반영된 주요 변경(최근 커밋 기준)
- `897e385` Add finance guides hub page
- `66019a6` Add finance guides hub and guide pages
- `13bcdca` Fix finance tools and refresh guide pages
- `cd1a460` Unify social share previews and titles

## 3) 현재 상태 요약
- 소셜 공유 미리보기 메타(썸네일/타이틀) 통일 작업 커밋됨
- 금융 가이드 허브 및 가이드 페이지 확장 반영됨
- 금융 도구 페이지 동작 보완 작업 반영됨
- 워킹트리: 추적 파일 변경 없음(최근 확인 시), 일부 미추적 파일만 존재

## 4) 남은 작업 시 체크 포인트
- 실제 카카오톡 썸네일 반영 지연 가능(캐시 영향) -> 배포 후 재확인 필요
- 히든 페이지(직원용) 접근 제어는 정적 사이트 한계상 “노출 최소화” 수준인지, 인증 기반인지 구분 필요
- 모든 페이지의 OG 메타(og:title/og:image/twitter 카드) 재점검 필요

## 5) 다음 LLM에게 바로 붙여넣는 Compact 프롬프트
아래를 그대로 후속 모델 입력에 사용:

```md
프로젝트: 정적 웹사이트(jwfinancial.co.kr) 유지보수.
최우선: 기존 디자인 시스템 유지(색상/폰트/네비 구조/컴포넌트 패턴).

이미 반영된 작업:
1) 금융 가이드 허브(guides.html) + 고객/직원 탭 구조
2) guides/ 자료 연결 및 가이드 페이지 정리
3) finance_news_auto.html, spending_diagnosis.html 기능 보완
4) 공유 썸네일/타이틀 통일, “허머니” 문구 제거, 페이지별 “한글 타이틀 + JW Financial” 적용
5) 커밋/푸시 진행

작업 원칙:
- 기존 UX 흐름과 시각 톤을 해치지 말 것
- 모바일 반응형 보장
- 수정 후 브라우저 렌더링 확인
- 작업 종료 시 git commit/push

검증 체크:
- index/service/reviews/tips/column/guides/consult 카카오 공유 미리보기 일관성
- 각 페이지 og:title, og:image, twitter 카드 일치
- 금융 도구 입력/생성 버튼 실제 동작
```

## 6) 초압축 한 줄 버전
- `기존 디자인 유지 + 금융가이드/도구/공유메타 통일 작업 완료 상태이며, 다음 작업은 카카오 캐시 포함 최종 미리보기 검증과 잔여 페이지 메타 일관성 점검 중심으로 진행하면 됨.`
