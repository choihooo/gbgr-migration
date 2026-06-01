# Data Model: Camera Lifecycle State

## CameraLifecycle

Authoritative renderer-facing camera lifecycle record.

**Fields**

- `intent`: `CameraIntent`
- `runtime`: `CameraRuntimeStatus`
- `streamUrl`: string or null
- `errorCode`: `CameraLifecycleErrorCode` or null
- `updatedAt`: ISO timestamp string

**Validation Rules**

- `streamUrl` must be null unless `runtime` is `ready`.
- `errorCode` must be null unless `runtime` is `error`.
- Runtime stream state must not be persisted across reloads.
- A camera is live only when `intent` is `show`, `runtime` is `ready`, and `streamUrl` is non-null.
- App restart or reload initializes runtime readiness to `idle`; persisted `show` intent alone does not start camera capture.
- A camera preparation failure preserves `show` intent, sets `runtime` to `error`, clears `streamUrl`, and keeps retry available.
- Main-screen `hide` pauses measurement and clears camera runtime to `idle`.

**State Transitions**

```text
exit/idle
  - user show request -> show/starting
  - user hide request -> hide/idle

show/starting
  - stream ready -> show/ready
  - start failed -> show/error
  - user hide request -> hide/stopping -> hide/idle; measurement paused; late start success ignored
  - user exit request -> exit/stopping -> exit/idle; late start success ignored

show/ready
  - user hide request -> hide/stopping -> hide/idle; measurement paused
  - user exit request -> exit/stopping -> exit/idle
  - stream failure -> show/error
  - retry/start refresh -> show/starting

hide/idle
  - user show request -> show/starting; measurement resumes after stream ready
  - user exit request -> exit/idle

show/error
  - retry -> show/starting
  - user hide request -> hide/idle
  - user exit request -> exit/idle

app restart or reload
  - any persisted intent -> same intent/idle with streamUrl null
```

## CameraIntent

User's explicit camera mode.

**Values**

- `show`: User wants camera preview and camera-dependent active UI visible.
- `hide`: User explicitly hid the camera from the main preview control.
- `exit`: User ended or has not started the camera/measurement flow.

**Rules**

- Window hidden, minimized, blurred, or backgrounded must not change this value.
- Toggle controls may update intent, but cannot directly mark runtime as ready.
- Calibration route entry may request camera preparation for that route without changing the main screen's persisted intent.

## CameraRuntimeStatus

Actual camera readiness for UI activation.

**Values**

- `idle`: No usable runtime camera stream is active.
- `starting`: A camera start or resume attempt is in progress.
- `ready`: A usable stream is available.
- `stopping`: Camera stop, hide cleanup, or exit cleanup is in progress.
- `error`: Camera start or stream readiness failed.

**Rules**

- `ready` requires a usable stream reference.
- `starting`, `stopping`, `idle`, and `error` must not be treated as live camera states.
- In-flight start results that complete after intent changes to `hide` or `exit` must not transition runtime to `ready`.

## CameraLifecycleErrorCode

Normalized failure reason for user-facing recovery.

**Values**

- `camera_permission_denied`
- `camera_unavailable`
- `camera_busy`
- `camera_frame_unavailable`
- `camera_api_unavailable`
- `camera_stream_unauthorized`
- `camera_unknown`

**Rules**

- Error codes are user-actionable categories, not raw native exception payloads.
- Unexpected failures map to `camera_unknown`.

## Derived Selectors

### isCameraLive

```text
intent == show AND runtime == ready AND streamUrl exists
```

Used by:

- Running panel background play/pause
- Running panel character video vs rest image
- Webcam preview active state
- Any future camera-dependent active UI

### isCameraPreparing

```text
intent == show AND runtime == starting
```

Used by:

- Preparing copy/spinner
- Disabled camera-dependent active controls

### isCameraHidden

```text
intent == hide
```

Used by:

- Main preview hidden state
- Running panel rest visuals

## Relationships

- `CameraLifecycle` consumes runtime outcomes from posture-engine startup and stop flows.
- `MeasurementSession` is paused while intent is `hide`, and camera-dependent visuals remain inactive unless `isCameraLive` is true after a later show transition.
- `EngineStateEvent` can inform `CameraRuntimeStatus`, but engine status alone is not the UI activation contract.
- Calibration and main measurement surfaces consume the same lifecycle record but may render different copy.
- Calibration uses route-scoped camera preparation and must not overwrite the main screen's persisted camera intent.
