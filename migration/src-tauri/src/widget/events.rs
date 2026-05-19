use tauri::{AppHandle, WebviewWindow};

use super::state::{save_widget_state, WidgetWindowState};

pub(super) fn save_current_widget_state(app: &AppHandle, window: &tauri::WebviewWindow) {
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

pub(super) fn attach_widget_window_events(app: &AppHandle, window: &WebviewWindow) {
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
