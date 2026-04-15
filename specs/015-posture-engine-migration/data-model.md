# Data Model: 자세 측정 엔진 분리 이관

## 1. 측정 세션

### 설명

사용자가 메인 화면에서 시작한 자세 측정 실행 단위다. 모드 전환이 발생해도 같은 세션으로 유지되며, 화면 표시 여부와 무관하게 최신 상태를 추적하는 기준이 된다.

### 필드

| 필드 | 타입 | 설명 | 검증 규칙 |
|---|---|---|---|
| `sessionId` | `string` | 측정 세션 식별자 | 비어 있지 않아야 함 |
| `status` | `idle \| starting \| running \| paused \| stopping \| error` | 세션의 현재 수명 주기 상태 | 정의된 상태 외 허용하지 않음 |
| `mode` | `foreground \| background` | 현재 측정 모드 | 정의된 모드 외 허용하지 않음 |
| `startedAt` | `string` | 세션 시작 시각 | ISO 시각 문자열이어야 함 |
| `lastResultAt` | `string \| null` | 마지막 정상 결과 수신 시각 | 값이 있으면 `startedAt` 이후여야 함 |
| `latestResultId` | `string \| null` | 최신 자세 결과 참조 식별자 | 값이 있으면 현재 세션에 속해야 함 |
| `lastErrorCode` | `string \| null` | 최근 오류 코드 | 오류 상태가 아닐 때는 `null` 허용 |

### 상태 전이

| 현재 상태 | 이벤트 | 다음 상태 | 기대 결과 |
|---|---|---|---|
| `idle` | 측정 시작 요청 | `starting` | 엔진 초기화와 카메라 점유 준비 시작 |
| `starting` | 첫 결과 수신 성공 | `running` | UI에 실시간 자세 피드백 표시 |
| `running` | 앱 최소화/숨김 | `running` | 세션은 유지되고 `mode`만 `background`로 전환 |
| `running` | 종료 요청 | `stopping` | 측정 중지와 자원 해제 시작 |
| `stopping` | 종료 완료 | `idle` | 세션 종료, 최신 결과 참조 해제 가능 |
| `starting/running/stopping` | 엔진 오류 | `error` | UI는 측정 불가 상태를 표시 |
| `error` | 복구 성공 | `running` 또는 `idle` | 복구 결과에 따라 세션 재개 또는 종료 |

## 2. 자세 측정 결과

### 설명

한 시점의 자세 추론과 분류 결과다. 메인 화면 오버레이, 보정 화면 품질 판단, 위젯 상태 반영, 알림 판단의 공통 입력이 된다.

### 필드

| 필드 | 타입 | 설명 | 검증 규칙 |
|---|---|---|---|
| `resultId` | `string` | 결과 식별자 | 세션 내 유일해야 함 |
| `sessionId` | `string` | 소속 세션 식별자 | 기존 측정 세션과 연결되어야 함 |
| `timestamp` | `string` | 결과 생성 시각 | ISO 시각 문자열이어야 함 |
| `postureClass` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | 레거시와 동일한 자세 상태 값 | 정의된 범위 외 허용하지 않음 |
| `score` | `number` | 자세 점수 | 0 이상 수여야 함 |
| `pi` | `number \| null` | 자세 판정 보조 지표 | 값이 있으면 수치형이어야 함 |
| `landmarks` | `Array<{x:number,y:number,z:number,visibility?:number}>` | 오버레이 렌더링용 위치 정보 | 빈 배열 허용 여부는 엔진 상태와 함께 해석 |
| `source` | `react_frame \| python_camera` | 결과 생성 소스 | 모드와 일치해야 함 |
| `engineMode` | `foreground \| background` | 결과 생성 시점의 측정 모드 | 세션 `mode`와 일치해야 함 |
| `events` | `string[]` | 부가 운영 이벤트 목록 | 정의된 이벤트 코드만 허용 |

### 파생 규칙

- `engineMode`가 `foreground`이면 UI는 오버레이 렌더링을 허용한다.
- `engineMode`가 `background`이면 UI는 최신 상태/배지만 갱신하고 실시간 오버레이를 강제하지 않는다.
- `postureClass`와 `score`의 의미는 레거시 `PostureClassifier`, `ScoreProcessor` 규칙을 따른다.

## 3. 엔진 상태 이벤트

### 설명

