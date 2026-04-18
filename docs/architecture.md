# Architecture

## Goal

- 회원가입 요청을 받고
- 관리자가 동아리와 역할을 배정해 승인하거나 반려하고
- 승인 후에는 멤버 / 리더 / 관리자 화면이 분리되는 구조

## Frontend

- 위치: `apps/web`
- 구성:
  - `pages/public-pages.tsx`: 로그인 / 회원가입
  - `pages/pending-page.tsx`: 승인 대기
  - `pages/member-pages.tsx`: 멤버 화면
  - `pages/leader-pages.tsx`: 리더 화면
  - `pages/admin-pages.tsx`: 관리자 화면
  - `lib/auth.tsx`: 세션과 홈 경로 결정
  - `components/app-shell.tsx`: 역할별 공통 레이아웃

## Backend

- 위치: `apps/api`
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
