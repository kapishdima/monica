use nanoid::nanoid;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::Result;
use crate::models::now_timestamp;
use crate::models::task::{NewTask, Task, TaskPriority, TaskStatus, UpdateTask};

pub async fn create(pool: &SqlitePool, input: NewTask) -> Result<Task> {
    let id = Uuid::new_v4().to_string();
    // Short, human-friendly id (6 chars, base64url alphabet). Collisions are
    // astronomically unlikely; the UNIQUE constraint would surface one as an error.
    let task_id = nanoid!(6);
    let now = now_timestamp();
    let priority = input.priority.unwrap_or(TaskPriority::Low);
    let status = TaskStatus::Todo;
    // Branch is auto-generated from label + short id, e.g. `feat/a1B2c3`.
    let github_branch = input
        .label
        .map(|label| format!("{}/{}", label.as_str(), task_id));

    let task = sqlx::query_as::<_, Task>(
        "INSERT INTO tasks
            (id, task_id, project_id, title, description, status, priority, label, github_branch, planned_for, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *",
    )
    .bind(&id)
    .bind(&task_id)
    .bind(&input.project_id)
    .bind(&input.title)
    .bind(&input.description)
    .bind(status)
    .bind(priority)
    .bind(input.label)
    .bind(&github_branch)
    .bind(&input.planned_for)
    .bind(&now)
    .bind(&now)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

pub async fn list_by_project(pool: &SqlitePool, project_id: &str) -> Result<Vec<Task>> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE project_id = ? ORDER BY position, created_at",
    )
    .bind(project_id)
    .fetch_all(pool)
    .await?;
    Ok(tasks)
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<Task> {
    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(task)
}

/// Universal update: applies only the fields present in `patch` (read-modify-write),
/// then persists. Returns `NotFound` if the task doesn't exist.
pub async fn update(pool: &SqlitePool, id: &str, patch: UpdateTask) -> Result<Task> {
    let mut t = get(pool, id).await?;

    if let Some(v) = patch.project_id {
        t.project_id = v;
    }
    if let Some(v) = patch.title {
        t.title = v;
    }
    if let Some(v) = patch.description {
        t.description = v;
    }
    if let Some(v) = patch.status {
        t.status = v;
    }
    if let Some(v) = patch.priority {
        t.priority = v;
    }
    if let Some(v) = patch.label {
        t.label = v;
    }
    if let Some(v) = patch.github_branch {
        t.github_branch = v;
    }
    if let Some(v) = patch.position {
        t.position = v;
    }
    if let Some(v) = patch.planned_for {
        t.planned_for = v;
    }
    t.updated_at = now_timestamp();

    let task = sqlx::query_as::<_, Task>(
        "UPDATE tasks SET project_id = ?, title = ?, description = ?, status = ?,
            priority = ?, label = ?, github_branch = ?, position = ?, planned_for = ?, updated_at = ?
         WHERE id = ? RETURNING *",
    )
    .bind(&t.project_id)
    .bind(&t.title)
    .bind(&t.description)
    .bind(t.status)
    .bind(t.priority)
    .bind(t.label)
    .bind(&t.github_branch)
    .bind(t.position)
    .bind(&t.planned_for)
    .bind(&t.updated_at)
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(task)
}

/// Delete a task. `NotFound` if nothing was deleted.
pub async fn remove(pool: &SqlitePool, id: &str) -> Result<()> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(crate::error::AppError::NotFound);
    }
    Ok(())
}
