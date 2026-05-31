use std::sync::atomic::Ordering;

use tauri::{AppHandle, State};
use uuid::Uuid;

use super::background::{spawn_camera_measurement_worker, stop_camera_measurement_worker};
use super::common::{
    emit_engine_status, emit_warning, engine_status_from_response, handle_sidecar_failure,
    invalidate_sidecar, set_engine_error, sidecar_error, sidecar_send,
};
use crate::{
    posture_engine::sidecar::{spawn_python_sidecar, spawn_with_debug_fallback},
    state::posture_engine_state::{
        now_iso, CameraOwner, EngineMode, LatestPostureStateResponse, MeasurementSession,
        PostureEngineState, StartPostureEngineResponse, StopPostureEngineResponse,
        WarmupPostureEngineResponse,
    },
};

#[tauri::command]
pub fn warmup_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<WarmupPostureEngineResponse, String> {
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if sidecar_guard.is_none() {
            let handle = spawn_with_debug_fallback()?;
            *sidecar_guard = Some(handle);
        }
    }

    let response = match sidecar_send(&state, &serde_json::json!({"command": "warmup"})) {
        Ok(response) => response,
        Err(error) => {
            handle_sidecar_failure(&app, &state, &error);
            return Err(error);
        }
    };

    let message = response
        .get("message")
        .and_then(|v| v.as_str())
        .map(String::from);

    {
        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        engine_guard.engine_status = engine_status_from_response(&response, "ready");
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::None;
        engine_guard.updated_at = now_iso();
        engine_guard.message = message.clone();
        engine_guard.recoverable = true;
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    if let Some(error) = sidecar_error(&response) {
        return Err(error);
    }

    Ok(WarmupPostureEngineResponse {
        engine_status: engine_status_from_response(&response, "ready"),
        message,
    })
}

#[tauri::command]
pub fn start_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StartPostureEngineResponse, String> {
    if is_camera_access_blocked() {
        let error = "camera_permission_denied";
        let _ = emit_warning(&app, "device_unavailable", None, error);
        set_engine_error(&state, error);
        emit_engine_status(&app, &state).map_err(|e| e.to_string())?;
        return Err(error.to_string());
    }

    // 1. sidecar 프로세스 시작
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if sidecar_guard.is_none() {
            let handle = spawn_with_debug_fallback()?;
            *sidecar_guard = Some(handle);
        }
        drop(sidecar_guard);
    }

    // 2. sidecar에 start 명령 전송
    let start_payload = serde_json::json!({"command": "start"});
    let sidecar_response = match sidecar_send(&state, &start_payload) {
        Ok(response) => response,
        Err(error)
            if cfg!(debug_assertions) && std::env::var("GBGR_POSTURE_ENGINE_BIN").is_ok() =>
        {
            eprintln!(
                "[posture-engine] debug binary sidecar start 실패, Python 스크립트로 재시도합니다: {error}"
            );
            invalidate_sidecar(&state);

            {
                let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
                *sidecar_guard = Some(spawn_python_sidecar()?);
            }

            match sidecar_send(&state, &start_payload) {
                Ok(response) => response,
                Err(retry_error) => {
                    handle_sidecar_failure(&app, &state, &retry_error);
                    return Err(retry_error);
                }
            }
        }
        Err(error) => {
            handle_sidecar_failure(&app, &state, &error);
            return Err(error);
        }
    };
    if let Some(error) = sidecar_error(&sidecar_response) {
        if is_camera_start_error(&error) {
            let _ = emit_warning(&app, "device_unavailable", None, &error);
        }
        set_engine_error(&state, &error);
        emit_engine_status(&app, &state).map_err(|e| e.to_string())?;
        return Err(error);
    }

    let stream_url = stream_url_from_start_response(&sidecar_response).map_err(|error| {
        let _ = emit_warning(&app, "device_unavailable", None, &error);
        set_engine_error(&state, &error);
        let _ = emit_engine_status(&app, &state);
        error
    })?;

    // 3. 세션 생성
    let session_id = {
        let mut session_guard = state.session.lock().map_err(|e| e.to_string())?;
        if session_guard.is_none() {
            *session_guard = Some(MeasurementSession {
                session_id: Uuid::new_v4().to_string(),
                status: "running".to_string(),
                mode: EngineMode::Foreground,
                started_at: now_iso(),
                last_result_at: None,
                latest_result_id: None,
                last_error_code: None,
            });
        }
        let id = session_guard.as_ref().map(|s| s.session_id.clone());
        drop(session_guard);
        id
    };

    // 4. 엔진 상태를 sidecar 응답 기반으로 업데이트
    {
        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        engine_guard.engine_status = engine_status_from_response(&sidecar_response, "ready");
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::Python;
        engine_guard.updated_at = now_iso();
        engine_guard.message = None;
        engine_guard.recoverable = true;
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    if let Some(session_id) = session_id.clone() {
        spawn_camera_measurement_worker(app.clone(), state, session_id, EngineMode::Foreground)?;
    }

    Ok(StartPostureEngineResponse {
        engine_status: engine_status_from_response(&sidecar_response, "ready"),
        session_id,
        mode: EngineMode::Foreground,
        stream_url,
    })
}

