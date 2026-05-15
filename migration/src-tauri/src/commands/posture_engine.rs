use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};
use uuid::Uuid;

use crate::{
    posture_engine::{
        events::{POSTURE_ENGINE_STATUS_EVENT, POSTURE_RESULT_EVENT, POSTURE_WARNING_EVENT},
        notification_bridge::{build_warning_event, evaluate_background_notification},
        session_metrics::record_session_result,
        sidecar::{spawn_python_sidecar, spawn_with_debug_fallback, SidecarHandle},
    },
    state::posture_engine_state::{
        now_iso, BackgroundMeasurementPayload, BackgroundMeasurementResponse,
        CalibrateFinishResponse, CalibrateFramePayload, CalibrateFrameResponse,
        CalibrateStartResponse, CameraOwner, EngineMode, MeasurementSession, PostureEngineResult,
        PostureEngineState, PushPostureFramePayload, PushPostureFrameResponse,
        SetCalibrationPayload, SetCalibrationResponse, StartPostureEngineResponse,
        StopPostureEngineResponse,
    },
};

const BACKGROUND_FRAME_INTERVAL: Duration = Duration::from_millis(200);

/// base64 인코딩된 이미지 payload 최대 크기 (약 10MB 원본 = 13.3M 자)
const MAX_IMAGE_PAYLOAD_LEN: usize = 14_000_000;

/// sidecar에 명령을 보내고 응답을 받는 헬퍼
fn sidecar_send(
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

fn sidecar_error(response: &serde_json::Value) -> Option<String> {
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

fn engine_status_from_response(response: &serde_json::Value, fallback: &str) -> String {
    response
        .get("engine_status")
        .and_then(|v| v.as_str())
        .unwrap_or(fallback)
        .to_string()
}

/// sidecar에 명령만 보내는 헬퍼 (응답 대기 없음)
#[allow(dead_code)]
fn sidecar_send_only(
    state: &PostureEngineState,
    payload: &serde_json::Value,
) -> Result<(), String> {
    let result = {
        let mut sidecar_guard = state.sidecar.lock().map_err(|e| e.to_string())?;
        let handle = sidecar_guard.as_mut().ok_or("sidecar가 실행 중이 아님")?;
        handle.send_only(payload)
    };

    if result.is_err() {
        invalidate_sidecar(state);
    }

    result
}

fn invalidate_sidecar(state: &PostureEngineState) {
    if let Ok(mut sidecar_guard) = state.sidecar.lock() {
        let _ = sidecar_guard.take();
    }
}

fn emit_engine_status(app: &AppHandle, state: &PostureEngineState) -> tauri::Result<()> {
    let engine_state = state.engine_state.lock().unwrap().clone();
    app.emit(POSTURE_ENGINE_STATUS_EVENT, engine_state)
}

fn emit_warning(
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

fn emit_result(app: &AppHandle, result: &PostureEngineResult) -> tauri::Result<()> {
    app.emit(POSTURE_RESULT_EVENT, result)
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

fn handle_sidecar_failure(app: &AppHandle, state: &PostureEngineState, error: &str) {
    set_engine_error(state, error);
    let _ = emit_engine_status(app, state);
}

fn parse_result(
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
        Err(error) if cfg!(debug_assertions) && std::env::var("GBGR_POSTURE_ENGINE_BIN").is_ok() => {
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
    {
        let mut engine_guard = state.engine_state.lock().map_err(|e| e.to_string())?;
        engine_guard.engine_status = engine_status_from_response(&sidecar_response, "ready");
        engine_guard.mode = EngineMode::Foreground;
        engine_guard.camera_owner = CameraOwner::React;
        engine_guard.updated_at = now_iso();
        engine_guard.message = None;
        engine_guard.recoverable = true;
    }

    emit_engine_status(&app, &state).map_err(|e| e.to_string())?;

    Ok(StartPostureEngineResponse {
        engine_status: engine_status_from_response(&sidecar_response, "ready"),
        session_id,
        mode: EngineMode::Foreground,
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
pub fn start_background_measurement(
    app: AppHandle,
    payload: BackgroundMeasurementPayload,
    state: State<'_, PostureEngineState>,
) -> Result<BackgroundMeasurementResponse, String> {
    // sidecar에 명령 전송
    let sidecar_response = match sidecar_send(
        &state,
        &serde_json::json!({
            "command": "start_background",
            "session_id": payload.session_id
        }),
    ) {
        Ok(response) => response,
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

    let stop_flag = Arc::new(AtomicBool::new(false));
    {
        let mut worker_guard = state
            .background_worker_stop
            .lock()
            .map_err(|e| e.to_string())?;
        if let Some(previous) = worker_guard.replace(stop_flag.clone()) {
            previous.store(true, Ordering::SeqCst);
        }
    }

    let app_clone = app.clone();
    let session_id = payload.session_id.clone();
    thread::spawn(move || {
        while !stop_flag.load(Ordering::SeqCst) {
            let command = serde_json::json!({
                "command": "background_tick",
                "session_id": session_id
            });

            let state: State<'_, PostureEngineState> = app_clone.state::<PostureEngineState>();
            let result = {
                match sidecar_send(&state, &command) {
                    Ok(value) => value,
                    Err(error) => {
                        handle_sidecar_failure(&app_clone, &state, &error);
                        break;
                    }
                }
            };

            if let Some(result_data) = parse_result(&result, EngineMode::Background) {
                let notification =
                    ingest_background_result_with_notification(&state, result_data.clone())
                        .unwrap_or(None);
                let _ = emit_engine_status(&app_clone, &state);
                let _ = emit_result(&app_clone, &result_data);
                if let Some(message) = notification {
                    let _ = emit_warning(
                        &app_clone,
                        "bad_posture_detected",
                        Some(result_data.session_id.clone()),
                        &message,
                    );
                }
            }

            thread::sleep(BACKGROUND_FRAME_INTERVAL);
        }
    });

    Ok(response)
}

#[tauri::command]
pub fn stop_background_measurement(
    app: AppHandle,
    payload: BackgroundMeasurementPayload,
    state: State<'_, PostureEngineState>,
) -> Result<BackgroundMeasurementResponse, String> {
    {
        let mut worker_guard = state
            .background_worker_stop
            .lock()
            .map_err(|e| e.to_string())?;
        if let Some(stop_flag) = worker_guard.take() {
            stop_flag.store(true, Ordering::SeqCst);
        }
    }

    // sidecar에 명령 전송
    let sidecar_response = match sidecar_send(
        &state,
        &serde_json::json!({
            "command": "stop_background",
            "session_id": payload.session_id
        }),
    ) {
        Ok(response) => response,
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

    Ok(
        crate::state::posture_engine_state::LatestPostureStateResponse {
            session,
            latest_result,
            engine_state,
        },
    )
}

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

#[cfg(test)]
mod tests {
    use super::engine_status_from_response;

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
}
