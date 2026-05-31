# 자세 엔진 Warmup 구현 계획

> **agentic worker 필수 지침:** 이 계획을 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 작업 추적은 체크박스(`- [ ]`)로 한다.

**목표:** 사용자가 측정을 시작할 때 MediaPipe 초기화 비용을 기다리지 않도록, 자세 엔진 detector를 앱 시작 이후 미리 예열한다.

**아키텍처:** Python sidecar에 `warmup` 명령을 추가해 sidecar 프로세스와 MediaPipe `PoseDetector`만 초기화하고, 카메라는 열지 않는다. Tauri command와 TypeScript bridge를 추가해 앱 mount 이후 fire-and-forget 방식으로 warmup을 시작한다. 기존 stdin/stdout 기반 단일 request/response 프로토콜은 유지한다.

**기술 스택:** Tauri v2 Rust command, React/TypeScript bridge hook, Python sidecar, MediaPipe Pose Landmarker, Vitest, Cargo check.

---

## 기대 효과

### 사용자 체감 효과

- 측정 화면이나 보정 화면에 처음 진입할 때, MediaPipe import/model 생성 비용 때문에 화면이 멈춘 것처럼 보이는 시간이 줄어든다.
- 앱이 켜진 뒤 사용자가 실제로 측정을 누르기 전까지의 유휴 시간에 MediaPipe 초기화가 진행되므로, 측정 시작 버튼을 누른 시점의 대기 시간이 짧아진다.
- warmup 중에도 첫 window 렌더링과 라우팅은 먼저 완료되므로, 앱 실행 직후 “아무 반응이 없는 느낌”을 줄일 수 있다.
- warmup이 끝난 상태에서는 `start_posture_engine`이 카메라 open 중심 작업만 수행하게 되어, cold start 대비 시작 응답이 빨라진다.

### 기술적 효과

- 현재 `start_posture_engine` 안에 섞여 있는 비용 중 `sidecar spawn + MediaPipe import + PoseLandmarker.create_from_options`를 사전 단계로 분리한다.
- 카메라를 열지 않는 warmup을 사용하므로, 앱 시작 직후부터 macOS 카메라 indicator가 켜지거나 다른 앱과 카메라 점유 충돌이 나는 일을 피한다.
- warmup이 완료된 sidecar를 그대로 재사용하므로, 실제 측정 시작 시 sidecar 프로세스를 중복 spawn하지 않는다.
- 기존 stdin/stdout request-response 구조를 유지하므로, sidecar protocol 전체를 job/event 기반으로 갈아엎지 않고도 첫 시작 지연을 줄인다.

### 기대하지 않는 효과

- 카메라 open 자체가 느린 경우까지 완전히 해결하지는 못한다. 이 계획은 MediaPipe 초기화 지연을 먼저 분리하는 작업이다.
- 보정 중 `calibrate_camera_frame` 요청이 100ms마다 쌓이는 문제는 별도 개선 대상이다.
- sidecar가 단일 mutex와 단일 Python 루프로 직렬 처리되는 구조는 유지된다. 따라서 장기적으로는 command queue, status polling, job/event 구조를 따로 검토해야 한다.

### 성공 기준

- warmup 중 카메라 indicator가 켜지지 않는다.
- warmup 완료 후 첫 `start_posture_engine`에서 MediaPipe 초기화 로그/지연이 반복되지 않는다.
- cold start 상태와 warmup 완료 상태를 비교했을 때, 측정 시작 버튼 클릭 후 `ready` 또는 stream 표시까지 걸리는 시간이 유의미하게 줄어든다.
- warmup 실패 시에도 앱이 crash하지 않고 기존 start 경로 또는 error 상태로 복구 가능하다.

### 수치 목표

아래 수치는 “보장값”이 아니라 구현 성공 여부를 판정하기 위한 목표값이다. 최종 판단은 동일 기기에서 cold start 10회, warmup 완료 후 start 10회를 측정해 비교한다.

