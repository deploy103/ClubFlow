# Session Handoff - 2026-04-17

## 현재 상태

ClubFlow 초기 프로토타입 구조를 거의 끝냈습니다.
프론트와 백엔드 모두 TypeScript 기반으로 올라가 있고, 역할별 페이지와 보안 기본 구조가 들어갔습니다.

## 완료한 것

- `pnpm` 워크스페이스 모노레포 구성
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- 프론트엔드 구현
  - React + Vite + TypeScript
  - 학생 / 멘토 / 관리자 라우트 분리
  - 로그인 페이지
  - 사이드바 + 상단바 + 카드형 다크 대시보드 UI
  - 학생 페이지
    - 대시보드
    - 내 과제
    - 제출 내역
    - 피드백
    - 질문함
  - 멘토 페이지
    - 대시보드
    - 과제 관리
    - 제출물 검토
    - 피드백 작성
    - 질문함
  - 관리자 페이지
    - 대시보드
    - 동아리
    - 사용자
    - 권한 범위
- 백엔드 구현
  - Fastify + TypeScript
  - 세션 쿠키 기반 인증
  - CSRF 헤더 검증
  - CORS / Helmet / Rate Limit
  - 학생 / 멘토 / 관리자 역할별 API
  - 저장소 인터페이스 + 인메모리 저장소
  - 더미 데이터 시드
  - DB 연동을 위한 저장소 분리 및 주석
- 추가 기능 반영
  - 알림
  - 활동 로그
  - 감사 로그 개념
  - 첨부 메타데이터 구조
- 검증
  - `corepack pnpm --filter @clubflow/api typecheck` 통과
  - `corepack pnpm --filter @clubflow/web typecheck` 통과
  - `corepack pnpm build` 통과
  - `corepack pnpm smoke` 통과

## 남은 것

- 브라우저에서 화면 실제 확인
  - 모바일 레이아웃
  - 멘토 과제 생성 / 피드백 작성 / 질문 답변 흐름
- 필요하면 다음 확장
  - 관리자 생성/수정 API
  - 실제 파일 업로드
  - 실제 DB 연결
  - Ubuntu 배포용 reverse proxy / process manager 설정

## 실행 명령

```bash
corepack pnpm install
corepack pnpm dev
```

개별 실행:

```bash
corepack pnpm --filter @clubflow/api dev
corepack pnpm --filter @clubflow/web dev
```

검증:

```bash
corepack pnpm --filter @clubflow/api typecheck
corepack pnpm --filter @clubflow/web typecheck
corepack pnpm build
corepack pnpm smoke
```

## 핵심 파일

- 프론트 진입점: `apps/web/src/App.tsx`
- 프론트 인증: `apps/web/src/lib/auth.tsx`
- 프론트 API 래퍼: `apps/web/src/lib/api.ts`
- 학생 페이지: `apps/web/src/pages/student-pages.tsx`
- 멘토 페이지: `apps/web/src/pages/mentor-pages.tsx`
- 관리자 페이지: `apps/web/src/pages/admin-pages.tsx`
- 스타일: `apps/web/src/styles.css`
- 백엔드 라우트: `apps/api/src/app.ts`
- 인증 서비스: `apps/api/src/services/auth-service.ts`
- 학생 서비스: `apps/api/src/services/student-service.ts`
- 멘토 서비스: `apps/api/src/services/mentor-service.ts`
- 관리자 서비스: `apps/api/src/services/admin-service.ts`
- 시드 데이터: `apps/api/src/data/seed.ts`
- 저장소 인터페이스: `apps/api/src/repositories/contracts.ts`
- 공유 타입: `packages/shared/src/index.ts`

## 이어서 할 때 권장 순서

1. `corepack pnpm dev` 실행
2. 로그인 화면에서 데모 계정 확인
3. 학생 / 멘토 / 관리자 각각 로그인 확인
4. 네트워크 탭에서 세션 쿠키와 CSRF 요청 확인
5. 필요시 관리자 생성/수정 API 또는 DB 구현체 작업 시작

## 메모

- 현재 `.env` 가 없어도 기본값으로 동작하도록 해두었습니다.
- 2026-04-17 기준 현재 Windows 계정에서는 전역 `pnpm` 이 PATH 에 없어도 되도록 루트 스크립트를 `corepack pnpm` 기준으로 정리했습니다.
- 실제 운영 전에는 `COOKIE_SECRET`, `WEB_ORIGIN`, `COOKIE_SECURE` 를 반드시 환경 변수로 교체해야 합니다.
- 참고 이미지 톤을 반영해 다크 카드형 대시보드로 디자인했습니다.
- 스모크 테스트 스크립트는 `scripts/smoke-test.mjs` 에 있습니다.
- 스모크 테스트 기준으로 확인된 항목:
  - 헬스체크
  - 비인증 접근 차단
  - 역할별 로그인
  - 멘토 과제 생성
  - 학생 제출 / 질문 등록
  - 멘토 답변 / 피드백 작성
  - 관리자 조회
  - CSRF 보호
  - 로그아웃
- 마지막 수정으로 스모크 테스트에 `역할 기반 접근 제어(학생이 멘토 API 접근 시 403)` 검증도 추가했습니다.
- 따라서 다음 시작 시 `corepack pnpm smoke` 를 한 번 재실행하면 최신 체크셋 기준으로 다시 확인할 수 있습니다.
