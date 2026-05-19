use tauri::WebviewWindow;

/// 위젯 창을 floating 레벨로 설정한다.
/// alwaysOnTop와 달리 다른 Spaces로 이동 가능하면서도 일반 창 위에 표시된다.
#[cfg(target_os = "macos")]
pub(super) fn set_widget_floating(window: &WebviewWindow) {
    use objc2::{msg_send, runtime::AnyObject};

    match window.ns_window() {
        Ok(ns_window) => unsafe {
            let raw = ns_window.cast::<AnyObject>();
            let _: () = msg_send![raw, setLevel: 3i64]; // NSFloatingWindowLevel
        },
        Err(e) => eprintln!("위젯 floating 레벨 설정 실패: {e}"),
    }
}

#[cfg(not(target_os = "macos"))]
pub(super) fn set_widget_floating(_window: &WebviewWindow) {}
