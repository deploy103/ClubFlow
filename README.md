# ClubFlow

동아리 가입 요청, 관리자 승인, 동아리 배정, 역할별 운영 화면을 한 흐름으로 처리하는 클럽 관리 플랫폼입니다.

## 주요 기능

- 회원가입 후 승인 대기 상태로 자동 진입
- 관리자의 가입 요청 승인 / 반려
- 승인 시 동아리와 역할 직접 배정
- 멤버 / 리더 / 관리자 화면 분리
- 리더의 동아리 공지 등록
- 관리자의 동아리 추가와 사용자 현황 조회
- 세션 쿠키 인증과 CSRF 보호

## 화면 구성

- 공개 화면: 로그인, 회원가입
- 승인 대기 화면: 요청 상태와 안내 확인
- 멤버 화면: 내 동아리, 공지, 프로필
- 리더 화면: 멤버 관리, 공지 관리
- 관리자 화면: 대시보드, 가입 승인, 동아리 관리, 사용자 관리

최근 UI는 운영툴 느낌에 맞춰 다크 사이드바, 선명한 카드/표, 로그인 히어로 워크플로우 중심으로 정리했습니다.

## 프로젝트 구조

```text
apps/
  api/      Fastify + TypeScript API 서버
  web/      React + Vite 프론트엔드
packages/
  shared/   프론트엔드와 백엔드가 공유하는 타입
scripts/
  smoke-test.mjs
docs/
  architecture.md
  current-status.md
```

프론트엔드 화면은 `apps/web`, API와 도메인 로직은 `apps/api`, 공용 타입은 `packages/shared`에 있습니다.

## 데모 계정

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 관리자 | `admin@clubflow.local` | `ClubFlow!Admin2026` |
| 리더 | `leader@clubflow.local` | `ClubFlow!Leader2026` |
| 멤버 | `member@clubflow.local` | `ClubFlow!Member2026` |
| 승인 대기 | `pending@clubflow.local` | `ClubFlow!Pending2026` |

## 실행

```bash
corepack pnpm install
corepack pnpm dev
```

- 웹: `http://localhost:5173/`
- API: `http://localhost:4000/`

`5173` 포트가 이미 사용 중이면 Vite가 다음 포트로 자동 전환합니다. `.env` 파일이 없어도 기본값으로 실행됩니다.

## 검증

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm smoke
```

스모크 테스트는 다음 흐름을 확인합니다.

- 헬스체크
- 비인증 접근 차단
- 공개 동아리 목록 조회
- 회원가입과 승인 대기 조회
- 관리자 승인
- 승인 후 멤버 접근
- 리더 공지 작성
- 역할 기반 접근 제어
- CSRF 보호
- 로그아웃

## 참고

- 현재 저장소는 인메모리 데이터 저장소를 사용하므로 서버 재시작 시 데이터가 초기화됩니다.
- 실제 운영 배포 전에는 영속 저장소, 운영용 쿠키 시크릿, 배포 환경별 `WEB_ORIGIN` 설정이 필요합니다.
