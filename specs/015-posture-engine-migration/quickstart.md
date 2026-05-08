# Quickstart: 자세 측정 엔진 분리 이관 검증

## 1. 사전 조건

- 작업 브랜치가 `015-posture-engine-migration`인지 확인한다.
- 저장소 루트는 ``이다.
- 개발 명령은 헌법에 따라 `bun`을 우선 사용한다.
- 레거시 비교 기준 화면은 `src/renderer/src/features/dashboard/ui/WebcamPanel.tsx`와 `src/renderer/src/pages/calibration-page/index.tsx`이다.

## 2. 문서 산출물 확인

- [plan.md](./plan.md)에 기술 맥락과 헌법 체크가 채워져 있어야 한다.
- [research.md](./research.md)에 모드 전환, 카메라 소유권, 브리지 계약 관련 결정이 정리되어 있어야 한다.
- [data-model.md](./data-model.md)에 세션/결과/엔진 상태 모델이 있어야 한다.
- [contracts/posture-engine-bridge-contract.md](./contracts/posture-engine-bridge-contract.md)에 Tauri command/event 계약이 있어야 한다.

## 3. 정적 검증

```bash
cd migration
bun x tsc --noEmit
```

```bash
cd 
bun x biome check migration/src migration/src-tauri/src
```

```bash
cd migration/src-tauri
cargo check
```

## 4. 실행 검증

```bash
cd migration
bun run tauri dev
```

- `/main` 진입 후 우측 `WebcamPanel`의 기존 레이아웃과 버튼 스타일이 유지되는지 확인한다.
- `/onboarding/calibration` 진입 후 웹캠 영역, 가이드 오버레이, 우측 패널 레이아웃이 레거시와 동일한지 확인한다.
- 측정 시작 후 앱을 최소화했다가 복귀해 세션이 유지되고 최신 상태가 먼저 표시되는지 확인한다.
- 최소화/복귀를 10회 반복해 카메라 충돌, 중복 세션, 복귀 실패가 없는지 확인한다.

## 5. 레거시 동일성 검증

- 레거시 `WebcamPanel`과 migration `WebcamPanel`의 버튼 텍스트, 아이콘 위치, 카드 스타일을 비교한다.
- 레거시 보정 화면과 migration 보정 화면의 웹캠 박스 크기, 오버레이 위치, 우측 안내 패널 간격을 비교한다.
- 같은 입력 자세에서 자세 클래스와 점수 해석이 레거시 의미와 동일한지 검증 표본으로 확인한다.
- 레거시 `calculatePI`, `ScoreProcessor`, `PostureClassifier`, 보정 판단 규칙과 sidecar 결과가 같은 의미를 유지하는지 표본 비교로 확인한다.

## 6. 오류 및 전환 검증

- 카메라를 다른 앱이 점유한 상태에서 시작해 측정 불가 상태가 명확히 보이는지 확인한다.
- sidecar를 강제로 중지한 뒤 엔진 상태가 오류로 전환되고, 전체 UI는 유지되는지 확인한다.
- 백그라운드 측정 중 복귀했을 때 오래된 결과를 새 결과처럼 표시하지 않는지 확인한다.
- 백그라운드 측정 중 생성된 나쁜 자세 상태가 알림 판단과 세션 기록 흐름에 연결되는지 확인한다.

## 7. 완료 기준

- 타입체크, 정적 검사, Rust 체크가 모두 통과한다.
- 메인 화면과 보정 화면의 시각 스타일 차이 항목이 0건이다.
- 모드 전환 10회 반복에서 카메라 충돌과 중복 세션 생성이 0건이다.
- 복귀 직후 2초 이내 최신 상태 또는 실시간 피드백이 다시 보인다.
- 레거시와 마이그레이션의 자세 분류 결과가 검증 표본 기준 95% 이상 일치한다.
