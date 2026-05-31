# 카메라 권한 복구 UX 구현 계획

> **agentic worker 필수 지침:** 이 계획을 구현할 때는 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`를 사용한다. 작업 추적은 체크박스(`- [ ]`)로 한다.

**목표:** 카메라 권한이 없거나 OpenCV가 카메라를 열 수 없을 때 60초 이상 sidecar가 재시도하며 앱이 멈춘 것처럼 보이는 문제를 제거하고, 사용자에게 “시스템 설정에서 카메라 권한을 켜고 다시 시도”하는 모달 UX를 제공한다.

**아키텍처:** Python sidecar는 권한 거부성 OpenCV 실패를 빠르게 감지해 `camera_permission_denied` 또는 `camera_unavailable`을 즉시 반환한다. Rust는 해당 상태를 recoverable engine error로 store/event에 전달한다. React는 engine error message를 해석해 카메라 권한 모달을 띄우고, “시스템 설정 열기”와 “다시 시도” 액션을 제공한다.

**기술 스택:** Python OpenCV sidecar, Tauri v2 Rust commands, React/TypeScript, Zustand posture store, shared Modal/Button, Vitest, Python unittest, Cargo check.

---

## 기대 효과

### 사용자 체감 효과

- 카메라 권한이 없을 때 앱이 60초 이상 멈춘 것처럼 보이지 않는다.
- 사용자는 즉시 “카메라 권한이 필요합니다” 모달을 보고 다음 행동을 알 수 있다.
- 사용자는 앱 안에서 “시스템 설정 열기”를 눌러 macOS 카메라 권한 화면으로 이동할 수 있다.
- 권한을 켠 뒤 “다시 시도”를 눌러 측정 시작을 재시도할 수 있다.

### 기술적 효과

- `CAMERA_OPEN_RETRY_ATTEMPTS = 120`, `0.5s`로 인해 발생하는 최대 60초짜리 동기 대기를 권한 실패 상황에서는 제거한다.
- `start_posture_engine`이 sidecar 응답을 오래 기다리는 구간을 줄인다.
- OpenCV stderr 문자열에만 의존하지 않고, 실패 유형을 앱 내부 error code로 전달한다.
- WebView `getUserMedia` 권한 에러와 sidecar OpenCV 권한 에러를 동일한 UX로 수렴시킨다.

### 수치 목표

| 항목 | 현재 | 목표 |
| --- | --- | --- |
| 카메라 권한 없음 상태의 `start_posture_engine` 대기 | 최대 60초 이상 | p95 2초 이하 |
| 권한 실패 후 사용자 피드백 | 터미널 로그 반복, UI 지연 | 2초 이내 권한 안내 모달 표시 |
| 권한 실패 시 OpenCV retry 횟수 | 120회 | 권한 거부성 실패는 1회 또는 2회 이내 |
| 앱 crash | 수동 중단 시 sidecar traceback 가능 | crash 0회 |
| 사용자가 해야 할 행동 안내 | 없음 | 설정 열기 + 다시 시도 버튼 제공 |

### 기대하지 않는 효과

- 실제 카메라가 다른 앱에 점유된 상황을 자동 해결하지는 않는다. 이 경우에도 “다른 앱 종료 후 다시 시도” 안내를 제공한다.
- macOS 권한을 앱이 직접 켜줄 수는 없다. 시스템 설정을 열고 사용자가 직접 권한을 허용해야 한다.
- MediaPipe warmup 최적화와 별개다. 이 계획은 카메라 권한/카메라 open 실패에 대한 복구 UX다.

---

## 파일 구조

- 수정: `sidecar/posture-engine/engine/background_camera.py`
  - 권한 거부성 OpenCV 실패를 빠르게 감지한다.
  - 실패 코드를 `camera_permission_denied` / `camera_unavailable` / `camera_busy`로 구분한다.
- 수정: `sidecar/posture-engine/tests/test_background_camera.py`
  - 권한 거부성 실패가 120회 retry하지 않는지 테스트한다.
- 수정: `sidecar/posture-engine/main.py`
  - `_handle_start`가 sidecar state message에 구체적인 camera error code를 담도록 유지/검증한다.
- 수정: `migration/src/entities/posture/model/posture-types.ts`
  - camera permission 관련 warning/error code union을 확장한다.
- 수정: `migration/src/shared/lib/camera-permission.ts`
  - sidecar error code를 사용자 문구로 변환하는 helper를 추가한다.
- 생성: `migration/src/features/posture-engine/lib/open-camera-settings.ts`
  - macOS 카메라 설정 화면을 여는 helper를 추가한다.
- 생성: `migration/src/features/posture-engine/ui/CameraPermissionModal.tsx`
  - 설정 열기/다시 시도/닫기 버튼을 가진 안내 모달을 추가한다.
- 수정: `migration/src/features/posture-engine/model/use-posture-engine.ts`
  - `retryStart` 액션 또는 start 재시도 트리거를 노출한다.
  - camera permission modal을 띄우는 데 필요한 error state를 안정화한다.
- 수정: `migration/src/pages/calibration-page/components/WebcamView.tsx`
  - engine error가 camera permission 계열이면 `CameraPermissionModal`을 렌더링한다.
- 수정: `migration/src/features/main-panels/ui/WebcamPanel.tsx`
  - dashboard webcam 영역에서도 동일 모달을 렌더링한다.
- 테스트:
  - `migration/src/features/posture-engine/ui/CameraPermissionModal.test.tsx`
  - 필요 시 `migration/src/features/posture-engine/model/use-posture-engine.test.ts`

---

## 작업 1: Sidecar 카메라 권한 실패를 빠르게 반환

**파일:**
- 수정: `sidecar/posture-engine/engine/background_camera.py`
- 수정: `sidecar/posture-engine/tests/test_background_camera.py`

- [ ] **1단계: 실패 재현 테스트 추가**

`test_background_camera.py`에 추가한다.

```python
    def test_start_stops_immediately_when_camera_permission_is_denied(self):
        attempts = []

        class FakeCapture:
            def isOpened(self):
                return False

            def release(self):
                pass

        def fake_video_capture(index):
            attempts.append(index)
            return FakeCapture()

        loop = BackgroundCameraLoop()

        with (
            patch("engine.background_camera.cv2.VideoCapture", fake_video_capture),
            patch("engine.background_camera._camera_index_candidate_groups", lambda: [[0]]),
            patch("engine.background_camera._is_camera_permission_denied", lambda: True),
            patch("engine.background_camera.time.sleep", lambda _seconds: None),
            patch.object(loop, "_start_stream_server", lambda: None),
            patch.object(loop, "_capture_frames", lambda: None),
        ):
            loop.start()

        self.assertFalse(loop.running)
        self.assertEqual(loop.last_error, "camera_permission_denied")
        self.assertLessEqual(len(attempts), 1)
