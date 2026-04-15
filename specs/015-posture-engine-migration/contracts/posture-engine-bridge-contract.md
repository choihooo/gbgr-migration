# Contract: 자세 측정 엔진 브리지

## 1. 목적

이 문서는 React 프론트엔드, Tauri Rust 백엔드, Python sidecar 사이의 자세 측정 엔진 인터페이스를 고정한다. 구현 시점에 세부 내부 구조는 바뀔 수 있지만, 아래 명령과 이벤트의 의미는 유지한다.

## 2. Command 계약

### 2.1 `start_posture_engine`

- 목적: 자세 측정 엔진과 sidecar를 초기화한다.
- 호출 주체: React 프론트엔드
- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `engineStatus` | `starting \| ready` | 초기화 직후 상태 |
| `sessionId` | `string \| null` | 기존 활성 세션이 있으면 반환 |
| `mode` | `foreground \| background` | 초기 진입 모드 |

- 오류 조건:
  - sidecar 실행 실패
  - 필수 권한 부족
  - 이미 복구 불가 오류 상태인 엔진 재시작 요청

### 2.2 `stop_posture_engine`

- 목적: 자세 측정 엔진을 중지하고 관련 자원을 해제한다.
- 호출 주체: React 프론트엔드
- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `engineStatus` | `idle` | 엔진 중지 완료 상태 |
| `releasedOwner` | `react \| python \| none` | 마지막 카메라 점유 주체 |

### 2.3 `push_posture_frame`

- 목적: 화면 표시 모드에서 React가 샘플링한 단일 프레임을 측정 엔진에 전달한다.
- 호출 주체: React 프론트엔드
- 요청 필드:

| 필드 | 타입 | 설명 | 규칙 |
|---|---|---|---|
| `sessionId` | `string` | 활성 세션 식별자 | 비어 있지 않아야 함 |
| `imagePayload` | `string \| Uint8Array` | 샘플링 프레임 | 포맷은 구현 선택 가능하나 단일 프레임이어야 함 |
| `capturedAt` | `string` | 프레임 캡처 시각 | ISO 시각 문자열 |
| `frameSize` | `{width:number,height:number}` | 프레임 크기 | 양수여야 함 |

- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `accepted` | `boolean` | 프레임 수락 여부 |
| `reason` | `string \| null` | 거부 사유 |

- 오류 조건:
  - 세션 불일치
  - 포그라운드 모드 아님
  - 엔진 준비 전 호출

### 2.4 `start_background_measurement`

- 목적: 백그라운드 측정 모드로 전환하고 Python sidecar가 직접 카메라를 점유하도록 요청한다.
- 호출 주체: Rust 내부 또는 프론트엔드
- 요청 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `sessionId` | `string` | 활성 세션 식별자 |
| `reason` | `minimized \| hidden \| manual` | 전환 이유 |

- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `engineStatus` | `switching \| measuring` | 전환 직후 상태 |
| `mode` | `background` | 목표 모드 |

### 2.5 `stop_background_measurement`

- 목적: 백그라운드 측정을 중지하고 화면 표시 모드 복귀를 준비한다.
- 호출 주체: Rust 내부 또는 프론트엔드
- 요청 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `sessionId` | `string` | 활성 세션 식별자 |

- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `engineStatus` | `switching \| ready` | 전환 직후 상태 |
| `mode` | `foreground` | 목표 모드 |

### 2.6 `get_latest_posture_state`

- 목적: 프론트엔드가 복귀 직후 최신 자세 결과와 엔진 상태를 즉시 조회한다.
- 호출 주체: React 프론트엔드
- 성공 응답:

| 필드 | 타입 | 설명 |
|---|---|---|
| `session` | `MeasurementSession \| null` | 활성 세션 정보 |
| `latestResult` | `PostureEngineResult \| null` | 최신 결과 |
| `engineState` | `EngineStateEvent` | 최신 엔진 상태 |

## 3. Event 계약

### 3.1 `posture://result`

- 목적: 최신 자세 측정 결과를 프론트엔드에 전달한다.
- 페이로드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `resultId` | `string` | 결과 식별자 |
| `sessionId` | `string` | 세션 식별자 |
| `timestamp` | `string` | 결과 생성 시각 |
| `postureClass` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | 레거시와 동일한 자세 상태 |
| `score` | `number` | 자세 점수 |
| `pi` | `number \| null` | 자세 판정 보조 지표 |
| `landmarks` | `Array<{x:number,y:number,z:number,visibility?:number}>` | 오버레이 렌더링용 랜드마크 |
| `engineMode` | `foreground \| background` | 결과 생성 모드 |
| `source` | `react_frame \| python_camera` | 결과 소스 |
| `events` | `string[]` | 운영 이벤트 코드 |

### 3.2 `posture://engine-status`

- 목적: 엔진 시작, 준비, 전환, 오류 상태를 프론트엔드에 전달한다.
- 페이로드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `engineStatus` | `idle \| starting \| ready \| switching \| measuring \| stopping \| error` | 현재 엔진 상태 |
| `mode` | `foreground \| background` | 현재 또는 목표 모드 |
| `cameraOwner` | `react \| python \| none` | 카메라 소유 주체 |
| `message` | `string \| null` | 사용자 노출 가능 메시지 |
| `recoverable` | `boolean` | 복구 가능 여부 |
| `updatedAt` | `string` | 상태 갱신 시각 |

### 3.3 `posture://warning`

- 목적: 치명적이지 않지만 사용자 경험에 영향을 주는 경고를 알린다.
- 페이로드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `code` | `camera_conflict \| frame_rejected \| inference_timeout \| device_unavailable` | 경고 코드 |
| `message` | `string` | 경고 설명 |
| `sessionId` | `string \| null` | 관련 세션 |
| `occurredAt` | `string` | 발생 시각 |

## 4. 화면 소비 규칙

- 메인 화면 `WebcamPanel`은 `posture://result`를 사용해 오버레이와 상태 배지를 갱신한다.
- 보정 화면 `WebcamView`와 `MeasuringPanel`은 같은 결과 이벤트를 사용하되, 카운트다운과 품질 판단에 우선 사용한다.
- 위젯 화면은 최신 자세 상태만 소비하며, 카메라 표시나 오버레이 렌더링을 요구하지 않는다.

## 5. 검증 규칙

- 모든 command는 입력 검증 실패 시 명시적 오류를 반환해야 한다.
- `posture://result`와 `posture://engine-status`는 같은 세션 문맥을 공유해야 한다.
- `engineMode=background`인 결과가 수신될 때 프론트엔드는 실시간 카메라 표시를 강제하면 안 된다.
- 카메라 소유권이 `react`와 `python`으로 동시에 보고되는 이벤트 조합은 허용하지 않는다.
