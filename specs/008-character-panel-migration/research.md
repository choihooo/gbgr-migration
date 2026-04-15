# Research: CharacterPanel 이관

**Date**: 2026-04-15
**Branch**: `008-character-panel-migration`

## R1: 레거시 기준 구현 선정

**Decision**: `src/renderer/src/features/dashboard/ui/CharacterPanel.tsx`를 CharacterPanel의 유일한 기준 구현으로 사용한다.

**Rationale**:
- 대시보드 패널 분석 문서에서 CharacterPanel은 Tier 1 무의존성 패널로 분류되어 있다.
- 실제 레거시 구현은 10줄짜리 정적 UI로, 카드 컨테이너와 내부 정사각형 비주얼 영역만 가진다.
- 데이터 훅, 스토어, 자식 컴포넌트가 없어서 화면 구조 그대로 포팅하는 것이 가장 정확하다.

**Alternatives considered**:
- 다른 패널 스타일에 맞춰 재해석: 헌장의 UI 충실도 보존 원칙 위반 가능성이 크다.
- 기존 마이그레이션 패널 디자인에 맞게 rounded 값이나 배경색을 조정: 사용자 요청인 “완전히 레거시와 동일”과 충돌한다.

## R2: 배치 연결 범위 결정

**Decision**: 우선순위는 CharacterPanel 컴포넌트 자체의 동일 복제이며, 실제 메인 화면 배치 연결은 레거시 사용처 확인을 전제로 최소 범위로 수행한다.

**Rationale**:
- 레거시 `CharacterPanel`은 배럴 export에는 포함되어 있지만, 현재 확인한 `src/renderer/src/pages/main-page/index.tsx`에서는 직접 렌더링되지 않는다.
- 따라서 “레거시와 동일”을 지키려면 무조건 현재 마이그레이션 메인 화면에 삽입하는 것보다, 먼저 컴포넌트 자체를 원형대로 옮기는 것이 안전하다.
- 후속 구현 단계에서 추가 사용처가 발견되거나 사용자가 배치 위치를 별도로 지시하면, 그 지점에 맞춰 연결하는 것이 범위 관리에 유리하다.

**Alternatives considered**:
- 즉시 `LeftPanelArea`에 강제 배치: 현재 확인한 레거시 메인 페이지 조합과 불일치할 수 있다.
- 컴포넌트만 만들고 검증을 생략: UI 충실도 보존 원칙의 증빙이 부족해진다.

## R3: 스타일 이관 방식

**Decision**: 레거시 Tailwind 유틸리티 의미를 최대한 그대로 유지하되, 마이그레이션 앱의 기존 Tailwind v4 환경에서 바로 해석 가능한 클래스 조합으로 옮긴다.

**Rationale**:
- 레거시 클래스는 `border-grey-100`, `rounded-2xl`, `border`, `bg-white`, `p-0`, `aspect-square`, `bg-warning-300/30`로 단순하다.
- 마이그레이션 앱은 이미 Tailwind CSS 4.2.2와 공통 색상 토큰을 사용 중이므로, 신규 토큰이나 별도 스타일 파일 없이 구현 가능성이 높다.
- 정적 패널이므로 별도 CSS 모듈을 만들기보다 기존 패널들과 동일하게 컴포넌트 내부 클래스 선언이 간결하다.

**Alternatives considered**:
- 별도 CSS 파일 생성: 단순 정적 패널에 비해 관리 비용이 커진다.
- 인라인 style 사용: 기존 코드베이스 패턴과 어긋나고 토큰 재사용이 어려워진다.

## R4: 검증 방식

**Decision**: 자동 검증은 선택적 경량 구조 테스트로 제한하고, 핵심 검증은 레거시 대비 시각 비교 산출물로 수행한다.

**Rationale**:
- 헌장상 단순 마크업 이관과 시각 복제는 테스트를 강제하지 않는다.
- CharacterPanel은 동적 상태가 없어, 자동 테스트가 있어도 DOM 존재 여부 이상을 충분히 보장하지 못한다.
- 이 기능의 핵심 성공 조건은 사용자가 보는 카드 외형과 비율이 같다는 점이므로 화면 캡처 비교가 가장 직접적이다.

**Alternatives considered**:
- 세부 스타일 값까지 단언하는 테스트 작성: 구현 세부에 과도하게 결합되고 유지 비용이 높다.
- 수동 검증 없이 코드 리뷰만 수행: UI 동일성 증빙이 부족하다.

## 이관 결과 (2026-04-15)

### 구현 결과

- CharacterPanel 컴포넌트를 `migration/src/features/main-panels/ui/CharacterPanel.tsx`에 구현했다.
- 레거시 원본(`src/renderer/src/features/dashboard/ui/CharacterPanel.tsx`)과 동일한 클래스 조합을 유지했다.
- 기존 마이그레이션 패턴(`PanelBaseProps` + `cn()`)을 적용해 다른 패널과의 충돌을 방지했다.
- 신규 데이터 요청, 저장소 접근, 외부 패키지, Tauri 명령은 추가하지 않았다.

### 배치 연결 판단 근거

- 레거시에서 CharacterPanel은 `features/dashboard/ui/index.ts` 배럴 export에만 존재하고, 실제 페이지에서 렌더링되지 않는다.
- `src/renderer/src/pages/main-page/index.tsx`를 포함한 모든 레거시 페이지에서 CharacterPanel import가 확인되지 않았다.
- 따라서 마이그레이션 앱에서도 대시보드 배치 연결을 수행하지 않고, 컴포넌트 단독 포팅으로 이관 범위를 마감한다.
- 후속 스펙에서 CharacterPanel의 실제 사용처가 발견되면 그 시점에 배치 연결을 수행한다.

### 시각 검증 결과

- 빌드 산출물 CSS에서 `bg-warning-300/30` 규칙이 생성되지 않음을 확인했다.
- 레거시와 마이그레이션 모두 동일한 `colors.css`를 사용하며, `warning-300` 토큰이 정의되어 있지 않다.
- 레거시 CharacterPanel은 실제로 렌더링되지 않아 이 문제가 발견되지 않았다.
- 결과적으로 양쪽 모두 비주얼 영역에 배경색이 렌더링되지 않으며, 시각적으로 동일하다.

### 후속 조치 후보

- `warning-300` 토큰 정의: CharacterPanel이 실제 배치되는 시점에 `colors.css`에 `--color-warning-300` 값을 추가해야 한다. 레거시에서 의도한 색상 값을 별도 확인이 필요하다.
