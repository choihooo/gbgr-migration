# Feature Specification: Camera Stream Permission

**Feature Branch**: `016-camera-stream-permission`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "카메라 스트림, 권한 체크 한 번 해줘봐 공식 문서들 참고해서 각자 쓰이는 기술들, 라이브러리에 대해서"

## Clarifications

### Session 2026-06-01

- Q: 카메라 숨김은 측정과 프레임 수집을 어떻게 처리해야 하는가? → A: 카메라 숨김은 측정을 일시정지하고 새 프레임 수집도 중단한다.
- Q: 여러 카메라가 있을 때 어떤 선택 정책을 적용해야 하는가? → A: 자동 선택만 제공하며 내장/일반 로컬 카메라를 우선하고 연속성/데스크뷰 계열은 기본 제외한다.
- Q: 측정 화면 진입 전에 어떤 카메라 권한/시작 확인을 통과해야 하는가? → A: 앱 화면 권한과 로컬 카메라 엔진 시작 확인을 모두 통과해야 측정 화면으로 진입한다.
- Q: 로컬 카메라 스트림은 어떤 접근 보호를 가져야 하는가? → A: 로컬 호스트 제한과 세션별 예측 불가 토큰을 모두 요구한다.
- Q: 카메라 진단 정보는 어떤 범위로 보존해야 하는가? → A: 오류 코드, 권한 상태, 상태 전이, 타이밍만 저장하고 영상/프레임/장치 식별자는 저장하지 않는다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 카메라 권한을 확인하고 측정을 시작한다 (Priority: P1)

사용자는 자세 측정을 시작하기 전에 앱에서 카메라 사용 목적을 확인하고, 운영체제 권한을 허용한 뒤, 측정 화면에서 실제 카메라 영상이 표시되는지 확인할 수 있다.

**Why this priority**: 카메라 권한과 스트림이 준비되지 않으면 자세 측정의 핵심 가치가 제공되지 않는다.

**Independent Test**: 새 사용자 상태에서 카메라 권한 허용 버튼을 눌러 권한을 승인하고, 보정 화면에서 카메라 영상과 측정 준비 상태가 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 아직 카메라 권한을 결정하지 않은 상태, **When** 사용자가 카메라 권한 허용을 진행하고 승인한다, **Then** 앱은 앱 화면 권한과 로컬 카메라 엔진 시작 확인을 모두 통과한 뒤 측정 화면으로 이동하고 카메라 영상 영역을 표시한다.
2. **Given** 카메라 권한이 이미 승인된 상태, **When** 사용자가 앱을 다시 열고 측정 기능을 시작한다, **Then** 앱은 불필요한 추가 권한 요청 없이 앱 화면 권한과 로컬 카메라 엔진 시작 가능성을 확인하고 측정을 시작한다.
3. **Given** 카메라 영상이 표시 중인 상태, **When** 사용자가 자세 측정을 진행한다, **Then** 앱은 영상 위에 측정 결과를 지연 없이 반영한다.

---

### User Story 2 - 권한 거부와 사용 불가 상태를 이해하고 복구한다 (Priority: P2)

사용자는 카메라 권한이 거부되었거나 카메라가 다른 앱에서 사용 중인 경우, 문제 원인과 해결 방법을 앱 안에서 확인하고 다시 시도할 수 있다.

**Why this priority**: 권한 실패는 사용자가 직접 복구해야 하는 경우가 많으므로, 명확한 안내가 없으면 온보딩과 측정 완료율이 크게 떨어진다.

**Independent Test**: 운영체제 설정에서 카메라 권한을 거부하거나 다른 앱으로 카메라를 점유한 뒤 측정을 시작하고, 앱이 올바른 안내와 다시 시도 경로를 제공하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 카메라 권한이 거부된 상태, **When** 사용자가 측정을 시작한다, **Then** 앱은 권한이 차단되었음을 설명하고 운영체제 설정에서 허용해야 할 앱 항목을 안내한다.
2. **Given** 카메라가 다른 앱에서 사용 중인 상태, **When** 사용자가 측정을 시작한다, **Then** 앱은 카메라를 열 수 없음을 설명하고 다른 앱 종료 후 다시 시도하도록 안내한다.
3. **Given** 카메라 연결이 끊겼거나 사용할 수 없는 상태, **When** 사용자가 측정을 시작한다, **Then** 앱은 사용할 수 있는 카메라가 없음을 안내하고 측정을 시작하지 않는다.

---

### User Story 3 - 사용자가 카메라 노출과 자원 사용을 제어한다 (Priority: P3)

사용자는 측정 중 카메라 화면을 숨기거나 측정을 종료할 수 있고, 앱은 사용자가 더 이상 측정을 진행하지 않을 때 카메라 사용을 중단한다.

**Why this priority**: 카메라는 민감한 장치이므로 사용자가 언제 사용 중인지 이해하고, 필요 없을 때 즉시 중단된다고 신뢰할 수 있어야 한다.

**Independent Test**: 측정 중 카메라 숨김과 측정 종료를 수행한 뒤 카메라 표시 상태와 장치 사용 표시가 기대대로 바뀌는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 측정 중 카메라 영상이 표시되는 상태, **When** 사용자가 카메라 화면을 숨긴다, **Then** 앱은 측정을 일시정지하고 새 프레임 수집과 영상 노출을 중단한다.
2. **Given** 측정이 진행 중인 상태, **When** 사용자가 측정을 종료하거나 앱이 측정 화면을 벗어난다, **Then** 앱은 카메라 사용을 중단하고 다음 시작 전까지 새 프레임을 수집하지 않는다.
3. **Given** 측정 종료 후 사용자가 다시 측정을 시작하는 상태, **When** 카메라 권한이 유지되어 있다, **Then** 앱은 다시 권한 흐름을 반복하지 않고 카메라 접근 가능성을 확인한 뒤 측정을 재개한다.

