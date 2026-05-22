use std::time::Duration;

use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;
use url::Url;

const API_BASE_URL: &str = "https://api.bugi.co.kr";
const API_HOST: &str = "api.bugi.co.kr";
const API_REQUEST_TIMEOUT_SECONDS: u64 = 15;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiRequest {
    method: String,
    url: String,
    headers: Vec<(String, String)>,
    body: Option<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    status: u16,
    status_text: String,
    headers: Vec<(String, String)>,
    data: Value,
}

pub struct ApiClientState {
    client: reqwest::Client,
}

impl Default for ApiClientState {
    fn default() -> Self {
        Self {
            client: build_api_client().expect("API 클라이언트 생성 실패"),
        }
    }
}

fn build_api_client() -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(API_REQUEST_TIMEOUT_SECONDS))
        .build()
}

fn validate_api_url(url: Url) -> Result<String, String> {
    let is_allowed = url.scheme() == "https"
        && url.host_str() == Some(API_HOST)
        && url.username().is_empty()
        && url.password().is_none()
        && url.port().is_none();

    if !is_allowed {
        return Err("허용되지 않은 API URL입니다.".to_string());
    }

    Ok(url.to_string())
}

fn resolve_api_url(url: &str) -> Result<String, String> {
    if url.starts_with('/') {
        let base =
            Url::parse(API_BASE_URL).map_err(|_| "API 기준 URL이 잘못되었습니다.".to_string())?;
        let resolved = base
            .join(url)
            .map_err(|_| "허용되지 않은 API URL입니다.".to_string())?;
        return validate_api_url(resolved);
    }

    let parsed = Url::parse(url).map_err(|_| "허용되지 않은 API URL입니다.".to_string())?;
    validate_api_url(parsed)
}

fn parse_allowed_method(method: &str) -> Result<reqwest::Method, String> {
    let normalized = method.trim().to_ascii_uppercase();

    match normalized.as_str() {
        "GET" => Ok(reqwest::Method::GET),
        "POST" => Ok(reqwest::Method::POST),
        "PUT" => Ok(reqwest::Method::PUT),
        "PATCH" => Ok(reqwest::Method::PATCH),
        "DELETE" => Ok(reqwest::Method::DELETE),
        _ => Err("허용되지 않은 HTTP 메서드입니다.".to_string()),
    }
}

fn build_headers(entries: &[(String, String)]) -> Result<HeaderMap, String> {
    let mut headers = HeaderMap::new();

    for (name, value) in entries {
        let normalized_name = name.to_ascii_lowercase();

        if matches!(
            normalized_name.as_str(),
            "origin" | "host" | "content-length" | "connection"
        ) {
            continue;
        }

        let header_name = HeaderName::from_bytes(name.as_bytes())
            .map_err(|error| format!("잘못된 헤더 이름입니다: {error}"))?;
        let header_value = HeaderValue::from_str(value)
            .map_err(|error| format!("잘못된 헤더 값입니다: {error}"))?;

        headers.insert(header_name, header_value);
    }

    Ok(headers)
}

#[tauri::command]
pub async fn api_request(
    state: State<'_, ApiClientState>,
    request: ApiRequest,
) -> Result<ApiResponse, String> {
    let url = resolve_api_url(&request.url)?;
    let method = parse_allowed_method(&request.method)?;
    let headers = build_headers(&request.headers)?;
    let mut builder = state.client.request(method, url).headers(headers);

    if let Some(body) = request.body {
        builder = builder.json(&body);
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("API 요청 실패: {error}"))?;
    let status = response.status();
    let status_text = status.canonical_reason().unwrap_or("").to_string();
    let headers = response
        .headers()
        .iter()
        .filter_map(|(name, value)| {
            value
                .to_str()
                .ok()
                .map(|value| (name.as_str().to_string(), value.to_string()))
        })
        .collect::<Vec<_>>();
    let text = response
        .text()
        .await
        .map_err(|error| format!("API 응답 읽기 실패: {error}"))?;
    let data = serde_json::from_str::<Value>(&text).unwrap_or(Value::String(text));

    Ok(ApiResponse {
        status: status.as_u16(),
        status_text,
        headers,
        data,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_api_url_allows_relative_path() {
        let resolved = resolve_api_url("/auth/login").expect("relative path should be allowed");

        assert_eq!(resolved, "https://api.bugi.co.kr/auth/login");
    }

    #[test]
    fn resolve_api_url_allows_exact_api_origin() {
        let resolved = resolve_api_url("https://api.bugi.co.kr/auth/login?next=/main")
            .expect("exact API origin should be allowed");

        assert_eq!(resolved, "https://api.bugi.co.kr/auth/login?next=/main");
    }

    #[test]
    fn resolve_api_url_rejects_prefix_host_bypass() {
        let result = resolve_api_url("https://api.bugi.co.kr.evil.example/auth/login");

        assert!(result.is_err());
    }

    #[test]
    fn resolve_api_url_rejects_http_scheme() {
        let result = resolve_api_url("http://api.bugi.co.kr/auth/login");

        assert!(result.is_err());
    }

    #[test]
    fn resolve_api_url_rejects_custom_port() {
        let result = resolve_api_url("https://api.bugi.co.kr:444/auth/login");

        assert!(result.is_err());
    }

    #[test]
    fn resolve_api_url_rejects_credentials() {
        let result = resolve_api_url("https://user:pass@api.bugi.co.kr/auth/login");

        assert!(result.is_err());
    }

    #[test]
    fn parse_allowed_method_accepts_supported_methods() {
        for method in ["GET", "post", " Put ", "PATCH", "delete"] {
            assert!(parse_allowed_method(method).is_ok());
        }
    }

    #[test]
    fn parse_allowed_method_rejects_unsupported_methods() {
        for method in ["TRACE", "CONNECT", "OPTIONS", "HEAD", ""] {
            assert!(parse_allowed_method(method).is_err());
        }
    }
}
