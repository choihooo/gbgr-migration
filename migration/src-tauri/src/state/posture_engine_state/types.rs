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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CameraDiagnosticEvent {
    pub error_code: Option<String>,
    pub permission_state: String,
    pub transition: String,
    pub duration_ms: Option<u64>,
    pub occurred_at: String,
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
    #[serde(default)]
    pub camera_diagnostics: Vec<CameraDiagnosticEvent>,
}
