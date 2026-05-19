use std::{fs, path::PathBuf};

use tauri::{AppHandle, Manager};

const WIDGET_STATE_FILE: &str = "widget-window-state.json";

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub(super) struct WidgetWindowState {
    pub(super) x: i32,
    pub(super) y: i32,
    pub(super) width: u32,
    pub(super) height: u32,
}

fn get_state_file_path(app: &AppHandle) -> PathBuf {
    let mut path = app.path().app_data_dir().expect("app data dir");
    fs::create_dir_all(&path).ok();
    path.push(WIDGET_STATE_FILE);
    path
}

pub(super) fn load_widget_state(app: &AppHandle) -> Option<WidgetWindowState> {
    let path = get_state_file_path(app);
    if !path.exists() {
        return None;
    }
    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
}

pub(super) fn save_widget_state(app: &AppHandle, state: &WidgetWindowState) {
    let path = get_state_file_path(app);
    if let Ok(raw) = serde_json::to_string(state) {
        fs::write(path, raw).ok();
    }
}
