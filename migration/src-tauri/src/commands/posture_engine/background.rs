use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
};

use tauri::{AppHandle, Manager, State};

use super::common::{
    apply_mode_change, emit_engine_status, emit_result, emit_warning, handle_sidecar_failure,
    ingest_background_result_with_notification, parse_result, set_engine_error, sidecar_error,
    sidecar_send, BACKGROUND_FRAME_INTERVAL,
};
use crate::state::posture_engine_state::{
    BackgroundMeasurementPayload, BackgroundMeasurementResponse, EngineMode, PostureEngineState,
};

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
