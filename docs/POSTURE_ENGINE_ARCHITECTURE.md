# 자세 측정 엔진 아키텍처 메모

## 1. 문서 목적

이 문서는 Tauri 마이그레이션 앱에서 거북목 측정 로직을 어떤 경계로 분리할지 정리하는 설계 메모다.

현재 논의의 핵심 요구사항은 아래 두 가지다.

- 메인 화면에서 레거시처럼 실시간 카메라 영상을 계속 보여준다.
- 앱이 최소화되더라도 측정 엔진은 렌더러 스로틀링 영향을 덜 받고 계속 동작할 수 있어야 한다.

이 문서는 위 요구사항을 만족하기 위한 권장 구조, 모드 전환, 데이터 흐름, 구현 경계, 리스크를 정리한다.

## 2. 배경

레거시 Electron 앱은 웹캠 표시, MediaPipe 추론, 선/점 오버레이, 자세 분류가 모두 렌더러 중심으로 연결되어 있다.

현재 저장소 기준으로는 아래 구성이 확인된다.

- `src/renderer/src/features/calibration/ui/components/WebcamView.tsx`
  웹캠 표시와 오버레이 연결
- `src/renderer/src/entities/posture/lib/PoseDetection.tsx`
  MediaPipe Pose Landmarker 기반 랜드마크 추출
- `src/renderer/src/entities/posture/lib/PoseVisualizer.tsx`
  귀/어깨 점, 선, 중점 오버레이 렌더링
- `src/renderer/src/entities/posture/lib/calculations.ts`
  `calculatePI`, `checkFrontality`
- `src/renderer/src/entities/posture/lib/PostureClassifier.ts`
  자세 분류와 히스테리시스 처리
- `src/renderer/src/entities/posture/lib/ScoreProcessor.ts`
  스코어 스무딩 처리

하지만 Tauri 환경에서는 창 최소화 또는 백그라운드 전환 시 웹뷰 렌더러의 타이머, 프레임 샘플링, 비디오 처리 루프가 흔들릴 수 있다. 따라서 측정 엔진을 렌더러 UI와 분리할 필요가 있다.

## 3. 설계 목표

### 3.1 기능 목표

- 메인 화면에서 실시간 카메라 영상과 선/점 오버레이를 유지한다.
- 보정 화면에서 사용자가 자기 자세를 보며 보정을 진행할 수 있어야 한다.
- 앱 최소화 상태에서도 자세 측정과 알림 판단이 이어질 수 있어야 한다.

### 3.2 구조 목표

- UI 렌더링 책임과 측정 엔진 책임을 분리한다.
- 카메라 장치 소유권 충돌을 피한다.
- React, Rust, Python 간 데이터 계약을 명확히 한다.

### 3.3 품질 목표

- 레거시 UI 스타일은 변경하지 않는다.
- 측정 엔진 오류가 나더라도 메인 화면 전체가 무너지지 않게 한다.
- 모드 전환 시 세션과 상태를 일관되게 유지한다.

## 4. 권장 아키텍처

권장 구조는 포그라운드 모드와 백그라운드 모드를 분리하는 이원화 구조다.

### 4.1 포그라운드 모드

앱 창이 보이는 동안의 모드다.

- React가 카메라 영상을 화면에 표시한다.
- React가 영상 위에 선/점 오버레이를 그린다.
- Python 엔진은 MediaPipe 추론과 자세 계산을 담당한다.
- Rust는 React와 Python 사이의 중계, sidecar 생명주기 관리, 이벤트 브리지를 담당한다.

### 4.2 백그라운드 모드

앱 창이 최소화되거나 숨김 상태인 동안의 모드다.

- Python 엔진이 카메라를 직접 점유한다.
- Python 엔진이 MediaPipe 추론과 자세 계산을 계속 수행한다.
- Rust는 결과 수신, 로그 저장, 알림 판단, 복귀 시 상태 전달을 담당한다.
- React는 실시간 영상 렌더링을 중지한다.

## 5. 모드별 책임 표

| 구분 | 포그라운드 모드 | 백그라운드 모드 |
|---|---|---|
| 앱 상태 | 메인 창 표시 | 최소화 또는 숨김 |
| 카메라 소유 | React | Python |
| 영상 표시 | React에서 실시간 표시 | 표시하지 않음 |
| 선/점 오버레이 | React | 없음 |
| MediaPipe 추론 | Python | Python |
| 자세 계산 | Python | Python |
| Rust 역할 | 프레임 전달, 결과 중계, sidecar 관리 | sidecar 관리, 결과 저장, 알림 처리 |
| 사용자 목적 | 실시간 확인과 피드백 | 측정 지속 |

