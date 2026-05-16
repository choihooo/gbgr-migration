use std::sync::Mutex;

use tauri::{AppHandle, Manager, WebviewWindowBuilder};

mod app_updates;
mod commands {
    pub mod analytics;
    pub mod api;
    pub mod posture_engine;
}

mod posture_engine;
mod state {
    pub mod posture_engine_state;
}
mod widget;

use commands::analytics::{analytics_log_event, analytics_set_user_id, AnalyticsState};
use commands::api::api_request;
use commands::posture_engine::{
    calibrate_finish, calibrate_frame, calibrate_start, get_latest_posture_state,
    push_posture_frame, set_calibration, start_background_measurement, start_posture_engine,
    stop_background_measurement, stop_posture_engine,
};
use state::posture_engine_state::PostureEngineState;
use widget::{close_widget_window, ensure_widget_window, is_widget_open, open_widget_window};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn show_or_create_main_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    let main_config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == "main")
        .ok_or_else(|| "main window config not found".to_string())?;

    let window = WebviewWindowBuilder::from_config(app, main_config)
        .map_err(|error| error.to_string())?
        .build()
        .map_err(|error| error.to_string())?;

    let _ = window.show();
    let _ = window.set_focus();

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_or_create_main_window(app);
        }));
    }

    builder
        .manage(PostureEngineState::default())
        .manage(AnalyticsState::default())
        .manage(app_updates::PendingUpdate(Mutex::new(None)))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;

                app.deep_link().register_all()?;
            }

            ensure_widget_window(app.handle()).map_err(|error| {
                std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("widget setup failed: {error}"),
                )
            })?;
            show_or_create_main_window(app.handle()).map_err(|error| {
                std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("main window setup failed: {error}"),
                )
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            api_request,
            start_posture_engine,
            stop_posture_engine,
            push_posture_frame,
            start_background_measurement,
            stop_background_measurement,
            get_latest_posture_state,
            calibrate_start,
            calibrate_frame,
            calibrate_finish,
            set_calibration,
            open_widget_window,
            close_widget_window,
            is_widget_open,
            app_updates::fetch_update,
            app_updates::install_update,
            analytics_log_event,
            analytics_set_user_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
