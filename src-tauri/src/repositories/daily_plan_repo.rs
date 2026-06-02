use sqlx::SqlitePool;

use crate::error::Result;
use crate::models::daily_plan::{DailyPlan, UpdateDailyPlan};
use crate::models::now_timestamp;

/// Fetch the plan for `date`, creating an empty one if it doesn't exist yet.
/// Plans are created lazily — opening or annotating a day materializes its row.
pub async fn get_or_create(pool: &SqlitePool, date: &str) -> Result<DailyPlan> {
    let now = now_timestamp();
    sqlx::query("INSERT OR IGNORE INTO daily_plans (date, created_at, updated_at) VALUES (?, ?, ?)")
        .bind(date)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

    let plan = sqlx::query_as::<_, DailyPlan>("SELECT * FROM daily_plans WHERE date = ?")
        .bind(date)
        .fetch_one(pool)
        .await?;
    Ok(plan)
}

/// Universal update: ensures the day's row exists, applies only the fields
/// present in `patch` (read-modify-write), then persists.
pub async fn update(pool: &SqlitePool, date: &str, patch: UpdateDailyPlan) -> Result<DailyPlan> {
    let mut p = get_or_create(pool, date).await?;

    if let Some(v) = patch.reflection {
        p.reflection = v;
    }
    if let Some(v) = patch.rating {
        p.rating = v;
    }
    p.updated_at = now_timestamp();

    let plan = sqlx::query_as::<_, DailyPlan>(
        "UPDATE daily_plans SET reflection = ?, rating = ?, updated_at = ? WHERE date = ? RETURNING *",
    )
    .bind(&p.reflection)
    .bind(p.rating)
    .bind(&p.updated_at)
    .bind(date)
    .fetch_one(pool)
    .await?;

    Ok(plan)
}
