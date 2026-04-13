# Quickstart: 라우팅 설정 검증

**Feature**: 002-routing-setup | **Date**: 2026-04-13

## 사전 준비

```bash
cd migration/
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.bun/bin:$PATH"
bun install
```

## 검증 시나리오

### US1: 공개 페이지 라우팅

```bash
bun run tauri dev
```

1. 앱 실행 시 `/auth/login` 페이지 표시 확인
2. URL을 `/auth/signup`으로 변경 → 회원가입 페이지 표시
3. URL을 `/auth/verify`로 변경 → 이메일 인증 페이지 표시
4. URL을 `/auth/resend`로 변경 → 재발송 페이지 표시
5. URL을 `/`로 변경 → `/auth/login`으로 리다이렉트

### US2: 인증 가드

1. localStorage에서 accessToken 제거
2. URL을 `/main`으로 변경 → `/auth/login`으로 리다이렉트
3. localStorage에 accessToken 설정 (임의 문자열)
4. URL을 `/main`으로 변경 → 메인 페이지 표시
5. URL을 `/auth/login`으로 변경 → `/main`으로 리다이렉트

### US3: 온보딩 라우팅

1. 인증 토큰 설정 상태에서
2. URL을 `/onboarding`으로 변경 → 온보딩 페이지 표시
3. URL을 `/onboarding/init`으로 변경 → 온보딩 시작 페이지 표시
4. URL을 `/onboarding/calibration`으로 변경 → 보정 페이지 표시
5. URL을 `/onboarding/completion`으로 변경 → 완료 페이지 표시

### US4: 위젯 라우트

1. URL을 `/widget`으로 변경 → 위젯 페이지 표시
2. 인증 토큰 없어도 위젯 페이지 정상 표시

### US5: 딥링크 (로컬 테스트 제한)

딥링크는 앱 설치 후 OS 수준에서 동작하므로 로컬 개발에서는 직접 테스트 어려움.
대신 프론트엔드 리스너 단위 검증으로 대체:

1. 콘솔에서 `window.__TAURI__.event.emit('deep-link://request', { urls: ['gbgr://auth/verify-callback?token=test123'] })` 실행
2. `/auth/verify-callback` 페이지로 이동하는지 확인

### 품질 게이트

```bash
bun run lint:check    # Biome 린트 통과
bunx tsc --noEmit     # 타입체크 통과
bun run build         # Vite 빌드 성공
```