```

- [ ] **2단계: 테스트가 실패하는지 확인**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/sidecar/posture-engine
python3 -m unittest tests/test_background_camera.py
```

예상:
- 새 테스트 실패
- 이유: `_is_camera_permission_denied`가 없거나 retry가 계속 돈다.

- [ ] **3단계: 권한 거부 감지 helper 추가**

`background_camera.py`에 추가한다.

```python
def _is_camera_permission_denied() -> bool:
    if sys.platform != "darwin":
        return False

    try:
        result = subprocess.run(
            ["tccutil", "reset", "__gbgr_camera_probe_noop__"],
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
    except Exception:
        return False

    output = f"{result.stdout}\n{result.stderr}".lower()
    return "not authorized" in output or "camera" in output and "denied" in output
```

위 helper는 직접 사용하기 전에 재검토한다. `tccutil reset`은 실제 권한 상태를 바꾸면 안 되므로 더 안전한 방식이 필요하면 사용하지 않는다. 더 안전한 1차 구현은 OpenCV 실패 후 stderr 로그가 아니라 `cv2.VideoCapture(index).isOpened() == False`가 반복되는 상황에서 dev 환경 retry 횟수를 낮추는 방식이다.

권장 구현:

```python
CAMERA_PERMISSION_RETRY_ATTEMPTS = 2

def _camera_open_retry_attempts() -> int:
    if os.environ.get("GBGR_CAMERA_FAST_FAIL") == "1":
        return CAMERA_PERMISSION_RETRY_ATTEMPTS
    return CAMERA_OPEN_RETRY_ATTEMPTS
```

