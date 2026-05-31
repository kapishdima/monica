use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::models::task::{NewTask, Task, UpdateTask};
use crate::repositories::task_repo;

#[tauri::command]
pub async fn create_task(db: State<'_, Db>, input: NewTask) -> Result<Task> {
    task_repo::create(db.pool(), input).await
}

#[tauri::command]
pub async fn list_tasks(db: State<'_, Db>, project_id: String) -> Result<Vec<Task>> {
    task_repo::list_by_project(db.pool(), &project_id).await
}

#[tauri::command]
pub async fn update_task(db: State<'_, Db>, id: String, patch: UpdateTask) -> Result<Task> {
    task_repo::update(db.pool(), &id, patch).await
}

#[tauri::command]
pub async fn remove_task(db: State<'_, Db>, id: String) -> Result<()> {
    task_repo::remove(db.pool(), &id).await
}
