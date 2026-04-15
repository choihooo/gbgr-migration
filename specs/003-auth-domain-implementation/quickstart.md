# Quickstart: 인증 도메인 정식 구현

## 1. 목표

`migration` 앱의 인증 화면을 레거시 UI 그대로 유지하면서 실제 API, 세션 저장/복구, 보호 라우트 분기까지 연결한다.

## 2. 구현 순서

1. `shared/api`에 레거시 계약을 따르는 인증 API 클라이언트와 토큰 재발급 처리기를 만든다.
2. `entities/session`에 인증 세션 저장소와 키 정리 유틸을 만든다.
3. `entities/user`에 사용자 기본 정보 조회/복구와 가입 이메일 보존 모델을 만든다.
4. `features/auth/model`에 로그인, 회원가입, 이메일 인증, 재발송, 콜백 상태 전이 로직을 둔다.
5. `features/auth/ui`는 기존 화면을 유지한 채 새 모델과 연결한다.
6. `shared/config/router.tsx`와 `app/providers`에서 인증 하이드레이션과 보호 라우트 분기를 연결한다.
7. 순수 함수/스토어 테스트와 수동 회귀 검증을 수행한다.

## 3. 구현 체크포인트

- 레거시와 동일한 엔드포인트 이름과 기본 응답 해석을 사용한다.
- 현재 `/users/me` 응답은 `name`, `email`, `avatar` 기준으로 해석하며, `email`을 앱 내부 사용자 식별자로 저장한다.
- `localStorage.clear()` 대신 인증 키만 선택적으로 정리한다.
- 미인증 로그인은 인증 대기/재발송 흐름으로 보낸다.
- 로그인/복구 성공 시 원래 요청한 보호 경로로 우선 복귀한다.
- 인증 복구가 끝나기 전에는 보호 화면이 노출되지 않는다.
- 이메일 인증 콜백은 성공/실패를 구분해 표시하고 자동 로그인하지 않는다.

## 4. 권장 수동 검증 시나리오

1. 저장된 토큰이 없는 상태에서 `/main` 진입 시 `/auth/login`으로 이동하는지 확인한다.
2. 유효한 계정 로그인 후 보호 경로로 복귀하는지 확인한다.
3. `savedEmail` 체크 상태가 로그인 재진입 시 유지되는지 확인한다.
4. 미인증 계정 로그인 시 `/auth/verify` 또는 `/auth/resend` 흐름으로 이동하는지 확인한다.
5. 회원가입 후 `/auth/verify` 화면에 이메일 정보가 이어지는지 확인한다.
6. 이메일 재발송 성공/실패 메시지가 현재 i18n 문구로 노출되는지 확인한다.
7. `token`이 있는 `/auth/verify-callback` 진입 시 1회만 처리되는지 확인한다.
8. 만료된 토큰 또는 재발급 실패 시 인증 키만 정리되고 언어 설정은 유지되는지 확인한다.

## 5. 기본 명령

```bash
cd /home/choiho/coding/FE-migration/migration
pnpm install
pnpm lint:check
pnpm typecheck
pnpm dev
```

Vitest를 추가한 뒤에는 아래 명령을 함께 사용한다.

```bash
cd /home/choiho/coding/FE-migration/migration
pnpm test
```
