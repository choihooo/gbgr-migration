# 앱 교착상태(무한 로딩) 원인 분서

## 현상

Tauri 앱 실행 후 하얀 화면 + "Loading..." 상태에서 멈춤.
개발자 도구(`Cmd+Option+I`)도 열리지 않거나 응답 없음.

## 후보 원인

### 후보 1 (가능성 높음) — Rust Mutex 교착

`posture_engine.rs`의 여러 커맨드가 복수의 Mutex를 동시에 잡는다.
데드락 전형 패턴: 서로 다른 순서로 lock을 획득하면 교착.

```
start_posture_engine:   session → engine_state
stop_posture_engine:    session → latest_result → engine_state → ownership → session_metrics
push_posture_frame:     session (만)
start_background:       session → engine_state → ownership
```

**stop_posture_engine**이 5개 Mutex를 동시에 잡는 게 가장 위험.
현재는 UI에서 호출하지 않지만, `use-posture-engine.ts:229`의 cleanup effect가
`active=false` 전환 시 `stopPostureEngine()`을 호출하면 데드락 가능.

### 후보 2 (가능성 높음) — Tauri invoke 블로킹

`tauri-posture-engine.ts`의 `invoke()` 호출이 Rust 쪽에서 Mutex lock을 잡고 있으면
메인 스레드가 블록된다. Tauri IPC는 기본적으로 메인 스레드에서 처리되므로,
Rust command에서 lock을 오래 잡으면 webview 전체가 멈춤.

특히 `use-posture-engine.ts:112-127`에서 마운트 시 바로:
1. `getLatestPostureState()` — 3개 Mutex lock
2. 이어서 `startPostureEngine()` — 2개 Mutex lock

이게 `/main` 페이지 진입 시마다 실행됨.

### 후보 3 (가능성 중간) — Tauri 이벤트 리스너 경쟁

`use-posture-engine.ts:76-110`에서 마운트 시 3개의 `listen()`을 동시에 등록.
이벤트 구독이 완료되기 전에 Rust에서 `emit`이 들어오면
콜백이 Zustand store를 업데이트하면서 리렌더를 유발하고,
리렌더가 다시 effect를 트리거하는 루프 가능.

### 후보 4 (가능성 중간) — Auth bootstrap + posture engine 동시 실행

`/main` 진입 시:
1. `ProtectedRoute` → `useAuthBootstrap()` → API 호출 (네트워크)
2. `MainPage` → `useWindowVisibilitySync()`
3. `DashboardPage` → `WebcamPanel` → `usePostureEngine()`

Auth bootstrap의 `refreshAccessToken()`이 느리면(1초+)
posture engine 초기화가 동시에 진행되어 Tauri IPC가 병목.

### 후보 5 (가능성 낮음) — Webcam 권한 요청

`WebcamView`에서 `navigator.mediaDevices.getUserMedia()`를 호출하는데,
Tauri에서 카메라 권한 팝업이 뜨면 webview를 블록할 수 있음.
`capabilities/default.json`에 카메라 권한이 없으면 무한 대기.

## 권장 확인 순서

1. **Rust Mutex 순서 통일** — 모든 커맨드에서 같은 순서로 lock 획득
   (`session → engine_state → latest_result → ownership → metrics`)
2. **posture engine 초기화 지연** — auth bootstrap 완료 후 posture engine 시작
3. **Tauri async command** — `#[tauri::command]`에 `async` 추가해서
   메인 스레드 블로킹 방지
4. **카메라 권한 확인** — `src-tauri/capabilities/default.json`에
   `camera` 권한 있는지 확인
