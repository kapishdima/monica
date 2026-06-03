use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::models::import::ImportSummary;
use crate::repositories::import_repo;

/// Import a Linear CSV export (raw file contents) into the local DB. Appends —
/// existing projects are reused by name, nothing is deleted.
#[tauri::command]
pub async fn import_linear_csv(db: State<'_, Db>, csv: String) -> Result<ImportSummary> {
    import_repo::import_linear_csv(db.pool(), &csv).await
}
