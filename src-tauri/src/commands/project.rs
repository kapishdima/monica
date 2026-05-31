use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::github::{self, GithubActivity};
use crate::models::project::{NewProject, Project, ProjectStatus, UpdateProject};
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
pub async fn update_project(db: State<'_, Db>, id: String, patch: UpdateProject) -> Result<Project> {
    project_repo::update(db.pool(), &id, patch).await
}

#[tauri::command]
pub async fn remove_project(db: State<'_, Db>, id: String) -> Result<()> {
    project_repo::remove(db.pool(), &id).await
}
