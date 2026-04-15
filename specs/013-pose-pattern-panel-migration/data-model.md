# Data Model: PosePatternPanel 정적 패널 이관

**Feature**: 013-pose-pattern-panel-migration
**Date**: 2026-04-15

## Entities

### PosePatternData

자세 패턴 분석 API 응답 데이터. 기존 `usePosturePatternQuery` 훅에서 반환되는 구조.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| worstTime | string | No | "14:00:00" (→ "오후 2시") | 자세가 가장 안좋은 시간 (HH:MM:SS 형식) |
| worstDay | string | No | "WEDNESDAY" (→ "수요일") | 자세가 가장 안좋은 요일 (영어 대문자) |
| recovery | number | No | 18 | 자세 회복까지 평균 소요 시간 (분) |
| stretching | string | No | "목돌리기" | 추천 스트레칭 이름 |

**Validation Rules:**
- worstTime: "HH:MM:SS" 형식이어야 함 (null/undefined 시 기본값 사용)
- worstDay: 영어 요일 대문자 (MONDAY~SUNDAY) (알 수 없는 값은 그대로 표시)
- recovery: 음수 불가 (0은 "0분"으로 표시)
- stretching: 빈 문자열 시 기본값 "목돌리기" 사용

**State Transitions:** 없음 (조회 전용)

### PatternCard

UI 렌더링용 내부 컴포넌트 데이터. PosePatternData에서 변환된 값을 사용.

| Field | Type | Description |
|-------|------|-------------|
| icon | ReactNode | 아이콘 컴포넌트 (ClockIcon, CalendarIcon, HourglassIcon, ThumbupIcon) |
| title | string | 카드 제목 |
| value | string | 표시할 값 (포맷 적용됨) |

## Relationships

```
usePosturePatternQuery() → PosePatternData
                              ↓ (formatTime, formatDay 변환)
                         PatternCard[] (4개)
                              ↓ (렌더링)
                         2x2 Grid UI
```

## Notes

- API 응답 래핑: `data?.data.worstTime` 구조 (TanStack Query → API response wrapper)
- 모든 필드가 독립적으로 null-safe 처리됨 (부분 데이터 허용)
- 새로운 저장소나 상태 관리 불필요 (조회 전용 패널)
