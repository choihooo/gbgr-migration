use std::{sync::atomic::Ordering, thread};

use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

use super::common::{
    emit_engine_status, emit_result, emit_warning, engine_status_from_response,
    handle_sidecar_failure, invalidate_sidecar, parse_result, set_engine_error, sidecar_error,
    sidecar_send, MAX_IMAGE_PAYLOAD_LEN,
};
use crate::{
    posture_engine::sidecar::{spawn_python_sidecar, spawn_with_debug_fallback},
    state::posture_engine_state::{
        now_iso, CameraOwner, EngineMode, LatestPostureStateResponse, MeasurementSession,
        PostureEngineState, PushPostureFramePayload, PushPostureFrameResponse,
        StartPostureEngineResponse, StopPostureEngineResponse,
    },
};

#[tauri::command]
pub fn start_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StartPostureEngineResponse, String> {
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
        set_engine_error(&state, &error);
        emit_engine_status(&app, &state).map_err(|e| e.to_string())?;
        return Err(error);
    }

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
    let stream_url = sidecar_response
        .get("stream_url")
        .and_then(|v| v.as_str())
        .map(String::from);

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

    Ok(StartPostureEngineResponse {
        engine_status: engine_status_from_response(&sidecar_response, "ready"),
        session_id,
        mode: EngineMode::Foreground,
        stream_url,
    })
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
        let mut inflight_guard = state.frame_inflight.lock().map_err(|e| e.to_string())?;
        *inflight_guard = false;
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

    if payload.image_payload.len() > MAX_IMAGE_PAYLOAD_LEN {
        let _ = emit_warning(
            &app,
            "frame_rejected",
            Some(payload.session_id),
            "프레임 이미지가 너무 큽니다",
        );
        return Ok(PushPostureFrameResponse {
            accepted: false,
            reason: Some("frame_payload_too_large".to_string()),
        });
    }

    {
        let mut inflight = state.frame_inflight.lock().map_err(|e| e.to_string())?;
        if *inflight {
            return Ok(PushPostureFrameResponse {
                accepted: false,
                reason: Some("inference_busy".to_string()),
            });
        }
        *inflight = true;
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
        let result: serde_json::Value = match sidecar_send(&state, &payload) {
            Ok(r) => r,
            Err(error) => {
                handle_sidecar_failure(&app_clone, &state, &error);
                if let Ok(mut inflight) = state.frame_inflight.lock() {
                    *inflight = false;
                }
                return;
            }
        };

        if let Some(result_data) = parse_result(&result, EngineMode::Foreground) {
            {
                let mut latest = state.latest_result.lock().unwrap();
                *latest = Some(result_data.clone());
            }

            let _ = emit_result(&app_clone, &result_data);
        }

        if let Ok(mut inflight) = state.frame_inflight.lock() {
            *inflight = false;
        };
    });

    Ok(PushPostureFrameResponse {
        accepted: true,
        reason: None,
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
