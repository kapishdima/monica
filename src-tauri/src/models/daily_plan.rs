use serde::{Deserialize, Serialize};

/// How a day went, recorded as the end-of-day "итог дня". Stored as TEXT with a
/// CHECK constraint; rendered as a colored glyph in the UI (like `TaskStatus`).
#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(rename_all = "snake_case")]
pub enum DayRating {
    Great,
    Good,
    Okay,
    Bad,
    Terrible,
}

/// A single day's plan record. Keyed by its local `date` (`YYYY-MM-DD`); the
/// day's tasks are linked separately via `tasks.planned_for`. Holds only the
/// day-level reflection and rating.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DailyPlan {
    pub date: String,
    pub reflection: Option<String>,
    pub rating: Option<DayRating>,
    pub created_at: String,
    pub updated_at: String,
}

/// Universal patch for a daily plan. An omitted field is left unchanged; a field
/// present as `null` clears a nullable column. (`date`/`createdAt` are immutable.)
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDailyPlan {
    #[serde(default)]
    pub reflection: Option<Option<String>>,
    #[serde(default)]
    pub rating: Option<Option<DayRating>>,
}
