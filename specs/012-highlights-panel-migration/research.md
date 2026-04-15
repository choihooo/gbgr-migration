# Research: HighlightsPanel 마이그레이션

**Feature**: 012-highlights-panel-migration
**Date**: 2026-04-15

## 1. 레거시 분석 요약

### 소스 파일
| 파일 | 경로 |
|------|------|
| 컴포넌트 | `src/renderer/src/features/dashboard/ui/HighlightsPanel.tsx` |
| 데이터/타입 | `src/renderer/src/features/dashboard/ui/HighlightsPanel/data.ts` |
| 차트 훅 | `src/renderer/src/features/dashboard/ui/HighlightsPanel/hooks/useHighlightsChart.ts` |
| API 훅 | `src/renderer/src/entities/dashboard/api/use-highlight-query.ts` |
| 타입 정의 | `src/renderer/src/entities/dashboard/types/index.ts` |

### 핵심 구조
- 단일 컴포넌트(`HighlightsPanel`) — props 없음, 내부 상태로 주간/월간 관리
- `useHighlightsChart` 훅에서 API 호출 + 차트 설정 계산 통합 처리
- Recharts(BarChart, Bar, Cell, LabelList, ResponsiveContainer) 사용
- `getColor` 유틸리티로 CSS 변수에서 색상 추출 (테마 대응)
- `useThemeApplied` 훅으로 다크모드 변경 감지 → 색상 재계산

### API 스펙
- 엔드포인트: `GET /dashboard/highlight?period=WEEKLY|MONTHLY&year=YYYY&month=MM`
- 응답: `{ success, data: { current: number, previous: number } }`
- TanStack Query: staleTime 5분, retry 1회

## 2. 마이그레이션 프로젝트 현황

### 이미 존재하는 것
| 항목 | 상태 | 위치 |
|------|------|------|
| `useHighlightQuery` 훅 | ✅ 존재 | `migration/src/entities/dashboard/model/use-dashboard-queries.ts` |
| `getHighlight` API 함수 | ✅ 존재 | `migration/src/entities/dashboard/api/dashboard-api.ts` |
| `HighlightQueryParams`, `HighlightData`, `HighlightResponse` 타입 | ✅ 존재 | `migration/src/entities/dashboard/types/index.ts` |
| `PanelHeader` 컴포넌트 | ✅ 존재 | `migration/src/shared/ui/panel-header/index.tsx` |
| `ToggleSwitch` 컴포넌트 | ✅ 존재 | `migration/src/shared/ui/toggle-switch/index.tsx` |
| `HighlightsPanel` 플레이스홀더 | ✅ 존재 | `migration/src/features/main-panels/ui/HighlightsPanel.tsx` |
| CSS 색상 변수 (light/dark) | ✅ 존재 | `migration/src/shared/styles/colors.css` |
| `useThemeStore` (Zustand) | ✅ 존재 | `migration/src/entities/theme/model/use-theme-store.ts` |
| `Period` 타입 | ✅ 존재 | `migration/src/features/main-panels/model/types.ts` |

### 신규 생성 필요
| 항목 | 이유 |
|------|------|
| `recharts` 패키지 | 플레이스홀더는 div 기반 → Recharts 교체 필요 |
| `getColor` 유틸리티 | Recharts SVG 요소는 Tailwind 클래스 미지원 → CSS 변수 직접 읽기 필요 |
| `useThemeApplied` 훅 | `useThemeStore.isDark` 감지하여 차트 색상 재계산 트리거 |
| `HighlightDatum` 타입 | 차트 데이터 형식 타입 |
| `useHighlightsChart` 훅 | API 호출 + 차트 설정 계산 통합 훅 |

## 3. 결정 사항

### Decision: Recharts 사용 (레거시 동일)
- **Rationale**: UI 충실도 보존 원칙(Constitution #2). 레거시와 동일한 차트 라이브러리 사용으로 시각적 차이 최소화.
- **Alternatives considered**: D3.js 직접 구현 (구현 비용 높음, UI 차이 발생 위험), div 기반 차트 유지 (레거시와 다른 렌더링).

### Decision: getColor 유틸리티 신규 생성
- **Rationale**: Recharts SVG 요소는 Tailwind 클래스를 사용할 수 없어 CSS 변수에서 직접 색상 값을 읽어야 함. 레거시와 동일한 방식.
- **Alternatives considered**: 하드코딩 (테마 전환 불가), CSS-in-JS (불필요한 의존성 추가).

### Decision: useThemeApplied 훅 신규 생성
- **Rationale**: 기존 `useThemeStore`의 `isDark` 상태를 Recharts 색상 재계산 트리거로 연결. 레거시 `useThemeApplied`와 동일 역할.
- **Alternatives considered**: 컴포넌트 내 직접 useThemeStore 호출 (훅 분리 원칙 위반), 없이 구현 (테마 전환 시 차트 색상 갱신 안 됨).

### Decision: HighlightsPanel 플레이스홀더 완전 교체
- **Rationale**: 기존 플레이스홀더는 div 기반 가짜 차트. 레거시와 동일한 Recharts 구조로 전면 교체.
- **Alternatives considered**: 기존 코드에 Recharts 추가 (구조가 완전히 달라 교체가 효율적).
