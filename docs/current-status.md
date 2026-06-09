# Current Status

## 날짜

- 작업 기준일: 2026-06-09

## 현재 구현 상태

ClubFlow는 동아리 가입 요청부터 관리자 승인, 동아리 배정, 역할별 화면 진입까지 이어지는 동아리 운영 플랫폼입니다.

완료된 항목:

- 로그인 / 회원가입 화면
- 승인 대기 화면
- 멤버 / 리더 / 관리자 화면 분리
- 관리자 가입 승인 / 반려
- 관리자 동아리 추가
- 관리자 사용자 현황 조회
- 리더 공지 등록
- 인메모리 저장소 기반 승인 플로우
- 세션 쿠키 인증
- CSRF 보호
- 운영툴 스타일 UI 정리

## 역할 구조

- `pending`: 가입 요청 후 승인 대기 또는 반려 상태
- `member`: 승인된 일반 멤버
- `leader`: 동아리 리더
- `admin`: 전체 운영 관리자

## 프론트엔드 상태

- 위치: `apps/web`
- 기술 스택: React, Vite, TanStack Query, React Router, Lucide Icons
- 주요 라우트:
  - `/login`
  - `/signup`
  - `/access`
  - `/member/*`
  - `/leader/*`
  - `/admin/*`
- 최근 정리:
  - 로그인 / 회원가입 히어로에 워크플로우 시각 요소 추가
  - 다크 사이드바 기반 앱 쉘 적용
  - 카드, 표, 폼, 버튼 스타일 통일
  - 모바일 반응형 레이아웃 보강

## 백엔드 상태

- 위치: `apps/api`
- 기술 스택: Fastify, TypeScript, Zod
- 주요 API:
  - `GET /api/health`
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/pending/overview`
  - `GET /api/member/*`
  - `GET/POST /api/leader/announcements`
  - `GET/POST /api/admin/*`

## 검증 결과

최근 확인 완료:

```bash
corepack pnpm --filter @clubflow/web typecheck
corepack pnpm --filter @clubflow/web build
node scripts/smoke-test.mjs
```

스모크 테스트 확인 항목:

- 헬스체크
- 비인증 접근 차단
- 공개 동아리 목록 조회
- 회원가입
- 승인 대기 조회
- 관리자 승인
- 승인 후 멤버 접근
- 리더 공지 작성
- 역할 기반 접근 제어
- CSRF 보호
- 로그아웃

## 남은 작업

- 영속 저장소 연결
- 운영 배포 환경 구성
- 운영용 `COOKIE_SECRET`, `WEB_ORIGIN`, HTTPS 쿠키 설정
- 실제 사용자 데이터 관리 기능 확장

## 참고

- 현재 저장소는 인메모리 기반이라 재시작 시 데이터가 초기화됩니다.
- `.env` 없이도 기본값으로 로컬 실행이 가능합니다.
