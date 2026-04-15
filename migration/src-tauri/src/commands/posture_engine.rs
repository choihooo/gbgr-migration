use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

use crate::{
    posture_engine::{
        events::{POSTURE_ENGINE_STATUS_EVENT, POSTURE_WARNING_EVENT},
        notification_bridge::{build_warning_event, evaluate_background_notification},
        ownership::transition_ownership,
        session_metrics::record_session_result,
    },
    state::posture_engine_state::{
        now_iso, BackgroundMeasurementPayload, BackgroundMeasurementResponse, CameraOwner, EngineMode,
        MeasurementSession, PostureEngineResult, PostureEngineState, PushPostureFramePayload,
        PushPostureFrameResponse, StartPostureEngineResponse, StopPostureEngineResponse,
    },
};

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

pub(crate) fn apply_mode_change(
    state: &PostureEngineState,
    session_id: &str,
    mode: EngineMode,
) -> Result<BackgroundMeasurementResponse, String> {
    let mut session_guard = state.session.lock().map_err(|error| error.to_string())?;
    let mut engine_guard = state.engine_state.lock().map_err(|error| error.to_string())?;
    let mut ownership_guard = state.ownership.lock().map_err(|error| error.to_string())?;

    let session = session_guard
        .as_mut()
        .ok_or_else(|| "no_active_session".to_string())?;
    session.session_id = session_id.to_string();
    session.mode = mode.clone();

    let ownership = transition_ownership(engine_guard.camera_owner.clone(), &mode);
    *ownership_guard = ownership.clone();

    engine_guard.engine_status = match mode {
        EngineMode::Background => "switching".to_string(),
        EngineMode::Foreground => "ready".to_string(),
    };
    engine_guard.mode = mode.clone();
    engine_guard.camera_owner = ownership.owner;
    engine_guard.updated_at = now_iso();
    engine_guard.message = None;
    engine_guard.recoverable = true;

    Ok(BackgroundMeasurementResponse {
        engine_status: engine_guard.engine_status.clone(),
        mode,
    })
}

pub(crate) fn cache_posture_result(
    state: &PostureEngineState,
    result: PostureEngineResult,
) -> Result<(), String> {
    let mut latest_result_guard = state.latest_result.lock().map_err(|error| error.to_string())?;
    let mut session_guard = state.session.lock().map_err(|error| error.to_string())?;
    let mut metrics_guard = state
        .session_metrics
        .lock()
        .map_err(|error| error.to_string())?;

    if let Some(session) = session_guard.as_mut() {
        session.last_result_at = Some(result.timestamp.clone());
        session.latest_result_id = Some(result.result_id.clone());
        session.mode = result.engine_mode.clone();
    }

    record_session_result(&mut metrics_guard, &result);
    *latest_result_guard = Some(result);

    Ok(())
}

#[tauri::command]
pub fn start_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StartPostureEngineResponse, String> {
    let mut session_guard = state.session.lock().map_err(|error| error.to_string())?;
    let mut engine_guard = state
        .engine_state
        .lock()
        .map_err(|error| error.to_string())?;

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

    engine_guard.engine_status = "ready".to_string();
    engine_guard.mode = EngineMode::Foreground;
    engine_guard.camera_owner = CameraOwner::React;
    engine_guard.updated_at = now_iso();
    engine_guard.message = None;
    engine_guard.recoverable = true;

    emit_engine_status(&app, &state).map_err(|error| error.to_string())?;

    Ok(StartPostureEngineResponse {
        engine_status: "ready".to_string(),
        session_id: session_guard.as_ref().map(|session| session.session_id.clone()),
        mode: EngineMode::Foreground,
    })
}

#[tauri::command]
pub fn stop_posture_engine(
    app: AppHandle,
    state: State<'_, PostureEngineState>,
) -> Result<StopPostureEngineResponse, String> {
    let mut session_guard = state.session.lock().map_err(|error| error.to_string())?;
    let mut latest_result_guard = state
        .latest_result
        .lock()
        .map_err(|error| error.to_string())?;
    let mut engine_guard = state
        .engine_state
        .lock()
        .map_err(|error| error.to_string())?;
    let mut ownership_guard = state.ownership.lock().map_err(|error| error.to_string())?;
    let mut metrics_guard = state
        .session_metrics
        .lock()
        .map_err(|error| error.to_string())?;

    let released_owner = engine_guard.camera_owner.clone();
    *session_guard = None;
    *latest_result_guard = None;
    *metrics_guard = Default::default();
    engine_guard.engine_status = "idle".to_string();
    engine_guard.mode = EngineMode::Foreground;
    engine_guard.camera_owner = CameraOwner::None;
    engine_guard.updated_at = now_iso();
    *ownership_guard = transition_ownership(CameraOwner::None, &EngineMode::Foreground);

    emit_engine_status(&app, &state).map_err(|error| error.to_string())?;

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
    let session_guard = state.session.lock().map_err(|error| error.to_string())?;
    let Some(session) = session_guard.as_ref() else {
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
    };

    if session.session_id != payload.session_id {
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

    emit_engine_status(&app, &state).map_err(|error| error.to_string())?;

    Ok(response)
}

#[tauri::command]
pub fn stop_background_measurement(
    app: AppHandle,
    payload: BackgroundMeasurementPayload,
    state: State<'_, PostureEngineState>,
) -> Result<BackgroundMeasurementResponse, String> {
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

    emit_engine_status(&app, &state).map_err(|error| error.to_string())?;

    Ok(response)
}

#[tauri::command]
pub fn get_latest_posture_state(
    state: State<'_, PostureEngineState>,
) -> Result<crate::state::posture_engine_state::LatestPostureStateResponse, String> {
    let session = state
        .session
        .lock()
        .map_err(|error| error.to_string())?
        .clone();
    let latest_result = state
        .latest_result
        .lock()
        .map_err(|error| error.to_string())?
        .clone();
    let engine_state = state
        .engine_state
        .lock()
        .map_err(|error| error.to_string())?
        .clone();

    Ok(crate::state::posture_engine_state::LatestPostureStateResponse {
        session,
        latest_result,
        engine_state,
    })
}

pub(crate) fn ingest_background_result_with_notification(
    state: &PostureEngineState,
    result: PostureEngineResult,
) -> Result<Option<String>, String> {
    let decision = evaluate_background_notification(&result);
    cache_posture_result(state, result)?;
    Ok(decision.message)
}
