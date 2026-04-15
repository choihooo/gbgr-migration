# Data Model: 출석 현황 패널 이관

**Feature**: `011-attendance-panel-migration`
**Date**: 2025-04-15

## Entities

### AttendanceRecord (출석 기록)

서버에서 제공되는 월간 출석 데이터. 날짜별 사용 시간(분)을 포함.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| attendances | `Record<string, number>` | 날짜(YYYY-MM-DD) → 사용 시간(분) 매핑 | 키는 YYYY-MM-DD 형식, 값은 0 이상의 정수 |
| title | `string` | 동기부여 제목 텍스트 | 비어있을 경우 기본값 "잘하고 있어요!" |
| content1 | `string` | 상승 지표 메시지 (긍정) | optional, 비어있으면 표시하지 않음 |
| content2 | `string` | 하락 지표 메시지 (부정) | optional, 비어있으면 표시하지 않음 |
| subContent | `string` | 캐릭터 기반 비유 메시지 키워드 | 5개 키워드 중 하나 또는 임의 문자열 |

### AttendanceLevel (도트 색상 레벨)

사용 시간(분)을 시간으로 변환 후 1~5 레벨로 매핑. 캘린더 도트 색상 결정에 사용.

| Level | Hours Range | Color | Description |
|-------|-------------|-------|-------------|
| null | - | bg-grey-50 | 데이터 없음 (미사용일) |
| 1 | 0~1시간 | bg-yellow-100 | 가장 연한 노란색 |
| 2 | 1~2시간 | bg-yellow-200 | 2단계 노랑 |
| 3 | 2~3시간 | bg-yellow-300 | 3단계 노랑 |
| 4 | 3~4시간 | bg-yellow-400 | 4단계 노랑 |
| 5 | 4시간 이상 | bg-yellow-500 | 가장 진한 노란색 |

### SubContentMessage (캐릭터 메시지 매핑)

subContent 키워드에 따른 표시 메시지.

| Keyword | Message |
|---------|---------|
| (기본값/undefined) | "당신은 매일 골든리트리버 한 마리를 목에 업고 작업한 것과 같아요 🥺" |
| 뽀각거부기 | "뚠뚠한 골든리트리버 한 마리를 매일 목에 업고 있어요 🐶" |
| 꾸부정거부기 | "기내용 캐리어를 목 위에 올려두고 앉아 있는 셈이에요 🧳" |
| 아기기린 | "무거운 볼링공을 목에 걸고 일하는 중이에요 🎳" |
| 쑥쑥기린 | "작은 수박 한 통 정도를 목에 얹은 상태예요 🍉" |
| 꽃꼿기린 | "머리 본연의 무게만 딱! 지금 아주 좋아요 🌸" |
| (알 수 없는 값) | 원본 subContent 텍스트 그대로 표시 |

### CalendarDay (캘린더 일자 셀)

캘린더 그리드의 각 셀에 대한 렌더링 정보.

| Field | Type | Description |
|-------|------|-------------|
| day | `number \| null` | 날짜 (1~31) 또는 null (빈 셀) |
| level | `number \| null` | 색상 레벨 (1~5, null) |
| today | `boolean` | 오늘 날짜 여부 |
| future | `boolean` | 미래 날짜 여부 |

## State Transitions

```
[초기 상태] → viewDate = 현재 월 1일
     ↓
[API 호출] → useAttendanceQuery({ period: 'MONTHLY', year, month })
     ↓
[데이터 수신] → attendances 맵에서 각 날짜별 level 계산
     ↓
[렌더링] → CalendarDay 배열 생성 → AttendanceDot 컴포넌트로 표시
     ↓
[월 변경] → setViewDate(newDate) → API 재호출 → 다시 렌더링
```

## Validation Rules

- 미래 달로 네비게이션 불가: `viewDate <= todayYm` 강제
- level 클램핑: `Math.min(Math.max(level, 1), 5)`
- 사용 시간 0분 → null level (회색 원)
- content1/content2가 비어있으면 해당 행 표시하지 않음
