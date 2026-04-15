# Quickstart: TrendPanel 이관

**Branch**: `009-trend-panel-migration`

## 사전 확인

1. 레거시 기준 구현 확인: `src/renderer/src/features/dashboard/ui/TrendPanel.tsx`
2. 대시보드 분석 문서 확인: `docs/dashboard-panel-migration-analysis.md`
3. 마이그레이션 패널 구조 확인: `migration/src/features/main-panels/ui/`

## 구현 순서

### 1단계: 레거시 패널 구조 포팅

```text
migration/src/features/main-panels/ui/TrendPanel.tsx
```

- 레거시 카드 구조와 내부 요소(제목, 버튼, 차트 영역)를 그대로 옮긴다.
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

1. 레거시 TrendPanel 화면과 마이그레이션 TrendPanel 화면을 같은 해상도에서 캡처한다.
2. 카드 외곽선, 배경색, 모서리, 내부 여백, 제목 문구가 동일한지 비교한다.
3. "주간"과 "월간" 필터 버튼 스타일이 동일한지 비교한다.
4. 차트 영역 높이와 배경색이 동일한지 비교한다.
5. 텍스트, 버튼, 추가 장식이 생기지 않았는지 확인한다.

## 완료 기준

- TrendPanel 컴포넌트가 마이그레이션 앱에 존재한다.
- 레거시와 동일한 시각 구조가 확인된다.
- 신규 데이터 연결, 외부 패키지, 시스템 연동이 추가되지 않는다.

---

## 시각 비교 기록 (구현 완료 후 작성)

**비교 대상**:
- 레거시: `src/renderer/src/features/dashboard/ui/TrendPanel.tsx`
- 마이그레이션: `migration/src/features/main-panels/ui/TrendPanel.tsx`

### 구조 비교

| 요소 | 레거시 클래스 | 마이그레이션 클래스 | 일치 |
|------|--------------|-------------------|------|
| 카드 컨테이너 | `border-grey-100 col-span-12 rounded-2xl border bg-white p-5 lg:col-span-6` | 동일 | ✓ |
| 제목 행 | `mb-4 flex items-center justify-between` | 동일 | ✓ |
| 제목 | `text-headline-xl-bold text-grey-800` → "자세 추이" | 동일 | ✓ |
| 주간 버튼 | `text-caption-md-medium text-grey-500 bg-grey-50 rounded-full px-3 py-1` | 동일 | ✓ |
| 월간 버튼 | `text-caption-md-medium text-warning-600 bg-warning-50 rounded-full px-3 py-1` | 동일 | ✓ |
| 차트 영역 | `bg-grey-50 h-[200px] rounded-xl` | 동일 | ✓ |

### 검증 결과

- 카드 외곽선: ✓ 동일 (border-grey-100, rounded-2xl)
- 배경색: ✓ 동일 (bg-white)
- 모서리: ✓ 동일 (rounded-2xl)
- 내부 여백: ✓ 동일 (p-5)
- 제목 문구: ✓ 동일 ("자세 추이")
- 필터 버튼 스타일: ✓ 동일 (주간 grey 계열, 월간 warning 계열)
- 차트 영역: ✓ 동일 (h-[200px], bg-grey-50, rounded-xl)
- 추가 요소 없음: ✓ 확인

### 알려진 제약

- `text-headline-xl-bold` 타이포그래피 토큰은 레거시/마이그레이션 양쪽 모두에 정의되어 있지 않다.
  - typography.css에 `headline-xl` 스케일 자체가 존재하지 않는다.
- `text-caption-md-medium` 타이포그래피 토큰도 레거시/마이그레이션 양쪽 모두에 정의되어 있지 않다.
  - typography.css에 `caption-md` 스케일 자체가 존재하지 않는다.
- `warning-50`, `warning-600` 색상 토큰은 레거시/마이그레이션 양쪽 모두에 정의되어 있지 않다.
- 레거시 TrendPanel은 실제 렌더링되지 않는(dead code) 상태로, 이 미정의 토큰들이 화면에 영향을 주지 않았다.
- 마이그레이션 TrendPanel도 동일한 클래스를 사용하므로 레거시 충실도 원칙을 만족한다.
- 후속 작업에서 타이포그래피/색상 토큰을 추가 정의할 때 일괄 적용한다.

---

## 후속 패널 이관 검증 포인트 (재사용 기준)

1. 레거시 컴포넌트 구조를 그대로 복사하고, `cn()` + `PanelBaseProps` 패턴만 적용한다.
2. 기본 내보내기 대신 명명된 내보내기를 사용한다.
3. 배럴 export에만 존재하는 패널은 대시보드에 강제 배치하지 않는다.
4. 레거시에 미정의 토큰(warning-* 등)이 있으면 원본 클래스를 그대로 유지한다.
5. 시각 비교 표를 quickstart에 작성해 누락을 방지한다.
