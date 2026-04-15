use crate::{
    commands::posture_engine::{apply_mode_change, ingest_background_result_with_notification},
    state::posture_engine_state::{EngineMode, MeasurementSession, PostureEngineResult, PostureEngineState},
};

fn build_session(session_id: &str) -> MeasurementSession {
    MeasurementSession {
        session_id: session_id.to_string(),
        status: "running".to_string(),
        mode: EngineMode::Foreground,
        started_at: "1".to_string(),
        last_result_at: None,
        latest_result_id: None,
        last_error_code: None,
    }
}

fn build_result(session_id: &str) -> PostureEngineResult {
    PostureEngineResult {
        result_id: "result-1".to_string(),
        session_id: session_id.to_string(),
        timestamp: "2".to_string(),
        posture_class: 4,
        score: 8.1,
        pi: Some(0.4),
        landmarks: vec![],
        source: "python_camera".to_string(),
        engine_mode: EngineMode::Background,
        events: vec!["enter_bad".to_string()],
    }
}

#[test]
fn background_transition_updates_mode_and_latest_cache() {
    let state = PostureEngineState::default();
    *state.session.lock().unwrap() = Some(build_session("session-1"));

    let response = apply_mode_change(&state, "session-1", EngineMode::Background).unwrap();
    assert!(matches!(response.mode, EngineMode::Background));

    let message = ingest_background_result_with_notification(&state, build_result("session-1"))
        .unwrap();

    let session = state.session.lock().unwrap().clone().unwrap();
    let latest_result = state.latest_result.lock().unwrap().clone().unwrap();
    let engine_state = state.engine_state.lock().unwrap().clone();

    assert!(message.is_some());
    assert!(matches!(session.mode, EngineMode::Background));
    assert_eq!(session.latest_result_id.as_deref(), Some("result-1"));
    assert!(matches!(latest_result.engine_mode, EngineMode::Background));
    assert!(matches!(engine_state.mode, EngineMode::Background));
}