fn is_camera_start_error(error: &str) -> bool {
    matches!(
        error,
        "camera_permission_denied"
            | "camera_unavailable"
            | "camera_busy"
            | "camera_frame_unavailable"
    )
}

fn stream_url_from_start_response(response: &serde_json::Value) -> Result<Option<String>, String> {
    let stream_url = response
        .get("stream_url")
        .and_then(|v| v.as_str())
        .filter(|value| value.starts_with("http://127.0.0.1:"))
        .map(String::from);

    if stream_url.is_none() {
        return Err("camera_frame_unavailable".to_string());
    }

    Ok(stream_url)
}

#[cfg(target_os = "macos")]
fn is_camera_access_blocked() -> bool {
    const AV_AUTH_STATUS_AUTHORIZED: i64 = 3;

    camera_authorization_status()
        .map(|status| status != AV_AUTH_STATUS_AUTHORIZED)
        .unwrap_or(false)
}

#[cfg(not(target_os = "macos"))]
fn is_camera_access_blocked() -> bool {
    false
}

#[cfg(target_os = "macos")]
fn camera_authorization_status() -> Option<i64> {
    use objc2::{
        msg_send,
        runtime::{AnyClass, AnyObject},
    };
    use std::ffi::CStr;

    #[link(name = "AVFoundation", kind = "framework")]
    extern "C" {
        static AVMediaTypeVideo: *mut AnyObject;
    }

    let class_name = CStr::from_bytes_with_nul(b"AVCaptureDevice\0").ok()?;
    let capture_device_class = AnyClass::get(class_name)?;
    let media_type = unsafe { AVMediaTypeVideo };
    let status: i64 = unsafe {
        msg_send![
            capture_device_class,
            authorizationStatusForMediaType: media_type
        ]
    };

    Some(status)
}

#[tauri::command]
pub fn stop_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StopPostureEngineResponse, String> {
    {
        let mut worker_guard = state
            .background_worker_stop
            .lock()
            .map_err(|e| e.to_string())?;
        if let Some(stop_flag) = worker_guard.take() {
            stop_flag.store(true, Ordering::SeqCst);
        }
    }
    stop_camera_measurement_worker(&state)?;

    // 1. sidecar에 stop 명령 전송
    {
        let _ = sidecar_send(&state, &serde_json::json!({"command": "stop"}));
    }

    // 2. sidecar 프로세스 종료
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = sidecar_guard.take() {
            drop(handle); // Drop이 kill을 호출함
        }
    }

    let released_owner = {
        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        let owner = engine_guard.camera_owner.clone();
        engine_guard.engine_status = "idle".to_string();
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::None;
        engine_guard.updated_at = now_iso();
        owner
    };

    {
        let mut session_guard = state.session.lock().map_err(|e| e.to_string())?;
        *session_guard = None;
    }
    {
        let mut latest_result_guard = state.latest_result.lock().map_err(|e| e.to_string())?;
        *latest_result_guard = None;
    }
    {
        let mut metrics_guard = state.session_metrics.lock().map_err(|e| e.to_string())?;
        *metrics_guard = Default::default();
    }
    {
        let mut ownership_guard = state.ownership.lock().map_err(|e| e.to_string())?;
        *ownership_guard = crate::posture_engine::ownership::transition_ownership(
            CameraOwner::None,
            &EngineMode::Foreground,
        );
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    Ok(StopPostureEngineResponse {
        engine_status: "idle".to_string(),
        released_owner,
    })
}

#[tauri::command]
pub fn get_latest_posture_state(
    state: State<'_, PostureEngineState>,
) -> Result<LatestPostureStateResponse, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?.clone();
    let latest_result = state
        .latest_result
        .lock()
        .map_err(|e| e.to_string())?
        .clone();
    let engine_state = state
        .engine_state
        .lock()
        .map_err(|e| e.to_string())?
        .clone();

    Ok(LatestPostureStateResponse {
        session,
        latest_result,
        engine_state,
    })
}

#[cfg(test)]
mod tests {
    use super::{is_camera_start_error, stream_url_from_start_response};

    #[test]
    fn start_response_requires_local_stream_url_before_session_creation() {
        let response = serde_json::json!({
            "engine_status": "ready",
            "mode": "foreground",
            "camera_owner": "python",
            "stream_url": null
        });

        assert_eq!(
            stream_url_from_start_response(&response).unwrap_err(),
            "camera_frame_unavailable"
        );
    }

    #[test]
    fn start_response_accepts_only_loopback_stream_url() {
        let response = serde_json::json!({
            "engine_status": "ready",
            "stream_url": "https://example.com/video?token=bad"
        });

        assert_eq!(
            stream_url_from_start_response(&response).unwrap_err(),
            "camera_frame_unavailable"
        );

        let response = serde_json::json!({
            "engine_status": "ready",
            "stream_url": "http://127.0.0.1:49152/video?token=test-token"
        });

        assert_eq!(
            stream_url_from_start_response(&response).unwrap(),
            Some("http://127.0.0.1:49152/video?token=test-token".to_string())
        );
    }

    #[test]
    fn camera_busy_is_a_recoverable_camera_start_error() {
        assert!(is_camera_start_error("camera_busy"));
    }
}
