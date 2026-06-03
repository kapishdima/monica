//! Tests for the Linear CSV import (append semantics, mapping, timestamps).

use crate::models::task::{TaskLabel, TaskPriority, TaskStatus};
use crate::repositories::import_repo::import_linear_csv;
use crate::repositories::tests::support::{memory_pool, new_project, run};
use crate::repositories::{project_repo, task_repo};

const HEADER: &str = "Project,Title,Description,Status,Priority,Labels,Created,Updated,Due Date";

#[test]
fn imports_projects_and_tasks_with_summary() {
    run(async {
        let pool = memory_pool().await;
        let csv = format!(
            "{HEADER}\n\
             Alpha,First task,A description,Todo,High,Feature,,,\n\
             Alpha,Second task,,In Progress,Urgent,Bug,,,\n\
             Beta,Third task,,Backlog,Low,,,,"
        );

        let summary = import_linear_csv(&pool, &csv).await.unwrap();
        assert_eq!(summary.projects_created, 2);
        assert_eq!(summary.projects_reused, 0);
        assert_eq!(summary.tasks_imported, 3);
        assert_eq!(summary.skipped_canceled, 0);
        assert_eq!(summary.skipped_no_project, 0);

        let projects = project_repo::list(&pool).await.unwrap();
        assert_eq!(projects.len(), 2);
        let alpha = projects.iter().find(|p| p.name == "Alpha").unwrap();
        let alpha_tasks = task_repo::list_by_project(&pool, &alpha.id).await.unwrap();
        assert_eq!(alpha_tasks.len(), 2);
        // Position is per-project and ordered by insertion.
        assert_eq!(alpha_tasks[0].title, "First task");
        assert_eq!(alpha_tasks[0].position, 0);
        assert_eq!(alpha_tasks[1].position, 1);
        assert_eq!(alpha_tasks[0].description.as_deref(), Some("A description"));
    });
}

#[test]
fn skips_canceled_and_no_project_rows() {
    run(async {
        let pool = memory_pool().await;
        let csv = format!(
            "{HEADER}\n\
             Alpha,Kept,,Todo,Low,,,,\n\
             Alpha,Dropped,,Canceled,Low,,,,\n\
             ,Orphan,,Todo,Low,,,,"
        );

        let summary = import_linear_csv(&pool, &csv).await.unwrap();
        assert_eq!(summary.tasks_imported, 1);
        assert_eq!(summary.skipped_canceled, 1);
        assert_eq!(summary.skipped_no_project, 1);
        assert_eq!(summary.projects_created, 1);
    });
}

#[test]
fn maps_status_priority_and_label() {
    run(async {
        let pool = memory_pool().await;
        let csv = format!(
            "{HEADER}\n\
             Alpha,Feature task,,In Progress,Medium,Feature,,,\n\
             Alpha,Plain task,,Done,Urgent,Improvement,,,"
        );

        import_linear_csv(&pool, &csv).await.unwrap();
        let project = project_repo::list(&pool).await.unwrap().pop().unwrap();
        let tasks = task_repo::list_by_project(&pool, &project.id).await.unwrap();

        let feature = tasks.iter().find(|t| t.title == "Feature task").unwrap();
        assert!(matches!(feature.status, TaskStatus::InProgress));
        // Linear "Medium" has no Monica equivalent -> Low.
        assert!(matches!(feature.priority, TaskPriority::Low));
        assert!(matches!(feature.label, Some(TaskLabel::Feat)));
        // Labelled tasks get a `feat/<task_id>` branch.
        assert_eq!(
            feature.github_branch.as_deref(),
            Some(format!("feat/{}", feature.task_id).as_str())
        );

        let plain = tasks.iter().find(|t| t.title == "Plain task").unwrap();
        assert!(matches!(plain.status, TaskStatus::Done));
        assert!(matches!(plain.priority, TaskPriority::Urgent));
        // Non-"Feature" labels map to none -> no branch.
        assert!(plain.label.is_none());
        assert!(plain.github_branch.is_none());
    });
}

#[test]
fn preserves_original_timestamps() {
    run(async {
        let pool = memory_pool().await;
        let csv = format!(
            "{HEADER}\n\
             Alpha,Timed,,Todo,Low,,Wed Oct 15 2025 09:33:28 GMT+0000 (Coordinated Universal Time),Thu Oct 16 2025 10:00:00 GMT+0000 (Coordinated Universal Time),"
        );

        import_linear_csv(&pool, &csv).await.unwrap();
        let project = project_repo::list(&pool).await.unwrap().pop().unwrap();
        let task = task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .pop()
            .unwrap();

        assert_eq!(task.created_at, "2025-10-15T09:33:28Z");
        assert_eq!(task.updated_at, "2025-10-16T10:00:00Z");
    });
}

#[test]
fn reuses_existing_project_by_name() {
    run(async {
        let pool = memory_pool().await;
        let existing = project_repo::create(&pool, new_project("Existing"))
            .await
            .unwrap();

        let csv = format!(
            "{HEADER}\n\
             Existing,Attached,,Todo,Low,,,,"
        );
        let summary = import_linear_csv(&pool, &csv).await.unwrap();

        assert_eq!(summary.projects_created, 0);
        assert_eq!(summary.projects_reused, 1);
        // No duplicate project, and the task attaches to the existing one.
        assert_eq!(project_repo::list(&pool).await.unwrap().len(), 1);
        let tasks = task_repo::list_by_project(&pool, &existing.id).await.unwrap();
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].title, "Attached");
    });
}

#[test]
fn parses_quoted_fields_with_commas_and_newlines() {
    run(async {
        let pool = memory_pool().await;
        // Title with a comma, description with an embedded newline, both quoted.
        let csv = format!(
            "{HEADER}\n\
             Alpha,\"Fix bug, urgently\",\"line one\nline two\",Todo,Low,,,,"
        );

        import_linear_csv(&pool, &csv).await.unwrap();
        let project = project_repo::list(&pool).await.unwrap().pop().unwrap();
        let task = task_repo::list_by_project(&pool, &project.id)
            .await
            .unwrap()
            .pop()
            .unwrap();

        assert_eq!(task.title, "Fix bug, urgently");
        assert_eq!(task.description.as_deref(), Some("line one\nline two"));
    });
}
