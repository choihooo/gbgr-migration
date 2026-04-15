@AGENTS.md

## Active Technologies
- TypeScript 5.x, Rust (latest stable via rustup) + Tauri 2, React 19, Vite 6, Tailwind CSS v4, Biome (001-migration-scaffold)
- N/A (이 스펙은 구조 설정만 다룸) (001-migration-scaffold)
- TypeScript 5.x + React 19, React Router DOM 7, @tauri-apps/api, @tauri-apps/plugin-deep-link (002-routing-setup)
- localStorage (accessToken, refreshToken) (002-routing-setup)
- TypeScript 5.8, React 19.1 + Tailwind CSS 4.2.2, clsx + tailwind-merge (신규 추가), Vitest 4.1.4 (004-shared-ui-components)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7, Zustand 5, TanStack Query 5, Tailwind CSS 4.2.2, clsx + tailwind-merge (005-app-layout-settings)
- Zustand persist (sessionStorage for notification settings, localStorage for theme) (005-app-layout-settings)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7, Zustand 5, TanStack Query 5, Tailwind CSS 4.2.2, clsx + tailwind-merge, i18next 26, @tauri-apps/api 2 (006-main-page-migration)
- localStorage (accessToken, refreshToken, theme), sessionStorage (notification settings) (006-main-page-migration)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7, Zustand 5, TanStack Query 5, i18next 26, Tailwind CSS 4.2.2, clsx + tailwind-merge, react-webcam (신규 추가 필요) (007-onboarding-calibration)
- localStorage (accessToken, refreshToken, calibration_gate_v1, calibration_result_v1, userId, sessionStartDistance, preferredCameraDeviceId, GA 관련 키) (007-onboarding-calibration)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7.14, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0 (009-trend-panel-migration)
- N/A (정적 UI 패널, 신규 저장 없음) (009-trend-panel-migration)

## Recent Changes
- 001-migration-scaffold: Added TypeScript 5.x, Rust (latest stable via rustup) + Tauri 2, React 19, Vite 6, Tailwind CSS v4, Biome
