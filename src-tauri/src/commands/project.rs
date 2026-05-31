use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::models::project::{NewProject, Project, UpdateProject};
use crate::repositories::project_repo;

#[tauri::command]
pub async fn create_project(db: State<'_, Db>, input: NewProject) -> Result<Project> {
    project_repo::create(db.pool(), input).await
}

#[tauri::command]
pub async fn list_projects(db: State<'_, Db>) -> Result<Vec<Project>> {
    project_repo::list(db.pool()).await
}

#[tauri::command]
pub async fn update_project(db: State<'_, Db>, id: String, patch: UpdateProject) -> Result<Project> {
    project_repo::update(db.pool(), &id, patch).await
}

#[tauri::command]
pub async fn remove_project(db: State<'_, Db>, id: String) -> Result<()> {
    project_repo::remove(db.pool(), &id).await
}
