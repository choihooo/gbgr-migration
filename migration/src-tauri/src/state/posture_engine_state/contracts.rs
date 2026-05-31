use serde::{Deserialize, Serialize};

use super::types::{
    CameraOwner, EngineMode, EngineStateEvent, MeasurementSession, PostureEngineResult,
};

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
    pub stream_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarmupPostureEngineResponse {
    pub engine_status: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StopPostureEngineResponse {
    pub engine_status: String,
    pub released_owner: CameraOwner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrameSize {
    pub width: u32,
    pub height: u32,
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

// ── 캘리브레이션 관련 타입 ──────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrateStartResponse {
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrateFramePayload {
    pub session_id: String,
    pub image_payload: String,
    pub captured_at: String,
    pub frame_size: FrameSize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrateCameraFramePayload {
    pub session_id: String,
    pub captured_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrateFrameResponse {
    pub status: String,
    pub frame_count: u32,
    pub step1_error: Option<String>,
    pub step2_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrateFinishResponse {
    pub status: String,
    pub success: bool,
    pub mu_pi: Option<f64>,
    pub sigma_pi: Option<f64>,
    pub quality: Option<String>,
    pub n_total: Option<u32>,
    pub n_pass: Option<u32>,
    pub pass_rate: Option<f64>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetCalibrationPayload {
    pub mu: f64,
    pub sigma: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetCalibrationResponse {
    pub status: String,
    pub mu: f64,
    pub sigma: f64,
}
