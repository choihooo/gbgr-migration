use std::sync::{atomic::AtomicBool, Arc, Mutex};

use crate::posture_engine::sidecar::SidecarHandle;

use super::{
    time::now_iso, CameraLockState, CameraOwner, CameraOwnershipState, EngineMode,
    EngineStateEvent, MeasurementSession, PostureEngineResult, SessionMetricsSnapshot,
};

impl std::fmt::Debug for PostureEngineState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PostureEngineState")
            .field("session", &self.session)
            .field("engine_state", &self.engine_state)
            .finish_non_exhaustive()
    }
}

pub struct PostureEngineState {
    pub session: Mutex<Option<MeasurementSession>>,
    pub latest_result: Mutex<Option<PostureEngineResult>>,
    pub engine_state: Mutex<EngineStateEvent>,
    pub ownership: Mutex<CameraOwnershipState>,
    pub session_metrics: Mutex<SessionMetricsSnapshot>,
    pub sidecar: Mutex<Option<SidecarHandle>>,
    pub background_worker_stop: Mutex<Option<Arc<AtomicBool>>>,
}

impl Default for PostureEngineState {
    fn default() -> Self {
        Self {
            session: Mutex::new(None),
            latest_result: Mutex::new(None),
            engine_state: Mutex::new(EngineStateEvent {
                engine_status: "idle".to_string(),
                mode: EngineMode::Foreground,
                camera_owner: CameraOwner::None,
                updated_at: now_iso(),
                message: None,
                recoverable: true,
                camera_diagnostics: Vec::new(),
            }),
            ownership: Mutex::new(CameraOwnershipState {
                owner: CameraOwner::None,
                requested_owner: CameraOwner::None,
                lock_state: CameraLockState::Free,
                updated_at: now_iso(),
            }),
            session_metrics: Mutex::new(SessionMetricsSnapshot::default()),
            sidecar: Mutex::new(None),
            background_worker_stop: Mutex::new(None),
        }
    }
}
