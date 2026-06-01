# Feature Specification: Camera Lifecycle State

**Feature Branch**: `017-camera-lifecycle-state`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "카메라 생명주기 상태 통합: 사용자 의도(show/hide/exit)와 실제 런타임 상태(idle/starting/ready/stopping/error)를 하나의 카메라 생명주기 모델에서 함께 관리하고, 러닝 패널/프리뷰/캘리브레이션 UI는 실제 ready 상태와 유효한 streamUrl을 기준으로만 활성화한다."

## Clarifications

### Session 2026-06-01

- Q: 캘리브레이션 화면은 전역 메인 카메라 의도와 어떤 관계로 동작해야 하는가? → A: 캘리브레이션은 화면 진입 동안만 카메라 준비를 강제하고, 전역 메인 카메라 의도는 변경하지 않는다.
- Q: 카메라 준비 중 사용자가 hide 또는 exit을 누르면 진행 중인 start 결과를 어떻게 처리해야 하는가? → A: 즉시 비활성 의도로 전환하고, 진행 중 start 결과는 무시하거나 정리한다.
- Q: 앱 재시작 또는 새로고침 후 이전 show 의도가 남아 있으면 카메라를 자동 시작해야 하는가? → A: 런타임은 idle로 초기화하고, 이전 show 의도만으로 자동 카메라 시작은 하지 않는다.
- Q: 카메라 준비 실패 후 사용자 의도는 어떻게 유지해야 하는가? → A: intent는 show로 유지하고, runtime은 error, streamUrl은 null로 둔다.
- Q: 메인 화면에서 hide를 누르면 측정 세션과 카메라 런타임을 어떻게 처리해야 하는가? → A: 측정 세션을 pause하고 카메라 런타임을 idle로 정리한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 실제 카메라 준비 전 UI 동작 차단 (Priority: P1)

사용자는 메인 화면에서 숨김 상태의 카메라를 다시 표시할 때, 실제 카메라 스트림이 준비되기 전까지 러닝 패널의 배경이나 캐릭터 애니메이션이 먼저 움직이지 않기를 원한다.

**Why this priority**: 현재 사용자에게 보이는 핵심 버그이며, 카메라가 켜지지 않았는데 측정 중처럼 보이는 상태는 신뢰도를 직접 떨어뜨린다.

**Independent Test**: 메인 화면에서 카메라를 숨김 상태로 전환한 뒤 다시 표시하고, 카메라 스트림 준비 전에는 러닝 패널이 정지 상태를 유지하는지 확인하면 독립적으로 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 메인 화면 카메라가 숨김 상태이고 측정 세션이 일시정지되어 있을 때, **When** 사용자가 카메라 표시 버튼을 누르면, **Then** 시스템은 실제 카메라 스트림이 준비될 때까지 러닝 패널 배경과 캐릭터 동작을 시작하지 않는다.
2. **Given** 사용자가 카메라 표시를 요청했지만 스트림이 아직 준비 중일 때, **When** 러닝 패널이 렌더링되면, **Then** 패널은 정지 상태 또는 준비 중 상태를 보여주며 측정 중 애니메이션으로 전환하지 않는다.
3. **Given** 실제 카메라 스트림이 준비되고 유효한 영상 주소가 확보되었을 때, **When** 메인 화면이 갱신되면, **Then** 러닝 패널과 프리뷰는 활성 상태로 전환된다.

---

### User Story 2 - 사용자 의도와 실제 카메라 상태 구분 (Priority: P1)

사용자는 카메라 버튼으로 표시, 숨김, 종료를 명확하게 제어하되, 앱은 그 의도와 실제 카메라 준비 상태를 혼동하지 않고 일관되게 동작해야 한다.

**Why this priority**: 사용자 의도만으로 실제 장치 상태를 판단하면 준비 중, 실패, 종료 중 같은 중간 상태에서 UI와 측정 동작이 어긋난다.

**Independent Test**: 표시, 숨김, 종료, 재표시 흐름마다 사용자 의도와 실제 카메라 상태가 독립적으로 추적되고 올바른 화면 상태로 표현되는지 확인하면 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 사용자가 카메라 표시를 요청했을 때, **When** 실제 카메라가 아직 준비 중이면, **Then** 사용자 의도는 표시로 유지되지만 실제 활성 상태는 준비 중으로 구분된다.
2. **Given** 사용자가 카메라 숨김을 요청했을 때, **When** 측정 세션이 실행 중이면, **Then** 시스템은 사용자 의도를 숨김으로 기록하고 측정 세션을 일시정지하며 카메라 런타임을 비활성 상태로 정리한다.
3. **Given** 카메라 준비가 진행 중일 때, **When** 사용자가 카메라 숨김 또는 종료를 요청하면, **Then** 시스템은 즉시 해당 사용자 의도를 반영하고 늦게 도착한 준비 성공 결과로 UI를 다시 활성화하지 않는다.
4. **Given** 앱이 재시작되었고 이전 사용자 의도가 표시였을 때, **When** 메인 화면이 렌더링되면, **Then** 시스템은 실제 런타임을 비활성 상태로 시작하고 이전 표시 의도만으로 카메라를 자동 시작하지 않는다.
5. **Given** 사용자가 숨김 상태에서 다시 카메라 표시를 요청했을 때, **When** 카메라 준비가 성공하면, **Then** 시스템은 측정 세션을 재개하고 실제 런타임 준비 완료 후에만 활성 UI를 표시한다.
6. **Given** 사용자가 카메라 종료를 요청했을 때, **When** 카메라와 측정 세션이 정리되면, **Then** 시스템은 종료 의도와 비활성 실제 상태를 함께 반영한다.

