# Research: 004-shared-ui-components

**Created**: 2026-04-14
**Status**: Complete

## R-001: cn 유틸리티 도입 결정

**Decision**: `clsx` + `tailwind-merge` 기반 `cn` 유틸리티를 `shared/lib/cn.ts`에 생성. 기존 Button, TextField의 `joinClasses`를 `cn`으로 교체.

**Rationale**:
- 레거시는 `cn`(clsx + tailwind-merge)을 사용하여 Tailwind 클래스 충돌을 자동 해결
- 현재 migration의 `joinClasses`는 단순 문자열 결합으로 Tailwind 클래스 충돌(`p-2` + `p-4` 등)을 해결하지 못함
- 7개 이상 컴포넌트가 동일한 유틸리티를 공유해야 하므로 표준화 필요

**Alternatives considered**:
- `joinClasses` 유지: Tailwind 클래스 충돌 미해결, 장기적 기술 부채
- 수동 클래스 관리: 각 컴포넌트마다 별도 로직, 유지보수 비용 증가

## R-002: LoadingSpinner 에셋 포팅 방식

**Decision**: 레거시의 `Loading.mov` 비디오 에셋을 migration의 `src/assets/video/`에 복사하여 동일하게 `<video>` 태그로 재생.

**Rationale**:
- 레거시가 CSS 애니메이션이 아닌 MOV 비디오를 사용 중
- UI 충실도 보존 원칙에 따라 동일한 에셋 사용
- 비디오 파일은 1:1 복사로 픽셀 퍼펙트 보장

**Alternatives considered**:
- CSS/SVG 애니메이션으로 재구현: 시각적 차이 발생 가능, 원칙 위반
- GIF 변환: 화질 저하, 투명도 미지원

## R-003: Timer 컴포넌트 스펙 보정

**Decision**: Timer 컴포넌트는 레거시와 동일하게 **시각적 카운트다운 표시**(value 0-5 SVG 세그먼트)로 포팅. 스펙의 "초 단위 카운트다운"은 레거시에 존재하지 않으므로 시각 표시 컴포넌트로 범위 조정.

**Rationale**:
- 레거시 Timer는 `value: 0|1|2|3|4|5` prop을 받아 SVG 세그먼트를 렌더링하는 순수 시각 컴포넌트
- 타이머 로직(초 단위 카운트다운, onComplete 콜백)은 Timer 컴포넌트에 존재하지 않음
- 실제 카운트다운 로직은 이 컴포넌트를 사용하는 상위 컴포넌트에서 구현

**Alternatives considered**:
- 스펙 그대로 자체 카운트다운 로직 추가: 레거시와 불일치, 원칙 위반
- Timer 이름 변경: API 호환성 유지를 위해 동일 이름 유지

## R-004: CVA 의존성 대체 전략

**Decision**: NotificateMessage의 CVA(cva 함수) 사용을 Tailwind 클래스 직접 매핑으로 변환. `class-variance-authority` 패키지는 추가하지 않음.

**Rationale**:
- migration 프로젝트에 CVA 의존성 없음
- Button 컴포넌트가 이미 Record 매핑 방식으로 CVA를 대체하고 있음
- NotificateMessage는 `default`/`success` 2가지 변형만 있어 Record 매핑으로 충분
- 일관된 패턴(Button과 동일) 유지

**Alternatives considered**:
- CVA 패키지 추가: 단일 컴포넌트를 위해 의존성 추가는 과도함
- 조건부 클래스: 가독성 저하, 유지보수 어려움

## R-005: Modal 컴포넌트 확장 설계

**Decision**: 레거시의 `ModalPortal`(포털만)에 스펙에서 요구하는 오버레이, ESC 닫기, 스크롤 락 기능을 추가한 통합 Modal 컴포넌트로 구현.

**Rationale**:
- 레거시는 ModalPortal(포털) + 각 모달 페이지에서 오버레이/닫기 직접 구현
- 중복 코드 제거를 위해 오버레이, ESC 닫기, 스크롤 락을 공통 Modal에 통합
- UI 충실도는 각 모달의 콘텐츠 레이아웃에서 보장, 공통 모달 셸은 Tauri 아키텍처 준수

**Alternatives considered**:
- ModalPortal만 포팅: 각 모달마다 동일 오버레이/닫기 코드 중복
- Headless UI / Radix 도입: 외부 의존성 추가, 레거시와 불일치

## R-006: 아이콘 에셋 관리

**Decision**: 레거시의 SVG 아이콘 에셋(info-circle, moon, sun, page-move-button)을 migration의 `src/shared/ui/icons/`에 SVG React 컴포넌트로 직접 포팅. `?react` SVGR 임포트 대신 인라인 SVG 컴포넌트로 작성.

**Rationale**:
- migration의 Vite 설정에 SVGR 플러그인이 설정되어 있지 않음
- 기존 icons/ 폴더에 인라인 SVG 패턴(status-icons.tsx, brand-icons.tsx)이 이미 확립됨
- 일관된 패턴 유지

**Alternatives considered**:
- SVGR 플러그인 추가: 빌드 설정 변경 필요, 기존 패턴과 불일치
- 별도 에셋 폴더: 파일 관리 복잡도 증가
