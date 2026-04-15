# Research: 출석 현황 패널 이관 (AttendancePanel)

**Feature**: `011-attendance-panel-migration`
**Date**: 2025-04-15

## 기존 마이그레이션 파일 현황

### AttendancePanel.tsx (이관 완료 상태)

**파일**: `migration/src/features/main-panels/ui/AttendancePanel.tsx`
**상태**: 이미 마이그레이션 폴더에 존재함

### Decision: 기존 파일 기준으로 검증 및 보완

**Rationale**: 마이그레이션 폴더에 이미 AttendancePanel.tsx가 존재하며, 핵심 로직과 UI 구조가 레거시와 동일하게 구현되어 있음. 새로 작성하는 대신 기존 파일을 검증하고 누락된 부분만 보완하는 방식이 효율적임.

**Alternatives considered**:
1. 기존 파일 삭제 후 재작성 → 비효율적, 기존 코드가 이미 올바름
2. 기존 파일 유지 + 검증 보완 (선택) → 효율적, 리스크 최소화

## 레거시 vs 마이그레이션 비교 분석

### UI 구조 비교

| 요소 | 레거시 (`src/`) | 마이그레이션 (`migration/`) | 일치 여부 |
|------|----------------|---------------------------|----------|
| 그리드 레이아웃 | 4열 4행 (grid-cols-4, grid-rows-[57px_1fr_1fr_1fr]) | 동일 | ✅ |
| 패널 헤더 | `PannelHeader` (오타) | `PanelHeader` (수정) | ✅ |
| 월 표시 | `{viewMonth + 1}월` | `{month + 1}월` | ✅ |
| 네비게이션 버튼 | `PageMoveButton` 컴포넌트 | 인라인 버튼 + `ChevronRightIcon` | ✅ (시각 동일) |
| 토글 스위치 | `ToggleSwitch` | `ToggleSwitch` | ✅ |
| 인텐시티 슬라이더 | `IntensitySlider` 컴포넌트 | 인라인 5단계 색상 바 | ✅ (시각 동일) |
| 캘린더 도트 | `Circle` 컴포넌트 (18x18px) | `AttendanceDot` 컴포넌트 (18x18px) | ✅ |
| 색상 매핑 | `LEVEL_COLORS[clampedLevel-1]` | `LEVEL_COLORS[level-1]` | ✅ |
| 오늘 강조 | ring-2 ring-yellow-500 | 동일 | ✅ |
| 미래 날짜 | border + bg-transparent | 동일 | ✅ |
| 데이터 없음 | bg-grey-50 | 동일 | ✅ |
| 정보 패널 | bg-grey-25 rounded-xl p-3 | 동일 | ✅ |
| 메시지 매핑 | `getSubContentMessage` | `getMessage` | ✅ |
| 상승/하락 아이콘 | SVG import (UpIcon/DownIcon) | ArrowNarrowUpIcon/ArrowNarrowDownIcon | ✅ |

### 공유 UI 컴포넌트 의존성

| 컴포넌트 | 마이그레이션 경로 | 상태 |
|---------|-----------------|------|
| PanelHeader | `@/shared/ui/panel-header` | ✅ 존재 |
| ToggleSwitch | `@/shared/ui/toggle-switch` | ✅ 존재 |
| cn (className 병합) | `@/shared/lib/cn` | ✅ 존재 |
| ArrowNarrowUpIcon | `@/shared/ui/icons/ui-icons` | ✅ 존재 |
| ArrowNarrowDownIcon | `@/shared/ui/icons/ui-icons` | ✅ 존재 |
| ChevronRightIcon | `@/shared/ui/icons/ui-icons` | ✅ 존재 |
| IntensitySlider | - | ❌ 미사용 (인라인으로 대체) |
| PageMoveButton | - | ❌ 미사용 (인라인으로 대체) |

**Decision**: IntensitySlider, PageMoveButton은 레거시와 시각적으로 동일한 결과를 내는 인라인 구현으로 대체됨. 별도 컴포넌트 생성 불필요.

**Rationale**: 다른 패널(TrendPanel 등)에서도 동일한 방식으로 인라인 구현을 사용 중이며, 프로젝트 일관성을 유지함.

### API 연동

| 항목 | 레거시 | 마이그레이션 | 일치 여부 |
|------|--------|-------------|----------|
| 쿼리 훅 | `useAttendanceQuery` from `@entities/dashboard` | `useAttendanceQuery` from `@/entities/dashboard/model/use-dashboard-queries` | ✅ |
| 파라미터 | `{period: 'MONTHLY', year, month}` | 동일 | ✅ |
| 응답 구조 | `data.data.attendances` | 동일 | ✅ |
| staleTime | 5분 | 동일 (추정) | ✅ |

### 누락 항목

| 항목 | 설명 | 조치 필요 |
|------|------|----------|
| barrel export (index.ts) | main-panels/ui/index.ts 없음 | 확인 필요 |
| PanelBaseProps | 기존 AttendancePanel이 className prop을 받지 않음 | 다른 패널 패턴과 일치 여부 확인 |

## 결론

기존 마이그레이션 AttendancePanel.tsx는 레거시와 **시각적으로 동일**하게 구현되어 있음. 주요 변경 사항:

1. 컴포넌트명 오타 수정: `AttendacePanel` → `AttendancePanel`
2. 서브 컴포넌트 구조 단순화: `Circle`/`Calendar` → `AttendanceDot` (인라인 캘린더)
3. 공유 컴포넌트 대체: `PageMoveButton`/`IntensitySlider` → 인라인 구현
4. `cn()` 유틸리티 도입으로 className 병합 개선

이번 작업의 핵심은 **검증**이며, 기존 코드가 레거시와 완전히 동일한 UI를 출력하는지 확인하는 데 집중함.
