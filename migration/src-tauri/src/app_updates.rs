use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use url::Url;

pub struct PendingUpdate(pub Mutex<Option<Update>>);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConfigPayload {
    pub endpoints: Vec<String>,
    pub pubkey: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMetadata {
    pub version: String,
    pub current_version: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchUpdateResponse {
    pub configured: bool,
    pub update: Option<UpdateMetadata>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallUpdateResponse {
    pub configured: bool,
    pub installed: bool,
    pub should_restart: bool,
    pub exits_on_install: bool,
}

fn normalize_update_config(
    payload: UpdateConfigPayload,
) -> tauri_plugin_updater::Result<Option<(Vec<Url>, String)>> {
    let endpoints = payload
        .endpoints
        .into_iter()
        .map(|endpoint| endpoint.trim().to_string())
        .filter(|endpoint| !endpoint.is_empty())
        .map(|endpoint| Url::parse(&endpoint))
        .collect::<Result<Vec<_>, _>>()?;

    let pubkey = payload.pubkey.trim().to_string();

    if endpoints.is_empty() || pubkey.is_empty() {
        return Ok(None);
    }

    Ok(Some((endpoints, pubkey)))
}

#[tauri::command]
pub async fn fetch_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
    config: UpdateConfigPayload,
) -> Result<FetchUpdateResponse, String> {
    let Some((endpoints, pubkey)) =
        normalize_update_config(config).map_err(|error| error.to_string())?
    else {
        return Ok(FetchUpdateResponse {
            configured: false,
            update: None,
        });
    };

    let update = app
        .updater_builder()
        .endpoints(endpoints)
        .map_err(|error| error.to_string())?
        .pubkey(pubkey)
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let current_version = app.package_info().version.to_string();
    let update_metadata = update.as_ref().map(|update| UpdateMetadata {
        version: update.version.clone(),
        current_version: current_version.clone(),
    });

    let mut pending = pending_update
        .0
        .lock()
        .map_err(|error| error.to_string())?;
    *pending = update;

    Ok(FetchUpdateResponse {
        configured: true,
        update: update_metadata,
    })
}

#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
    config: UpdateConfigPayload,
) -> Result<InstallUpdateResponse, String> {
    let Some((endpoints, pubkey)) =
        normalize_update_config(config).map_err(|error| error.to_string())?
    else {
        return Ok(InstallUpdateResponse {
            configured: false,
            installed: false,
            should_restart: false,
            exits_on_install: false,
        });
    };

    let pending = {
        let mut pending = pending_update
            .0
            .lock()
            .map_err(|error| error.to_string())?;
        pending.take()
    };

    let update = if let Some(update) = pending {
        Some(update)
    } else {
        app.updater_builder()
            .endpoints(endpoints)
            .map_err(|error| error.to_string())?
            .pubkey(pubkey)
            .build()
            .map_err(|error| error.to_string())?
            .check()
            .await
            .map_err(|error| error.to_string())?
    };

    let Some(update) = update else {
        return Ok(InstallUpdateResponse {
            configured: true,
            installed: false,
            should_restart: false,
            exits_on_install: false,
        });
    };

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|error| error.to_string())?;

    Ok(InstallUpdateResponse {
        configured: true,
        installed: true,
        should_restart: !cfg!(target_os = "windows"),
        exits_on_install: cfg!(target_os = "windows"),
    })
}
