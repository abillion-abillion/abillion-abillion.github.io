# Client Portal (GitHub Pages + Supabase)

이 폴더는 정적 호스팅(GitHub Pages)에서 동작하는 고객관리 포털입니다.

## 1. 권장 구조

- 기존 사이트와 분리된 **전용 Supabase 프로젝트**를 새로 만드는 것을 권장합니다.
- 이유: 이 포털은 개인정보/재무정보/비공개 파일을 다룹니다.
- `service_role` 키는 절대 프론트엔드에 넣지 않습니다.
- 이 포털은 `anon key`만 브라우저에 노출됩니다.

## 2. Supabase 준비

1. Supabase SQL Editor에서 `supabase-client-portal-schema.sql` 실행
2. Authentication에서 관리자 계정 1개 생성
3. `portal_users`에 관리자 연결

기존 운영 DB에 점진 반영할 경우(이미 기본 스키마를 실행한 경우) 아래 migration 파일을 추가 실행합니다.

- `supabase-add-portal-execution-tasks.sql`
- `supabase-add-portal-strategy-configs.sql`
- `supabase-add-portal-consulting-notes.sql`
- `supabase-add-portal-account-recovery.sql`

```sql
insert into public.portal_users (auth_user_id, role, is_active)
values ('<ADMIN_AUTH_USER_UUID>', 'admin', true);
```

관리자 Auth UUID를 찾는 예시:

```sql
select id, email, created_at
from auth.users
order by created_at desc;
```

## 3. 포털 설정 파일

`client-portal/supabase-config.js`에 포털 전용 프로젝트 값을 넣습니다.

```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

기본 예시는 `client-portal/supabase-config.example.js`에 있습니다.

## 4. Auth 설정 권장값

Supabase Dashboard에서 다음을 확인합니다.

- Authentication -> Providers -> Email 활성화
- 관리자/고객은 Email + Password 로그인 사용
- Site URL: 실제 Pages 도메인
- Redirect URLs:
  - `https://<YOUR_DOMAIN>/client-portal/index.html`
  - `https://<YOUR_DOMAIN>/client-portal/app.html`

예:

- `https://jwfinancial.co.kr/client-portal/index.html`
- `https://jwfinancial.co.kr/client-portal/app.html`

## 5. 고객 계정 연결 방식

앱에서 엑셀 업로드 시 고객 라벨이 생성됩니다.

- 로그인 ID 권장: `라벨@clients.jwfinancial.local`
- 초기 비밀번호 권장: 고객 휴대폰 뒷자리 4자리

고객 Auth 계정 생성 후 `portal_users`에 연결합니다.

1. 관리자 로그인
2. `client-portal/app.html`에서 엑셀 업로드
3. `portal_customers`에 생성된 `label`, `id` 확인
4. Supabase Authentication -> Users에서 고객 계정 생성
5. 아래 SQL로 Auth 계정과 고객 레코드 연결

```sql
insert into public.portal_users (auth_user_id, role, customer_id, is_active)
values ('<CUSTOMER_AUTH_USER_UUID>', 'customer', <CUSTOMER_ID>, true);
```

고객 목록 확인 예시:

```sql
select id, name, label, phone, created_at
from public.portal_customers
order by id desc;
```

주의:

- 현재 구현은 **고객 Auth 계정 자동 생성까지는 하지 않습니다.**
- 이유: GitHub Pages 정적 앱에서는 `service_role` 없이 안전하게 Auth 계정을 생성할 수 없기 때문입니다.
- 자동화를 원하면 Supabase Edge Function을 추가해야 합니다.

## 6. Storage 확인

SQL 실행 시 private bucket `portfolio-files`가 같이 생성됩니다.

확인 위치:

- Supabase Dashboard -> Storage -> Buckets
- `portfolio-files` 버킷이 보여야 함
- public 은 `false` 이어야 함

포트폴리오 파일은 여기 저장되고, 고객 본인/관리자만 볼 수 있도록 RLS가 적용됩니다.

## 7. GitHub Pages 배포

이 저장소는 GitHub Pages 저장소이므로 커밋/푸시 후 바로 경로로 접근하면 됩니다.

- 로그인: `/client-portal/index.html`
- 앱: `/client-portal/app.html`

## 8. 첫 실행 순서

1. `supabase-config.js` 값 입력
2. SQL schema 실행
3. 관리자 Auth 계정 생성
4. 관리자 UUID를 `portal_users`에 insert
5. GitHub에 push
6. `/client-portal/index.html` 접속
7. 관리자 로그인
8. 엑셀 업로드
9. 생성된 고객 라벨 확인
10. 필요 고객만 Auth 계정 생성 후 `portal_users` 연결

## 9. 구현된 기능

- 역할 기반 로그인 (관리자/고객)
- 고객 검색 및 상세 조회
- 재무제표 엑셀 업로드 후 스냅샷 저장
- 라벨 규칙: `년생_성별_이름_첫업로드년월`
- 추세 그래프 + SWOT + 칭찬/개선 포인트
- 포트폴리오 파일 업로드/조회 (Supabase Storage private bucket)
- 사고 -> 설계 -> 자산관리 -> 실행 단계 진행률 보드
- 실행 체크리스트 완료 상태 저장 (`portal_execution_tasks`)
- 고객별 전략 프리셋/목표 비중 저장 (`portal_customer_strategy_configs`)

## 10. 개인정보/보안

- 파일은 Supabase private bucket(`portfolio-files`)에 저장
- 스토리지 접근은 RLS 정책으로 고객 본인/관리자만 허용
- 페이지에는 `noindex` 메타 적용
- 기존 사이트용 Supabase 설정과 분리해서 `client-portal/supabase-config.js`를 사용
