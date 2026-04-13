# Research: Migration 폴더 기본 구조 구성

**Feature Branch**: `001-migration-scaffold`
**Date**: 2026-04-13

---

## 1. Tauri 2 프로젝트 초기화

### Decision

`bunx create-tauri-app` 사용. 프롬프트에서 React + TypeScript + Bun 선택.

| 프롬프트 | 선택값 |
|----------|--------|
| Project name | `gbgr-app` |
| Identifier | `com.gbgr.app` |
| Frontend language | TypeScript / JavaScript |
| Package manager | Bun |
| UI template | React |
| UI flavor | TypeScript |

### Rationale

- `create-tauri-app`이 Bun을 퍼스트클래스 옵션으로 지원
- React + TypeScript 선택 시 Vite 기반 프로젝트 자동 스캐폴딩
- 수동 설정 대비 설정 오류 최소화

### Alternatives

- 수동: `bun create vite` → `bun add -D @tauri-apps/cli` → `bunx tauri init`
  (frontend dir, dev command 등 수동 입력 필요)

---

## 2. Tauri 2 기본 프로젝트 구조

### Decision

```
migration/
├── src/                    # React 프론트엔드
│   ├── App.tsx
│   ├── main.tsx
│   └── style.css
├── src-tauri/              # Tauri 백엔드 (Rust)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   └── icons/
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

이후 FSD 구조로 `src/` 하위를 재구성한다.

### Rationale

- `src/`는 프론트엔드, `src-tauri/`는 Rust 백엔드
- `src-tauri/capabilities/`는 Tauri 2의 새 권한 시스템
- Electron의 main/preload/renderer → Tauri의 src-tauri/src

---

## 3. Bun 패키지 매니저

### Decision

`create-tauri-app`에서 Bun 선택 시 자동 구성.
scripts는 `bun run` 기준으로 생성됨.

### Rationale

- 설치 속도 pnpm 대비 2~10배 빠름
- `bun.lock`으로 의존성 관리
- Tauri CLI는 `bun run tauri`로 실행 가능

---

## 4. Biome 설정

### Decision

```bash
bun add -D -E @biomejs/biome
bunx --bun @biomejs/biome init
```

기존 프로젝트의 `biome.json` 설정을 참고하여 동일한 규칙 적용.

### Rationale

- 레거시와 동일한 린트/포맷 규칙 유지
- Rust 기반으로 ESLint + Prettier 대비 10~100배 빠름
- `bunx --bun`으로 Bun 런타임 사용

---

## 5. Tailwind CSS v4 + Vite

### Decision

```bash
bun add -D tailwindcss @tailwindcss/vite
```

CSS-first 설정. `postcss.config.js` 불필요.
`@import 'tailwindcss'` 한 줄로 모든 유틸리티 활성화.
`@theme` 디렉티브로 레거시 디자인 토큰 정의.

### Rationale

- Tailwind v4는 PostCSS 설정 불필요, `@tailwindcss/vite` 플러그인이 처리
- 레거시의 `@theme` 기반 CSS 토큰 구조와 자연스럽게 호환
- `vite.config.ts`에서 `port: 1420`은 Tauri 개발 서버 기본 포트

---

## 6. 핵심 Tauri 2 의존성

### Decision

**필수**:
- `@tauri-apps/api` (프론트엔드 API)
- `@tauri-apps/cli` (devDependencies)

**초기 스캐폴드에서는 최소 설치, 이후 기능 포팅 시 플러그인 추가**:
- http, fs, notification, global-shortcut, autostart,
  window-state, log, updater, process, store 등

### Rationale

- 점진적 마이그레이션 원칙에 따라 필요한 플러그인만 설치
- 플러그인은 프론트엔드 패키지 + Rust 의존성 + lib.rs 등록 3곳에 추가 필요

---

## 7. Tauri 2 Capabilities

### Decision

기본 `core:default` + `shell:allow-open`으로 시작.
이후 기능 포팅 시 필요 권한을 점진적으로 추가.

### Rationale

- Tauri 2는 deny-all 기본 정책으로 최소 권한 원칙 자동 적용
- 헌법 원칙 3(Tauri 아키텍처 준수)의 보안 요구사항 충족

---

## Electron → Tauri 매핑 요약

| Electron | Tauri 2 |
|----------|---------|
| ipcMain/ipcRenderer | `#[tauri::command]` + `invoke()` |
| contextBridge | capabilities (자동) |
| BrowserWindow | WebviewWindow |
| Notification | tauri-plugin-notification |
| autoUpdater | tauri-plugin-updater |
| localStorage (동기화) | tauri-plugin-store 또는 이벤트 시스템 |
| MediaPipe (카메라) | WebView에서 직접 실행 (변경 없음) |
| Zustand / TanStack Query | 그대로 사용 |