| 항목 | 현재 문제 구간 | 목표 수치 | 측정 방법 |
| --- | --- | --- | --- |
| 앱 첫 화면 표시 | 앱 시작 직후 MediaPipe 초기화가 UI 체감 대기와 겹칠 수 있음 | 첫 window 표시가 warmup 완료를 기다리지 않음, `RootLayout` mount 후 300ms 이내 warmup 호출 시작 | 프론트 `performance.now()` 로그 |
| warmup 중 카메라 사용 | warmup이 카메라까지 열면 안 됨 | 카메라 indicator 점등 0회 | macOS 카메라 indicator 수동 확인 |
| MediaPipe warmup 시간 | 기존에는 `start_posture_engine` 내부에 포함 | 별도 `warmup_posture_engine`에서만 1회 발생 | Python/Rust 로그 timestamp |
| warmup 후 측정 시작 응답 | MediaPipe 초기화가 이미 끝난 상태여야 함 | `start_posture_engine` 호출부터 응답까지 p50 1.2초 이하, p95 2.0초 이하 | 10회 측정 |
| cold start 대비 개선율 | 첫 측정 시작 때 MediaPipe 초기화까지 기다림 | `start_posture_engine` 응답 시간 60% 이상 감소 | cold 10회 평균 vs warm 10회 평균 |
| sidecar 중복 spawn | warmup과 start가 각각 sidecar를 띄우면 안 됨 | 측정 시작 시 추가 sidecar spawn 0회 | Rust spawn 로그 또는 프로세스 수 확인 |
| warmup 실패 복구 | warmup 실패가 앱 전체 실패로 번지면 안 됨 | 앱 crash 0회, error state 1회 이하, 수동 재시도 가능 | 실패 환경에서 수동 확인 |

성공 판정:

- 필수 통과: 카메라 indicator 0회, sidecar 중복 spawn 0회, 앱 crash 0회.
- 성능 통과: warmup 후 `start_posture_engine` p50 1.2초 이하이거나, cold start 평균 대비 60% 이상 감소.
- 재검토 필요: warmup 후에도 p95가 2.0초를 넘으면 MediaPipe가 아니라 카메라 open 또는 sidecar 직렬 queue가 병목인지 추가 계측한다.

---

## 파일 구조

- 수정: `sidecar/posture-engine/main.py`
  - `warmup` command를 추가하고, 카메라를 열지 않는 `_handle_warmup()`을 구현한다.
- 수정: `migration/src-tauri/src/state/posture_engine_state/contracts.rs`
  - `WarmupPostureEngineResponse`를 추가한다.
- 수정: `migration/src-tauri/src/commands/posture_engine/engine.rs`
  - `warmup_posture_engine` Tauri command를 추가한다.
  - sidecar가 없으면 spawn하고, `warmup`을 보낸 뒤 engine 상태만 갱신한다.
  - 세션 생성이나 측정 worker 시작은 하지 않는다.
- 수정: `migration/src-tauri/src/commands/posture_engine/mod.rs`
  - `warmup_posture_engine`을 export한다.
- 수정: `migration/src-tauri/src/lib.rs`
  - `warmup_posture_engine`을 Tauri invoke handler에 등록한다.
- 수정: `migration/src/entities/posture/model/posture-types.ts`
  - 프론트 응답 타입을 추가한다.
- 수정: `migration/src/features/posture-engine/lib/tauri-posture-engine.ts`
  - `warmupPostureEngine()` bridge 함수를 추가한다.
- 생성: `migration/src/features/posture-engine/model/use-posture-engine-warmup.ts`
  - 앱에서 한 번만 warmup을 실행하는 hook을 추가한다.
- 수정: `migration/src/features/posture-engine/index.ts`
  - warmup hook을 export한다.
- 수정: `migration/src/app/layouts/RootLayout.tsx`
  - widget route가 아닐 때 warmup hook을 호출한다.
  - 앱 시작 직후 카메라까지 여는 기존 autostart 호출은 제거한다.
- 생성: `migration/src/features/posture-engine/model/use-posture-engine-warmup.test.ts`
  - 한 번만 실행되는지, Tauri 외부에서는 실행되지 않는지 검증한다.

