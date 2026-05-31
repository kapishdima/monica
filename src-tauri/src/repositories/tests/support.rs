//! Test environment: an isolated in-memory database per test plus builders and
//! seeders that keep individual tests focused on the behaviour they assert.

use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;

use crate::models::project::{NewProject, Project};
use crate::models::task::{NewTask, Task};
use crate::repositories::{project_repo, task_repo};

/// A fresh, migrated in-memory SQLite pool. Each call returns a brand-new
/// database, so tests never share state.
pub async fn memory_pool() -> SqlitePool {
    // A single connection keeps the in-memory DB alive and shared across queries
    // (each connection would otherwise get its own empty database).
    let options = SqliteConnectOptions::from_str("sqlite::memory:")
        .unwrap()
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .unwrap();
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();
    pool
}

/// Block on an async test body using Tauri's runtime (no `#[tokio::test]` needed).
pub fn run<F: std::future::Future>(f: F) -> F::Output {
    tauri::async_runtime::block_on(f)
}

/// A `NewProject` with only the required `name` set; tweak fields inline as needed.
pub fn new_project(name: &str) -> NewProject {
    NewProject {
        name: name.into(),
        description: None,
        url: None,
        github_url: None,
        github_stars: None,
        github_prs: None,
        github_issues: None,
    }
}

/// A `NewTask` with only the required fields set.
pub fn new_task(project_id: &str, title: &str) -> NewTask {
    NewTask {
        project_id: project_id.into(),
        title: title.into(),
        description: None,
        priority: None,
        label: None,
        planned_for: None,
    }
}

/// Insert a throwaway project and return it (for task tests that need a parent).
pub async fn seed_project(pool: &SqlitePool) -> Project {
    project_repo::create(pool, new_project("Seed")).await.unwrap()
}

/// Insert a throwaway task under `project_id` and return it.
pub async fn seed_task(pool: &SqlitePool, project_id: &str) -> Task {
    task_repo::create(pool, new_task(project_id, "Seed task"))
        .await
        .unwrap()
}
