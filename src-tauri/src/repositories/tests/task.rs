//! CRUD tests for `task_repo`, including FK cascade and project scoping.

use crate::error::AppError;
use crate::models::task::{TaskLabel, TaskPriority, TaskStatus, UpdateTask};
use crate::repositories::{project_repo, task_repo};

use super::support::{memory_pool, new_task, run, seed_project, seed_task};

#[test]
fn create_applies_defaults_without_label() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;

        let task = task_repo::create(&pool, new_task(&project.id, "First"))
            .await
            .unwrap();

        assert_eq!(task.title, "First");
        assert_eq!(task.task_id.len(), 6);
        // Defaults.
        assert!(matches!(task.status, TaskStatus::Todo));
        assert!(matches!(task.priority, TaskPriority::Low));
        assert_eq!(task.position, 0);
        // No label -> no auto branch.
        assert!(task.label.is_none());
        assert!(task.github_branch.is_none());
        assert_eq!(task.created_at, task.updated_at);
    });
}

#[test]
fn create_with_label_generates_branch_and_keeps_priority() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;

        let mut input = new_task(&project.id, "Branchy");
        input.priority = Some(TaskPriority::High);
        input.label = Some(TaskLabel::Feat);
        let task = task_repo::create(&pool, input).await.unwrap();

        assert!(matches!(task.priority, TaskPriority::High));
        assert!(matches!(task.label, Some(TaskLabel::Feat)));
        assert_eq!(
            task.github_branch.as_deref(),
            Some(&*format!("feat/{}", task.task_id))
        );
    });
}

#[test]
fn create_generates_unique_short_ids() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;

        let a = seed_task(&pool, &project.id).await;
        let b = seed_task(&pool, &project.id).await;
        assert_ne!(a.task_id, b.task_id);
        assert_ne!(a.id, b.id);
    });
}

#[test]
fn get_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = task_repo::get(&pool, "missing").await.unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}

#[test]
fn list_by_project_orders_by_position() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;

        // Insert three tasks, then reorder them via position.
        let t0 = seed_task(&pool, &project.id).await;
        let t1 = seed_task(&pool, &project.id).await;
        let t2 = seed_task(&pool, &project.id).await;

        for (task, pos) in [(&t0, 2), (&t1, 0), (&t2, 1)] {
            task_repo::update(
                &pool,
                &task.id,
                UpdateTask {
                    position: Some(pos),
                    ..Default::default()
                },
            )
            .await
            .unwrap();
        }

        let listed = task_repo::list_by_project(&pool, &project.id).await.unwrap();
        let ordered: Vec<&str> = listed.iter().map(|t| t.id.as_str()).collect();
        assert_eq!(ordered, vec![t1.id.as_str(), t2.id.as_str(), t0.id.as_str()]);
    });
}

#[test]
fn list_by_project_scopes_to_one_project() {
    run(async {
        let pool = memory_pool().await;
        let project_a = seed_project(&pool).await;
        let project_b = seed_project(&pool).await;
        let task_a = seed_task(&pool, &project_a.id).await;
        seed_task(&pool, &project_b.id).await;

        let listed = task_repo::list_by_project(&pool, &project_a.id)
            .await
            .unwrap();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, task_a.id);
    });
}

#[test]
fn update_applies_only_present_fields() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;
        let mut input = new_task(&project.id, "First");
        input.label = Some(TaskLabel::Feat);
        let task = task_repo::create(&pool, input).await.unwrap();

        let updated = task_repo::update(
            &pool,
            &task.id,
            UpdateTask {
                status: Some(TaskStatus::InProgress),
                priority: Some(TaskPriority::Urgent),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        // Changed.
        assert!(matches!(updated.status, TaskStatus::InProgress));
        assert!(matches!(updated.priority, TaskPriority::Urgent));
        // Untouched.
        assert_eq!(updated.title, "First");
        assert!(matches!(updated.label, Some(TaskLabel::Feat)));
    });
}

#[test]
fn update_clears_nullable_label() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;
        let mut input = new_task(&project.id, "Labelled");
        input.label = Some(TaskLabel::Fix);
        let task = task_repo::create(&pool, input).await.unwrap();

        let updated = task_repo::update(
            &pool,
            &task.id,
            UpdateTask {
                label: Some(None),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        assert!(updated.label.is_none());
    });
}

#[test]
fn update_can_reassign_task_to_another_project() {
    run(async {
        let pool = memory_pool().await;
        let project_a = seed_project(&pool).await;
        let project_b = seed_project(&pool).await;
        let task = seed_task(&pool, &project_a.id).await;

        let updated = task_repo::update(
            &pool,
            &task.id,
            UpdateTask {
                project_id: Some(project_b.id.clone()),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        assert_eq!(updated.project_id, project_b.id);
        assert!(task_repo::list_by_project(&pool, &project_a.id)
            .await
            .unwrap()
            .is_empty());
        assert_eq!(
            task_repo::list_by_project(&pool, &project_b.id)
                .await
                .unwrap()
                .len(),
            1
        );
    });
}

#[test]
fn update_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = task_repo::update(&pool, "missing", UpdateTask::default())
            .await
            .unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}

#[test]
fn remove_deletes_task() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;
        let task = seed_task(&pool, &project.id).await;

        task_repo::remove(&pool, &task.id).await.unwrap();

        assert!(task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .is_empty());
    });
}

#[test]
fn remove_missing_is_not_found() {
    run(async {
        let pool = memory_pool().await;
        let err = task_repo::remove(&pool, "missing").await.unwrap_err();
        assert!(matches!(err, AppError::NotFound));
    });
}

#[test]
fn removing_project_cascades_tasks() {
    run(async {
        let pool = memory_pool().await;
        let project = seed_project(&pool).await;
        seed_task(&pool, &project.id).await;

        project_repo::remove(&pool, &project.id).await.unwrap();

        assert!(task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .is_empty());
    });
}
