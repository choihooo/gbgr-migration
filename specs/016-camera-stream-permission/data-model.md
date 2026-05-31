# Data Model: Camera Stream Permission

## CameraPermissionState

Represents whether the app can ask for and use camera access before measurement.

**Fields**
- `appViewPermission`: `unknown | prompt | granted | denied | unavailable`
- `engineStartup`: `idle | checking | ready | denied | unavailable | busy | frameUnavailable | error`
- `checkedAt`: ISO timestamp or `null`
- `message`: user-facing recovery message key or `null`
- `recoverable`: boolean

**Validation Rules**
- Measurement entry requires `appViewPermission = granted` and `engineStartup = ready`.
- `denied`, `unavailable`, `busy`, and `frameUnavailable` states must map to distinct user-facing recovery guidance.
- Permission state must not contain raw frame data or camera device identifiers.

## CameraStreamState

Represents local preview and frame collection state.

**Fields**
- `visibility`: `visible | hidden`
- `collection`: `stopped | starting | collecting | paused | interrupted`
- `streamUrl`: loopback URL string or `null`
- `sessionTokenPresent`: boolean
- `lastFrameAt`: ISO timestamp or `null`

**Validation Rules**
- `streamUrl` must be local-device only and require a session-specific unpredictable token.
- `visibility = hidden` requires `collection = paused` or `stopped`.
- Measurement stop requires `collection = stopped` within 2 seconds.
- Stream access without the current token must be rejected.

## MeasurementSession

Represents an active posture measurement run that depends on camera readiness.

**Fields**
- `sessionId`: non-empty string
- `status`: `idle | starting | running | paused | stopping | error`
- `mode`: `foreground | background`
- `startedAt`: ISO timestamp
- `lastResultAt`: ISO timestamp or `null`
- `lastErrorCode`: camera or engine error code or `null`

**State Transitions**
- `idle -> starting`: user starts measurement.
- `starting -> running`: permission and local engine startup both succeed.
- `running -> paused`: user hides camera.
- `paused -> running`: user shows camera and camera access remains available.
- `running|paused -> stopping -> idle`: user exits measurement or leaves measurement flow.
- Any active state -> `error`: unrecoverable camera/engine failure.

## CameraErrorState

Represents recoverable and non-recoverable camera failures.

**Fields**
- `code`: `camera_permission_denied | camera_unavailable | camera_busy | camera_frame_unavailable | camera_api_unavailable | camera_stream_unauthorized | camera_unknown`
- `source`: `app-view | local-engine | local-stream`
- `recoverable`: boolean
- `occurredAt`: ISO timestamp
- `guidanceKey`: user-facing guidance key

**Validation Rules**
- Permission-denied errors must guide users to operating system privacy settings.
- Busy-device errors must guide users to close other camera-using apps.
- Unauthorized stream errors must not reveal the valid token.

## CameraPreference

Represents the app-inferred preferred camera when more than one camera is available.

**Fields**
- `selectionMode`: always `automatic` for this feature
- `preferredClass`: `built-in | general-local | external | unknown`
- `excludedClasses`: includes `continuity` and `desk-view`
- `updatedAt`: ISO timestamp or `null`

**Validation Rules**
- No user camera picker is introduced by this feature.
- Raw camera device names and device identifiers must not be persisted as diagnostics.
- Inferred preference may be reused only when it can be validated safely at startup.

## CameraDiagnosticEvent

Represents non-sensitive diagnostics for support and regression analysis.

**Fields**
- `errorCode`: camera error code or `null`
- `permissionState`: coarse permission state
- `transition`: `from -> to` state name
- `durationMs`: non-negative integer or `null`
- `occurredAt`: ISO timestamp

**Validation Rules**
- Must not include raw video, captured frames, camera device names, camera device identifiers, or stream tokens.
- Must be sufficient to separate permission failures from device availability failures.
