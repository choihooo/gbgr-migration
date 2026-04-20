use tauri::Manager;

mod commands {
    pub mod posture_engine;
}

mod posture_engine;
mod state {
    pub mod posture_engine_state;
}
mod widget;

use commands::posture_engine::{
    get_latest_posture_state, push_posture_frame, start_background_measurement, start_posture_engine,
    stop_background_measurement, stop_posture_engine,
};
use state::posture_engine_state::PostureEngineState;
use widget::{close_widget_window, is_widget_open, open_widget_window};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .manage(PostureEngineState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            start_posture_engine,
            stop_posture_engine,
            push_posture_frame,
            start_background_measurement,
            stop_background_measurement,
            get_latest_posture_state,
            open_widget_window,
            close_widget_window,
            is_widget_open
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
