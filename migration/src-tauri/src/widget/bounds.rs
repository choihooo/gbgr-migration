use tauri::{AppHandle, Monitor, WebviewWindow};

use super::state::{load_widget_state, WidgetWindowState};

const DEBUG_IGNORE_SAVED_WIDGET_POSITION: bool = false;
const DEFAULT_WIDGET_WIDTH: u32 = 200;
const DEFAULT_WIDGET_HEIGHT: u32 = 320;
const MIN_WIDGET_WIDTH: u32 = 160;
const MIN_WIDGET_HEIGHT: u32 = 45;
const MAX_WIDGET_WIDTH: u32 = 260;
const MAX_WIDGET_HEIGHT: u32 = 348;
const DEFAULT_WIDGET_MARGIN: i32 = 24;

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

pub(super) fn apply_saved_widget_bounds(
    app: &AppHandle,
    window: &WebviewWindow,
) -> Result<(), tauri::Error> {
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
