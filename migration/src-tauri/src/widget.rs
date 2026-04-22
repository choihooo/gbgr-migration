use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewWindow, WebviewWindowBuilder};

const WIDGET_STATE_FILE: &str = "widget-window-state.json";
const DEBUG_IGNORE_SAVED_WIDGET_POSITION: bool = false;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
struct WidgetWindowState {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

fn get_state_file_path(app: &AppHandle) -> PathBuf {
    let mut path = app.path().app_data_dir().expect("app data dir");
    fs::create_dir_all(&path).ok();
    path.push(WIDGET_STATE_FILE);
    path
}

fn load_widget_state(app: &AppHandle) -> Option<WidgetWindowState> {
    let path = get_state_file_path(app);
    if !path.exists() {
        return None;
    }
    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
}

fn save_widget_state(app: &AppHandle, state: &WidgetWindowState) {
    let path = get_state_file_path(app);
    if let Ok(raw) = serde_json::to_string(state) {
        fs::write(path, raw).ok();
    }
}

fn save_current_widget_state(app: &AppHandle, window: &tauri::WebviewWindow) {
    if let (Ok(pos), Ok(size)) = (window.outer_position(), window.inner_size()) {
        save_widget_state(app, &WidgetWindowState {
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
        });
    }
}

fn apply_saved_widget_bounds(
    app: &AppHandle,
    window: &WebviewWindow,
) -> Result<(), tauri::Error> {
    let saved = if DEBUG_IGNORE_SAVED_WIDGET_POSITION {
        None
    } else {
        load_widget_state(app)
    };

    let (x, y, width, height) = match saved {
        Some(s) => (Some(s.x), Some(s.y), s.width, s.height),
        None => (None, None, 200, 320),
    };

    window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: width as f64,
        height: height as f64,
    }))?;

    if let (Some(sx), Some(sy)) = (x, y) {
        window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x: sx as f64,
            y: sy as f64,
        }))?;
    } else {
        window.center()?;
    }

    Ok(())
}

fn attach_widget_window_events(app: &AppHandle, window: &WebviewWindow) {
    let app_clone = app.clone();
    let win_for_events = window.clone();
    window.on_window_event(move |event| match event {
        tauri::WindowEvent::Moved(_pos) => {
            save_current_widget_state(&app_clone, &win_for_events);
        }
        tauri::WindowEvent::Resized(_size) => {
            save_current_widget_state(&app_clone, &win_for_events);
        }
        tauri::WindowEvent::Destroyed => {}
        tauri::WindowEvent::Focused(_) => {}
        _ => {}
    });
}

pub fn ensure_widget_window(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("widget").is_some() {
        return Ok(());
    }

    let widget_config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == "widget")
        .ok_or_else(|| "widget window config not found".to_string())?;

    let window = WebviewWindowBuilder::from_config(app, widget_config)
        .map_err(|error| error.to_string())?
        .build()
        .map_err(|error| error.to_string())?;

    attach_widget_window_events(app, &window);
    apply_saved_widget_bounds(app, &window).map_err(|error| error.to_string())?;

    window.hide().map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn open_widget_window(app: AppHandle) -> Result<(), String> {
    // 이미 위젯 창이 있으면 포커스
    if let Some(existing) = app.get_webview_window("widget") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    ensure_widget_window(&app)?;

    let win = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window not found after ensure".to_string())?;

    let _ = apply_saved_widget_bounds(&app, &win);

    if let Err(error) = win.show() {
        return Err(error.to_string());
    }

    let _ = win.set_focus();

    Ok(())
}

#[tauri::command]
pub fn close_widget_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("widget") {
        save_current_widget_state(&app, &win);
        if let Err(error) = win.hide() {
            return Err(error.to_string());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn is_widget_open(app: AppHandle) -> Result<bool, String> {
    let open = app.get_webview_window("widget")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false);
    Ok(open)
}
