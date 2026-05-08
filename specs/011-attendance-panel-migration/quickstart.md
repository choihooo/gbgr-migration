# Quickstart: 출석 현황 패널 이관

**Feature**: `011-attendance-panel-migration`
**Date**: 2025-04-15

## 개요

레거시 `AttendacePanel` 컴포넌트를 Tauri 마이그레이션 프로젝트로 이관.
마이그레이션 폴더에 이미 구현체가 존재하므로, 검증 및 보완 작업이 중심.

## 주요 파일

### 레거시 (참조용, 수정 금지)
```
src/renderer/src/features/dashboard/ui/AttendacePanel.tsx          ← 원본 컴포넌트
src/renderer/src/entities/dashboard/types/index.ts                 ← 타입 정의
src/renderer/src/entities/dashboard/api/use-attendance-query.ts    ← API 쿼리 훅
```

### 마이그레이션 (작업 대상)
```
migration/src/features/main-panels/ui/AttendancePanel.tsx          ← 이관 컴포넌트
migration/src/entities/dashboard/model/use-dashboard-queries.ts    ← 쿼리 훅
migration/src/shared/ui/panel-header/index.tsx                     ← PanelHeader
migration/src/shared/ui/toggle-switch/index.tsx                    ← ToggleSwitch
migration/src/shared/ui/icons/ui-icons.tsx                         ← 아이콘
```

## 작업 단계

### 1. 기존 코드 검증
- 마이그레이션 AttendancePanel이 레거시와 시각적으로 동일한지 확인
- 색상, 간격, 폰트 크기, 레이아웃이 일치하는지 비교

### 2. 보완 (필요 시)
- barrel export 누락 시 추가
- PanelBaseProps 적용 필요 시 반영

### 3. 빌드 검증
- `pnpm run lint:check && pnpm run typecheck` (lint + typecheck) 통과 확인
- `bun run build` 성공 확인

## 실행 방법

```bash
# 개발 서버 실행
cd migration && bun run dev

# 린트/타입체크
pnpm run lint:check && pnpm run typecheck

# 빌드
bun run build
```

## 검증 체크리스트

- [ ] 캘린더 7열 그리드 표시 (일~토)
- [ ] 일요일 빨간색 표시
- [ ] 5단계 노란색 도트 표시
- [ ] 오늘 날짜 노란색 링 강조
- [ ] 미래 날짜 테두리만 표시
- [ ] 데이터 없는 날 회색 원
- [ ] 월 네비게이션 동작 (이전/다음)
- [ ] 현재 월에서 다음 버튼 비활성화
- [ ] 토글 스위치 표시
- [ ] 인텐시티 범례 표시
- [ ] 동기부여 메시지 표시 (5개 키워드 매핑)
- [ ] 기본 메시지 폴백
