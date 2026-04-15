# 프로젝트 설명
- src에는 url 웹뷰 일렉트론 앱이 존재.
- migration 폴더에는 tauri + react로 Native UI 앱으로 만들 예정
- 이 프로젝트의 목적은 웹뷰 일렉트론 앱을 Native UI 타우리 앱으로 마이그레이션 하는 것

# Do
- src 레거시 폴더에 개선 사항이 있으면 물어보고 반영하여 tauri로 옮길 것
- 모든 문서는 한글로 작성한다.

# Don't
- UI 스타일을 절대 바꾸지 않을 것

## Active Technologies
- TypeScript 5.8, React 19, Rust 2021(Tauri 런타임) + React Router 7, Zustand 5, TanStack Query 5, i18next 26, Tauri 2 플러그인 (003-auth-domain-implementation)
- 브라우저 `localStorage` 기반 클라이언트 저장소, 백엔드 인증 API, Tauri deep-link 진입 정보 (003-auth-domain-implementation)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7.14, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0 (008-character-panel-migration)
- N/A (정적 UI 패널, 신규 저장 없음) (008-character-panel-migration)
- TypeScript 5.8, React 19.1, Rust 2021 (Tauri 런타임) + React Router DOM 7.14, TanStack Query 5, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0 (010-average-posture-panel)
- N/A (조회형 UI 패널, 신규 저장 없음) (010-average-posture-panel)
- TypeScript 5.8, React 19.1, Rust 2021(Tauri 런타임) + React Router DOM 7.14, TanStack Query 5, Recharts 3.8.1, Tailwind CSS 4.2.2, clsx 2.1.1, tailwind-merge 3.3.0 (014-average-graph-panel)

## Recent Changes
- 003-auth-domain-implementation: Added TypeScript 5.8, React 19, Rust 2021(Tauri 런타임) + React Router 7, Zustand 5, TanStack Query 5, i18next 26, Tauri 2 플러그인