## 6. 데이터 흐름

### 6.1 포그라운드 모드 흐름

1. React가 `react-webcam`으로 카메라 영상을 표시한다.
2. React가 주기적으로 프레임을 샘플링한다.
3. React가 샘플링한 프레임을 Rust 명령으로 전달한다.
4. Rust가 Python sidecar에 프레임을 전달한다.
5. Python이 MediaPipe 추론 후 랜드마크, 점수, 자세 클래스를 반환한다.
6. Rust가 결과 이벤트를 React에 전달한다.
7. React가 영상 위에 점, 선, 상태 라벨을 렌더링한다.

### 6.2 백그라운드 모드 흐름

1. 앱 최소화 또는 숨김 상태가 감지된다.
2. React가 웹캠 스트림과 프레임 샘플링을 중지한다.
3. Rust가 Python에 백그라운드 측정 시작을 요청한다.
4. Python이 카메라를 직접 열고 MediaPipe 추론을 수행한다.
5. Python이 자세 상태, 점수, 랜드마크, 이벤트를 Rust에 전달한다.
6. Rust가 로그 저장, 세션 메트릭 적재, 알림 판단을 수행한다.
7. 앱 복귀 시 Rust가 최신 상태를 React에 전달한다.

## 7. 모드 전환 규칙

카메라 장치 충돌을 피하기 위해 소유권 전환 순서를 고정해야 한다.

### 7.1 포그라운드 → 백그라운드

1. 창 최소화 또는 숨김 감지
2. React 웹캠 정지
3. React 프레임 샘플링 정지
4. Rust가 Python에 백그라운드 측정 시작 요청
5. Python이 카메라 장치 열기
6. Python이 측정 지속

### 7.2 백그라운드 → 포그라운드

1. 창 복귀 감지
2. Rust가 Python에 백그라운드 측정 중지 요청
3. Python이 카메라 장치 해제
4. React가 웹캠 다시 시작
5. React가 프레임 샘플링 재개
6. Rust가 최신 측정 상태를 React에 전달

동시에 React와 Python이 같은 카메라를 여는 상태는 허용하지 않는다.

## 8. 권장 데이터 계약

### 8.1 Python → Rust → React 결과 이벤트

```ts
type PostureEngineResult = {
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility?: number
  }>
  postureClass: 0 | 1 | 2 | 3 | 4 | 5 | 6
  score: number
  pi?: number
  timestamp: string
}
```

추가 이벤트가 필요하면 아래 정보를 확장할 수 있다.

- `events`: `enter_bad`, `exit_bad`
- `engineMode`: `foreground` 또는 `background`
- `source`: `react_frame` 또는 `python_camera`

### 8.2 React → Rust 프레임 전달

원본 비디오 전체 스트림을 장시간 전달하기보다는, 포그라운드 모드에서 샘플링한 단일 프레임만 주기적으로 전달한다.

후보 포맷:

- JPEG base64
- PNG base64
- 바이너리 바이트 배열

초기 구현은 단순성을 위해 JPEG base64가 가장 다루기 쉽지만, 성능 검증 후 바이너리 전송으로 낮출 수 있다.

## 9. Tauri 명령 및 이벤트 초안

### 9.1 Rust commands

- `start_posture_engine`
  sidecar 초기화
- `stop_posture_engine`
  sidecar 종료
- `push_posture_frame`
  포그라운드 모드에서 React 프레임 전달
- `start_background_measurement`
  Python이 카메라를 직접 잡는 측정 모드 시작
- `stop_background_measurement`
  백그라운드 측정 모드 종료
- `get_latest_posture_state`
  앱 복귀 직후 최신 상태 조회

### 9.2 Rust events

- `posture://result`
  최신 랜드마크, 점수, 자세 상태
- `posture://engine-status`
  엔진 시작, 중지, 오류, 모드 전환
- `posture://warning`
  카메라 충돌, 프레임 처리 실패, 추론 실패

## 10. 프론트엔드 권장 구조

`migration/` 기준으로는 아래 정도의 구조를 권장한다.

```text
migration/src/
├─ entities/
│  └─ posture/
│     ├─ model/
│     │  ├─ posture-engine-store.ts
│     │  └─ posture-types.ts
│     ├─ lib/
│     │  ├─ overlay-mapper.ts
│     │  └─ posture-events.ts
│     └─ ui/
│        └─ PoseOverlayCanvas.tsx
├─ features/
│  └─ posture-engine/
│     ├─ model/
│     │  ├─ use-posture-engine.ts
│     │  └─ use-window-visibility-sync.ts
│     └─ lib/
│        └─ tauri-posture-engine.ts
├─ pages/
│  ├─ calibration-page/
│  └─ dashboard-page/
```

