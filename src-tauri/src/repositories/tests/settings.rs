//! Tests for `settings_repo`: the migration-seeded singleton and its update.

use crate::models::settings::UpdateSettings;
use crate::repositories::settings_repo;

use super::support::{memory_pool, run};

#[test]
fn get_returns_seeded_default() {
    run(async {
        let pool = memory_pool().await;
        let settings = settings_repo::get(&pool).await.unwrap();

        assert_eq!(settings.id, 1);
        assert_eq!(settings.notification_time, "20:00");
    });
}

#[test]
fn update_changes_notification_time_and_bumps_updated_at() {
    run(async {
        let pool = memory_pool().await;
        let before = settings_repo::get(&pool).await.unwrap();

        let patch = UpdateSettings {
            notification_time: Some("21:30".into()),
        };
        let after = settings_repo::update(&pool, patch).await.unwrap();

        assert_eq!(after.notification_time, "21:30");
        assert_eq!(after.created_at, before.created_at);
        assert_ne!(after.updated_at, before.updated_at);
    });
}

#[test]
fn update_with_no_fields_leaves_value_unchanged() {
    run(async {
        let pool = memory_pool().await;

        let after = settings_repo::update(&pool, UpdateSettings::default())
            .await
            .unwrap();

        assert_eq!(after.notification_time, "20:00");
    });
}
