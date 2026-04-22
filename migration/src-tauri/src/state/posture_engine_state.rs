use std::sync::Mutex;

use crate::posture_engine::sidecar::SidecarHandle;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EngineMode {
    Foreground,
    Background,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CameraOwner {
    React,
    Python,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CameraLockState {
    Free,
    Releasing,
    Acquiring,
    Held,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraOwnershipState {
    pub owner: CameraOwner,
    pub requested_owner: CameraOwner,
    pub lock_state: CameraLockState,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementSession {
    pub session_id: String,
    pub status: String,
    pub mode: EngineMode,
    pub started_at: String,
    pub last_result_at: Option<String>,
    pub latest_result_id: Option<String>,
    pub last_error_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoseLandmark {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub visibility: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostureEngineResult {
    pub result_id: String,
    pub session_id: String,
    pub timestamp: String,
    pub posture_class: u8,
    pub score: f64,
    pub pi: Option<f64>,
    pub landmarks: Vec<PoseLandmark>,
    pub source: String,
    pub engine_mode: EngineMode,
    pub events: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStateEvent {
    pub engine_status: String,
    pub mode: EngineMode,
    pub camera_owner: CameraOwner,
    pub updated_at: String,
    pub message: Option<String>,
    pub recoverable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestPostureStateResponse {
    pub session: Option<MeasurementSession>,
    pub latest_result: Option<PostureEngineResult>,
    pub engine_state: EngineStateEvent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartPostureEngineResponse {
    pub engine_status: String,
    pub session_id: Option<String>,
    pub mode: EngineMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StopPostureEngineResponse {
    pub engine_status: String,
    pub released_owner: CameraOwner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushPostureFramePayload {
    pub session_id: String,
    pub image_payload: String,
    pub captured_at: String,
    pub frame_size: FrameSize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameSize {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushPostureFrameResponse {
    pub accepted: bool,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackgroundMeasurementPayload {
    pub session_id: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackgroundMeasurementResponse {
    pub engine_status: String,
    pub mode: EngineMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SessionMetricsSnapshot {
    pub total_results: u32,
    pub bad_results: u32,
    pub last_score: Option<f64>,
    pub last_posture_class: Option<u8>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PostureWarningEvent {
    pub code: String,
    pub message: String,
    pub session_id: Option<String>,
    pub occurred_at: String,
}

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
            }),
            ownership: Mutex::new(CameraOwnershipState {
                owner: CameraOwner::None,
                requested_owner: CameraOwner::None,
                lock_state: CameraLockState::Free,
                updated_at: now_iso(),
            }),
            session_metrics: Mutex::new(SessionMetricsSnapshot::default()),
            sidecar: Mutex::new(None),
        }
    }
}

pub fn now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    format!("{timestamp}")
}
