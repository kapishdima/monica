use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum ProjectStatus {
    Active,
    Cancelled,
    Planned,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub logo_path: Option<String>,
    pub url: Option<String>,
    pub github_url: Option<String>,
    pub github_stars: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewProject {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub github_url: Option<String>,
    #[serde(default)]
    pub github_stars: Option<i64>,
}

/// Universal patch for a project. An omitted field is left unchanged; a field
/// present as `null` clears a nullable column. (`id`/`createdAt` are immutable.)
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProject {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<Option<String>>,
    #[serde(default)]
    pub status: Option<ProjectStatus>,
    #[serde(default)]
    pub logo_path: Option<Option<String>>,
    #[serde(default)]
    pub url: Option<Option<String>>,
    #[serde(default)]
    pub github_url: Option<Option<String>>,
    #[serde(default)]
    pub github_stars: Option<Option<i64>>,
}