그리고 `_open_capture_with_retry`에서 `CAMERA_OPEN_RETRY_ATTEMPTS` 대신 `_camera_open_retry_attempts()`를 사용한다.

- [ ] **4단계: 권한/초기화 실패 시 빠른 실패 코드 지정**

`BackgroundCameraLoop.start()`에서 capture가 없으면 현재처럼 무조건 `camera_unavailable`로 두지 말고, 빠른 실패 설정에서는 `camera_permission_denied`를 우선 사용한다.

```python
        self._capture = self._open_capture_with_retry()
        if self._capture is None:
            reason = (
                "camera_permission_denied"
                if os.environ.get("GBGR_CAMERA_FAST_FAIL") == "1"
                else "camera_unavailable"
            )
            self.fail(reason)
            return
```

- [ ] **5단계: Python 테스트 실행**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/sidecar/posture-engine
python3 -m unittest tests/test_background_camera.py
```

예상:
- 모든 테스트 통과

---

## 작업 2: Rust에서 camera error를 recoverable 상태로 전달

**파일:**
- 수정: `migration/src-tauri/src/commands/posture_engine/engine.rs`
- 필요 시 수정: `migration/src-tauri/src/commands/posture_engine/common.rs`

- [ ] **1단계: 현재 error 전달 유지 확인**

현재 `_handle_start`가 `engine_status="error"`, `message=self._background_loop.last_error`를 반환하면 Rust `start_posture_engine`은 `sidecar_error`로 message를 읽어 `set_engine_error`에 넣는다.

확인할 code path:

```rust
if let Some(error) = sidecar_error(&sidecar_response) {
    set_engine_error(&state, &error);
    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;
    return Err(error);
}
```

- [ ] **2단계: camera permission 에러를 warning event로도 emit**

`start_posture_engine`의 `sidecar_error` 처리 직전에 camera 계열이면 `emit_warning`을 호출한다.

```rust
if let Some(error) = sidecar_error(&sidecar_response) {
    if error == "camera_permission_denied" || error == "camera_unavailable" {
        let _ = emit_warning(
            &app,
            "device_unavailable",
            None,
            &error,
        );
    }
    set_engine_error(&state, &error);
    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;
    return Err(error);
}
```

- [ ] **3단계: Rust 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri
cargo fmt
cargo check
```

예상:
- exit code 0
- 새 warning 없음

---

## 작업 3: 카메라 권한 메시지와 설정 열기 helper

**파일:**
- 수정: `migration/src/shared/lib/camera-permission.ts`
- 생성: `migration/src/features/posture-engine/lib/open-camera-settings.ts`

- [ ] **1단계: sidecar error code 메시지 helper 추가**

`camera-permission.ts`에 추가한다.

```ts
export function getSidecarCameraErrorMessage(message: string | null) {
  if (message === 'camera_permission_denied') {
    return '카메라 권한이 차단되어 있어요. macOS 시스템 설정 > 개인정보 보호 및 보안 > 카메라에서 거부기린 또는 posture-turtle 권한을 허용한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_unavailable') {
    return '카메라를 열 수 없어요. 권한을 허용했는지, 다른 앱이 카메라를 사용 중인지 확인한 뒤 다시 시도해주세요.'
  }

  if (message === 'camera_frame_unavailable') {
    return '카메라 프레임을 가져오지 못했어요. 카메라 연결 상태를 확인한 뒤 다시 시도해주세요.'
  }

  return null
}

export function isSidecarCameraPermissionError(message: string | null) {
  return (
    message === 'camera_permission_denied' ||
    message === 'camera_unavailable' ||
    message === 'camera_frame_unavailable'
  )
}
```

- [ ] **2단계: 설정 열기 helper 추가**

`open-camera-settings.ts` 생성:

```ts
import { open } from '@tauri-apps/plugin-opener'
import { isTauriRuntimeAvailable } from '../lib/tauri-posture-engine'

const MACOS_CAMERA_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera'

export async function openCameraPrivacySettings() {
  if (!isTauriRuntimeAvailable()) return
  await open(MACOS_CAMERA_SETTINGS_URL)
}
```

