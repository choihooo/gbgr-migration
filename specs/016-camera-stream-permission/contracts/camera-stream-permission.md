# Contract: Camera Stream Permission

## Renderer Permission Probe

**Trigger**: User starts onboarding, calibration, dashboard measurement, or auto-start measurement.

**Preconditions**
- Camera access purpose has been shown to the user.
- Microphone access is not requested.

**Success**
- App-view camera permission is granted.
- Any probe stream is stopped immediately after access is confirmed.
- The flow continues to local camera engine startup.

**Failure**
- `NotAllowedError` or denied permission maps to `camera_permission_denied`.
- No device maps to `camera_unavailable`.
- Busy/read failure maps to `camera_busy` or `camera_unavailable` with user recovery guidance.

## Tauri Command: `start_posture_engine`

**Request**

```json
{}
```

**Success Response**

```json
{
  "engineStatus": "ready",
  "sessionId": "uuid-or-null",
  "mode": "foreground",
  "streamUrl": "http://127.0.0.1:<port>/video?token=<session-token>"
}
```

**Required Behavior**
- Must not return success until local camera startup succeeds.
- Must return a loopback stream URL with a session-specific unpredictable token.
- Must update engine state to camera owner `python`/local engine and recoverable `true`.

**Error Codes**
- `camera_permission_denied`
- `camera_unavailable`
- `camera_busy`
- `camera_frame_unavailable`
- `detector_initialization_failed`

## Tauri Command: `stop_posture_engine`

**Request**

```json
{}
```

**Success Response**

```json
{
  "engineStatus": "idle",
  "releasedOwner": "python"
}
```

**Required Behavior**
- Must stop camera frame collection.
- Must clear the active stream URL.
- Must release camera ownership within the success criteria window.

## Camera Hide/Show Contract

**Hide**
- Pauses the measurement session.
- Stops new camera frame collection.
- Removes or invalidates the current visible preview stream for the hidden state.

**Show**
- Rechecks camera availability when needed.
- Resumes measurement only after local camera stream readiness is confirmed.

## Local Stream Contract

**Allowed Request**

```text
GET http://127.0.0.1:<port>/video?token=<current-session-token>
```

**Success**
- HTTP 200.
- `Content-Type: multipart/x-mixed-replace; boundary=frame`.
- Frames are JPEG encoded for local preview only.

**Rejected Requests**
- Missing token.
- Incorrect token.
- Non-`/video` path.
- Non-local access.

**Rejected Response**
- Must not include a valid token or frame bytes.
- Must not reveal sensitive diagnostic data.

## Sidecar Command: `start`

**Request**

```json
{ "command": "start" }
```

**Success Response**

```json
{
  "engine_status": "ready",
  "mode": "foreground",
  "camera_owner": "python",
  "recoverable": true,
  "stream_url": "http://127.0.0.1:<port>/video?token=<session-token>"
}
```

**Failure Response**

```json
{
  "engine_status": "error",
  "mode": "foreground",
  "camera_owner": "none",
  "message": "camera_permission_denied",
  "recoverable": true,
  "stream_url": null
}
```

**Required Behavior**
- Opens camera before detector initialization.
- Uses automatic camera selection only.
- Prefers built-in/general local cameras.
- Excludes continuity/desk-view style cameras by default.
- Does not persist raw frames, camera names, camera IDs, or stream tokens as diagnostics.

## User-Facing Error Guidance Contract

| Error | Required Guidance |
|-------|-------------------|
| `camera_permission_denied` | Tell the user camera permission is blocked and point to OS privacy settings. |
| `camera_unavailable` | Tell the user no usable camera is available or permission/device state should be checked. |
| `camera_busy` | Tell the user another app may be using the camera and to close it before retrying. |
| `camera_frame_unavailable` | Tell the user frames cannot be read and to check camera connection before retrying. |
| `camera_stream_unauthorized` | Do not expose token details; treat as stream access denied. |