### Edge Cases

- 사용자가 권한 요청 창을 닫거나 응답하지 않으면 앱은 진행 중 상태를 무기한 고정하지 않고 사용자가 다시 시도할 수 있는 상태로 복귀해야 한다.
- 권한 확인 직후 카메라 장치가 사라지거나 다른 앱이 점유하면 앱은 측정을 시작하지 않고 원인에 가까운 오류 안내를 제공해야 한다.
- 운영체제 개인정보 설정에 앱 본체와 보조 실행 항목이 따로 표시되는 경우, 안내 문구는 사용자가 확인해야 할 항목을 빠짐없이 알려야 한다.
- 외장 카메라, 가상 카메라, 연속성 카메라가 함께 있는 경우, 앱은 자동 선택만 제공하고 내장/일반 로컬 카메라를 우선하며 연속성/데스크뷰 계열은 기본 선택에서 제외해야 한다.
- 스트림 주소나 내부 식별 정보가 화면 밖으로 노출되더라도 외부 네트워크에서 카메라 영상을 볼 수 없어야 하며, 같은 기기의 다른 로컬 클라이언트도 세션별 예측 불가 토큰 없이는 접근할 수 없어야 한다.
- 카메라 프레임 수집은 일시적으로 실패할 수 있으며, 앱은 일시 실패와 지속 실패를 구분해 사용자를 불필요하게 온보딩으로 되돌리지 않아야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST explain why camera access is needed before asking the user to grant access.
- **FR-002**: System MUST verify both app-view camera permission and local camera engine startup before entering any measurement flow that depends on live camera input.
- **FR-003**: System MUST start measurement only after confirming that a usable local camera stream can be obtained from the local camera engine.
- **FR-004**: System MUST show a live camera preview during foreground measurement when the user has not hidden the camera view.
- **FR-005**: System MUST keep camera processing local to the user's device and MUST NOT transmit raw camera video to external services.
- **FR-006**: System MUST stop collecting new camera frames when the user ends measurement, leaves the measurement flow, or the measurement session is stopped.
- **FR-007**: System MUST present distinct user-facing recovery guidance for permission denied, no usable camera, camera already in use, and frame unavailable states.
- **FR-008**: System MUST provide a retry path from recoverable camera errors without requiring the user to restart the app.
- **FR-009**: System MUST guide users to the correct operating system privacy settings when camera access is blocked outside the app.
- **FR-010**: System MUST preserve the inferred camera preference when it can be reused safely.
- **FR-011**: System MUST automatically prefer built-in or general local cameras and exclude continuity or desk-view style cameras from default selection.
- **FR-012**: System MUST restrict camera stream access to the local device and require a session-specific unpredictable token for stream access.
- **FR-013**: System MUST keep the app responsive while camera permission prompts, camera startup, and stream readiness checks are in progress.
- **FR-014**: System MUST record only non-sensitive diagnostic state needed to distinguish camera permission failures from device availability failures, including error code, permission state, state transitions, and timing.
- **FR-015**: System MUST treat hiding the camera view as a measurement pause and stop collecting new camera frames until the user shows the camera again.
- **FR-016**: System MUST NOT store raw video, captured frames, camera device names, or camera device identifiers as diagnostic data.

### Key Entities

- **Camera Permission State**: Represents whether the user and operating system allow camera access for the app components required by measurement.
- **Camera Stream State**: Represents whether live camera frames are unavailable, starting, visible, hidden, interrupted, or stopped.
- **Measurement Session**: Represents an active posture measurement run that depends on camera availability and owns the user-facing measurement state.
- **Camera Error State**: Represents recoverable and non-recoverable camera failures, including permission denied, unavailable device, busy device, and frame collection failure.
- **Camera Preference**: Represents the app-inferred preferred camera device when more than one camera is available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of users with an available camera and granted permission reach the measurement screen with a visible preview within 5 seconds after starting the camera flow.
- **SC-002**: 100% of permission-denied attempts show actionable recovery guidance that names where the user should change the permission.
- **SC-003**: 100% of measurement exits stop camera frame collection within 2 seconds.
- **SC-004**: 0 raw camera video frames are sent to external services during measurement, onboarding, or calibration.
- **SC-005**: At least 90% of recoverable camera failures can be retried from the current screen without restarting the app.
- **SC-006**: In multi-camera environments, the app selects a usable measurement camera on the first attempt in at least 90% of sessions.
- **SC-007**: 100% of stream access attempts without the current session token are rejected, including attempts from the same device.

## Assumptions

- The feature focuses on desktop camera permission and stream readiness for posture measurement.
- Camera video is used only for local posture analysis, calibration, and live preview.
- The app may have more than one component that needs camera access, and users may see more than one related item in operating system privacy settings.
- Microphone access is out of scope because posture measurement does not require audio.
- Cloud sync, remote monitoring, and recording or saving raw camera videos are out of scope.
- Existing onboarding, calibration, measurement, and error surfaces will be reused where they already support the required user journeys.
