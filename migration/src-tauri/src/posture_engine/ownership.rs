use crate::state::posture_engine_state::{
    now_iso, CameraLockState, CameraOwner, CameraOwnershipState, EngineMode,
};

pub fn transition_ownership(current_owner: CameraOwner, mode: &EngineMode) -> CameraOwnershipState {
    let requested_owner = match mode {
        EngineMode::Foreground | EngineMode::Background => CameraOwner::Python,
    };

    let lock_state = if current_owner == requested_owner {
        CameraLockState::Held
    } else if matches!(current_owner, CameraOwner::None) {
        CameraLockState::Acquiring
    } else {
        CameraLockState::Releasing
    };

    CameraOwnershipState {
        owner: requested_owner.clone(),
        requested_owner,
        lock_state,
        updated_at: now_iso(),
    }
}
