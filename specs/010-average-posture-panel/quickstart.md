# Quickstart: AveragePosturePanel 이관

**Branch**: `010-average-posture-panel`

## 사전 확인

1. 레거시 기준 구현 확인
   `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx`
2. 레거시 단계 정보 확인
   `src/renderer/src/features/dashboard/ui/AveragePosture/levelConfig.ts`
3. 현재 마이그레이션 구현 확인
   `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`
4. 메인 대시보드 연결 위치 확인
   `migration/src/features/dashboard/ui/LeftPanelArea.tsx`

## 구현 순서

### 1단계: 레거시 단계 규칙과 시각 구조 재정렬

```text
migration/src/features/main-panels/ui/AveragePosturePanel.tsx
```

- 현재 6단계 규칙을 레거시 5단계 규칙으로 되돌린다.
- 점수, 단계 이름, 목 평균 기울기, 예상 하중 문구를 레거시와 동일하게 맞춘다.
- 임시 도형 기반 캐릭터 표현을 제거하고 레거시 이미지 자산을 사용한다.
- 배경 그라데이션 전환 기준을 레거시와 동일하게 맞춘다.

### 2단계: 상위 레이아웃과 호환성 유지

```text
migration/src/features/main-panels/model/types.ts
migration/src/features/dashboard/ui/LeftPanelArea.tsx
```

- `className` 기반 확장 지점은 유지한다.
- 대시보드 좌측 상단 슬롯에서 레거시와 같은 카드 비율로 보이는지 확인한다.
- 상위 레이아웃 수정은 최소 범위에 그친다.

### 3단계: 검증 경로 확보

```text
migration/src/features/dashboard/ui/LeftPanelArea.tsx
migration/src/pages/dashboard-page/index.tsx
```

- 메인 대시보드 실제 진입 경로에서 AveragePosturePanel을 검증한다.
- 필요 시 패널 단독 검증을 보조로 사용하되, 최종 비교는 대시보드 문맥 기준으로 수행한다.

## 검증 방법

1. 레거시 메인 대시보드와 마이그레이션 메인 대시보드를 같은 해상도에서 연다.
2. AveragePosturePanel 카드 외형, 배경 그라데이션, 좌우 배치가 같은지 비교한다.
3. 제목, 점수, 기울기/하중 문구, 단계 이름, `Step` 문구를 비교한다.
4. 서로 다른 점수 상태를 최소 2개 이상 만들어 단계별 캐릭터와 배경 전환 결과를 비교한다.
5. 임시 도형이나 추가 장식이 남아 있지 않은지 확인한다.

## 완료 기준

- AveragePosturePanel이 레거시와 동일한 구조와 단계 규칙으로 표시된다.
- 단계별 캐릭터 이미지와 배경 전환이 레거시와 일치한다.
- 메인 대시보드 좌측 상단 슬롯에서 시각 차이가 없음을 확인할 수 있다.
- 신규 데이터 저장, 신규 명령, 신규 상호작용이 추가되지 않는다.

## 시각 비교 기록 (구현 완료 후 작성)

**비교 대상**:

- 레거시: `src/renderer/src/features/dashboard/ui/AveragePosture/AveragePosturePanel.tsx`
- 마이그레이션: `migration/src/features/main-panels/ui/AveragePosturePanel.tsx`

### 구조 비교

| 요소 | 레거시 | 마이그레이션 | 일치 |
|------|--------|-------------|------|
| 카드 컨테이너 | `relative h-full w-full rounded-3xl p-4` | 동일 구조로 복원 | ✓ |
| 좌측 정보 영역 | 제목, 점수, 기울기, 하중 | 동일 문구 순서와 위계로 복원 | ✓ |
| 우측 시각 영역 | 단계 배지 + 캐릭터 이미지 | 임시 도형 제거 후 이미지 렌더링으로 교체 | ✓ |
| 배경 그라데이션 | 단계 구간에 따른 2종 전환 | 동일 규칙으로 복원 | ✓ |
| 하단 Step 표기 | `Step. {level}` | 동일 위치와 문구로 복원 | ✓ |

### 검증 결과

- 카드 외곽/배경: ✓ 레거시와 동일한 카드 구조와 그라데이션 전환 규칙으로 복원
- 텍스트 위계: ✓ 제목, 점수, 기울기/하중 문구 순서와 강조 수준을 레거시 기준으로 복원
- 캐릭터 이미지: ✓ 임시 도형 제거 후 레거시 단계별 PNG 자산으로 교체
- 단계 문구: ✓ 5단계 이름과 `Step. {level}` 표기를 레거시 기준으로 복원
- 배경 전환: ✓ `level <= 2` 구간 거북이 계열, 그 외 평균 점수 배경으로 유지
- 추가 요소 없음: ✓ 신규 장식, 신규 배지, 신규 인터랙션 추가 없음

### 스크린샷 검증 산출물

- 비교 HTML:
  `specs/010-average-posture-panel/verification/legacy-low.html`
  `specs/010-average-posture-panel/verification/migration-low.html`
  `specs/010-average-posture-panel/verification/legacy-high.html`
  `specs/010-average-posture-panel/verification/migration-high.html`
  `specs/010-average-posture-panel/verification/legacy-loading.html`
  `specs/010-average-posture-panel/verification/migration-loading.html`
- 비교 스크린샷:
  `specs/010-average-posture-panel/verification/screens/legacy-low.png`
  `specs/010-average-posture-panel/verification/screens/migration-low.png`
  `specs/010-average-posture-panel/verification/screens/legacy-high.png`
  `specs/010-average-posture-panel/verification/screens/migration-high.png`
  `specs/010-average-posture-panel/verification/screens/legacy-loading.png`
  `specs/010-average-posture-panel/verification/screens/migration-loading.png`
- 검증 결과:
  저단계, 고단계, 로딩 상태 3쌍 모두 스크린샷 SHA-256 해시가 완전히 동일했다.
  - Low: `c75b8de3acf4ba0b785d48ed980250fbbdfd2c6c348d6b5e6c3f6c0b83187ac1`
  - High: `d306e77abbc116ddef24535e3087ab8bc6be2ad70eb4a16f36116b3f547699a0`
  - Loading: `0aa70728ea9abe8b5b16be5b013027d3f5130104f2ac742707768f53a8b3f79a`

### 알려진 제약

- 코드 구조와 빌드 결과 기준으로는 레거시 동일성 복원이 반영되었다.
- 검증은 빌드된 CSS와 이관 자산을 사용한 정적 비교 하네스 기준으로 수행했다.
