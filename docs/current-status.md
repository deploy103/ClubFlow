# Current Status

## 날짜

- 작업 기준일: 2026-04-17

## 현재 구현 상태

ClubFlow는 현재 과제 플랫폼이 아니라, 다음 흐름의 동아리 운영 플랫폼으로 정리되어 있습니다.

- 로그인 화면 정리 완료
- 회원가입 화면 추가 완료
- 승인 대기 화면 추가 완료
- 멤버 / 리더 / 관리자 화면 분리 완료
- 관리자 가입 승인 / 반려 기능 추가 완료
- 관리자 동아리 추가 기능 추가 완료
- 리더 공지 등록 기능 추가 완료
- 인메모리 저장소 기반 승인 플로우 구현 완료

## 역할 구조

- `pending`: 가입 요청 후 승인 대기 또는 반려 상태
- `member`: 승인된 일반 멤버
- `leader`: 동아리 리더
- `admin`: 전체 운영 관리자

## 프론트엔드 상태

- `apps/web` 에서만 화면 렌더링
- 라우트:
  - `/login`
  - `/signup`
  - `/access`
  - `/member/*`
  - `/leader/*`
  - `/admin/*`
- 메인 화면 복잡도를 줄이기 위해 역할별로 페이지를 나눴습니다.

## 백엔드 상태

- `apps/api` 에서만 API와 도메인 로직 처리
- 주요 API:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/pending/overview`
  - `GET /api/member/*`
  - `GET/POST /api/leader/announcements`
  - `GET/POST /api/admin/*`
- 세션 쿠키 + CSRF 보호 유지

## 검증 결과

완료:

- `cd apps/api && ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- `cd apps/web && ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- `cd apps/api && ./node_modules/.bin/tsc -p tsconfig.json`
- `cd apps/web && ./node_modules/.bin/vite build`
- `node scripts/smoke-test.mjs`

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

## 참고

- 현재 저장소는 인메모리 기반이라 재시작 시 데이터가 초기화됩니다.
- WSL 환경에서 빌드 검증을 위해 Linux용 `rollup` / `esbuild` 바이너리를 로컬 `node_modules`에 보강했습니다.
