use serde::{Deserialize, Serialize};

/// Application settings. A single row (`id = 1`) seeded by the migration; new
/// settings are added as columns over time. Edited from the Settings page.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub id: i64,
    /// Local 'HH:MM' time at which the evening planning reminder fires.
    pub notification_time: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Universal patch for settings. An omitted field is left unchanged.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettings {
    #[serde(default)]
    pub notification_time: Option<String>,
}
