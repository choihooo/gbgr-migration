# Research: Camera Stream Permission

## Decision: Require both app-view permission and local camera engine startup before measurement entry

**Rationale**: The renderer permission prompt proves the app-view can request camera access, while the local posture engine must still prove it can open the camera and serve a usable stream. Requiring both checks prevents the user from reaching measurement after a superficial permission success but before the actual local engine can capture frames.

**Alternatives considered**:
- App-view permission only: leaves sidecar startup failures to the measurement screen and weakens onboarding acceptance tests.
- Local engine startup only: risks missing renderer/WebView permission failures and browser-preview differences.
- Different checks per flow: reduces consistency across onboarding, calibration, dashboard, and auto-start.

**References**:
- W3C Media Capture and Streams: camera permission can be denied and `getUserMedia` permission failures reject with `NotAllowedError`.
- Apple media capture authorization: macOS requires explicit camera permission and remembers the user's response.

## Decision: Keep camera selection automatic for this feature

**Rationale**: The spec explicitly chooses automatic selection only. The implementation should prefer built-in or general local cameras, exclude continuity and desk-view style cameras by default, and preserve only an inferred preference when safe. This keeps scope small and aligns with existing sidecar candidate selection tests.

**Alternatives considered**:
- Full camera picker UI: useful later, but expands UX, persistence, and accessibility scope.
- Operating-system default only: simpler, but current regressions show default ordering can select unsuitable continuity/desk-view sources.
- Fallback picker on failure: still introduces a new UI surface and is better planned as a separate feature.

**References**:
- FFmpeg AVFoundation device listing supports indexed camera enumeration.
- Existing sidecar tests already cover preferring FaceTime/built-in camera and avoiding continuity/iPhone desk-view sources.

## Decision: Treat camera hide as measurement pause and stop new frame collection

**Rationale**: Camera hide is a privacy-sensitive user action. Interpreting it as pause gives users a clear mental model and creates a testable requirement: no new camera frames are collected until the user shows the camera again.

**Alternatives considered**:
- Hide only the preview while continuing measurement: optimizes background continuity but violates user expectation that hiding a camera stops camera use.
- Allow hidden foreground but continue background measurement: ambiguous and harder to explain or test.

## Decision: Protect local stream with loopback binding and session-specific unpredictable token

**Rationale**: Loopback prevents remote network access, while a session token prevents casual access from another local client that learns the port. This matches the sensitivity of raw camera imagery without requiring a new transport.

**Alternatives considered**:
- Loopback only: blocks remote access but not same-device clients with the URL.
- WebView-only transport: stronger isolation but requires a larger protocol change.
- URL expiry only: useful but insufficient if the current session URL is exposed.

**References**:
- Tauri CSP limits which renderer resources can load network/image sources.
- Existing sidecar stream server already uses a tokenized local URL shape.

## Decision: Persist only non-sensitive diagnostics

**Rationale**: Error code, permission state, state transition, and timing are enough to distinguish permission, availability, busy-device, and frame-unavailable failures. Persisting raw frames or camera identifiers increases privacy risk and conflicts with the spec.

**Alternatives considered**:
- Store device names/IDs: helps debugging multi-camera issues but creates avoidable sensitive metadata retention.
- Store diagnostics only in memory: strongest privacy posture but weakens supportability for recoverable startup failures.
- Store detailed diagnostics with consent: broader product/privacy design decision, out of scope for this feature.

## Decision: Preserve current local posture analysis pipeline

**Rationale**: The feature is about permission, stream readiness, and privacy behavior, not replacing posture analysis. MediaPipe/OpenCV remain in the Python sidecar, and React continues to render stream preview and overlay state returned from Tauri.

**Alternatives considered**:
- Move pose detection into the renderer: would alter performance, packaging, and privacy testing scope.
- Replace MJPEG preview with a new binary transport: potentially cleaner later, but unnecessary for the clarified requirements.

**References**:
- OpenCV `VideoCapture` supports open/read/release lifecycle for camera capture.
- MediaPipe Pose Landmarker supports image/video/live-stream pose detection with timestamped frames.
