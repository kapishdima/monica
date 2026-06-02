use tauri::State;

use crate::db::Db;
use crate::error::Result;
use crate::models::daily_plan::{DailyPlan, UpdateDailyPlan};
use crate::repositories::daily_plan_repo;

#[tauri::command]
pub async fn get_daily_plan(db: State<'_, Db>, date: String) -> Result<DailyPlan> {
    daily_plan_repo::get_or_create(db.pool(), &date).await
}

#[tauri::command]
pub async fn update_daily_plan(
    db: State<'_, Db>,
    date: String,
    patch: UpdateDailyPlan,
) -> Result<DailyPlan> {
    daily_plan_repo::update(db.pool(), &date, patch).await
}
