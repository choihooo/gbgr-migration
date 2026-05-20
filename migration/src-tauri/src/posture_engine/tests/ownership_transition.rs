use crate::{
    posture_engine::ownership::transition_ownership,
    state::posture_engine_state::{CameraLockState, CameraOwner, EngineMode},
};

#[test]
fn ownership_transition_moves_to_python_on_background() {
    let ownership = transition_ownership(CameraOwner::React, &EngineMode::Background);

    assert!(matches!(ownership.owner, CameraOwner::Python));
    assert!(matches!(ownership.requested_owner, CameraOwner::Python));
    assert!(matches!(ownership.lock_state, CameraLockState::Releasing));
}

#[test]
fn ownership_transition_keeps_owner_when_already_foreground() {
    let ownership = transition_ownership(CameraOwner::Python, &EngineMode::Foreground);

    assert!(matches!(ownership.owner, CameraOwner::Python));
    assert!(matches!(ownership.lock_state, CameraLockState::Held));
}
