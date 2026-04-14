# Quickstart: 메인 페이지 이관

**Feature**: 006-main-page-migration
**Date**: 2026-04-14

## 사전 조건

- Node.js (bun 사용)
- Rust (latest stable via rustup)
- Tauri CLI
- 이전 스펙(001~005) 완료 상태

## 실행 방법

```bash
# 마이그레이션 앱 디렉토리로 이동
cd migration

# 의존성 설치
bun install

# 개발 서버 시작
bun run tauri dev
```

## 주요 파일 진입점

| 용도 | 파일 경로 |
|------|-----------|
| 메인 페이지 | `src/pages/main-page/index.tsx` |
| 대시보드 페이지 | `src/pages/dashboard-page/index.tsx` |
| 대시보드 레이아웃 | `src/features/dashboard/ui/MainContent.tsx` |
| 좌측 패널 영역 | `src/features/dashboard/ui/LeftPanelArea.tsx` |
| 우측 패널 영역 | `src/features/dashboard/ui/RightPanelArea.tsx` |
| 패널 컴포넌트 | `src/features/main-panels/ui/*.tsx` |
| 카메라 스토어 | `src/features/main-panels/model/use-camera-store.ts` |
| 대시보드 헤더 | `src/features/layout/ui/DashboardHeader.tsx` |
| 알림 모달 | `src/features/notification-settings/ui/NotificationModal.tsx` |
| 커스텀 스크롤바 | `src/shared/styles/scrollbar.css` |

## 검증 방법

### 1. 레이아웃 검증
- `bun run tauri dev` 실행 후 로그인
- `/main` 진입 시 2열 그리드 레이아웃 확인
- 좌/우 영역 독립 스크롤 동작 확인

### 2. 패널 구성 검증
- 8개 패널이 레거시와 동일한 순서로 배치되었는지 확인
- 각 패널의 카드 외형(둥근 모서리, 배경색, 간격) 일치 확인

### 3. 상호작용 검증
- 알림 버튼 클릭 → 알림 설정 모달 열림/닫힘
- 웹캠 토글 → 카메라 상태 변화

### 4. 시각 비교
- 레거시 앱과 마이그레이션 앱을 나란히 실행하여 비교
- 패널 배치 순서, 그룹 구조, 간격, 색상 일치 확인

## 빌드 검증

```bash
# 타입 체크
bun run typecheck

# 린트
bun run lint

# 빌드
bun run build
```
