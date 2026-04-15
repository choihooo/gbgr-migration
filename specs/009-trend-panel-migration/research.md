# Research: TrendPanel 이관

**Date**: 2026-04-15
**Branch**: `009-trend-panel-migration`

## R1: 레거시 기준 구현 선정

**Decision**: `src/renderer/src/features/dashboard/ui/TrendPanel.tsx`를 TrendPanel의 유일한 기준 구현으로 사용한다.

**Rationale**:
- 대시보드 패널 분석 문서에서 TrendPanel은 Tier 1 무의존성 패널로 분류되어 있다.
- 실제 레거시 구현은 21줄짜리 정적 UI로, 카드 컨테이너와 제목, 필터 버튼, 차트 영역만 가진다.
- 데이터 훅, 스토어, 자식 컴포넌트가 없어서 화면 구조 그대로 포팅하는 것이 가장 정확하다.

**Alternatives considered**:
- 다른 패널 스타일에 맞춰 재해석: 헌장의 UI 충실도 보존 원칙 위반 가능성이 크다.
- 기존 마이그레이션 패널 디자인에 맞게 rounded 값이나 배경색을 조정: 사용자 요청인 "완전히 레거시와 동일"과 충돌한다.

## R2: 배치 연결 범위 결정

**Decision**: 우선순위는 TrendPanel 컴포넌트 자체의 동일 복제이며, 실제 메인 화면 배치 연결은 레거시 사용처 확인을 전제로 최소 범위로 수행한다.

**Rationale**:
- 레거시 `TrendPanel`은 배럴 export에 포함되어 있지만, 실제 렌더링 여부를 확인해야 한다.
- "레거시와 동일"을 지키려면 무조건 현재 마이그레이션 메인 화면에 삽입하는 것보다, 먼저 컴포넌트 자체를 원형대로 옮기는 것이 안전하다.
- 후속 구현 단계에서 추가 사용처가 발견되거나 사용자가 배치 위치를 별도로 지시하면, 그 지점에 맞춰 연결하는 것이 범위 관리에 유리한다.

**Alternatives considered**:
- 즉시 `LeftPanelArea`에 강제 배치: 현재 확인한 레거시 메인 페이지 조합과 불일치할 수 있다.
- 컴포넌트만 만들고 검증을 생략: UI 충실도 보존 원칙의 증빙이 부족해진다.

## R3: 스타일 이관 방식

**Decision**: 레거시 Tailwind 유틸리티 의미를 최대한 그대로 유지하되, 마이그레이션 앱의 기존 Tailwind v4 환경에서 바로 해석 가능한 클래스 조합으로 옮긴다.

**Rationale**:
- 레거시 클래스는 `border-grey-100`, `rounded-2xl`, `border`, `bg-white`, `p-5`, `lg:col-span-6`, `text-headline-xl-bold`, `text-grey-800`, `bg-grey-50`, `text-warning-600`, `bg-warning-50`, `h-[200px]`, `rounded-xl`로 단순하다.
- 마이그레이션 앱은 이미 Tailwind CSS 4.2.2와 공통 색상 토큰, 타이포그래피 토큰을 사용 중이므로, 대부분의 클래스를 그대로 사용할 수 있다.
- `warning-50`, `warning-600` 토큰은 008 CharacterPanel에서 발견된 것과 동일한 이슈로, 레거시와 마이그레이션 양쪽 모두에 정의되어 있지 않다. 동일한 클래스명을 유지하는 것이 레거시 충실도 원칙에 부합한다.

**Alternatives considered**:
- warning 토큰을 yellow 계열로 치환: 레거시 원본 코드를 변경하는 것이므로 헌장 위반이다.
- 별도 CSS 파일 생성: 단순 정적 패널에 비해 관리 비용이 커진다.

## R4: 검증 방식

**Decision**: 자동 검증은 선택적 경량 구조 테스트로 제한하고, 핵심 검증은 레거시 대비 시각 비교 산출물로 수행한다.

**Rationale**:
- 헌장상 단순 마크업 이관과 시각 복제는 테스트를 강제하지 않는다.
- TrendPanel은 동적 상태가 없어, 자동 테스트가 있어도 DOM 존재 여부 이상을 충분히 보장하지 못한다.
- 이 기능의 핵심 성공 조건은 사용자가 보는 카드 외형과 요소 배치가 같다는 점이므로 화면 캡처 비교가 가장 직접적이다.

**Alternatives considered**:
- 세부 스타일 값까지 단언하는 테스트 작성: 구현 세부에 과도하게 결합되고 유지 비용이 높다.
- 수동 검증 없이 코드 리뷰만 수행: UI 동일성 증빙이 부족하다.

---

## 이관 결과 (구현 완료 후 작성)

**배치 판단 근거**:
- 레거시에서 TrendPanel은 배럴 export(`index.ts`)에만 포함되어 있고, 실제 렌더링되는 화면에서는 사용되지 않는다.
- 따라서 마이그레이션 앱에서도 컴포넌트 단독 포팅만 수행하고, LeftPanelArea에 강제 배치하지 않는다.
- 후속 단계에서 TrendPanel이 실제 화면에 필요해지면, 그 시점에 배치 연결을 진행한다.

**구현 방식**:
- CharacterPanel(008)과 동일한 패턴: `PanelBaseProps` + `cn()` + named export
- 레거시 원본의 모든 Tailwind 클래스를 그대로 유지
- `warning-50`, `warning-600` 토큰 미정의 이슈는 레거시와 동일한 상태로 유지
