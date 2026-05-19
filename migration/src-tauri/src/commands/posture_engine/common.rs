use std::time::Duration;

use tauri::{AppHandle, Emitter};

use crate::{
    posture_engine::{
        events::{POSTURE_ENGINE_STATUS_EVENT, POSTURE_RESULT_EVENT, POSTURE_WARNING_EVENT},
        notification_bridge::{build_warning_event, evaluate_background_notification},
        session_metrics::record_session_result,
    },
    state::posture_engine_state::{
        now_iso, BackgroundMeasurementResponse, CameraOwner, EngineMode, PostureEngineResult,
        PostureEngineState,
    },
};

pub(super) const BACKGROUND_FRAME_INTERVAL: Duration = Duration::from_millis(200);

/// base64 인코딩된 이미지 payload 최대 크기 (약 10MB 원본 = 13.3M 자)
pub(super) const MAX_IMAGE_PAYLOAD_LEN: usize = 14_000_000;

/// sidecar에 명령을 보내고 응답을 받는 헬퍼
pub(super) fn sidecar_send(
    state: &PostureEngineState,
    payload: &serde_json::Value,
) -> Result<serde_json::Value, String> {
    let result = {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        let handle = sidecar_guard.as_mut().ok_or("sidecar가 실행 중이 아님")?;
        handle.send_and_recv(payload)
    };

    if result.is_err() {
        invalidate_sidecar(state);
    }

    result
}

pub(super) fn sidecar_error(response: &serde_json::Value) -> Option<String> {
    response
        .get("error")
        .and_then(|v| v.as_str())
        .map(String::from)
        .or_else(|| {
            let is_error = response
                .get("engine_status")
                .and_then(|v| v.as_str())
                .is_some_and(|status| status == "error");
            is_error.then(|| {
                response
                    .get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("sidecar_error")
                    .to_string()
            })
        })
}

pub(super) fn engine_status_from_response(response: &serde_json::Value, fallback: &str) -> String {
    response
        .get("engine_status")
        .and_then(|v| v.as_str())
        .unwrap_or(fallback)
        .to_string()
}

pub(super) fn invalidate_sidecar(state: &PostureEngineState) {
    if let Ok(mut sidecar_guard) = state.sidecar.lock() {
        let _ = sidecar_guard.take();
    }
}

pub(super) fn emit_engine_status(app: &AppHandle, state: &PostureEngineState) -> tauri::Result<()> {
    let engine_state = state.engine_state.lock().unwrap().clone();
    app.emit(POSTURE_ENGINE_STATUS_EVENT, engine_state)
}

pub(super) fn emit_warning(
    app: &AppHandle,
    code: &str,
    session_id: Option<String>,
    message: &str,
) -> tauri::Result<()> {
    app.emit(
        POSTURE_WARNING_EVENT,
        build_warning_event(code, session_id, message.to_string()),
    )
}

pub(super) fn emit_result(app: &AppHandle, result: &PostureEngineResult) -> tauri::Result<()> {
    app.emit(POSTURE_RESULT_EVENT, result)
}

#[allow(dead_code)]
pub(super) fn set_engine_error(state: &PostureEngineState, message: &str) {
    if let Ok(mut guard) = state.engine_state.lock() {
        guard.engine_status = "error".to_string();
        guard.message = Some(message.to_string());
        guard.recoverable = true;
        guard.updated_at = now_iso();
    }
}

pub(super) fn handle_sidecar_failure(app: &AppHandle, state: &PostureEngineState, error: &str) {
    set_engine_error(state, error);
    let _ = emit_engine_status(app, state);
}

pub(super) fn parse_result(
    result: &serde_json::Value,
    default_mode: EngineMode,
) -> Option<PostureEngineResult> {
    let posture_class = result.get("posture_class").and_then(|v| v.as_u64())?;
    let engine_mode = match result.get("engine_mode").and_then(|v| v.as_str()) {
        Some("background") => EngineMode::Background,
        Some("foreground") => EngineMode::Foreground,
        _ => default_mode,
    };

    Some(PostureEngineResult {
        result_id: result
            .get("result_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        session_id: result
            .get("session_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        timestamp: result
            .get("timestamp")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        posture_class: posture_class as u8,
        score: result.get("score").and_then(|v| v.as_f64()).unwrap_or(0.0),
        pi: result.get("pi").and_then(|v| v.as_f64()),
        landmarks: result
            .get("landmarks")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| {
                        Some(crate::state::posture_engine_state::PoseLandmark {
                            x: v.get("x")?.as_f64()?,
                            y: v.get("y")?.as_f64()?,
                            z: v.get("z")?.as_f64()?,
                            visibility: v.get("visibility").and_then(|v| v.as_f64()),
                        })
                    })
                    .collect()
            })
            .unwrap_or_default(),
        source: result
            .get("source")
            .and_then(|v| v.as_str())
            .unwrap_or("python_engine")
            .to_string(),
        engine_mode,
        events: result
            .get("events")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
    })
}