---

### User Story 3 - 캘리브레이션과 메인 화면의 정책 통일 (Priority: P2)

사용자는 캘리브레이션 화면과 메인 화면에서 카메라 상태가 서로 다른 기준으로 동작하지 않고, 동일한 생명주기 정책을 따른다고 기대한다.

**Why this priority**: 캘리브레이션과 메인 화면이 같은 카메라 자원을 사용하므로 상태 기준이 다르면 화면 전환, 재시도, 실패 처리에서 예측하기 어려운 동작이 생긴다.

**Independent Test**: 캘리브레이션 진입, 스트림 준비, 실패, 메인 화면 이동, 메인 화면 숨김/표시 전환을 순서대로 수행하며 동일한 상태 명칭과 전환 규칙이 적용되는지 확인하면 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 사용자가 캘리브레이션 화면에 진입했을 때, **When** 카메라 스트림이 준비 중이면, **Then** 화면은 준비 중 상태를 표시하고 준비 완료 전에는 측정 가능한 상태로 표시하지 않는다.
2. **Given** 캘리브레이션에서 카메라 준비가 실패했을 때, **When** 사용자가 재시도하면, **Then** 이전 실패 상태가 명확히 초기화되고 새로운 준비 흐름이 시작된다.
3. **Given** 캘리브레이션을 완료하고 메인 화면으로 이동했을 때, **When** 카메라 상태가 전달되면, **Then** 메인 화면은 동일한 생명주기 기준으로 활성 여부를 판단하되 캘리브레이션 진입이 기존 메인 카메라 의도를 덮어쓰지 않는다.

---

### User Story 4 - 실패와 재시도 상태의 명확한 표현 (Priority: P3)

사용자는 카메라가 바쁘거나 권한이 없거나 스트림이 준비되지 않은 경우, 앱이 측정 중처럼 보이지 않고 실패 원인과 재시도 가능 상태를 명확히 보여주기를 원한다.

**Why this priority**: 실패 상태를 정상 활성 상태와 구분해야 사용자가 잘못된 조작을 반복하지 않고 문제를 해결할 수 있다.

**Independent Test**: 권한 거부, 카메라 사용 중, 스트림 미수신 상황을 각각 발생시켜 활성 UI가 차단되고 실패 상태가 표시되는지 확인하면 검증할 수 있다.

**Acceptance Scenarios**:

1. **Given** 카메라 권한이 거부된 상태일 때, **When** 사용자가 카메라 표시를 요청하면, **Then** 시스템은 활성 UI를 시작하지 않고 권한 문제 상태를 표시한다.
2. **Given** 다른 앱이 카메라를 사용 중일 때, **When** 카메라 준비가 실패하면, **Then** 시스템은 측정 중 상태로 전환하지 않고 재시도 가능한 실패 상태를 표시한다.
3. **Given** 사용자가 카메라 표시를 요청했고 준비가 실패했을 때, **When** 실패 상태가 렌더링되면, **Then** 시스템은 표시 의도를 유지하되 실제 런타임을 실패 상태로 두고 스트림 주소를 제거한다.
4. **Given** 카메라 스트림 주소가 없거나 사용할 수 없을 때, **When** UI가 활성 여부를 판단하면, **Then** 시스템은 실제 카메라 활성 상태로 간주하지 않는다.

### Edge Cases

