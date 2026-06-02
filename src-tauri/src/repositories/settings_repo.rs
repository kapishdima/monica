use sqlx::SqlitePool;

use crate::error::Result;
use crate::models::now_timestamp;
use crate::models::settings::{Settings, UpdateSettings};

/// The settings singleton (`id = 1`, seeded by the migration).
pub async fn get(pool: &SqlitePool) -> Result<Settings> {
    let settings = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = 1")
        .fetch_one(pool)
        .await?;
    Ok(settings)
}

/// Universal update: applies only the fields present in `patch` (read-modify-write),
/// then persists. Returns `NotFound` if the singleton row is missing.
pub async fn update(pool: &SqlitePool, patch: UpdateSettings) -> Result<Settings> {
    let mut s = get(pool).await?;

    if let Some(v) = patch.notification_time {
        s.notification_time = v;
    }
    s.updated_at = now_timestamp();

    let settings = sqlx::query_as::<_, Settings>(
        "UPDATE settings SET notification_time = ?, updated_at = ? WHERE id = 1 RETURNING *",
    )
    .bind(&s.notification_time)
    .bind(&s.updated_at)
    .fetch_one(pool)
    .await?;

    Ok(settings)
}
