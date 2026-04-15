# Quickstart: AverageGraphPannel UI 이관 검증

## 1. 사전 조건

- 작업 브랜치가 `014-average-graph-panel`인지 확인한다.
- 저장소 루트는 `/home/choiho/coding/FE-migration`이다.
- 개발 명령은 헌법에 따라 `bun` 기준으로 실행한다.

## 2. 정적 검증

```bash
cd /home/choiho/coding/FE-migration/migration
bun x tsc --noEmit
```

```bash
cd /home/choiho/coding/FE-migration
bun x biome check migration/src/features/main-panels/ui/AverageGraphPanel.tsx \
  migration/src/features/main-panels/ui/AverageGraphPanel/hooks/useAverageGraphChart.ts
```

## 3. 실행 검증

```bash
cd /home/choiho/coding/FE-migration/migration
bun run dev
```

- migration 대시보드 좌측 영역에서 `AverageGraphPanel`을 확인한다.
- 같은 시점의 레거시 `AverageGraphPannel`과 비교한다.
- 다음 항목을 순서대로 확인한다.
  - 헤더 텍스트와 정보 아이콘 위치
  - 주간/월간 토글 스타일과 위치
  - 우측 범례 위치와 텍스트
  - x축, y축, 가로 그리드 수와 배치
  - 면적 채움과 선 색상
  - 툴팁 표시 형태
  - 월간 12개 초과 데이터에서 수평 스크롤 동작

## 4. 데이터 예외 검증

- `usePostureGraphQuery()` 응답이 비어 있는 경우에도 그래프 레이아웃이 깨지지 않는지 확인한다.
- 일부 점수가 `0`인 경우 선이 바닥으로 급락하지 않고 레거시와 유사하게 표시되는지 확인한다.

## 5. 완료 기준

- 타입체크와 정적 검사가 모두 통과한다.
- 레거시 대비 시각적 차이가 없거나 무시 가능한 수준임을 확인한다.
- 다른 좌측 패널 레이아웃 회귀가 없다.
