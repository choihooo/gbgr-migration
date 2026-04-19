use std::thread;
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

use crate::{
    posture_engine::{
        events::{POSTURE_ENGINE_STATUS_EVENT, POSTURE_WARNING_EVENT},
        notification_bridge::build_warning_event,
        sidecar::SidecarHandle,
    },
    state::posture_engine_state::{
        now_iso, BackgroundMeasurementPayload, BackgroundMeasurementResponse, CameraOwner, EngineMode,
        MeasurementSession, PostureEngineResult, PostureEngineState,
        PushPostureFramePayload, PushPostureFrameResponse, StartPostureEngineResponse,
        StopPostureEngineResponse,
    },
};

/// sidecar에 명령을 보내고 응답을 받는 헬퍼
fn sidecar_send(
    state: &PostureEngineState,
    payload: &serde_json::Value,
) -> Result<serde_json::Value, String> {
    let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
    let handle = sidecar_guard
        .as_mut()
        .ok_or("sidecar가 실행 중이 아님")?;
    handle.send_and_recv(payload)
}

/// sidecar에 명령만 보내는 헬퍼 (응답 대기 없음)
#[allow(dead_code)]
fn sidecar_send_only(
    state: &PostureEngineState,
    payload: &serde_json::Value,
) -> Result<(), String> {
    let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
    let handle = sidecar_guard
        .as_mut()
        .ok_or("sidecar가 실행 중이 아님")?;
    handle.send_only(payload)
}

fn emit_engine_status(app: &AppHandle, state: &PostureEngineState) -> tauri::Result<()> {
    let engine_state = state.engine_state.lock().unwrap().clone();
    app.emit(POSTURE_ENGINE_STATUS_EVENT, engine_state)
}

fn emit_warning(app: &AppHandle, code: &str, session_id: Option<String>, message: &str) -> tauri::Result<()> {
    app.emit(
        POSTURE_WARNING_EVENT,
        build_warning_event(code, session_id, message.to_string()),
    )
}

fn emit_result(app: &AppHandle, result: &PostureEngineResult) -> tauri::Result<()> {
    app.emit("posture://result", result)
}

