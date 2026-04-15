# Research: PosePatternPanel 정적 패널 이관

**Feature**: 013-pose-pattern-panel-migration
**Date**: 2026-04-15

## R1: 레거시 vs 마이그레이션 스타일 차이 분석

### Decision: 아이콘 래퍼 스타일 불일치 식별 및 해결 방안 확정

**레거시 PatternHeader (src/):**
```jsx
<span className="bg-grey-50 inline-flex items-center justify-center rounded-full"
      style={{ width: 20, height: 20 }}>
  <IconComp className="text-grey-200 [&_*]:fill-none [&_line]:stroke-current"
            style={{ width: 20, height: 20 }} />
</span>
```
- 아이콘을 `bg-grey-50 rounded-full` 배경의 span으로 감싸서 원형 배경 생성
- 아이콘 자체에는 배경 원이 없고, `[&_*]:fill-none [&_line]:stroke-current`로 fill 제거

**마이그레이션 PatternCard (migration/):**
```jsx
<ClockIcon className="text-grey-200 h-5 w-5" />
```
- 아이콘을 직접 사용, 래퍼 없음
- 단, 마이그레이션 아이콘 SVG 자체에 `fill="#EFEEED"` 원형 배경이 내장됨

**차이점:**

| 항목 | 레거시 | 마이그레이션 | 일치 여부 |
|------|--------|-------------|-----------|
| 아이콘 배경 | CSS `bg-grey-50` (#F5F4F3) | SVG `fill="#EFEEED"` | 거의 동일 (HEX 차이 미미) |
| 아이콘 크기 | 20x20 (style) | 20x20 (h-5 w-5) | 동일 |
| 원형 모양 | CSS `rounded-full` | SVG path로 그린 원 | 시각적으로 동일 |
| 아이콘 색상 | `text-grey-200` stroke | `text-grey-200` stroke | 동일 |
| 래퍼 유무 | span 래퍼 존재 | 래퍼 없음 (SVG 내장) | 시각 결과 동일 |

**Rationale**: 마이그레이션 아이콘(ClockIcon, CalendarIcon, HourglassIcon, ThumbupIcon)은 이미 SVG 내부에 `fill="#EFEEED"` 원형 배경을 포함하고 있으므로, 레거시의 `bg-grey-50 rounded-full` 래퍼를 추가로 적용하면 이중 배경이 되어 시각적 불일치가 발생함. 따라서 현재 마이그레이션 방식(아이콘 직접 사용)이 올바름.

**Alternatives considered:**
1. 레거시와 동일하게 span 래퍼 추가 → 기각 (이중 배경 문제)
2. SVG에서 fill 원 제거 후 CSS 래퍼 추가 → 기각 (공유 아이콘이므로 다른 패널에 영향)
3. 현재 방식 유지 (SVG 내장 원 + 직접 사용) → 채택 (시각적으로 동일)

### Decision: 패널 루트 요소 및 Props 패턴

**레거시:** `<div>` 사용, Props 없음 (고정 크기)
**마이그레이션:** `<section>` 사용, Props 없음

**분석:**
- AveragePosturePanel, AttendancePanel도 `<section>` 사용 중
- CharacterPanel, TrendPanel, HighlightsPanel은 `<div>` 사용
- 혼용 상태이므로 `<section>` 유지해도 무방
- 단, 다른 패널들이 `PanelBaseProps`를 점진적으로 도입하는 추세이므로 추가 권장

**Rationale**: 시맨틱 HTML 측면에서 `<section>`이 더 적절하며, 기존 AveragePosturePanel, AttendancePanel과 일치함. `PanelBaseProps`는 향후 레이아웃 유연성을 위해 추가.

**Alternatives considered:**
1. `<div>`로 변경하여 레거시와 완전 일치 → 기각 (시맨틱 HTML 개선, 시각 차이 없음)
2. `<section>` 유지 → 채택

### Decision: cn() 유틸리티 사용

**레거시:** className 문자열 결합 (템플릿 리터럴)
**마이그레이션:** 현재 cn() 미사용

**Rationale**: 다른 마이그레이션된 패널들(CharacterPanel, TrendPanel, AveragePosturePanel, AttendancePanel)이 모두 `cn()`을 사용하므로 일관성을 위해 도입.

**Alternatives considered:**
1. cn() 미사용 유지 → 기각 (다른 패널과 일관성 부족)
2. cn() 도입 → 채택

## R2: 검증 방안

### Decision: 렌더링 비교 검증으로 충분

**Rationale**: 정적 UI 패널로 비즈니스 로직이 단순함(포맷 변환 2개, null 병합 4개). 시각적 비교 검증이 가장 효과적이며, constitution 5원칙에 따라 리스크가 낮은 변경에는 테스트를 강제하지 않음.

**Alternatives considered:**
1. 단위 테스트 작성 → 기각 (정적 UI, 리스크 낮음)
2. 시각적 비교만 → 채택

## R3: 최종 수정 사항 정리

레거시와 마이그레이션 비교 결과, 다음 수정이 필요함:

1. **PanelBaseProps + cn() 도입**: 다른 마이그레이션 패널과 일관성 확보
2. **아이콘 스타일 확인**: 현재 마이그레이션 아이콘에 이미 배경 원이 내장되어 있으므로 레거시와 시각적으로 동일함. 추가 래퍼 불필요
3. **레이아웃/간격/색상**: 이미 Tailwind 클래스가 레거시와 동일하게 적용되어 있어 수정 불필요
4. **TIP 영역 ChevronRightIcon 스타일**: 레거시는 `className="stroke-current"` 사용, 마이그레이션은 `className="h-4 w-4"` 사용. stroke-current는 SVG에서 current color를 사용하도록 하는 것인데, 마이그레이션 아이콘은 이미 `stroke="currentColor"`를 사용하고 있어 동일함