---

## 작업 1: Python Sidecar Warmup Command

**파일:**
- 수정: `sidecar/posture-engine/main.py`

- [ ] **1단계: 구현 전 현재 동작 확인**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration
printf '{"command":"warmup"}\n' | python sidecar/posture-engine/main.py
```

구현 전 예상:

```json
{"error": "unknown_command"}
```

- [ ] **2단계: `warmup` command dispatch 추가**

`PostureEngineService.handle` 안에 calibration command보다 앞쪽에 추가한다.

```python
        if command == "warmup":
            return self._handle_warmup()
```

- [ ] **3단계: `_handle_warmup` 구현**

`_handle_start` 근처에 추가한다.

```python
    def _handle_warmup(self) -> dict[str, Any]:
        if not self._detector_initialized:
            self._detector_initialized = self._detector.initialize()

        if not self._detector_initialized:
            self._state.engine_status = "error"
            self._state.message = self._detector.last_error or "detector_initialization_failed"
            self._state.recoverable = True
            self._state.updated_at = str(int(time.time()))
            return asdict(self._state)

        self._state.engine_status = "ready"
        self._state.updated_at = str(int(time.time()))
        self._state.message = None
        self._state.recoverable = True
        return asdict(self._state)
```

주의:
- `self._background_loop.start()`를 호출하지 않는다.
- warmup은 카메라를 열면 안 된다.
- 목적은 MediaPipe import/model 초기화 비용을 미리 치르는 것이다.

- [ ] **4단계: warmup command 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration
printf '{"command":"warmup"}\n' | python sidecar/posture-engine/main.py
```

구현 후 예상:

```json
{"engine_status": "ready", "mode": "foreground", "camera_owner": "none", ...}
```

로컬 Python 환경에 MediaPipe나 model 파일이 없으면 `engine_status: "error"`가 나올 수 있다. 이 경우에도 command가 인식되고, 카메라를 열지 않는 것이 핵심이다.

---

## 작업 2: Tauri Warmup Command

**파일:**
- 수정: `migration/src-tauri/src/state/posture_engine_state/contracts.rs`
- 수정: `migration/src-tauri/src/commands/posture_engine/engine.rs`
- 수정: `migration/src-tauri/src/commands/posture_engine/mod.rs`
- 수정: `migration/src-tauri/src/lib.rs`

- [ ] **1단계: Rust 응답 contract 추가**

`contracts.rs`에서 `StartPostureEngineResponse` 근처에 추가한다.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarmupPostureEngineResponse {
    pub engine_status: String,
    pub message: Option<String>,
}
```

- [ ] **2단계: command에서 응답 타입 import**

`engine.rs`의 posture engine state import 목록에 추가한다.

```rust
WarmupPostureEngineResponse,
```

- [ ] **3단계: `warmup_posture_engine` 구현**

`engine.rs`에서 `start_posture_engine` 앞에 추가한다.

```rust
#[tauri::command]
pub fn warmup_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<WarmupPostureEngineResponse, String> {
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if sidecar_guard.is_none() {
            let handle = spawn_with_debug_fallback()?;
            *sidecar_guard = Some(handle);
        }
    }

    let response = match sidecar_send(&state, &serde_json::json!({"command": "warmup"})) {
        Ok(response) => response,
        Err(error) => {
            handle_sidecar_failure(&app, &state, &error);
            return Err(error);
        }
    };

    let message = response
        .get("message")
        .and_then(|v| v.as_str())
        .map(String::from);

    {
        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        engine_guard.engine_status = engine_status_from_response(&response, "ready");
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::None;
        engine_guard.updated_at = now_iso();
        engine_guard.message = message.clone();
        engine_guard.recoverable = true;
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    if let Some(error) = sidecar_error(&response) {
        return Err(error);
    }

    Ok(WarmupPostureEngineResponse {
        engine_status: engine_status_from_response(&response, "ready"),
        message,
    })
}
```

주의:
- 세션을 만들지 않는다.
- `spawn_camera_measurement_worker`를 호출하지 않는다.
- `camera_owner`는 `None`으로 둔다.

- [ ] **4단계: export와 invoke handler 등록**

`mod.rs`:

```rust
pub use engine::{
    get_latest_posture_state, start_posture_engine, stop_posture_engine, warmup_posture_engine,
};
```

`lib.rs` import와 `generate_handler!` 목록에 추가:

```rust
warmup_posture_engine,
```

- [ ] **5단계: Rust 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri
cargo fmt
cargo check
```

