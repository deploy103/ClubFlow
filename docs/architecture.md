# Architecture

## Goal

- 회원가입 요청을 받고
- 관리자가 동아리와 역할을 배정해 승인하거나 반려하고
- 승인 후에는 멤버 / 리더 / 관리자 화면이 분리되는 구조

## Frontend

- 위치: `apps/web`
- 기술:
  - React
  - Vite
  - TanStack Query
  - React Router
  - Lucide Icons
- 구성:
  - `pages/public-pages.tsx`: 로그인 / 회원가입
  - `pages/pending-page.tsx`: 승인 대기
  - `pages/member-pages.tsx`: 멤버 화면
  - `pages/leader-pages.tsx`: 리더 화면
  - `pages/admin-pages.tsx`: 관리자 화면
  - `lib/auth.tsx`: 세션과 홈 경로 결정
  - `components/app-shell.tsx`: 역할별 공통 레이아웃
  - `components/ui.tsx`: 공용 카드, 표, 폼, 배지 컴포넌트
  - `styles.css`: 전체 레이아웃과 운영툴 스타일

### Frontend Routing

- 공개 사용자:
  - `/login`
  - `/signup`
- 승인 대기 사용자:
  - `/access`
- 승인된 사용자:
  - `/member/*`
  - `/leader/*`
  - `/admin/*`

`AuthProvider`가 `GET /api/auth/me`로 세션을 복원하고, `getHomePath`가 역할과 승인 상태에 맞는 홈 경로를 결정합니다.

## Backend

- 위치: `apps/api`
- 기술:
  - Fastify
  - TypeScript
  - Zod
- 구성:
  - `app.ts`: 라우트와 보안 미들웨어
  - `services/auth-service.ts`: 로그인 / 회원가입 / 세션
  - `services/pending-service.ts`: 승인 대기 조회
  - `services/member-service.ts`: 멤버 화면 데이터
  - `services/leader-service.ts`: 리더 공지와 멤버 조회
  - `services/admin-service.ts`: 가입 승인 / 반려 / 동아리 추가
  - `repositories/*`: 저장소 계약과 인메모리 구현

## Shared Types

- 위치: `packages/shared`
- 역할:
  - `Role`, `ApprovalStatus`
  - `Club`, `User`, `JoinRequest`, `Announcement`
  - 역할별 페이지 응답 타입

## Data Flow

1. 회원가입 시 `pending` 사용자와 가입 요청이 같이 생성됩니다.
2. 가입자는 로그인되지만 승인 대기 화면만 접근합니다.
3. 관리자가 요청을 승인하면 사용자 `role`, `approvalStatus`, `clubId` 가 갱신됩니다.
4. 이후 세션 조회 시 새로운 권한이 바로 반영됩니다.

## Security Flow

1. 로그인 또는 회원가입 성공 시 세션 쿠키와 CSRF 토큰을 발급합니다.
2. 프론트엔드는 CSRF 토큰을 메모리에 저장합니다.
3. `GET`, `HEAD`가 아닌 요청에는 `x-csrf-token` 헤더를 포함합니다.
4. 백엔드는 세션과 CSRF 토큰을 함께 확인한 뒤 요청을 처리합니다.

## Runtime Note

- 로컬 API 기본 포트는 `4000`입니다.
- 로컬 웹 기본 포트는 `5173`이며, 이미 사용 중이면 Vite가 다음 포트를 사용합니다.
- 현재 저장소는 인메모리 저장소를 사용하므로 서버 재시작 시 데이터가 초기화됩니다.