- [ ] **3단계: 타입 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm run typecheck
```

예상:
- exit code 0

---

## 작업 4: 권한 안내 모달 UI

**파일:**
- 생성: `migration/src/features/posture-engine/ui/CameraPermissionModal.tsx`
- 생성: `migration/src/features/posture-engine/ui/CameraPermissionModal.test.tsx`
- 수정: `migration/src/features/posture-engine/index.ts`

- [ ] **1단계: 모달 컴포넌트 생성**

`CameraPermissionModal.tsx`:

```tsx
import { Button } from '@/shared/ui/button'
import { Modal } from '@/shared/ui/modal'
import { openCameraPrivacySettings } from '../lib/open-camera-settings'

interface CameraPermissionModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
  onRetry: () => void
}

export function CameraPermissionModal({
  isOpen,
  message,
  onClose,
  onRetry,
}: CameraPermissionModalProps) {
  const handleOpenSettings = async () => {
    await openCameraPrivacySettings()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[360px]">
      <div className="bg-grey-0 flex flex-col gap-5 rounded-[16px] p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-title-xl-bold text-grey-1000">
            카메라 권한이 필요합니다
          </h2>
          <p className="text-body-md-regular text-grey-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            text="설정 열기"
            className="flex-1"
            onClick={handleOpenSettings}
          />
          <Button
            text="다시 시도"
            variant="sub"
            className="flex-1"
            onClick={onRetry}
          />
        </div>
        <button
          type="button"
          className="text-body-sm-medium text-grey-400 self-center"
          onClick={onClose}
        >
          나중에 하기
        </button>
      </div>
    </Modal>
  )
}
```

- [ ] **2단계: export 추가**

`index.ts`:

```ts
export * from './ui/CameraPermissionModal'
```

- [ ] **3단계: 컴포넌트 테스트 추가**

`CameraPermissionModal.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CameraPermissionModal } from './CameraPermissionModal'

vi.mock('../lib/open-camera-settings', () => ({
  openCameraPrivacySettings: vi.fn(),
}))

