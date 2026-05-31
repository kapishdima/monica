use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::Result;
use crate::models::now_timestamp;
use crate::models::project::{NewProject, Project, UpdateProject};

pub async fn create(pool: &SqlitePool, input: NewProject) -> Result<Project> {
    let id = Uuid::new_v4().to_string();
    let now = now_timestamp();

    let project = sqlx::query_as::<_, Project>(
        "INSERT INTO projects (id, name, description, url, github_url, github_stars, github_prs, github_issues, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.url)
    .bind(&input.github_url)
    .bind(input.github_stars)
    .bind(input.github_prs)
    .bind(input.github_issues)
    .bind(&now)
    .bind(&now)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

pub async fn list(pool: &SqlitePool) -> Result<Vec<Project>> {
    let projects = sqlx::query_as::<_, Project>("SELECT * FROM projects ORDER BY created_at DESC")
        .fetch_all(pool)
        .await?;
    Ok(projects)
}

pub async fn get(pool: &SqlitePool, id: &str) -> Result<Project> {
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(project)
}

/// Universal update: applies only the fields present in `patch` (read-modify-write),
/// then persists. Returns `NotFound` if the project doesn't exist.
pub async fn update(pool: &SqlitePool, id: &str, patch: UpdateProject) -> Result<Project> {
    let mut p = get(pool, id).await?;

    if let Some(v) = patch.name {
        p.name = v;
    }
    if let Some(v) = patch.description {
        p.description = v;
    }
    if let Some(v) = patch.status {
        p.status = v;
    }
    if let Some(v) = patch.logo_path {
        p.logo_path = v;
    }
    if let Some(v) = patch.url {
        p.url = v;
    }
    if let Some(v) = patch.github_url {
        p.github_url = v;
    }
    if let Some(v) = patch.github_stars {
        p.github_stars = v;
    }
    if let Some(v) = patch.github_prs {
        p.github_prs = v;
    }
    if let Some(v) = patch.github_issues {
        p.github_issues = v;
    }
    p.updated_at = now_timestamp();

    let project = sqlx::query_as::<_, Project>(
        "UPDATE projects SET name = ?, description = ?, status = ?, logo_path = ?,
            url = ?, github_url = ?, github_stars = ?, github_prs = ?, github_issues = ?, updated_at = ?
         WHERE id = ? RETURNING *",
    )
    .bind(&p.name)
    .bind(&p.description)
    .bind(p.status)
    .bind(&p.logo_path)
    .bind(&p.url)
    .bind(&p.github_url)
    .bind(p.github_stars)
    .bind(p.github_prs)
    .bind(p.github_issues)
    .bind(&p.updated_at)
    .bind(id)
    .fetch_one(pool)
    .await?;

    Ok(project)
}

/// Delete a project (its tasks cascade via the FK). `NotFound` if nothing was deleted.
pub async fn remove(pool: &SqlitePool, id: &str) -> Result<()> {
    let result = sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(crate::error::AppError::NotFound);
    }
    Ok(())
}
