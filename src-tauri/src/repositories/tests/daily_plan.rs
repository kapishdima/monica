//! Tests for `daily_plan_repo`: lazy get-or-create, the universal update's
//! null-clear semantics, the rating CHECK constraint, and enum round-trips.

use crate::models::daily_plan::{DayRating, UpdateDailyPlan};
use crate::repositories::daily_plan_repo;

use super::support::{memory_pool, run};

#[test]
fn get_or_create_is_idempotent() {
    run(async {
        let pool = memory_pool().await;

        let first = daily_plan_repo::get_or_create(&pool, "2026-06-02")
            .await
            .unwrap();
        assert_eq!(first.date, "2026-06-02");
        assert!(first.reflection.is_none());
        assert!(first.rating.is_none());

        let second = daily_plan_repo::get_or_create(&pool, "2026-06-02")
            .await
            .unwrap();
        // Same row, untouched timestamps — not re-created.
        assert_eq!(second.created_at, first.created_at);
        assert_eq!(second.updated_at, first.updated_at);
    });
}

#[test]
fn update_sets_then_clears_reflection_and_rating() {
    run(async {
        let pool = memory_pool().await;

        let set = daily_plan_repo::update(
            &pool,
            "2026-06-02",
            UpdateDailyPlan {
                reflection: Some(Some("Shipped the planner".into())),
                rating: Some(Some(DayRating::Great)),
            },
        )
        .await
        .unwrap();
        assert_eq!(set.reflection.as_deref(), Some("Shipped the planner"));
        assert!(matches!(set.rating, Some(DayRating::Great)));

        // An omitted field is left unchanged; an explicit `null` clears it.
        let cleared = daily_plan_repo::update(
            &pool,
            "2026-06-02",
            UpdateDailyPlan {
                reflection: Some(None),
                rating: None,
            },
        )
        .await
        .unwrap();
        assert!(cleared.reflection.is_none());
        // `rating` was omitted, so it survives.
        assert!(matches!(cleared.rating, Some(DayRating::Great)));
    });
}

#[test]
fn invalid_rating_is_rejected_by_check_constraint() {
    run(async {
        let pool = memory_pool().await;

        let result = sqlx::query(
            "INSERT INTO daily_plans (date, rating, created_at, updated_at)
             VALUES ('2026-06-03', 'amazing', '', '')",
        )
        .execute(&pool)
        .await;

        assert!(result.is_err());
    });
}