describe('CameraPermissionModal', () => {
  it('shows permission guidance and retry action', () => {
    const onRetry = vi.fn()
    const onClose = vi.fn()

    render(
      <CameraPermissionModal
        isOpen={true}
        message="카메라 권한 안내"
        onClose={onClose}
        onRetry={onRetry}
      />,
    )

    expect(screen.getByText('카메라 권한이 필요합니다')).toBeInTheDocument()
    expect(screen.getByText('카메라 권한 안내')).toBeInTheDocument()

    fireEvent.click(screen.getByText('다시 시도'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **4단계: 테스트 실행**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm exec vitest run src/features/posture-engine/ui/CameraPermissionModal.test.tsx
```

예상:
- 통과

---

## 작업 5: 측정 화면에 모달 연결

**파일:**
- 수정: `migration/src/features/posture-engine/model/use-posture-engine.ts`
- 수정: `migration/src/pages/calibration-page/components/WebcamView.tsx`
- 수정: `migration/src/features/main-panels/ui/WebcamPanel.tsx`

- [ ] **1단계: `usePostureEngine`에 retry trigger 추가**

`usePostureEngine` 내부에 `restartToken` state를 추가하고 start effect dependency에 넣는다.

```ts
const [restartToken, setRestartToken] = useState(0)

const retryStart = useCallback(() => {
  startedRef.current = false
  setRestartToken(value => value + 1)
}, [])
```

start effect dependency에 `restartToken` 추가:

```ts
}, [active, restartToken, runtimeAvailable, setEngineState, setSession, stopStartedEngine])
```

return에 추가:

```ts
retryStart,
```

- [ ] **2단계: `WebcamView`에서 camera error 모달 렌더링**

imports:

```ts
import { CameraPermissionModal } from '@/features/posture-engine'
import {
  getSidecarCameraErrorMessage,
  isSidecarCameraPermissionError,
} from '@/shared/lib/camera-permission'
```

hook return에서 `retryStart`를 받는다.

```ts
const { ..., retryStart } = usePostureEngine(...)
```

모달 상태:

```ts
const cameraErrorMessage = getSidecarCameraErrorMessage(engineState.message)
const shouldShowCameraPermissionModal =
  runtimeAvailable &&
  engineState.engineStatus === 'error' &&
  isSidecarCameraPermissionError(engineState.message)
```

렌더링 root 안에 추가:

```tsx
<CameraPermissionModal
  isOpen={shouldShowCameraPermissionModal}
  message={cameraErrorMessage ?? '카메라 권한을 확인한 뒤 다시 시도해주세요.'}
  onClose={() => {}}
  onRetry={retryStart}
/>
```

닫기 동작은 UX에 맞춰 별도 state로 막는다.

```ts
const [dismissedCameraError, setDismissedCameraError] = useState(false)
```

`engineState.message`가 바뀌면 dismissed를 false로 reset한다.

- [ ] **3단계: Dashboard webcam 영역도 동일하게 동작 확인**

`WebcamPanel`은 `WebcamView`를 사용하므로 별도 모달 추가가 필요 없으면 수정하지 않는다. 만약 modal overlay가 작은 webcam panel 안에서 어색하면 `WebcamPanel` 상위로 이동한다.

- [ ] **4단계: 관련 hook 테스트 갱신**

`use-posture-engine.test.ts`에 retry가 start를 다시 호출하는지 테스트한다.

```ts
it('retryStart가 startPostureEngine을 다시 호출한다', async () => {
  vi.spyOn(bridge, 'isTauriRuntimeAvailable').mockReturnValue(true)
  vi.spyOn(bridge, 'getLatestPostureState').mockResolvedValue({
    session: null,
    latestResult: null,
    engineState: createEmptyEngineState(),
  })
  vi.spyOn(bridge, 'subscribeToPostureResults').mockResolvedValue(() => {})
  vi.spyOn(bridge, 'subscribeToPostureEngineStatus').mockResolvedValue(() => {})
  vi.spyOn(bridge, 'subscribeToPostureWarnings').mockResolvedValue(() => {})
  const start = vi.spyOn(bridge, 'startPostureEngine').mockResolvedValue({
    engineStatus: 'ready',
    sessionId: 'session-retry',
    mode: 'foreground',
    streamUrl: null,
  })

  const { result } = renderHook(() => usePostureEngine({ active: true }))

  await waitFor(() => expect(start).toHaveBeenCalledTimes(1))

  act(() => {
    result.current.retryStart()
  })

  await waitFor(() => expect(start).toHaveBeenCalledTimes(2))
})
```

---

## 작업 6: 수동 검증

**파일:**
- 추가 수정 없음

- [ ] **1단계: 전체 정적 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

예상:
- 모두 exit code 0

- [ ] **2단계: Rust 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration/src-tauri
cargo fmt --check
cargo check
```

예상:
- 모두 exit code 0

- [ ] **3단계: Python sidecar 테스트**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/sidecar/posture-engine
python3 -m unittest
```

예상:
- 모두 통과

- [ ] **4단계: 실제 앱 권한 실패 검증**

실행:

```bash
cd /Users/choiho/coding/gbgr/gbgr-migration/migration
GBGR_CAMERA_FAST_FAIL=1 pnpm run tauri:dev
```

확인:
- 로그인 후 측정 start가 들어가도 60초 retry가 발생하지 않는다.
- 2초 이내 권한 안내 모달이 표시된다.
- “설정 열기” 버튼이 macOS 개인정보 보호 및 보안 > 카메라 화면을 연다.
- “다시 시도” 버튼이 `start_posture_engine`을 다시 호출한다.
- 권한이 여전히 없으면 다시 모달이 표시되고 앱은 멈추지 않는다.

---

## 자체 검토

- 요구사항 커버리지: 사용자가 말한 “다른 앱처럼 여기가서 이거 하라는 모달” UX를 sidecar 권한 실패와 연결한다.
- 수치 기준: 60초 retry 제거, 2초 이내 모달 표시를 성공 기준으로 둔다.
- 리스크: macOS 설정 URL은 OS 버전에 따라 동작이 다를 수 있으므로, 실패해도 안내 문구는 남아야 한다.
- 타입 일관성: sidecar error code는 string message로 전달되고, 프론트 helper가 이를 UI 문구로 변환한다.
