# Quickstart: CharacterPanel 이관

**Branch**: `008-character-panel-migration`

## 사전 확인

1. 레거시 기준 구현 확인: `src/renderer/src/features/dashboard/ui/CharacterPanel.tsx`
2. 대시보드 분석 문서 확인: `docs/dashboard-panel-migration-analysis.md`
3. 마이그레이션 패널 구조 확인: `migration/src/features/main-panels/ui/`

## 구현 순서

### 1단계: 레거시 패널 구조 포팅

```text
migration/src/features/main-panels/ui/CharacterPanel.tsx
```

- 레거시 카드 구조와 내부 정사각형 영역을 그대로 옮긴다.
- `className` 외 신규 props는 추가하지 않는다.
- 별도 훅, 쿼리, 스토어 연결은 하지 않는다.

### 2단계: 필요 시 대시보드 연결 지점 검토

```text
migration/src/features/dashboard/ui/LeftPanelArea.tsx
```

- 실제 배치 연결은 레거시 사용처 확인 결과를 전제로 한다.
- 강제 삽입보다, 레거시와 동일한 화면 구성이 보장되는 경우에만 연결한다.

### 3단계: 검증 경로 확보

```text
migration/src/pages/dashboard-page/index.tsx
migration/src/features/dashboard/ui/MainContent.tsx
```

- 수동 확인이 가능한 화면 진입점을 사용한다.
- 필요한 경우 패널 단독 렌더링용 임시 검증 코드를 작성하되, 최종 머지 전에는 제거 가능한 형태로 유지한다.

## 검증 방법

1. 레거시 CharacterPanel 화면과 마이그레이션 CharacterPanel 화면을 같은 해상도에서 캡처한다.
2. 카드 외곽선, 배경색, 모서리, 내부 정사각형 비율이 동일한지 비교한다.
3. 텍스트, 버튼, 추가 장식이 생기지 않았는지 확인한다.
4. 대시보드 문맥에 연결한 경우 주변 패널과의 간격 때문에 CharacterPanel 자체 스타일이 변형되지 않았는지 확인한다.

## 완료 기준

- CharacterPanel 컴포넌트가 마이그레이션 앱에 존재한다.
- 레거시와 동일한 시각 구조가 확인된다.
- 신규 데이터 연결, 외부 패키지, 시스템 연동이 추가되지 않는다.

## 시각 비교 산출물

**상태**: 구현 완료, 수동 시각 비교 대기

| 항목 | 레거시 | 마이그레이션 | 일치 여부 |
|------|--------|-------------|----------|
| 카드 배경색 (`bg-white`) | 확인 필요 | `bg-white` | 수동 비교 대기 |
| 카드 테두리 (`border border-grey-100`) | 확인 필요 | `border border-grey-100` | 수동 비교 대기 |
| 카드 모서리 (`rounded-2xl`) | 확인 필요 | `rounded-2xl` | 수동 비교 대기 |
| 내부 비주얼 영역 배경 (`bg-warning-300/30`) | 확인 필요 | `bg-warning-300/30` | 수동 비교 대기 |
| 정사각형 비율 (`aspect-square`) | 확인 필요 | `aspect-square` | 수동 비교 대기 |
| 전체 너비 (`w-full`) | 확인 필요 | `w-full` | 수동 비교 대기 |

## 후속 패널 이관을 위한 완료 기준 템플릿

CharacterPanel 이관에서 검증한 기준을 후속 패널에 재사용한다.

### 의무 검증 포인트

1. **카드 외형**: 레거시와 동일한 border, background, border-radius 유지
2. **내부 영역 비율**: aspect-ratio 등 CSS 속성이 레거시와 동일
3. **추가 요소 부재**: 텍스트, 버튼, 아이콘, 이미지가 임의로 추가되지 않았는지 확인
4. **독립 렌더링**: 다른 패널 상태와 무관하게 마운트 유지
5. **신규 의존성 부재**: 데이터 요청, 저장소 접근, 외부 패키지, Tauri 명령 없음

### 검증 완료 조건

- 위 5개 포인트가 모두 통과하면 해당 패널 이관을 완료로 간주한다.
- 시각 비교 산출물(캡처)을 quickstart에 첨부한다.
