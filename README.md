# ClubFlow

동아리 가입 요청, 관리자 승인, 역할별 운영 화면을 분리한 클럽 관리 플랫폼입니다.

## 현재 구조

- `apps/web`: React + Vite 프론트엔드
  - 로그인
  - 회원가입
  - 승인 대기
  - 멤버 화면
  - 리더 화면
  - 관리자 화면
- `apps/api`: Fastify + TypeScript 백엔드
  - 세션 쿠키 인증
  - CSRF 보호
  - 가입 요청 생성
  - 관리자 승인 / 반려
  - 리더 공지 등록
  - 동아리 추가
- `packages/shared`: 프론트와 백엔드가 공유하는 타입

프론트와 백엔드는 워크스페이스 기준으로 명확히 분리되어 있습니다.
화면은 `apps/web`, API와 도메인 로직은 `apps/api` 에만 있습니다.

## 데모 계정

- 관리자: `admin@clubflow.local` / `ClubFlow!Admin2026`
- 리더: `leader@clubflow.local` / `ClubFlow!Leader2026`
- 멤버: `member@clubflow.local` / `ClubFlow!Member2026`
- 승인 대기: `pending@clubflow.local` / `ClubFlow!Pending2026`

## 주요 흐름

1. 사용자가 회원가입 페이지에서 가입 요청을 보냅니다.
2. 계정은 즉시 로그인되지만 `승인 대기` 상태만 접근할 수 있습니다.
3. 관리자가 요청을 보고 동아리와 역할을 배정해 승인하거나 메모와 함께 반려합니다.
4. 승인되면 멤버 또는 리더 화면으로 바로 진입합니다.

## 실행

```bash
corepack pnpm install
corepack pnpm dev
```

`.env` 가 없어도 기본값으로 동작합니다.

## 검증

앱별 타입체크:

```bash
cd apps/api && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
cd apps/web && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
```

빌드:

```bash
cd apps/api && ./node_modules/.bin/tsc -p tsconfig.json
cd apps/web && ./node_modules/.bin/vite build
```

스모크 테스트:

```bash
node scripts/smoke-test.mjs
```

검증 항목:

- 공개 동아리 목록 조회
- 회원가입과 승인 대기 확인
- 관리자 승인
- 승인 후 멤버 접근
- 리더 공지 작성
- 역할 기반 접근 제어
- CSRF 보호
- 로그아웃
