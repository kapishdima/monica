use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};

use crate::error::Result;

/// Owns the SQLite connection pool. Stored in Tauri managed state and shared
/// across commands (and, later, the tray / git / AI features).
pub struct Db {
    pool: SqlitePool,
}

impl Db {
    /// Resolve the per-user app data dir, ensure it exists, open the pool and
    /// run migrations. Data lives only on the user's machine (no cloud/sync).
    pub async fn new(handle: &AppHandle) -> Result<Self> {
        let data_dir = handle
            .path()
            .app_data_dir()
            .map_err(|e| crate::error::AppError::Io(e.to_string()))?;
        std::fs::create_dir_all(&data_dir)?;

        let db_path = data_dir.join("monica.db");
        let url = format!("sqlite://{}", db_path.to_string_lossy());

        let options = SqliteConnectOptions::from_str(&url)
            .map_err(|e| crate::error::AppError::Database(e.to_string()))?
            .create_if_missing(true)
            .foreign_keys(true)
            .journal_mode(SqliteJournalMode::Wal);

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await?;

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| crate::error::AppError::Database(e.to_string()))?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}
