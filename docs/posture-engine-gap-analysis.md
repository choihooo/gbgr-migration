# 포스처 엔진 이관 갭 분석

## 레거시 아키텍처

레거시는 sidecar 없이 브라우저 내에서 직접 포즈 감지를 수행한다.

| 항목 | 파일 | 설명 |
|---|---|---|
| 포즈 감지 | `src/renderer/src/entities/posture/lib/PoseDetection.tsx` | MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) 사용 |
| 점수 계산 | `src/renderer/src/entities/posture/lib/ScoreProcessor.ts` | Python 알고리즘을 JS로 변환 |
| 웹캠 | 브라우저 WebRTC API | `react-webcam`으로 프레임 캡처 |

**흐름**: 웹캠 프레임 → MediaPipe 포즈 랜드마크 추출 → ScoreProcessor 점수 계산 → UI 업데이트

## 마이그레이션 아키텍처 (현재)

Tauri IPC + Python sidecar 구조를 설계했으나 실제 연결이 안 되어 있다.

### 구현된 부분

| 항목 | 파일 | 상태 |
|---|---|---|
| Rust 상태 관리 | `migration/src-tauri/src/state/posture_engine_state.rs` | 완료 — Mutex 기반 상태 저장 |
| Rust 커맨드 | `migration/src-tauri/src/commands/posture_engine.rs` | 완료 — start/stop/push/background 전환 |
| Tauri 이벤트 | `migration/src-tauri/src/posture_engine/events.rs` | 완료 — 상태/경고 이벤트 정의 |
| 프론트엔드 브릿지 | `migration/src/features/posture-engine/lib/tauri-posture-engine.ts` | 완료 — invoke/listen 래핑 |
| 프론트엔드 훅 | `migration/src/features/posture-engine/model/use-posture-engine.ts` | 완료 — 엔진 생명주기 관리 |
| Zustand 스토어 | `migration/src/entities/posture/model/posture-engine-store.ts` | 완료 |
| Python sidecar 코드 | `sidecar/posture-engine/` | 완료 — stdin/stdout JSON 라인 통신 |

### 빠진 부분

| 항목 | 설명 | 필요 작업 |
|---|---|---|
| **Python sidecar 실행** | Rust에서 `main.py`를 프로세스로 띄우는 코드 없음 | `Command::new("python3")`로 sidecar 실행 + stdin/stdout 파이프 연결 |
| **stdin/stdout 브릿지** | Rust ↔ Python 간 JSON 라인 통신 구현 없음 | sidecar stdout을 읽어서 Tauri 이벤트로 emit, `push_posture_frame`을 stdin으로 전달 |
| **실제 포즈 추론** | `push_posture_frame`이 프레임을 받아들여도 처리 안 함 | 프레임 이미지를 Python sidecar stdin으로 전송 → 결과 수신 → store 업데이트 |
| **sidecar 설정** | `tauri.conf.json`에 sidecar 등록 없음 | `bundle.externalBin` 설정 또는 Rust `Command`로 직접 실행 |
| **Python 환경** | MediaPipe, opencv 등 의존성 설치 필요 | `requirements.txt` 또는 가상환경 설정 |

## "엔진 준비 중"이 계속 뜨는 이유

`WebcamPanel.tsx:116`에서:
```
engineState.engineStatus !== 'error' && latestResult === null
→ '엔진 준비 중'
```

Rust 커맨드는 상태를 `ready`로 설정하지만, 실제 추론이 없으니 `latestResult`가 영원히 `null`이다.

## 해결 방안 두 가지

### 방안 A: Python sidecar 연결 완성 (설계된 구조)
- Rust에서 Python 프로세스 실행
- stdin/stdout JSON 라인 브릿지 구현
- 프레임 이미지 전송 → 결과 수신 루프
- 장점: 백그라운드 모드, Python 생태계 활용 가능
- 단점: Python 런타임 번들링, 프로세스 관리 복잡

### 방안 B: 레거시 방식 재현 (MediaPipe 직접 사용)
- `@mediapipe/tasks-vision` 프론트엔드 설치
- `PoseDetection` 포팅 (MediaPipe WASM + WebGPU)
- `ScoreProcessor` 포팅 (JS→TS)
- 장점: sidecar 없이 동작, 레거시와 동일한 동작
- 단점: 백그라운드 모드 시 브라우저 제약

## 현재 posture engine 데이터 흐름 (실제)

```
[WebcamView]
    ↓ 프레임 캡처 (120ms 간격)
[use-posture-engine.ts:pushPostureFrame]
    ↓ Tauri invoke
[Rust: push_posture_frame]
    ↓ 여기서 끝. 프레임을 받아들이기만 하고 처리 안 함
    ↓ latestResult가 업데이트되지 않음
[UI: "엔진 준비 중"]
```

## 레거시 posture engine 데이터 흐름 (참고)

```
[WebcamView]
    ↓ react-webcam 프레임 캡처
[PoseDetection.tsx]
    ↓ MediaPipe Tasks Vision 포즈 랜드마크 추출
[ScoreProcessor.ts]
    ↓ 점수/자세 등급 계산
[Zustand store]
    ↓ 상태 업데이트
[UI: "자세 단계 2"]
```
