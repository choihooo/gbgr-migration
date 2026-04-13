# OS 부팅 시 앱 자동 실행 구현 계획

- 작성일: 2026-03-19
- 작업 브랜치: `feat/auto-launch-on-startup`
- 대상 앱: Electron 기반 데스크톱 앱 (`src/main`, `src/preload`, `src/renderer`)

## 1) 목표

macOS/Windows에서 OS 로그인(부팅 후 사용자 세션 시작) 시 앱이 자동 실행되도록 설정하고, 사용자가 앱 설정 화면에서 해당 기능을 켜고 끌 수 있도록 한다.

## 2) 범위

- 포함
  - Main Process에 자동 실행 상태 조회/설정 로직 추가
  - IPC 채널 추가 (`startup:get`, `startup:set`)
  - Preload API 노출 (`window.electronAPI.startup`)
  - Settings UI에 토글 추가
  - 동작 검증(플랫폼별 기본 시나리오)
- 제외
  - Linux 데스크톱 환경별 자동 시작 스크립트/서비스 대응
  - 설치 프로그램(인스톨러) 단계의 별도 자동 시작 옵션 UI 추가

## 3) 구현 설계

### A. Main Process

- 파일: `src/main/src/index.ts`
- 작업
  - `app.getLoginItemSettings()` 기반 현재 상태 조회 핸들러 구현
  - `app.setLoginItemSettings({ openAtLogin: boolean })` 기반 상태 변경 핸들러 구현
  - 플랫폼 분기 처리
    - `win32`, `darwin`: 기능 활성
    - 그 외: 미지원 응답 반환
- IPC 예시 응답 형태
  - `startup:get` → `{ success: true, enabled: boolean, supported: boolean }`
  - `startup:set` → `{ success: true, enabled: boolean, supported: boolean }`

### B. Preload Bridge

- 파일: `src/preload/src/index.ts`
- 작업
  - `ElectronAPI` 타입에 `startup` 네임스페이스 추가
  - `startup.get()` / `startup.set(enabled)`를 IPC invoke로 연결

### C. Renderer Settings

- 파일: `src/renderer/src/features/dashboard/ui/SettingsModal.tsx`
- 작업
  - “OS 시작 시 자동 실행” 항목 추가
  - 모달 진입 시 현재 상태 조회
  - 토글 변경 시 즉시 `startup.set()` 호출
  - 실패 시 사용자 피드백(알림/메시지)
  - 미지원 플랫폼에서는 비활성 또는 안내 문구 표시

## 4) 데이터/상태 정책

- 자동 실행 상태의 소스 오브 트루스는 OS 로그인 아이템 설정값으로 간주한다.
- 앱 내부 로컬스토리지에 별도 캐시를 두지 않고, UI 오픈 시점에 실제 상태를 조회한다.

## 5) 테스트 체크리스트

1. 앱 실행 후 설정에서 토글 ON → 앱 재실행 후 상태 유지 확인
2. 토글 OFF → 앱 재실행 후 상태 해제 확인
3. macOS/Windows에서 실제 로그인 재시작 후 자동 실행 여부 확인
4. 미지원 플랫폼에서 UI/응답이 안전하게 처리되는지 확인
5. 기존 기능(로그아웃/회원탈퇴/캘리브레이션 재설정) 회귀 확인

## 6) 리스크 및 대응

- 리스크: 개발 환경 실행(`pnpm dev`)과 패키징 앱 실행의 동작 차이
  - 대응: 패키징 빌드 기준으로 최종 검증 수행
- 리스크: 플랫폼별 `LoginItemSettings` 동작 차이
  - 대응: 플랫폼 분기와 `supported` 플래그를 명시적으로 반환
- 리스크: IPC 실패 시 사용자 혼란
  - 대응: UI에서 실패 메시지와 현재 상태 재동기화 처리

## 7) 완료 기준(Definition of Done)

1. 설정 화면에서 자동 실행 토글이 노출되고 정상 작동한다.
2. Main/Preload/Renderer 경로가 타입 에러 없이 빌드된다.
3. macOS/Windows에서 기본 시나리오 수동 검증을 통과한다.
4. 문서와 코드가 동일한 동작 기준을 설명한다.
