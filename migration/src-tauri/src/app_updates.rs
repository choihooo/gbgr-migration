use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Error as UpdaterError, Update, UpdaterExt};

pub struct PendingUpdate(pub Mutex<Option<Update>>);

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

fn is_updater_unconfigured(error: &UpdaterError) -> bool {
    matches!(error, UpdaterError::EmptyEndpoints)
}

#[tauri::command]
pub async fn fetch_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<FetchUpdateResponse, String> {
    let updater = match app.updater() {
        Ok(updater) => updater,
        Err(error) if is_updater_unconfigured(&error) => {
            let mut pending = pending_update.0.lock().map_err(|error| error.to_string())?;
            *pending = None;

            return Ok(FetchUpdateResponse {
                configured: false,
                update: None,
            });
        }
        Err(error) => return Err(error.to_string()),
    };

    let update = updater.check().await.map_err(|error| error.to_string())?;

    let current_version = app.package_info().version.to_string();
    let update_metadata = update.as_ref().map(|update| UpdateMetadata {
        version: update.version.clone(),
        current_version: current_version.clone(),
    });

    let mut pending = pending_update.0.lock().map_err(|error| error.to_string())?;
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
) -> Result<InstallUpdateResponse, String> {
    let pending = {
        let mut pending = pending_update.0.lock().map_err(|error| error.to_string())?;
        pending.take()
    };

    let update = if let Some(update) = pending {
        Some(update)
    } else {
        let updater = match app.updater() {
            Ok(updater) => updater,
            Err(error) if is_updater_unconfigured(&error) => {
                return Ok(InstallUpdateResponse {
                    configured: false,
                    installed: false,
                    should_restart: false,
                    exits_on_install: false,
                });
            }
            Err(error) => return Err(error.to_string()),
        };

        updater.check().await.map_err(|error| error.to_string())?
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

    let should_restart = !cfg!(target_os = "windows");
    if should_restart {
        app.request_restart();
    }

    Ok(InstallUpdateResponse {
        configured: true,
        installed: true,
        should_restart,
        exits_on_install: cfg!(target_os = "windows"),
    })
}