### 10.1 React 책임

- 웹캠 영상 표시
- 오버레이 렌더링
- 엔진 상태 표시
- 창 상태에 따른 모드 전환 트리거

### 10.2 Rust 책임

- Python sidecar 실행과 종료
- 프레임 전달
- 이벤트 브리지
- 백그라운드 모드 전환
- 로그 저장, 알림 조건 연결

### 10.3 Python 책임

- MediaPipe 모델 로드
- 프레임 추론
- 카메라 직접 점유 모드 처리
- PI 계산, 정면성 체크, 자세 분류, 점수 처리

## 11. 레거시 로직 재사용 원칙

측정 알고리즘 자체는 최대한 레거시와 동일한 의미를 유지한다.

재사용 대상:

- 랜드마크 선택 규칙
- `calculatePI`
- `checkFrontality`
- `ScoreProcessor`
- `PostureClassifier`
- 보정 결과 처리 규칙

단, 구현 언어는 바뀔 수 있다. 즉 알고리즘 의미는 유지하되, 실행 위치는 프런트엔드에서 Python으로 이동할 수 있다.

## 12. 보정 화면과 메인 화면의 차이

### 12.1 보정 화면

- 사용자는 자기 모습을 보며 자세를 맞춰야 한다.
- React 실시간 영상 표시가 필수에 가깝다.
- Python 결과를 받아 카운트다운, 점/선, 품질 판단에 활용한다.

### 12.2 메인 화면

- 사용자는 계속 실시간 영상을 볼 수 있어야 한다.
- 레거시처럼 우측 `WebcamPanel`에서 카메라 영상을 유지한다.
- 최소화 시에는 영상 표시를 중단하되 측정은 백그라운드 모드로 유지한다.

## 13. 리스크와 대응

### 13.1 카메라 충돌 리스크

설명:

- React와 Python이 같은 장치를 동시에 열면 충돌하거나 초기화 실패가 날 수 있다.

대응:

- 카메라 소유권 전환 순서를 강제한다.
- 모드 전환 중에는 한쪽이 완전히 해제된 뒤 다른 쪽이 장치를 연다.

### 13.2 프레임 전달 비용 리스크

설명:

- 포그라운드 모드에서 React가 프레임을 계속 Python에 보내면 IPC 비용이 커질 수 있다.

대응:

- 해상도와 샘플링 주기를 제한한다.
- 초기에는 10~15fps 수준에서 검증한다.
- 성능이 부족하면 바이너리 전송 또는 공유 메모리성 대안을 검토한다.

### 13.3 모드 전환 끊김 리스크

설명:

- 최소화와 복귀 시 카메라 재점유 사이에 수백 ms 이상의 빈 구간이 생길 수 있다.

대응:

- 최신 상태를 Rust에 캐시한다.
- 복귀 직후 React는 마지막 결과를 먼저 렌더링하고, 새 스트림이 붙으면 실시간 모드로 전환한다.

### 13.4 Python 배포 리스크

설명:

- Tauri 앱 번들에 Python 런타임과 MediaPipe 의존성을 안정적으로 포함해야 한다.

대응:

- sidecar 번들 전략을 별도 검증한다.
- 개발 모드와 배포 모드의 실행 경로를 문서화한다.

## 14. 단계별 구현 권장 순서

1. React 오버레이 구조를 `migration`에 이관한다.
2. Rust에서 Python sidecar 실행과 결과 이벤트 브리지를 만든다.
3. 포그라운드 모드에서 React 프레임 전달 기반 측정을 붙인다.
4. 보정 화면에서 결과 수신과 품질 판단을 연결한다.
5. 메인 화면 `WebcamPanel`에 실시간 영상과 오버레이를 연결한다.
6. 최소화 감지와 백그라운드 모드 전환을 붙인다.
7. 알림, 메트릭, 로그 저장을 Rust 계층과 연결한다.

## 15. 문서 상태

이 문서는 구현 전 설계 메모다.

- 기존 `specs/006-main-page-migration`의 범위를 직접 수정하지 않는다.
- Python 기반 측정 엔진 전환은 별도 기능 스펙으로 분리하는 것이 맞다.
- 실제 구현에 들어가기 전, sidecar 배포 방식과 카메라 소유권 전환 검증이 선행되어야 한다.
