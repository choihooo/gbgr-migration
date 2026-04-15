# UI Contract: AveragePosturePanel

**Date**: 2026-04-15

## 목적

AveragePosturePanel 이관 시 구현자가 반드시 지켜야 하는 최소 UI 계약을 정의한다.

## Public Surface

### Component

```ts
AveragePosturePanel(props?: { className?: string }): JSX.Element
```

## Rendering Contract

1. 최상위 패널은 단일 카드 컨테이너여야 한다.
2. 카드 컨테이너는 레거시와 동일한 둥근 모서리, 내부 여백, 전체 높이 구조를 가져야 한다.
3. 카드 좌측에는 제목, 점수, 목 평균 기울기, 예상 하중이 위에서 아래 순서로 표시되어야 한다.
4. 카드 우측에는 단계 이름 배지와 단계별 캐릭터 이미지가 표시되어야 한다.
5. 카드 하단에는 `Step. {level}` 형식의 단계 표기가 고정 위치에 표시되어야 한다.
6. 단계가 낮은 구간과 높은 구간은 레거시와 동일한 두 종류의 배경 그라데이션 중 하나를 사용해야 한다.
7. 점수 구간에 따라 단계 이름, 기울기 문구, 하중 문구, 캐릭터 이미지, Step 숫자가 함께 바뀌어야 한다.
8. 로딩 중에도 카드 구조와 텍스트 배치 영역은 유지되어야 한다.
9. 임시 도형, 신규 장식, 신규 배지, 신규 버튼, 신규 애니메이션을 추가해서는 안 된다.

## Dependency Contract

- 평균 자세 점수 조회는 기존 대시보드 조회 경로를 재사용해야 한다.
- 신규 서버 엔드포인트를 추가하지 않는다.
- 신규 클라이언트 저장소 접근을 추가하지 않는다.
- 신규 Tauri 명령 또는 시스템 권한을 추가하지 않는다.

## Placement Contract

- AveragePosturePanel은 메인 대시보드 좌측 상단 슬롯에 배치된 상태로 검증 가능해야 한다.
- 상위 레이아웃은 패널 자체의 내부 구조를 덮어쓰지 않아야 한다.
- 패널 단독 검증이 필요하더라도, 최종 기준은 메인 대시보드 문맥 안의 렌더 결과다.

## Verification Contract

- 구현 완료 후 레거시 `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx` 결과와 마이그레이션 결과를 비교하는 시각 검증 자료를 남겨야 한다.
- 검증 자료에는 최소한 카드 배경, 점수 텍스트, 단계 이름, 설명 문구, 캐릭터 이미지, 하단 `Step` 표기 일치 여부가 드러나야 한다.