pub(crate) fn ingest_background_result_with_notification(
    state: &PostureEngineState,
    result: PostureEngineResult,
) -> Result<Option<String>, String> {
    {
        let mut session_guard = state.session.lock().map_err(|e| e.to_string())?;
        if let Some(session) = session_guard.as_mut() {
            session.last_result_at = Some(result.timestamp.clone());
            session.latest_result_id = Some(result.result_id.clone());
            session.mode = result.engine_mode.clone();
        }
    }

    {
        let mut latest = state.latest_result.lock().map_err(|e| e.to_string())?;
        *latest = Some(result.clone());
    }

    {
        let mut metrics = state.session_metrics.lock().map_err(|e| e.to_string())?;
        record_session_result(&mut metrics, &result);
    }

    {
        let mut engine = state.engine_state.lock().map_err(|e| e.to_string())?;
        engine.mode = result.engine_mode.clone();
        engine.engine_status = "measuring".to_string();
        engine.camera_owner = CameraOwner::Python;
        engine.updated_at = now_iso();
        engine.message = None;
        engine.recoverable = true;
    }

    let decision = evaluate_background_notification(&result);
    Ok(decision
        .should_notify
        .then(|| decision.message.unwrap_or_default()))
}

pub(crate) fn apply_mode_change(
    state: &PostureEngineState,
    session_id: &str,
    mode: EngineMode,
) -> Result<BackgroundMeasurementResponse, String> {
    let mode_clone = mode.clone();
    let ownership = {
        let mut session_guard = state.session.lock().map_err(|e| e.to_string())?;
        let session = session_guard
            .as_mut()
            .ok_or_else(|| "no_active_session".to_string())?;
        session.session_id = session_id.to_string();
        session.mode = mode_clone.clone();
        drop(session_guard);

        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        let ownership = crate::posture_engine::ownership::transition_ownership(
            engine_guard.camera_owner.clone(),
            &mode_clone,
        );

        engine_guard.engine_status = match &mode_clone {
            EngineMode::Background => "switching".to_string(),
            EngineMode::Foreground => "ready".to_string(),
        };
        engine_guard.mode = mode_clone.clone();
        engine_guard.camera_owner = ownership.owner.clone();
        engine_guard.updated_at = now_iso();
        engine_guard.message = None;
        engine_guard.recoverable = true;

        let engine_status = engine_guard.engine_status.clone();
        drop(engine_guard);

        let mut ownership_guard = state.ownership.lock().map_err(|e| e.to_string())?;
        *ownership_guard = ownership.clone();
        drop(ownership_guard);

        BackgroundMeasurementResponse {
            engine_status,
            mode: mode_clone,
        }
    };

    Ok(ownership)
}

#[cfg(test)]
mod tests {
    use super::{engine_status_from_response, parse_result};
    use crate::state::posture_engine_state::EngineMode;

    #[test]
    fn engine_status_from_response_uses_sidecar_status_when_present() {
        let response = serde_json::json!({
            "engine_status": "starting"
        });

        assert_eq!(engine_status_from_response(&response, "ready"), "starting");
    }

    #[test]
    fn engine_status_from_response_falls_back_when_missing() {
        let response = serde_json::json!({});

        assert_eq!(engine_status_from_response(&response, "ready"), "ready");
    }

    #[test]
    fn parse_result_accepts_python_sidecar_result_shape() {
        let response = serde_json::json!({
            "result_id": "result-1",
            "session_id": "session-1",
            "timestamp": "123",
            "posture_class": 4,
            "score": 8.1,
            "pi": 0.4,
            "landmarks": [
                {"x": 0.1, "y": 0.2, "z": 0.3, "visibility": 0.9},
                {"x": 0.4, "y": 0.5, "z": 0.6}
            ],
            "source": "python_camera",
            "engine_mode": "background",
            "events": ["enter_bad"]
        });

        let result = parse_result(&response, EngineMode::Foreground).unwrap();

        assert_eq!(result.result_id, "result-1");
        assert_eq!(result.session_id, "session-1");
        assert_eq!(result.timestamp, "123");
        assert_eq!(result.posture_class, 4);
        assert_eq!(result.score, 8.1);
        assert_eq!(result.pi, Some(0.4));
        assert_eq!(result.landmarks.len(), 2);
        assert_eq!(result.landmarks[0].visibility, Some(0.9));
        assert_eq!(result.landmarks[1].visibility, None);
        assert_eq!(result.source, "python_camera");
        assert!(matches!(result.engine_mode, EngineMode::Background));
        assert_eq!(result.events, vec!["enter_bad"]);
    }

    #[test]
    fn parse_result_uses_default_mode_when_sidecar_mode_is_missing() {
        let response = serde_json::json!({
            "posture_class": 0
        });

        let result = parse_result(&response, EngineMode::Background).unwrap();

        assert!(matches!(result.engine_mode, EngineMode::Background));
        assert_eq!(result.source, "python_engine");
        assert!(result.events.is_empty());
    }
}
