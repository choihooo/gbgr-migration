use std::sync::Mutex;

use serde::Serialize;
use tauri::State;

const GA4_ENDPOINT: &str = "https://www.google-analytics.com/mp/collect";

/// 분석 이벤트 파라미터 (key-value 쌍)
type EventParams = std::collections::HashMap<String, serde_json::Value>;

/// 영속 분석 상태
pub struct AnalyticsState {
    client_id: Mutex<String>,
    user_id: Mutex<Option<String>>,
}

impl Default for AnalyticsState {
    fn default() -> Self {
        let client_id = uuid::Uuid::new_v4().to_string();
        Self {
            client_id: Mutex::new(client_id),
            user_id: Mutex::new(None),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Ga4Event {
    name: String,
    params: EventParams,
}

#[derive(Debug, Serialize)]
struct Ga4Payload {
    client_id: String,
    user_id: Option<String>,
    events: Vec<Ga4Event>,
}

fn get_measurement_config() -> Option<(String, String)> {
    let measurement_id = std::env::var("GA4_MEASUREMENT_ID").ok()?;
    let api_secret = std::env::var("GA4_API_SECRET").ok()?;

    if measurement_id.is_empty() || api_secret.is_empty() {
        return None;
    }

    Some((measurement_id, api_secret))
}

fn build_common_params() -> EventParams {
    let mut params = EventParams::new();
    params.insert(
        "platform".to_string(),
        serde_json::Value::String("tauri-desktop".to_string()),
    );

    if let Ok(version) = std::env::var("TAURI_APP_VERSION") {
        params.insert(
            "app_version".to_string(),
            serde_json::Value::String(version),
        );
    }

    params
}

async fn post_to_ga4(
    measurement_id: &str,
    api_secret: &str,
    payload: &Ga4Payload,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{GA4_ENDPOINT}?measurement_id={measurement_id}&api_secret={api_secret}");

    client
        .post(&url)
        .json(payload)
        .send()
        .await
        .map_err(|e| format!("GA4 전송 실패: {e}"))?;

    Ok(())
}

#[tauri::command]
pub async fn analytics_log_event(
    state: State<'_, AnalyticsState>,
    name: String,
    params: Option<EventParams>,
) -> Result<(), String> {
    let config = match get_measurement_config() {
        Some(config) => config,
        None => {
            // 설정 없으면 조용히 무시 (개발 환경)
            return Ok(());
        }
    };

    let (measurement_id, api_secret) = config;

    let mut event_params = build_common_params();
    if let Some(custom_params) = params {
        for (key, value) in custom_params {
            event_params.insert(key, value);
        }
    }

    let client_id = state
        .client_id
        .lock()
        .map_err(|e| format!("client_id 락 실패: {e}"))?
        .clone();

    let user_id = state
        .user_id
        .lock()
        .map_err(|e| format!("user_id 락 실패: {e}"))?
        .clone();

    let payload = Ga4Payload {
        client_id,
        user_id,
        events: vec![Ga4Event {
            name,
            params: event_params,
        }],
    };

    post_to_ga4(&measurement_id, &api_secret, &payload).await
}

#[tauri::command]
pub fn analytics_set_user_id(
    state: State<'_, AnalyticsState>,
    user_id: String,
) -> Result<(), String> {
    let mut stored = state
        .user_id
        .lock()
        .map_err(|e| format!("user_id 락 실패: {e}"))?;

    *stored = if user_id.is_empty() {
        None
    } else {
        Some(user_id)
    };

    Ok(())
}
