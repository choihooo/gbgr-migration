# Data Model: 인증 도메인 정식 구현

## 1. 인증 세션

### 목적

앱 전역에서 현재 사용자의 인증 여부, 복구 진행 상태, 보호 경로 복귀 정보를 일관되게 관리한다.

### 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `checking \| authenticated \| unauthenticated` | 앱 초기 복구 중인지, 인증 완료인지, 미인증인지 나타낸다 |
| `accessToken` | `string \| null` | API 인증에 사용하는 액세스 토큰 |
| `refreshToken` | `string \| null` | 세션 연장에 사용하는 리프레시 토큰 |
| `userId` | `string \| null` | 인증된 사용자 식별자 |
| `userName` | `string \| null` | 보호 화면과 온보딩 분기에 쓰는 사용자 표시 이름 |
| `redirectPath` | `string \| null` | 공개 상태에서 사용자가 요청했던 보호 경로 |
| `lastErrorCode` | `string \| null` | 최근 인증 실패 코드 또는 분류값 |
| `hydratedAt` | `number \| null` | 마지막 복구 시각 |

### 검증 규칙

- `authenticated` 상태에서는 `accessToken`, `refreshToken`, `userId`가 모두 존재해야 한다.
- `checking` 상태에서는 보호 화면을 렌더링하지 않는다.
- `redirectPath`는 보호 라우트 경로만 저장한다.
- `AUTH-101`, `AUTH-102`가 감지되면 세션은 `unauthenticated`로 전환되고 인증 키를 정리한다.

### 상태 전이

| 현재 상태 | 이벤트 | 다음 상태 | 설명 |
|-----------|--------|-----------|------|
| `unauthenticated` | 보호 경로 요청 | `unauthenticated` | 경로 저장 후 로그인 화면으로 이동 |
| `unauthenticated` | 로그인 성공 | `authenticated` | 토큰, 사용자 정보 저장 후 복귀 경로 또는 기본 화면 이동 |
| `unauthenticated` | 미인증 로그인 응답 | `unauthenticated` | 이메일 인증 대기/재발송 흐름으로 이동 |
| `checking` | 저장 세션 검증 성공 | `authenticated` | 보호 경로 복귀 또는 기본 보호 화면 이동 |
| `checking` | 저장 세션 검증 실패 | `unauthenticated` | 인증 키 정리 후 로그인 화면 이동 |
| `authenticated` | 토큰 만료 후 재발급 성공 | `authenticated` | 새 토큰으로 세션 유지 |
| `authenticated` | 토큰 만료 후 재발급 실패 | `unauthenticated` | 인증 키 정리 후 로그인 화면 이동 |
| `authenticated` | 명시적 로그아웃 | `unauthenticated` | 인증 키만 정리 |

## 2. 가입 초안 사용자

### 목적

회원가입 완료 직후와 이메일 인증 대기/재발송 화면 사이에서 필요한 최소 정보를 유지한다.

### 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | `string` | 가입 또는 재발송 대상 이메일 |
| `name` | `string \| null` | 가입 시 입력한 이름 |
| `emailChecked` | `boolean` | 이메일 중복 확인 완료 여부 |
| `submittedAt` | `number \| null` | 가입 제출 시각 |

### 검증 규칙

- `email`은 유효한 이메일 형식이어야 한다.
- `emailChecked`가 `true`일 때만 가입 제출 가능하다.
- 재발송 화면 진입 시 `email`이 없으면 “이메일 정보 없음” 상태를 보여야 한다.

### 상태 전이

| 현재 상태 | 이벤트 | 다음 상태 | 설명 |
|-----------|--------|-----------|------|
| 빈 상태 | 폼 입력 | 초안 생성 | 로컬 입력만 반영 |
| 초안 생성 | 중복 확인 성공 | 확인 완료 | 가입 제출 가능 |
| 확인 완료 | 가입 성공 | 인증 대기 | 이메일 인증 안내 화면 이동 |
| 인증 대기 | 재발송 성공 | 인증 대기 유지 | 마지막 이메일을 계속 유지 |
| 인증 대기 | 인증 완료 | 초기화 | 로그인 유도 화면으로 전환 |

## 3. 이메일 인증 요청

### 목적

이메일 인증 메일 발송과 재발송의 마지막 결과를 표현한다.

### 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `email` | `string` | 발송 대상 |
| `requestType` | `initial \| resend` | 최초 발송인지 재발송인지 |
| `status` | `idle \| pending \| success \| error` | 요청 상태 |
| `message` | `string \| null` | 사용자 노출 메시지 |
| `requestedAt` | `number \| null` | 마지막 요청 시각 |

### 규칙

- `pending` 중에는 중복 재요청을 막아야 한다.
- `success`와 `error` 모두 현재 i18n 문구 체계에서 표현 가능해야 한다.

## 4. 인증 콜백 결과

### 목적

인증 링크 유입 후 콜백 페이지에 표시할 결과를 단일 상태로 관리한다.

### 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `token` | `string \| null` | URL에서 추출한 인증 토큰 |
| `status` | `idle \| pending \| success \| error` | 토큰 처리 상태 |
| `errorCode` | `string \| null` | 실패 시 분류값 |
| `resolvedAt` | `number \| null` | 처리 완료 시각 |

### 규칙

- 동일한 `token`은 한 번만 처리한다.
- `token`이 없거나 무효하면 `error` 상태로 전환한다.
- 성공 시 자동 로그인은 하지 않고 로그인 유도 문구를 유지한다.

## 5. 보호 경로 의도

### 목적

미인증 상태에서 사용자가 접근하려던 보호 목적지를 보존하고 로그인 후 우선 복귀에 사용한다.

### 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `path` | `string` | 요청한 보호 경로 |
| `search` | `string` | 쿼리 문자열 |
| `hash` | `string` | 해시 값 |
| `capturedAt` | `number` | 저장 시각 |

### 규칙

- 공개 라우트(`/auth/*`, `/widget`)는 저장 대상이 아니다.
- 인증 성공 또는 복구 완료 후 사용한 뒤 즉시 비운다.

## 6. 저장 키 정책

| 키 | 용도 | 정리 시점 |
|----|------|-----------|
| `auth.accessToken` | API 인증 토큰 | 로그아웃, 재발급 실패, 복구 실패 |
| `auth.refreshToken` | 재발급 토큰 | 로그아웃, 재발급 실패, 복구 실패 |
| `auth.userId` | 사용자 식별자 | 로그아웃, 복구 실패 |
| `auth.userName` | 사용자 표시 이름 | 로그아웃, 복구 실패 |
| `auth.redirectPath` | 보호 경로 복귀 정보 | 복귀 직후 |
| `auth.signupEmail` | 가입/재발송 이메일 | 인증 완료, 명시적 초기화 |
| `savedEmail` | 로그인 아이디 저장 | 사용자가 체크 해제할 때 |

`appLanguage` 등 인증 외 키는 인증 정리 과정에서 건드리지 않는다.
