use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Monitor, WebviewWindow, WebviewWindowBuilder};

const WIDGET_STATE_FILE: &str = "widget-window-state.json";
const DEBUG_IGNORE_SAVED_WIDGET_POSITION: bool = false;
const DEFAULT_WIDGET_WIDTH: u32 = 200;
const DEFAULT_WIDGET_HEIGHT: u32 = 320;
const MIN_WIDGET_WIDTH: u32 = 160;
const MIN_WIDGET_HEIGHT: u32 = 45;
const MAX_WIDGET_WIDTH: u32 = 260;
const MAX_WIDGET_HEIGHT: u32 = 348;
const DEFAULT_WIDGET_MARGIN: i32 = 24;

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

fn logical_to_physical_u32(value: u32, scale_factor: f64) -> u32 {
    ((value as f64) * scale_factor).round().max(1.0) as u32
}

fn logical_to_physical_i32(value: i32, scale_factor: f64) -> i32 {
    ((value as f64) * scale_factor).round() as i32
}

fn clamp_i32(value: i32, min: i32, max: i32) -> i32 {
    if max < min {
        return min;
    }

    value.clamp(min, max)
}

fn clamp_u32(value: u32, min: u32, max: u32) -> u32 {
    if max < min {
        return min;
    }

    value.clamp(min, max)
}

fn intersection_area(first: &WidgetWindowState, monitor: &Monitor) -> i64 {
    let work_area = monitor.work_area();
    let left = first.x.max(work_area.position.x);
    let top = first.y.max(work_area.position.y);
    let right =
        (first.x + first.width as i32).min(work_area.position.x + work_area.size.width as i32);
    let bottom =
        (first.y + first.height as i32).min(work_area.position.y + work_area.size.height as i32);
    let width = right - left;
    let height = bottom - top;

    if width <= 0 || height <= 0 {
        return 0;
    }

    i64::from(width) * i64::from(height)
}

fn default_widget_bounds(monitor: &Monitor) -> WidgetWindowState {
    let work_area = monitor.work_area();
    let scale_factor = monitor.scale_factor();
    let width =
        logical_to_physical_u32(DEFAULT_WIDGET_WIDTH, scale_factor).min(work_area.size.width);
    let height =
        logical_to_physical_u32(DEFAULT_WIDGET_HEIGHT, scale_factor).min(work_area.size.height);
    let margin = logical_to_physical_i32(DEFAULT_WIDGET_MARGIN, scale_factor);

    WidgetWindowState {
        x: work_area.position.x + (work_area.size.width as i32 - width as i32 - margin).max(0),
        y: work_area.position.y + margin.max(0),
        width,
        height,
    }
}

fn normalize_widget_state(app: &AppHandle, state: WidgetWindowState) -> WidgetWindowState {
    let monitors = match app.available_monitors() {
        Ok(monitors) if !monitors.is_empty() => monitors,
        _ => return state,
    };

    let monitor = monitors
        .iter()
        .max_by_key(|monitor| intersection_area(&state, monitor))
        .unwrap_or(&monitors[0]);
    let work_area = monitor.work_area();
    let scale_factor = monitor.scale_factor();
    let min_width = logical_to_physical_u32(MIN_WIDGET_WIDTH, scale_factor);
    let min_height = logical_to_physical_u32(MIN_WIDGET_HEIGHT, scale_factor);
    let max_width =
        logical_to_physical_u32(MAX_WIDGET_WIDTH, scale_factor).min(work_area.size.width);
    let max_height =
        logical_to_physical_u32(MAX_WIDGET_HEIGHT, scale_factor).min(work_area.size.height);
    let width = clamp_u32(state.width, min_width.min(max_width), max_width);
    let height = clamp_u32(state.height, min_height.min(max_height), max_height);
    let candidate = WidgetWindowState {
        x: state.x,
        y: state.y,
        width,
        height,
    };

    if intersection_area(&candidate, monitor) <= 0 {
        return default_widget_bounds(monitor);
    }

    WidgetWindowState {
        x: clamp_i32(
            candidate.x,
            work_area.position.x,
            work_area.position.x + work_area.size.width as i32 - width as i32,
        ),
        y: clamp_i32(
            candidate.y,
            work_area.position.y,
            work_area.position.y + work_area.size.height as i32 - height as i32,
        ),
        width,
        height,
    }
}

fn save_current_widget_state(app: &AppHandle, window: &tauri::WebviewWindow) {
    if let (Ok(pos), Ok(size)) = (window.outer_position(), window.inner_size()) {
        save_widget_state(
            app,
            &WidgetWindowState {
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
            },
        );
    }
}

fn apply_saved_widget_bounds(app: &AppHandle, window: &WebviewWindow) -> Result<(), tauri::Error> {
    let saved = if DEBUG_IGNORE_SAVED_WIDGET_POSITION {
        None
    } else {
        load_widget_state(app)
    };

    let state = match saved {
        Some(state) => normalize_widget_state(app, state),
        None => {
            let monitors = app.available_monitors()?;
            monitors
                .first()
                .map(default_widget_bounds)
                .unwrap_or(WidgetWindowState {
                    x: 0,
                    y: 0,
                    width: DEFAULT_WIDGET_WIDTH,
                    height: DEFAULT_WIDGET_HEIGHT,
                })
        }
    };

    window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: state.width,
        height: state.height,
    }))?;
    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: state.x,
        y: state.y,
    }))?;

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

    set_widget_floating(&window);

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
    let open = app
        .get_webview_window("widget")
        .map(|w| w.is_visible().unwrap_or(false))
        .unwrap_or(false);
    Ok(open)
}

/// 위젯 창을 floating 레벨로 설정한다.
/// alwaysOnTop와 달리 다른 Spaces로 이동 가능하면서도 일반 창 위에 표시된다.
#[cfg(target_os = "macos")]
fn set_widget_floating(window: &WebviewWindow) {
    match window.ns_window() {
        Ok(ns_window) => unsafe {
            use cocoa::base::id;
            let raw: id = ns_window.cast();
            msg_send![raw, setLevel: 3i64]; // NSFloatingWindowLevel
        },
        Err(e) => eprintln!("위젯 floating 레벨 설정 실패: {e}"),
    }
}

#[cfg(not(target_os = "macos"))]
fn set_widget_floating(_window: &WebviewWindow) {}
