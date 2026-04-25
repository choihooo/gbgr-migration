use crate::state::posture_engine_state::{
    now_iso, EngineMode, PostureEngineResult, PostureWarningEvent,
};

// TODO: 백그라운드 결과 수신 기능 구현 시 사용
#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NotificationDecision {
    pub should_notify: bool,
    pub message: Option<String>,
}

#[allow(dead_code)]
pub fn evaluate_background_notification(result: &PostureEngineResult) -> NotificationDecision {
    let should_notify =
        matches!(result.engine_mode, EngineMode::Background) && result.posture_class >= 4;

    NotificationDecision {
        should_notify,
        message: should_notify.then(|| {
            format!(
                "백그라운드 측정 중 나쁜 자세가 감지되었어요. 단계 {}",
                result.posture_class
            )
        }),
    }
}

pub fn build_warning_event(
    code: &str,
    session_id: Option<String>,
    message: impl Into<String>,
) -> PostureWarningEvent {
    PostureWarningEvent {
        code: code.to_string(),
        message: message.into(),
        session_id,
        occurred_at: now_iso(),
    }
}