- 사용자가 숨김에서 표시로 전환한 직후 카메라 준비가 늦어지는 경우
- 사용자가 표시를 요청한 뒤 준비 완료 전에 다시 숨김 또는 종료를 누르는 경우
- 카메라 준비 성공 결과가 숨김 또는 종료 요청 이후 늦게 도착하는 경우
- 앱 재시작 또는 새로고침 후 이전 표시 의도가 남아 있지만 실제 카메라 런타임은 없는 경우
- 카메라 준비 중 화면 전환이 발생하는 경우
- 이전 스트림 주소가 남아 있는 상태에서 새 카메라 준비가 시작되는 경우
- 카메라 권한은 있지만 실제 프레임이 도착하지 않는 경우
- 카메라 준비 실패 후 사용자가 표시 의도를 유지한 채 재시도하는 경우
- 캘리브레이션 화면과 메인 화면을 빠르게 왕복하는 경우
- 메인 화면에서 카메라를 숨긴 뒤 캘리브레이션에 진입하고 다시 메인 화면으로 돌아오는 경우
- 메인 화면에서 숨김을 누른 뒤 측정 세션 pause와 카메라 런타임 정리 중 하나만 성공하는 경우
- 앱 창 숨김, 최소화, 포커스 변경이 사용자 카메라 숨김 의도로 오인되는 경우

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain a single camera lifecycle record that includes both the user's intended camera mode and the actual runtime readiness of the camera.
- **FR-002**: System MUST distinguish user intent values for showing, hiding, and exiting the camera from runtime readiness values such as inactive, preparing, ready, stopping, and failed.
- **FR-003**: System MUST treat the camera as visually and behaviorally active only when the user intent is show, the runtime state is ready, and a usable stream reference is available.
- **FR-004**: System MUST prevent measurement animations, running-panel motion, and camera-dependent active visuals from starting before the camera is actually ready.
- **FR-005**: System MUST clear stale stream references whenever a new camera preparation attempt begins, fails, is cancelled, or is stopped.
- **FR-006**: System MUST preserve the user's explicit hide intent separately from app window visibility, focus, minimize, or background status.
- **FR-007**: System MUST use the same lifecycle policy for calibration and main measurement surfaces, while allowing calibration to request camera preparation for its route without changing the main screen's persisted camera intent.
- **FR-008**: System MUST expose enough lifecycle information for UI surfaces to render preparing, ready, hidden, stopped, and failed states without inferring them from unrelated flags.
- **FR-009**: System MUST make retry behavior reset previous failure and stale stream state before starting a new camera preparation attempt.
- **FR-010**: System MUST keep measurement session state and camera visibility state consistent when the user hides, shows, exits, retries, or navigates between calibration and main screens.
- **FR-011**: System MUST surface camera failure reasons in a way that can be mapped to user-actionable messages, including permission denial, camera busy, stream unavailable, and unexpected failure.
- **FR-012**: System MUST provide deterministic state transitions so repeated show/hide/exit actions cannot leave the UI in a running state without an actually ready camera.
- **FR-013**: System MUST ignore or clean up any in-flight camera start result that completes after the user has changed intent to hide or exit.
- **FR-014**: System MUST initialize runtime readiness to inactive after app restart or reload and MUST NOT automatically start the camera from a previously persisted show intent alone.
- **FR-015**: System MUST preserve show intent after camera preparation failure while setting runtime readiness to failed, clearing stream reference, and exposing a retryable failure state.
- **FR-016**: System MUST pause the measurement session and transition camera runtime to inactive when the user explicitly hides the camera from the main screen.
- **FR-017**: System MUST resume the paused measurement session only after a subsequent show request reaches actual camera readiness.

### Key Entities *(include if feature involves data)*

- **Camera Lifecycle**: The authoritative camera state for the app. Includes user intent, runtime readiness, stream availability, failure reason, and last transition time.
- **Camera Intent**: The user's explicit requested camera mode: show, hide, or exit.
- **Runtime Readiness**: The actual operational state of the camera pipeline, such as inactive, preparing, ready, stopping, or failed.
- **Stream Reference**: The currently usable camera stream location or equivalent reference required for preview and camera-dependent UI.
- **Camera Failure**: A normalized reason explaining why the camera could not become ready.
- **Measurement Surface**: A UI area that depends on camera state, including calibration preview, main preview, and running panel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of hide-to-show transitions, running-panel motion and active character visuals start only after the camera is ready and a usable stream reference exists.
- **SC-002**: In 100% of camera preparation failures, the UI does not display a camera-active or measurement-active state.
- **SC-003**: Users can perform show, hide, show again, and exit in sequence without stale camera preview or premature running animation appearing.
- **SC-004**: Calibration and main measurement screens use the same lifecycle states for readiness, failure, and inactive behavior.
- **SC-005**: Retry after a camera failure starts from a clean preparing state with no stale stream reference visible to the user.
- **SC-006**: Window visibility changes do not change the user's explicit camera hide/show/exit intent.
- **SC-007**: In 100% of preparing-to-hide and preparing-to-exit transitions, late camera start success results do not activate preview, running-panel motion, or character animation.
- **SC-008**: In 100% of app restart or reload cases, stale runtime state and stream references do not activate camera preview or running visuals.
- **SC-009**: In 100% of camera preparation failures, retry remains available from a show-intent error state without displaying active camera visuals.
- **SC-010**: In 100% of explicit main-screen hide actions, the measurement session is paused and camera-dependent visuals stay inactive until a later ready show transition.

## Assumptions

- Existing camera permission and stream acquisition behavior remains the source of actual camera readiness.
- This feature focuses on state policy and UI activation correctness, not on changing posture detection algorithms.
- The app continues to support separate calibration and main measurement screens.
- User-facing terminology may be localized independently from the internal lifecycle state names.
- A stream reference alone is not sufficient for active UI; it must be paired with a ready runtime state and show intent.
- Persisted user intent is not treated as consent to automatically restart camera capture after app restart or reload.
- A failed camera preparation attempt does not mean the user intended to hide or exit the camera.
- Explicit main-screen hide is treated as a privacy-preserving pause, not as background measurement.
