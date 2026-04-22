use crate::state::posture_engine_state::{EngineMode, PostureEngineResult, SessionMetricsSnapshot};

// TODO: 세션 결과 기록 기능 구현 시 사용
#[allow(dead_code)]
pub fn record_session_result(
    snapshot: &mut SessionMetricsSnapshot,
    result: &PostureEngineResult,
) {
    snapshot.total_results += 1;
    if matches!(result.engine_mode, EngineMode::Background) && result.posture_class >= 4 {
        snapshot.bad_results += 1;
    }
    snapshot.last_score = Some(result.score);
    snapshot.last_posture_class = Some(result.posture_class);
    snapshot.updated_at = Some(result.timestamp.clone());
}
