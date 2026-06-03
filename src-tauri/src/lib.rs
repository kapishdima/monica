mod claude_code;
mod commands;
mod db;
mod error;
mod favicon;
mod github;
mod models;
mod repositories;
mod tray;

use tauri::Manager;

use db::Db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let db = tauri::async_runtime::block_on(Db::new(&handle))
                .expect("failed to initialize database");
            app.manage(db);

            // Tray + the evening reminder scheduler. The tray keeps the process
            // alive after the window is hidden so the reminder can fire.
            tray::init(&handle)?;
            let tray_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let _ = tray::rebuild_tray(&tray_handle).await;
            });
            tray::spawn_scheduler(handle);
            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the window hides it to the tray instead of quitting, so the
            // scheduler stays alive. Quit is available from the tray menu.
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::remove_project,
            commands::project::connect_github_project,
            commands::project::fetch_github_activity,
            commands::project::fetch_github_repo,
            commands::task::create_task,
            commands::task::list_tasks,
            commands::task::list_all_tasks,
            commands::task::list_planned_tasks,
            commands::task::list_plannable_tasks,
            commands::task::get_task,
            commands::task::update_task,
            commands::task::remove_task,
            commands::import::import_linear_csv,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::daily_plan::get_daily_plan,
            commands::daily_plan::update_daily_plan,
            commands::claude_code::list_task_sessions,
            commands::claude_code::get_task_session,
            tray::refresh_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