#[allow(dead_code)]
fn set_engine_error(state: &PostureEngineState, message: &str) {
    if let Ok(mut guard) = state.engine_state.lock() {
        guard.engine_status = "error".to_string();
        guard.message = Some(message.to_string());
        guard.recoverable = true;
        guard.updated_at = now_iso();
    }
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
        let ownership =
            crate::posture_engine::ownership::transition_ownership(engine_guard.camera_owner.clone(), &mode_clone);

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

#[tauri::command]
pub fn start_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StartPostureEngineResponse, String> {
    // 1. sidecar 프로세스 시작
    {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        if sidecar_guard.is_none() {
            let handle = SidecarHandle::spawn()?;
            *sidecar_guard = Some(handle);
        }
        drop(sidecar_guard);
    }

    // 2. sidecar에 start 명령 전송
    let sidecar_response = sidecar_send(&state, &serde_json::json!({"command": "start"}))?;

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
        engine_guard.engine_status = sidecar_response
            .get("engine_status")
            .and_then(|v| v.as_str())
            .unwrap_or("ready")
            .to_string();
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::React;
        engine_guard.updated_at = now_iso();
        engine_guard.message = None;
        engine_guard.recoverable = true;
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    Ok(StartPostureEngineResponse {
        engine_status: "ready".to_string(),
        session_id,
        mode: EngineMode::Foreground,
    })
}

#[tauri::command]
pub fn stop_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StopPostureEngineResponse, String> {
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
pub fn push_posture_frame(
    app: AppHandle,
    payload: PushPostureFramePayload,
    state: State<'_, PostureEngineState>,
) -> Result<PushPostureFrameResponse, String> {
    let current_session_id = {
        let session_guard = state.session.lock().map_err(|e| e.to_string())?;
        session_guard.as_ref().map(|s| s.session_id.clone())
    };

    if current_session_id.is_none() {
        let _ = emit_warning(
            &app,
            "frame_rejected",
            None,
            "활성 세션이 없어 프레임을 처리할 수 없어요",
        );
        return Ok(PushPostureFrameResponse {
            accepted: false,
            reason: Some("no_active_session".to_string()),
        });
    }

    if current_session_id.as_deref() != Some(&payload.session_id) {
        let _ = emit_warning(
            &app,
            "frame_rejected",
            Some(payload.session_id),
            "현재 세션과 다른 프레임이 전달되었어요",
        );
        return Ok(PushPostureFrameResponse {
            accepted: false,
            reason: Some("session_mismatch".to_string()),
        });
    }

    // 비동기로 sidecar에 프레임 전송 + 결과 수신
    let app_clone = app.clone();
    let session_id = payload.session_id.clone();
    let image_payload = payload.image_payload.clone();
    let frame_width = payload.frame_size.width;
    let frame_height = payload.frame_size.height;
    let captured_at = payload.captured_at.clone();

    // sidecar stdin에 쓰고 stdout에서 결과를 읽는 건 별도 스레드에서
    thread::spawn(move || {
        let payload = serde_json::json!({
            "command": "frame",
            "session_id": session_id,
            "image_payload": image_payload,
            "captured_at": captured_at,
            "frame_size": {"width": frame_width, "height": frame_height}
        });

        let state: State<'_, PostureEngineState> = app_clone.state::<PostureEngineState>();
        let result: serde_json::Value = {
            let mut sidecar_guard = match state.sidecar.lock() {
                Ok(g) => g,
                Err(_) => return,
            };
            let handle: &mut SidecarHandle = match sidecar_guard.as_mut() {
                Some(h) => h,
                None => return,
            };
            match handle.send_and_recv(&payload) {
                Ok(r) => r,
                Err(_) => return,
            }
        };

        // 결과 파싱
        if let Some(posture_class) = result.get("posture_class").and_then(|v: &serde_json::Value| v.as_u64()) {
            let result_data = PostureEngineResult {
                result_id: result
                    .get("result_id")
                    .and_then(|v: &serde_json::Value| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                session_id: result
                    .get("session_id")
                    .and_then(|v: &serde_json::Value| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                timestamp: result
                    .get("timestamp")
                    .and_then(|v: &serde_json::Value| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                posture_class: posture_class as u8,
                score: result
                    .get("score")
                    .and_then(|v: &serde_json::Value| v.as_f64())
                    .unwrap_or(0.0),
                pi: result.get("pi").and_then(|v: &serde_json::Value| v.as_f64()),
                landmarks: vec![],
                source: result
                    .get("source")
                    .and_then(|v: &serde_json::Value| v.as_str())
                    .unwrap_or("python_engine")
                    .to_string(),
                engine_mode: EngineMode::Foreground,
                events: result
                    .get("events")
                    .and_then(|v: &serde_json::Value| v.as_array())
                    .map(|arr: &Vec<serde_json::Value>| {
                        arr.iter()
                            .filter_map(|v: &serde_json::Value| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default(),
            };

            {
                let mut latest = state.latest_result.lock().unwrap();
                *latest = Some(result_data.clone());
            }

            let _ = emit_result(&app_clone, &result_data);
        }
    });

    Ok(PushPostureFrameResponse {
        accepted: true,
        reason: None,
    })
}

#[tauri::command]
pub fn start_background_measurement(
    app: AppHandle,
    payload: BackgroundMeasurementPayload,
    state: State<'_, PostureEngineState>,
) -> Result<BackgroundMeasurementResponse, String> {
    // sidecar에 명령 전송
    let _ = sidecar_send(
        &state,
        &serde_json::json!({
            "command": "start_background",
            "session_id": payload.session_id
        }),
    );

    let response = match apply_mode_change(&state, &payload.session_id, EngineMode::Background) {
        Ok(response) => response,
        Err(error) => {
            let _ = emit_warning(
                &app,
                "device_unavailable",
                Some(payload.session_id),
                "백그라운드 측정을 시작할 세션이 없어요",
            );
            return Err(error);
        }
    };

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    Ok(response)
}

#[tauri::command]
pub fn stop_background_measurement(
    app: AppHandle,
    payload: BackgroundMeasurementPayload,
    state: State<'_, PostureEngineState>,
) -> Result<BackgroundMeasurementResponse, String> {
    // sidecar에 명령 전송
    let _ = sidecar_send(
        &state,
        &serde_json::json!({
            "command": "stop_background",
            "session_id": payload.session_id
        }),
    );

    let response = match apply_mode_change(&state, &payload.session_id, EngineMode::Foreground) {
        Ok(response) => response,
        Err(error) => {
            let _ = emit_warning(
                &app,
                "device_unavailable",
                Some(payload.session_id),
                "포그라운드 복귀를 준비할 세션이 없어요",
            );
            return Err(error);
        }
    };

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    Ok(response)
}

#[tauri::command]
pub fn get_latest_posture_state(
    state: State<'_, PostureEngineState>,
) -> Result<crate::state::posture_engine_state::LatestPostureStateResponse, String> {
    let session = state.session.lock().map_err(|e| e.to_string())?.clone();
    let latest_result = state.latest_result.lock().map_err(|e| e.to_string())?.clone();
    let engine_state = state.engine_state.lock().map_err(|e| e.to_string())?.clone();

    Ok(crate::state::posture_engine_state::LatestPostureStateResponse {
        session,
        latest_result,
        engine_state,
    })
}
