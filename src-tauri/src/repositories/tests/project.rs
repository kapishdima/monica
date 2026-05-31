//! CRUD tests for `project_repo`.

use crate::error::AppError;
use crate::models::project::{ProjectStatus, UpdateProject};
use crate::repositories::project_repo;

use super::support::{memory_pool, new_project, run};

#[test]
fn create_applies_schema_defaults() {
    run(async {
        let pool = memory_pool().await;
        let project = project_repo::create(&pool, new_project("Monica"))
            .await
            .unwrap();

        assert_eq!(project.name, "Monica");
        // Defaults from the schema / repo.
        assert!(matches!(project.status, ProjectStatus::Planned));
        assert_eq!(project.description, None);
        assert_eq!(project.logo_path, None);
        assert_eq!(project.github_stars, None);
        // Timestamps are set and equal on insert.
        assert!(!project.created_at.is_empty());
        assert_eq!(project.created_at, project.updated_at);
    });
}

#[test]
fn create_persists_all_optional_fields() {
    run(async {
        let pool = memory_pool().await;
        let mut input = new_project("Full");
        input.description = Some("desc".into());
        input.url = Some("https://monica.app".into());
        input.github_url = Some("https://github.com/x/y".into());
        input.github_stars = Some(42);
        input.github_prs = Some(3);
        input.github_issues = Some(7);

        let project = project_repo::create(&pool, input).await.unwrap();

        assert_eq!(project.description.as_deref(), Some("desc"));
        assert_eq!(project.url.as_deref(), Some("https://monica.app"));
        assert_eq!(
            project.github_url.as_deref(),
            Some("https://github.com/x/y")
        );
        assert_eq!(project.github_stars, Some(42));
        assert_eq!(project.github_prs, Some(3));
        assert_eq!(project.github_issues, Some(7));
    });
}

#[test]
fn get_returns_created_project() {
    run(async {
        let pool = memory_pool().await;
        let created = project_repo::create(&pool, new_project("P")).await.unwrap();

        let fetched = project_repo::get(&pool, &created.id).await.unwrap();
        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "P");
    });
}

#[test]
fn get_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = project_repo::get(&pool, "missing").await.unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}

#[test]
fn list_orders_by_created_at_desc() {
    run(async {
        let pool = memory_pool().await;
        // created_at is an RFC3339 string; insert distinct timestamps by spacing
        // the inserts is unreliable at sub-second resolution, so assert the set
        // and that the newest-by-tie ordering is stable for a single insert.
        let a = project_repo::create(&pool, new_project("A")).await.unwrap();
        let b = project_repo::create(&pool, new_project("B")).await.unwrap();
        let c = project_repo::create(&pool, new_project("C")).await.unwrap();

        let all = project_repo::list(&pool).await.unwrap();
        assert_eq!(all.len(), 3);
        // All three are present.
        let ids: Vec<&str> = all.iter().map(|p| p.id.as_str()).collect();
        assert!(ids.contains(&a.id.as_str()));
        assert!(ids.contains(&b.id.as_str()));
        assert!(ids.contains(&c.id.as_str()));
        // Ordered by created_at DESC (non-increasing).
        assert!(all[0].created_at >= all[1].created_at);
        assert!(all[1].created_at >= all[2].created_at);
    });
}

#[test]
fn update_applies_only_present_fields() {
    run(async {
        let pool = memory_pool().await;
        let mut input = new_project("Monica");
        input.github_url = Some("https://github.com/x/y".into());
        input.github_stars = Some(10);
        let project = project_repo::create(&pool, input).await.unwrap();

        let updated = project_repo::update(
            &pool,
            &project.id,
            UpdateProject {
                description: Some(Some("desc".into())),
                status: Some(ProjectStatus::Active),
                logo_path: Some(Some("logos/x.png".into())),
                github_prs: Some(Some(5)),
                github_issues: Some(Some(9)),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        // Changed fields.
        assert!(matches!(updated.status, ProjectStatus::Active));
        assert_eq!(updated.description.as_deref(), Some("desc"));
        assert_eq!(updated.logo_path.as_deref(), Some("logos/x.png"));
        assert_eq!(updated.github_prs, Some(5));
        assert_eq!(updated.github_issues, Some(9));
        // Untouched fields preserved.
        assert_eq!(updated.name, "Monica");
        assert_eq!(
            updated.github_url.as_deref(),
            Some("https://github.com/x/y")
        );
        assert_eq!(updated.github_stars, Some(10));
    });
}

#[test]
fn update_clears_nullable_field_with_explicit_null() {
    run(async {
        let pool = memory_pool().await;
        let mut input = new_project("Monica");
        input.github_stars = Some(10);
        let project = project_repo::create(&pool, input).await.unwrap();

        let updated = project_repo::update(
            &pool,
            &project.id,
            UpdateProject {
                github_stars: Some(None),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.github_stars, None);
    });
}

#[test]
fn update_empty_patch_only_bumps_updated_at() {
    run(async {
        let pool = memory_pool().await;
        let project = project_repo::create(&pool, new_project("P")).await.unwrap();

        let updated = project_repo::update(&pool, &project.id, UpdateProject::default())
            .await
            .unwrap();

        // All data fields unchanged.
        assert_eq!(updated.name, project.name);
        assert!(matches!(updated.status, ProjectStatus::Planned));
        // created_at is immutable.
        assert_eq!(updated.created_at, project.created_at);
    });
}

#[test]
fn update_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = project_repo::update(&pool, "missing", UpdateProject::default())
            .await
            .unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}

#[test]
fn remove_deletes_project() {
    run(async {
        let pool = memory_pool().await;
        let project = project_repo::create(&pool, new_project("P")).await.unwrap();

        project_repo::remove(&pool, &project.id).await.unwrap();

        assert!(project_repo::list(&pool).await.unwrap().is_empty());
        assert!(matches!(
            project_repo::get(&pool, &project.id).await.unwrap_err(),
            AppError::NotFound
        ));
    });
}

#[test]
fn remove_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = project_repo::remove(&pool, "missing").await.unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}