예상:
- `cargo check` exit code 0
- 새 warning 없음

---

## 작업 3: TypeScript Bridge와 Warmup Hook

**파일:**
- 수정: `migration/src/entities/posture/model/posture-types.ts`
- 수정: `migration/src/features/posture-engine/lib/tauri-posture-engine.ts`
- 생성: `migration/src/features/posture-engine/model/use-posture-engine-warmup.ts`
- 수정: `migration/src/features/posture-engine/index.ts`

- [ ] **1단계: TS 응답 타입 추가**

`posture-types.ts`에서 `StartPostureEngineResponse` 뒤에 추가한다.

```ts
export interface WarmupPostureEngineResponse {
  engineStatus: Extract<PostureEngineStatus, 'ready' | 'error'>
  message: string | null
}
```

- [ ] **2단계: bridge 함수 추가**

`tauri-posture-engine.ts`에서 `WarmupPostureEngineResponse`를 import하고 아래 함수를 추가한다.

```ts
export async function warmupPostureEngine() {
  if (!isTauriRuntimeAvailable()) {
    return {
      engineStatus: 'error',
      message: 'tauri_runtime_unavailable',
    } satisfies WarmupPostureEngineResponse
  }

  return invoke<WarmupPostureEngineResponse>('warmup_posture_engine')
}
```

- [ ] **3단계: warmup hook 추가**

`use-posture-engine-warmup.ts` 생성:

```ts
import { useEffect } from 'react'
import { usePostureEngineStore } from '@/entities/posture'
import {
  isTauriRuntimeAvailable,
  warmupPostureEngine,
} from '../lib/tauri-posture-engine'

let warmupInFlight = false
let warmupCompleted = false

export function usePostureEngineWarmup(enabled: boolean) {
  const engineStatus = usePostureEngineStore(
    state => state.engineState.engineStatus,
  )
  const setEngineState = usePostureEngineStore(state => state.setEngineState)

  useEffect(() => {
    if (!enabled) return
    if (!isTauriRuntimeAvailable()) return
    if (warmupInFlight || warmupCompleted) return
    if (engineStatus !== 'idle') return

    warmupInFlight = true

    void warmupPostureEngine()
      .then(response => {
        warmupCompleted = response.engineStatus === 'ready'
        setEngineState({
          engineStatus: response.engineStatus,
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: response.message,
          recoverable: true,
        })
      })
      .catch(error => {
        setEngineState({
          engineStatus: 'error',
          mode: 'foreground',
          cameraOwner: 'none',
          updatedAt: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error),
          recoverable: true,
        })
      })
      .finally(() => {
        warmupInFlight = false
      })
  }, [enabled, engineStatus, setEngineState])
}

export function resetPostureEngineWarmupForTest() {
  warmupInFlight = false
  warmupCompleted = false
}
```

- [ ] **4단계: hook export**

`migration/src/features/posture-engine/index.ts`에 추가:

```ts
export {
  resetPostureEngineWarmupForTest,
  usePostureEngineWarmup,
} from './model/use-posture-engine-warmup'
```

---

## 작업 4: 앱 Mount 이후 Warmup 시작

**파일:**
- 수정: `migration/src/app/layouts/RootLayout.tsx`

- [ ] **1단계: hook import**

posture engine import를 아래처럼 갱신한다.

```ts
import { usePostureEngine, usePostureEngineWarmup } from '@/features/posture-engine'
```

- [ ] **2단계: RootLayout에서 warmup만 호출**

