use tauri::{AppHandle, Manager, WebviewWindowBuilder};

use super::{
    bounds::apply_saved_widget_bounds,
    events::{attach_widget_window_events, save_current_widget_state},
    platform::set_widget_floating,
};

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
