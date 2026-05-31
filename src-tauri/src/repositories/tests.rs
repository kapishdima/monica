//! Exercises the real query layer (RETURNING, enum encode/decode, universal
//! update read-modify-write, remove) against an in-memory SQLite DB.

use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;

use crate::models::project::{NewProject, ProjectStatus, UpdateProject};
use crate::models::task::{NewTask, TaskLabel, TaskPriority, TaskStatus, UpdateTask};
use crate::repositories::{project_repo, task_repo};

async fn memory_pool() -> SqlitePool {
    // Single connection so the in-memory DB is shared across queries.
    let options = SqliteConnectOptions::from_str("sqlite::memory:")
        .unwrap()
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .unwrap();
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();
    pool
}

fn run<F: std::future::Future>(f: F) -> F::Output {
    tauri::async_runtime::block_on(f)
}

#[test]
fn project_crud_roundtrip() {
    run(async {
        let pool = memory_pool().await;

        let project = project_repo::create(
            &pool,
            NewProject {
                name: "Monica".into(),
                description: None,
                url: None,
                github_url: Some("https://github.com/x/y".into()),
                github_stars: Some(10),
            },
        )
        .await
        .unwrap();

        // Defaults from the schema.
        assert!(matches!(project.status, ProjectStatus::Planned));
        assert_eq!(project.github_stars, Some(10));

        // Universal update: change status, clear github_stars (null), set logo.
        let updated = project_repo::update(
            &pool,
            &project.id,
            UpdateProject {
                name: None,
                description: Some(Some("desc".into())),
                status: Some(ProjectStatus::Active),
                logo_path: Some(Some("logos/x.png".into())),
                url: None,
                github_url: None,
                github_stars: Some(None),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert!(matches!(updated.status, ProjectStatus::Active));
        assert_eq!(updated.description.as_deref(), Some("desc"));
        assert_eq!(updated.logo_path.as_deref(), Some("logos/x.png"));
        assert_eq!(updated.github_stars, None);
        // Untouched field preserved.
        assert_eq!(updated.github_url.as_deref(), Some("https://github.com/x/y"));

        let all = project_repo::list(&pool).await.unwrap();
        assert_eq!(all.len(), 1);

        project_repo::remove(&pool, &project.id).await.unwrap();
        assert!(project_repo::list(&pool).await.unwrap().is_empty());

        // Removing a missing project is NotFound.
        assert!(project_repo::remove(&pool, "missing").await.is_err());
    });
}

#[test]
fn task_create_generates_short_id_and_branch() {
    run(async {
        let pool = memory_pool().await;
        let project = project_repo::create(
            &pool,
            NewProject {
                name: "P".into(),
                description: None,
                url: None,
                github_url: None,
                github_stars: None,
            },
        )
        .await
        .unwrap();

        let task = task_repo::create(
            &pool,
            NewTask {
                project_id: project.id.clone(),
                title: "First".into(),
                description: None,
                priority: Some(TaskPriority::High),
                label: Some(TaskLabel::Feat),
                planned_for: None,
            },
        )
        .await
        .unwrap();

        assert_eq!(task.task_id.len(), 6);
        assert_eq!(task.github_branch.as_deref(), Some(&*format!("feat/{}", task.task_id)));
        assert!(matches!(task.status, TaskStatus::Todo));
        assert!(matches!(task.priority, TaskPriority::High));

        // Update status + clear the label (null on a nullable column).
        let updated = task_repo::update(
            &pool,
            &task.id,
            UpdateTask {
                status: Some(TaskStatus::InProgress),
                label: Some(None),
                ..Default::default()
            },
        )
        .await
        .unwrap();
        assert!(matches!(updated.status, TaskStatus::InProgress));
        assert!(updated.label.is_none());
        // Title untouched.
        assert_eq!(updated.title, "First");

        let listed = task_repo::list_by_project(&pool, &project.id).await.unwrap();
        assert_eq!(listed.len(), 1);

        task_repo::remove(&pool, &task.id).await.unwrap();
        assert!(task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .is_empty());
    });
}

#[test]
fn removing_project_cascades_tasks() {
    run(async {
        let pool = memory_pool().await;
        let project = project_repo::create(
            &pool,
            NewProject {
                name: "P".into(),
                description: None,
                url: None,
                github_url: None,
                github_stars: None,
            },
        )
        .await
        .unwrap();
        task_repo::create(
            &pool,
            NewTask {
                project_id: project.id.clone(),
                title: "T".into(),
                description: None,
                priority: None,
                label: None,
                planned_for: None,
            },
        )
        .await
        .unwrap();

        project_repo::remove(&pool, &project.id).await.unwrap();
        assert!(task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .is_empty());
    });
}
