use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

const WIDGET_STATE_FILE: &str = "widget-window-state.json";

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

#[tauri::command]
pub fn open_widget_window(app: AppHandle) -> Result<(), String> {
    // 이미 위젯 창이 있으면 포커스
    if let Some(existing) = app.get_webview_window("widget") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let saved = load_widget_state(&app);
    let (x, y, width, height) = match saved {
        Some(s) => (Some(s.x), Some(s.y), s.width, s.height),
        None => (None, None, 200, 320),
    };

    let mut builder = WebviewWindowBuilder::new(&app, "widget", WebviewUrl::App("/widget".into()))
        .title("widget")
        .inner_size(width as f64, height as f64)
        .min_inner_size(160.0, 45.0)
        .max_inner_size(260.0, 348.0)
        .decorations(false)
        .always_on_top(true)
        .resizable(true)
        .skip_taskbar(true)
        .visible(false);

    if let (Some(sx), Some(sy)) = (x, y) {
        builder = builder.position(sx as f64, sy as f64);
    }

    let win = builder.build().map_err(|e| e.to_string())?;

    // 창 이동/리사이즈 시 상태 저장
    let app_clone = app.clone();
    win.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Moved(pos) => {
                let state = load_widget_state(&app_clone).unwrap_or(WidgetWindowState {
                    x: pos.x,
                    y: pos.y,
                    width: 200,
                    height: 320,
                });
                save_widget_state(&app_clone, &WidgetWindowState {
                    x: pos.x,
                    y: pos.y,
                    ..state
                });
            }
            tauri::WindowEvent::Resized(size) => {
                let state = load_widget_state(&app_clone).unwrap_or(WidgetWindowState {
                    x: 0,
                    y: 0,
                    width: size.width,
                    height: size.height,
                });
                save_widget_state(&app_clone, &WidgetWindowState {
                    width: size.width,
                    height: size.height,
                    ..state
                });
            }
            _ => {}
        }
    });

    let _ = win.show();
    Ok(())
}

#[tauri::command]
pub fn close_widget_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("widget") {
        if let (Ok(pos), Ok(size)) = (win.outer_position(), win.inner_size()) {
            save_widget_state(&app, &WidgetWindowState {
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
            });
        }
        let _ = win.close();
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
