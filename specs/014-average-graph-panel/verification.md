# Verification: AverageGraphPannel UI 이관

## 1. 정적 검증 결과

- 실행 일시: 2026-04-15
- 타입체크: `bun x tsc --noEmit` 통과
- 정적 검사: `bun x biome check migration/src/features/main-panels/ui/AverageGraphPanel.tsx migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts` 통과

## 2. 레거시 구조 비교 결과

비교 기준:

- `src/renderer/src/features/dashboard/ui/AverageGraph/AverageGraphPannel.tsx`
- `src/renderer/src/features/dashboard/ui/AverageGraph/hooks/useAverageGraphChart.ts`

확인 결과:

- 패널 헤더 텍스트, 토글, 우측 범례 구조가 migration 구현과 동일하게 반영되었다.
- `AreaChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Area` 조합이 레거시와 동일하다.
- 월간 12개 초과 시 차트 너비 확장과 수평 스크롤 규칙이 동일하다.
- 정렬된 원본 데이터 사용, 주간 최근 7개 슬라이싱, 빈 데이터 임시 생성, `0` 점수 치환, y축 `100` 고정 규칙이 동일하다.

## 3. 좌측 패널 레이아웃 회귀 점검

검토 파일:

- `migration/src/features/dashboard/ui/LeftPanelArea.tsx`
- `migration/src/features/main-panels/ui/AverageGraphPanel.tsx`

점검 결과:

- `LeftPanelArea`의 카드 크기와 그리드 배치는 변경되지 않았다.
- `AverageGraphPanel` 내부 구현만 교체되었고 외곽 카드 반경, 최소 높이, 배치 구조는 유지된다.
- 다른 좌측 패널(`HighlightsPanel`, `TotalDistancePanel`, `PosePatternPanel`)의 레이아웃 제약을 바꾸는 수정은 없다.

## 4. 수동 UI 비교 기록

- quickstart 및 UI contract 기준으로 비교 항목을 정리했다.
- 현재 CLI 환경에서는 실화면 캡처 기반의 최종 수동 시각 비교를 직접 수행할 수 없었다.
- 후속 확인 권장 항목:
  - migration 앱 실행 후 레거시와 헤더/범례/축/그리드/툴팁/월간 스크롤을 육안 비교
  - 필요 시 비교 스크린샷을 `docs/verification/` 하위에 저장

## 5. 결론

- 코드 구조와 정적 검증 기준에서는 레거시 `AverageGraphPannel` 이관 요구사항을 충족한다.
- 최종 시각 동일성은 로컬 실행 환경에서 한 번 더 수동 확인하면 된다.
