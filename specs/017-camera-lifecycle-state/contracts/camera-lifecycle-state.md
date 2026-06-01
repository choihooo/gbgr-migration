# Contract: Camera Lifecycle State

## Lifecycle Ownership

**User intent owner**

- Camera controls update user intent to `show`, `hide`, or `exit`.
- User intent may be persisted with existing camera preference state.
- Window visibility, focus, minimize, or app background events must not update user intent.

**Runtime readiness owner**

- The posture-engine start/stop flow updates runtime readiness.
- Runtime readiness and stream URL are transient and must not be persisted.
- Runtime readiness must be reset when a new start begins, a stop begins, a start fails, a start is cancelled, or the active hook unmounts.
- Runtime readiness initializes to inactive after app restart or reload, and a previously persisted `show` intent must not automatically start camera capture by itself.

## Runtime Publication Contract

### Start Begins

**Trigger**

- Camera should become visible or measurement should start/resume.

**Required state**

```json
{
  "runtime": "starting",
  "streamUrl": null,
  "errorCode": null
}
```

### Start Succeeds

**Preconditions**

- Camera start completed.
- A usable stream reference exists.

**Required state**

```json
{
  "runtime": "ready",
  "streamUrl": "usable-local-stream-reference",
  "errorCode": null
}
```

### Start Fails

**Required state**

```json
{
  "intent": "show",
  "runtime": "error",
  "streamUrl": null,
  "errorCode": "camera_permission_denied | camera_unavailable | camera_busy | camera_frame_unavailable | camera_api_unavailable | camera_stream_unauthorized | camera_unknown"
}
```

**Required behavior**

- Failure preserves `show` intent because the user attempted to show the camera.
- Failure does not activate preview, running-panel motion, or character animation.
- Retry starts from a clean `starting` state with no stale stream reference.

### Intent Changes During Start

**Trigger**

- User requests `hide` or `exit` while camera start is still in progress.

**Required behavior**

- The new intent is reflected immediately.
- Any late start success result is ignored or cleaned up.
- Late success must not render preview, running-panel motion, or character animation.

### Stop Begins

**Required state**

```json
{
  "runtime": "stopping",
  "streamUrl": null
}
```

### Stop Completes or Inactive

**Required state**

```json
{
  "runtime": "idle",
  "streamUrl": null,
  "errorCode": null
}
```

### App Restart or Reload

**Required state**

```json
{
  "runtime": "idle",
  "streamUrl": null,
  "errorCode": null
}
```

**Required behavior**

- Runtime state is not restored from persisted data.
- Persisted `show` intent alone is not treated as consent to restart camera capture.

## UI Activation Contract

All camera-dependent active visuals must use this predicate:

```text
isCameraLive = intent is show AND runtime is ready AND streamUrl exists
```

**Required behavior**

- Running panel background motion starts only when `isCameraLive` is true.
- Running panel character video renders only when `isCameraLive` is true.
- Preview stream renders only when surface policy allows visibility and runtime has a valid stream.
- Hidden and exit states never display active measurement animation.
- Preparing and error states never display active measurement animation.

## Surface Contract

### Main Webcam Panel

- `show` intent requests camera activation.
- `hide` intent pauses the measurement session, clears runtime camera readiness to inactive, hides preview, and pauses camera-dependent visuals.
- `exit` intent stops the active camera/measurement surface.
- The panel must pass active preview state from lifecycle readiness, not from intent alone.
- A later `show` intent may resume the paused measurement session only after camera runtime becomes ready with a usable stream reference.

### Mini Running Panel

- `exit` intent renders the existing exit panel.
- Non-exit intent renders running panel layout.
- Running motion and character animation use `isCameraLive`.
- If intent is `show` but runtime is `starting`, the panel remains visually paused.

### Calibration View

- Calibration may request camera preparation for its route, but still uses runtime readiness before displaying active camera behavior.
- Calibration must not change the main screen's persisted camera intent.
- Calibration retry clears previous error and stream state before a new start attempt.

### Onboarding Camera Start

- Successful preflight may set user intent to `show`.
- It must not mark runtime as ready unless the normal runtime publisher has a valid stream.

## Error Mapping Contract

Runtime failures must map to one of:

- `camera_permission_denied`
- `camera_unavailable`
- `camera_busy`
- `camera_frame_unavailable`
- `camera_api_unavailable`
- `camera_stream_unauthorized`
- `camera_unknown`

Raw exception objects, stream tokens, camera device names, and camera device identifiers must not be persisted.
