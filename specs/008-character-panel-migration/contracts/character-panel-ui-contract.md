# UI Contract: CharacterPanel

**Date**: 2026-04-15

## 목적

CharacterPanel 이관 시 구현자가 반드시 지켜야 하는 최소 UI 계약을 정의한다.

## Public Surface

### Component

```ts
CharacterPanel(props?: { className?: string }): JSX.Element
```

## Rendering Contract

1. 최상위 패널은 단일 카드 컨테이너여야 한다.
2. 카드 컨테이너는 테두리, 흰색 배경, 둥근 모서리를 가져야 한다.
3. 카드 내부에는 전체 너비를 채우는 정사각형 비주얼 영역이 정확히 1개 존재해야 한다.
4. 비주얼 영역은 레거시와 동일한 톤의 옅은 경고색 배경을 사용해야 한다.
5. 텍스트, 버튼, 아이콘, 이미지 파일, 상태 배지, 로딩 표시를 추가해서는 안 된다.

## Dependency Contract

- 신규 서버 데이터 요청이 없어야 한다.
- 신규 클라이언트 저장소 접근이 없어야 한다.
- 신규 외부 패키지 도입이 없어야 한다.
- 신규 Tauri 명령 또는 시스템 권한이 없어야 한다.

## Placement Contract

- 레거시에서 실제 사용처가 확인되지 않은 경우, 컴포넌트 단독 포팅과 단독 검증만으로도 계약을 충족한다.
- 후속 단계에서 대시보드 배치 연결이 필요해질 경우에도, CharacterPanel 자체의 시각 구조는 바꾸지 않는다.

## Verification Contract

- 구현 완료 후 레거시 `src/renderer/src/features/dashboard/ui/CharacterPanel.tsx` 결과와 마이그레이션 결과를 비교하는 시각 검증 자료를 남겨야 한다.
- 검증 자료에는 최소한 카드 외곽선, 내부 정사각형 비율, 배경 톤 일치 여부가 드러나야 한다.