`RootLayout` 내부에서 기존 hook 호출부를 아래처럼 정리한다. `useAutoStartPostureEngine`은 카메라까지 여는 경로이므로 여기서는 호출하지 않는다.

```ts
  usePostureEngine({ active: false })
  usePostureEngineWarmup(!isWidgetRoute)
```

예상 동작:
- 첫 화면 렌더링이 먼저 진행된다.
- warmup은 React effect에서 비동기로 시작된다.
- warmup 중 카메라 indicator가 켜지면 안 된다.
- 실제 카메라는 측정 화면에서 `usePostureEngine({ active: true })`가 호출될 때 열린다.

---

## 작업 5: 테스트

**파일:**
- 생성: `migration/src/features/posture-engine/model/use-posture-engine-warmup.test.ts`
- 필요 시 수정: `migration/src/features/posture-engine/model/use-auto-start-posture-engine.test.ts`

- [ ] **1단계: warmup hook 테스트 추가**

`use-posture-engine-warmup.test.ts` 생성:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePostureEngineStore } from '@/entities/posture'
import * as bridge from '../lib/tauri-posture-engine'
import {
  resetPostureEngineWarmupForTest,
  usePostureEngineWarmup,
} from './use-posture-engine-warmup'

describe('usePostureEngineWarmup', () => {
  beforeEach(() => {
    usePostureEngineStore.getState().reset()
    resetPostureEngineWarmupForTest()
    vi.restoreAllMocks()
  })

  it('enabled이고 idle이면 sidecar를 한 번만 warmup한다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
    const warmup = vi.spyOn(bridge, 'warmupPostureEngine').mockResolvedValue({
      engineStatus: 'ready',
      message: null,
    })

    renderHook(() => usePostureEngineWarmup(true))

    await waitFor(() => {
      expect(warmup).toHaveBeenCalledTimes(1)
    })
    expect(usePostureEngineStore.getState().engineState).toMatchObject({
      engineStatus: 'ready',
      cameraOwner: 'none',
    })
  })

  it('Tauri 런타임이 아니면 warmup하지 않는다', async () => {
    vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(false)
    const warmup = vi.spyOn(bridge, 'warmupPostureEngine')

    renderHook(() => usePostureEngineWarmup(true))

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(warmup).not.toHaveBeenCalled()
  })
})
```

- [ ] **2단계: 관련 테스트 실행**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm exec vitest run src/features/posture-engine/model/use-posture-engine-warmup.test.ts src/features/posture-engine/model/use-auto-start-posture-engine.test.ts
```

예상:
- 모든 테스트 통과

---

## 작업 6: 최종 검증과 수동 타이밍 확인

**파일:**
- 검증 중 결함이 발견되지 않으면 추가 수정 없음

- [ ] **1단계: 프론트 정적 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

예상:
- 모든 command exit code 0

- [ ] **2단계: Rust 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri
cargo fmt --check
cargo check
```

예상:
- 두 command 모두 exit code 0
- 새 warning 없음

- [ ] **3단계: 수동 dev 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm run tauri:dev
```

확인 항목:
- 앱 첫 window가 MediaPipe warmup 완료 전에 먼저 표시된다.
- warmup 중 macOS 카메라 indicator가 켜지지 않는다.
- warmup 완료 후 측정 화면에 들어가면 cold start보다 빠르게 시작된다.
- warmup 중 측정 화면에 들어가도 앱이 crash하지 않는다.
- warmup으로 sidecar가 이미 떠 있으면 `start_posture_engine`이 sidecar를 중복 spawn하지 않는다.

---

## 자체 검토

- 요구사항 커버리지: 사용자가 지적한 “처음 sidecar 붙을 때 MediaPipe 초기화가 오래 걸리는 문제”를 카메라와 분리된 warmup으로 해결한다.
- placeholder 검사: `TBD`, `TODO`, “나중에 구현” 같은 미정 항목 없음.
- 타입 일관성: Rust `WarmupPostureEngineResponse`는 serde camelCase로 TS `WarmupPostureEngineResponse`와 매핑된다. command 이름은 전체 문서에서 `warmup_posture_engine`으로 통일했다.
