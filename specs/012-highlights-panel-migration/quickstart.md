# Quickstart: HighlightsPanel 마이그레이션

**Feature**: 012-highlights-panel-migration
**Date**: 2026-04-15

## 사전 준비

```bash
cd migration
bun add recharts
```

## 구현 순서

### 1단계: 공유 유틸리티 생성

```
migration/src/shared/lib/get-color.ts        — CSS 변수 읽기 유틸리티
migration/src/shared/hooks/use-theme-applied.ts — 테마 변경 감지 훅
```

### 2단계: 타입 및 훅 생성

```
migration/src/features/main-panels/ui/HighlightsPanel/
├── data.ts                                    — HighlightDatum 타입
└── hooks/useHighlightsChart.ts                — 차트 설정 훅
```

### 3단계: 컴포넌트 교체

```
migration/src/features/main-panels/ui/HighlightsPanel.tsx  — Recharts 기반으로 전면 교체
```

## 검증 방법

1. `bun run typecheck` — 타입 에러 없어야 함
2. `bun run lint` — 린트 에러 없어야 함
3. `bun run dev` — 실행 후 메인 페이지에서:
   - 하이라이트 패널 렌더링 확인
   - 주간/월간 토글 전환 확인
   - 다크/라이트 테마 전환 시 색상 변경 확인
   - 레거시와 나란히 비교하여 시각적 동일성 확인

## 레거시 참조

| 마이그레이션 대상 | 레거시 원본 |
|-------------------|-------------|
| HighlightsPanel.tsx | `src/renderer/src/features/dashboard/ui/HighlightsPanel.tsx` |
| data.ts | `src/renderer/src/features/dashboard/ui/HighlightsPanel/data.ts` |
| useHighlightsChart.ts | `src/renderer/src/features/dashboard/ui/HighlightsPanel/hooks/useHighlightsChart.ts` |

## 주의사항

- UI 스타일 절대 변경 금지 (Constitution #2)
- `recharts`는 레거시와 동일한 버전 사용 권장
- `getColor` 유틸리티는 Recharts SVG에만 사용 (Tailwind로 해결 가능한 곳은 Tailwind 사용)
