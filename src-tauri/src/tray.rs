//! System tray + the evening planning reminder.
//!
//! The tray keeps the app alive after the window is closed (see the
//! `CloseRequested` handler in `lib.rs`), so the scheduler can fire the daily
//! reminder. The tray menu lists today's planned tasks; clicking one shows the
//! window and deep-links to that task via a `navigate` event.

use std::time::Duration;

use tauri::menu::{MenuBuilder, MenuEvent, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::db::Db;
use crate::error::Result;
use crate::models::{local_hm, local_today};
use crate::repositories::{settings_repo, task_repo};

const TRAY_ID: &str = "main";

/// Create the tray icon with its menu-event handler. The menu is populated by
/// [`rebuild_tray`] once the app data is ready.
pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let icon = app
        .default_window_icon()
        .expect("app has a default window icon")
        .clone();

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("monica")
        .on_menu_event(handle_menu_event)
        .build(app)?;

    Ok(())
}

/// Rebuild the tray menu from today's planned tasks. Call after planning or any
/// status change (the `refresh_tray` command) and on each scheduler tick.
pub async fn rebuild_tray(app: &AppHandle) -> Result<()> {
    let db = app.state::<Db>();
    let today = local_today();
    let tasks = task_repo::list_by_planned_for(db.pool(), &today).await?;

    let mut builder = MenuBuilder::new(app);
    if tasks.is_empty() {
        let none = MenuItem::with_id(app, "none", "No tasks today", false, None::<&str>)?;
        builder = builder.item(&none);
    } else {
        for task in &tasks {
            // Item id is the task UUID so the menu handler can deep-link to it.
            builder = builder.text(&task.id, &task.title);
        }
    }
    let menu = builder
        .separator()
        .text("open", "Open monica")
        .separator()
        .text("quit", "Quit")
        .build()?;

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))?;
    }
    Ok(())
}

fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        "none" => {}
        "quit" => app.exit(0),
        "open" => show_main(app),
        // Any other id is a task UUID: surface the window on that task.
        id => {
            show_main(app);
            let _ = app.emit("navigate", format!("/tasks/{id}"));
        }
    }
}

fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Spawn the once-a-minute scheduler. When the local time first matches the
/// configured `notification_time`, fire the reminder (once per day). Missed
/// firings are skipped — the app must be running at that minute.
pub fn spawn_scheduler(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_fired: Option<String> = None;
        let mut ticker = tokio::time::interval(Duration::from_secs(60));
        loop {
            ticker.tick().await;

            let db = app.state::<Db>();
            let target = match settings_repo::get(db.pool()).await {
                Ok(s) => s.notification_time,
                Err(_) => continue,
            };

            let today = local_today();
            if local_hm() == target && last_fired.as_deref() != Some(today.as_str()) {
                last_fired = Some(today);
                let _ = app
                    .notification()
                    .builder()
                    .title("Plan your day")
                    .body("Review today's tasks and plan tomorrow")
                    .show();
                let _ = rebuild_tray(&app).await;
            }
        }
    });
}

/// Rebuild the tray from the frontend after planning / status changes.
#[tauri::command]
pub async fn refresh_tray(app: AppHandle) -> Result<()> {
    rebuild_tray(&app).await
}
