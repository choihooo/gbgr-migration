use tauri::State;

use super::common::{sidecar_error, sidecar_send, MAX_IMAGE_PAYLOAD_LEN};
use crate::{
    posture_engine::sidecar::SidecarHandle,
    state::posture_engine_state::{
        CalibrateFinishResponse, CalibrateFramePayload, CalibrateFrameResponse,
        CalibrateStartResponse, PostureEngineState, SetCalibrationPayload, SetCalibrationResponse,
    },
};

// ── 캘리브레이션 커맨드 ──────────────────────────────────

#[tauri::command]
pub fn calibrate_start(
    state: State<'_, PostureEngineState>,
) -> Result<CalibrateStartResponse, String> {
    // 사이드카가 없으면 시작
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if sidecar_guard.is_none() {
            let handle = SidecarHandle::spawn()?;
            *sidecar_guard = Some(handle);
        }
    }

    let result = sidecar_send(&state, &serde_json::json!({"command": "calibrate_start"}))?;
    if let Some(error) = sidecar_error(&result) {
        return Err(error);
    }

    Ok(CalibrateStartResponse {
        status: result
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("error")
            .to_string(),
    })
}

#[tauri::command]
pub fn calibrate_frame(
    payload: CalibrateFramePayload,
    state: State<'_, PostureEngineState>,
) -> Result<CalibrateFrameResponse, String> {
    if payload.image_payload.len() > MAX_IMAGE_PAYLOAD_LEN {
        return Err("frame_payload_too_large: 보정 프레임 이미지가 너무 큽니다".to_string());
    }

    let result = sidecar_send(
        &state,
        &serde_json::json!({
            "command": "calibrate_frame",
            "session_id": payload.session_id,
            "image_payload": payload.image_payload,
            "captured_at": payload.captured_at,
            "frame_size": {"width": payload.frame_size.width, "height": payload.frame_size.height}
        }),
    )?;
    if let Some(error) = sidecar_error(&result) {
        return Err(error);
    }

    Ok(CalibrateFrameResponse {
        status: result
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("error")
            .to_string(),
        frame_count: result
            .get("frame_count")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32,
        step1_error: result
            .get("step1_error")
            .and_then(|v| v.as_str())
            .map(String::from),
        step2_error: result
            .get("step2_error")
            .and_then(|v| v.as_str())
            .map(String::from),
    })
}

#[tauri::command]
pub fn calibrate_finish(
    state: State<'_, PostureEngineState>,
) -> Result<CalibrateFinishResponse, String> {
    let result = sidecar_send(&state, &serde_json::json!({"command": "calibrate_finish"}))?;
    if let Some(error) = sidecar_error(&result) {
        return Err(error);
    }

    let success = result
        .get("success")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    Ok(CalibrateFinishResponse {
        status: result
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("error")
            .to_string(),
        success,
        mu_pi: result.get("mu_PI").and_then(|v| v.as_f64()),
        sigma_pi: result.get("sigma_PI").and_then(|v| v.as_f64()),
        quality: result
            .get("quality")
            .and_then(|v| v.as_str())
            .map(String::from),
        n_total: result
            .get("nTotal")
            .and_then(|v| v.as_u64())
            .map(|v| v as u32),
        n_pass: result
            .get("nPass")
            .and_then(|v| v.as_u64())
            .map(|v| v as u32),
        pass_rate: result.get("passRate").and_then(|v| v.as_f64()),
        message: result
            .get("message")
            .and_then(|v| v.as_str())
            .map(String::from),
    })
}

#[tauri::command]
pub fn set_calibration(
    payload: SetCalibrationPayload,
    state: State<'_, PostureEngineState>,
) -> Result<SetCalibrationResponse, String> {
    let result = sidecar_send(
        &state,
        &serde_json::json!({
            "command": "set_calibration",
            "mu": payload.mu,
            "sigma": payload.sigma,
        }),
    )?;
    if let Some(error) = sidecar_error(&result) {
        return Err(error);
    }

    Ok(SetCalibrationResponse {
        status: result
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("error")
            .to_string(),
        mu: result.get("mu").and_then(|v| v.as_f64()).unwrap_or(0.0),
        sigma: result.get("sigma").and_then(|v| v.as_f64()).unwrap_or(1.0),
    })
}
