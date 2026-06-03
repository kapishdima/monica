use serde::Serialize;

/// Outcome of a Linear CSV import, surfaced to the UI for a summary toast.
#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    /// Projects newly inserted (a CSV `Project` name not already in the DB).
    pub projects_created: usize,
    /// Projects matched to an existing row by name and reused (no duplicate).
    pub projects_reused: usize,
    /// Tasks inserted.
    pub tasks_imported: usize,
    /// Rows skipped because their Linear status was `Canceled`.
    pub skipped_canceled: usize,
    /// Rows skipped because they had no `Project`.
    pub skipped_no_project: usize,
}
