use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::models::settings::{Settings, UpdateSettings};
use crate::repositories::settings_repo;

#[tauri::command]
pub async fn get_settings(db: State<'_, Db>) -> Result<Settings> {
    settings_repo::get(db.pool()).await
}

#[tauri::command]
pub async fn update_settings(db: State<'_, Db>, patch: UpdateSettings) -> Result<Settings> {
    settings_repo::update(db.pool(), patch).await
}
