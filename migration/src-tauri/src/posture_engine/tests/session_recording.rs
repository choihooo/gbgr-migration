use crate::{
    posture_engine::{
        notification_bridge::evaluate_background_notification,
        session_metrics::record_session_result,
    },
    state::posture_engine_state::{EngineMode, PostureEngineResult, SessionMetricsSnapshot},
};

fn build_result(posture_class: u8, score: f64) -> PostureEngineResult {
    PostureEngineResult {
        result_id: "result-1".to_string(),
        session_id: "session-1".to_string(),
        timestamp: "3".to_string(),
        posture_class,
        score,
        pi: Some(0.2),
        landmarks: vec![],
        source: "python_camera".to_string(),
        engine_mode: EngineMode::Background,
        events: vec![],
    }
}

#[test]
fn background_results_feed_metrics_and_notification_decision() {
    let result = build_result(5, 10.2);
    let mut snapshot = SessionMetricsSnapshot::default();

    record_session_result(&mut snapshot, &result);
    let decision = evaluate_background_notification(&result);

    assert_eq!(snapshot.total_results, 1);
    assert_eq!(snapshot.bad_results, 1);
    assert_eq!(snapshot.last_posture_class, Some(5));
    assert!(decision.should_notify);
    assert!(decision.message.unwrap().contains("나쁜 자세"));
}
