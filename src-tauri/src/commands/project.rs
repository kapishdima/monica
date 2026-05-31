use tauri::{AppHandle, State};

use crate::db::Db;
use crate::error::Result;
use crate::favicon;
use crate::github::{self, GithubActivity};
use crate::models::project::{NewProject, Project, ProjectStatus, UpdateProject};
use crate::repositories::project_repo;

#[tauri::command]
pub async fn create_project(
    app: AppHandle,
    db: State<'_, Db>,
    input: NewProject,
) -> Result<Project> {
    let project = project_repo::create(db.pool(), input).await?;

    // Best-effort: a favicon failure must never fail project creation.
    if let Some(url) = project.url.clone() {
        if let Ok(path) = favicon::download(&app, &project.id, &url).await {
            return set_logo(db.pool(), &project.id, Some(path)).await;
        }
    }

    Ok(project)
}

/// Persist a project's `logo_path` via the universal patch.
async fn set_logo(pool: &sqlx::SqlitePool, id: &str, path: Option<String>) -> Result<Project> {
    let patch = UpdateProject {
        logo_path: Some(path),
        ..Default::default()
    };
    project_repo::update(pool, id, patch).await
}

#[tauri::command]
pub async fn list_projects(db: State<'_, Db>) -> Result<Vec<Project>> {
    project_repo::list(db.pool()).await
}

#[tauri::command]
pub async fn get_project(db: State<'_, Db>, id: String) -> Result<Project> {
    project_repo::get(db.pool(), &id).await
}

/// Fetch GitHub stats for `url`, persist them on the project (promoting a
/// `planned` project to `active` so its metrics render), and return the
/// updated project.
#[tauri::command]
pub async fn connect_github_project(db: State<'_, Db>, id: String, url: String) -> Result<Project> {
    let stats = github::fetch_stats(&url).await?;
    let current = project_repo::get(db.pool(), &id).await?;

    let patch = UpdateProject {
        github_url: Some(Some(url)),
        github_stars: Some(Some(stats.stars)),
        github_prs: Some(Some(stats.prs)),
        github_issues: Some(Some(stats.issues)),
        status: matches!(current.status, ProjectStatus::Planned).then_some(ProjectStatus::Active),
        ..Default::default()
    };

    project_repo::update(db.pool(), &id, patch).await
}

/// Live open pull requests and issues for a repository (not persisted).
#[tauri::command]
pub async fn fetch_github_activity(url: String) -> Result<GithubActivity> {
    github::fetch_activity(&url).await
}

#[tauri::command]
pub async fn update_project(
    app: AppHandle,
    db: State<'_, Db>,
    id: String,
    patch: UpdateProject,
) -> Result<Project> {
    // Detect whether this patch actually changes the URL, so we only re-fetch
    // the favicon when it does.
    let url_change = match &patch.url {
        Some(new_url) => {
            let current = project_repo::get(db.pool(), &id).await?;
            (new_url.as_deref() != current.url.as_deref()).then(|| new_url.clone())
        }
        None => None,
    };

    let project = project_repo::update(db.pool(), &id, patch).await?;

    match url_change {
        // URL changed to a new site → refresh the favicon (best-effort).
        Some(Some(url)) => {
            if let Ok(path) = favicon::download(&app, &id, &url).await {
                return set_logo(db.pool(), &id, Some(path)).await;
            }
        }
        // URL cleared → drop the logo and its file.
        Some(None) => {
            let _ = favicon::remove(&app, &id);
            return set_logo(db.pool(), &id, None).await;
        }
        None => {}
    }

    Ok(project)
}

#[tauri::command]
pub async fn remove_project(app: AppHandle, db: State<'_, Db>, id: String) -> Result<()> {
    project_repo::remove(db.pool(), &id).await?;
    // Best-effort cleanup of the downloaded favicon.
    let _ = favicon::remove(&app, &id);
    Ok(())
}
