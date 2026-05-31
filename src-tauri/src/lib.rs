mod commands;
mod db;
mod error;
mod favicon;
mod github;
mod models;
mod repositories;

use tauri::Manager;

use db::Db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let db = tauri::async_runtime::block_on(Db::new(&handle))
                .expect("failed to initialize database");
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::update_project,
            commands::project::remove_project,
            commands::project::connect_github_project,
            commands::project::fetch_github_activity,
            commands::task::create_task,
            commands::task::list_tasks,
            commands::task::update_task,
            commands::task::remove_task,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