UI와 운영 계층이 자세 엔진의 현재 상태를 이해하기 위해 구독하는 상태 객체다. 결과 이벤트와 달리 측정 가능 여부, 전환 진행 여부, 오류 내용을 표현한다.

### 필드

| 필드 | 타입 | 설명 | 검증 규칙 |
|---|---|---|---|
| `engineStatus` | `idle \| starting \| ready \| switching \| measuring \| stopping \| error` | 엔진 상태 | 정의된 상태 외 허용하지 않음 |
| `mode` | `foreground \| background` | 현재 또는 목표 모드 | 상태와 모순되면 안 됨 |
| `cameraOwner` | `react \| python \| none` | 현재 카메라 점유 주체 | 하나만 허용 |
| `lastTransitionAt` | `string` | 마지막 상태 변경 시각 | ISO 시각 문자열이어야 함 |
| `message` | `string \| null` | 사용자 노출 가능 상태 메시지 | 오류/전환 시 채워질 수 있음 |
| `recoverable` | `boolean` | 자동 복구 가능 여부 | 항상 명시해야 함 |

### 상태 전이

| 현재 상태 | 이벤트 | 다음 상태 | 기대 결과 |
|---|---|---|---|
| `idle` | 엔진 시작 | `starting` | sidecar 초기화 시작 |
| `starting` | 준비 완료 | `ready` | 결과 수신 가능 |
| `ready` | 측정 시작 | `measuring` | UI가 결과를 소비 |
| `measuring` | 모드 전환 시작 | `switching` | 카메라 소유권 전환 진행 |
| `switching` | 전환 완료 | `measuring` | 새 모드에서 측정 지속 |
| `measuring/switching` | 중지 요청 | `stopping` | 자원 해제 시작 |
| 모든 상태 | 오류 발생 | `error` | 오류 메시지와 복구 가능 여부 표시 |

## 4. 카메라 점유 상태

### 설명

카메라 장치를 누가 사용하는지 표현하는 운영 모델이다. 전환 중 충돌 방지와 수동 검증 시나리오의 핵심 기준이 된다.

### 필드

| 필드 | 타입 | 설명 | 검증 규칙 |
|---|---|---|---|
| `owner` | `react \| python \| none` | 현재 카메라 점유자 | 단 하나만 허용 |
| `requestedOwner` | `react \| python \| none` | 전환 목표 점유자 | 전환 중에만 현재 소유자와 달라질 수 있음 |
| `lockState` | `free \| releasing \| acquiring \| held` | 장치 전환 단계 | 모드 전환 규칙과 일치해야 함 |
| `updatedAt` | `string` | 마지막 갱신 시각 | ISO 시각 문자열이어야 함 |

### 전환 규칙

- `owner=react`에서 `requestedOwner=python`으로 바뀌면 React가 먼저 스트림을 중단하고 `owner=none`이 된 뒤 Python이 점유한다.
- `owner=python`에서 `requestedOwner=react`로 바뀌면 Python이 장치를 해제한 뒤 React가 다시 스트림을 연다.
- `owner`와 `requestedOwner`가 동시에 서로 다른 실소유 상태를 가지는 시간은 허용하지 않는다.

## 5. 보정 상태 소비 문맥

### 설명

보정 화면이 동일한 자세 결과를 어떤 방식으로 소비하는지 표현하는 화면 문맥 모델이다. 측정 결과 자체는 공용이지만, 화면별 사용 목적이 다르므로 소비 문맥을 별도로 정의한다.

### 필드

| 필드 | 타입 | 설명 | 검증 규칙 |
|---|---|---|---|
| `view` | `calibration` | 화면 종류 | 보정 화면 고정 값 |
| `isPoseDetected` | `boolean` | 현재 포즈 인식 여부 | 랜드마크 유무와 연계됨 |
| `qualityState` | `ready \| blocked \| counting \| complete` | 보정 단계 상태 | 정의된 상태 외 허용하지 않음 |
| `blockingReason` | `string \| null` | 보정 불가 이유 | `blocked`일 때 채워질 수 있음 |

### 관계

- `보정 상태 소비 문맥`은 `자세 측정 결과`를 읽어 카운트다운 시작 여부와 품질 메시지를 결정한다.
- 같은 `자세 측정 결과`라도 메인 화면은 오버레이 중심, 보정 화면은 품질 판단 중심으로 소비한다.
