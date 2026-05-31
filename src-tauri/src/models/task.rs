use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum TaskStatus {
    Backlog,
    Todo,
    InProgress,
    InReview,
    Done,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum TaskPriority {
    Low,
    High,
    Urgent,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum TaskLabel {
    Feat,
    Fix,
    Refactor,
    Chore,
}

impl TaskLabel {
    /// Branch prefix, e.g. `feat` -> used in `feat/<task_id>`.
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskLabel::Feat => "feat",
            TaskLabel::Fix => "fix",
            TaskLabel::Refactor => "refactor",
            TaskLabel::Chore => "chore",
        }
    }
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub task_id: String,
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub label: Option<TaskLabel>,
    pub github_branch: Option<String>,
    pub position: i64,
    pub planned_for: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTask {
    pub project_id: String,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub priority: Option<TaskPriority>,
    #[serde(default)]
    pub label: Option<TaskLabel>,
    #[serde(default)]
    pub planned_for: Option<String>,
}

/// Universal patch for a task. An omitted field is left unchanged; a field
/// present as `null` clears a nullable column. (`id`/`taskId`/`createdAt` are immutable.)
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTask {
    #[serde(default)]
    pub project_id: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<Option<String>>,
    #[serde(default)]
    pub status: Option<TaskStatus>,
    #[serde(default)]
    pub priority: Option<TaskPriority>,
    #[serde(default)]
    pub label: Option<Option<TaskLabel>>,
    #[serde(default)]
    pub github_branch: Option<Option<String>>,
    #[serde(default)]
    pub position: Option<i64>,
    #[serde(default)]
    pub planned_for: Option<Option<String>>,
}
