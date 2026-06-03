//! Linear CSV import (append, non-destructive).
//!
//! Ported from `scripts/import-linear.ts`: parse a Linear issue export, map its
//! status/priority/labels to Monica's enums, preserve the original created/updated/
//! due timestamps, and insert projects + tasks. Unlike the script (a full DB reset),
//! this appends — existing projects are reused by name, nothing is deleted.

use std::collections::{HashMap, HashSet};

use nanoid::nanoid;
use sqlx::SqlitePool;
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::error::Result;
use crate::models::import::ImportSummary;
use crate::models::now_timestamp;
use crate::models::task::{TaskLabel, TaskPriority, TaskStatus};

/// Parse a Linear CSV export and append its projects/tasks to the database.
pub async fn import_linear_csv(pool: &SqlitePool, csv: &str) -> Result<ImportSummary> {
    let records = to_records(parse_csv(csv));
    let mut summary = ImportSummary::default();

    let mut tx = pool.begin().await?;

    // Resolve each distinct project name to an id, reusing an existing row when
    // the name already exists so repeated imports don't create duplicates.
    let mut project_ids: HashMap<String, String> = HashMap::new();
    for rec in &records {
        let name = rec.get("Project").map(|s| s.trim()).unwrap_or("");
        if name.is_empty() || project_ids.contains_key(name) {
            continue;
        }

        let existing: Option<(String,)> = sqlx::query_as("SELECT id FROM projects WHERE name = ?")
            .bind(name)
            .fetch_optional(&mut *tx)
            .await?;

        let id = if let Some((id,)) = existing {
            summary.projects_reused += 1;
            id
        } else {
            let id = Uuid::new_v4().to_string();
            let now = now_timestamp();
            sqlx::query(
                "INSERT INTO projects (id, name, status, created_at, updated_at)
                 VALUES (?, ?, 'active', ?, ?)",
            )
            .bind(&id)
            .bind(name)
            .bind(&now)
            .bind(&now)
            .execute(&mut *tx)
            .await?;
            summary.projects_created += 1;
            id
        };
        project_ids.insert(name.to_string(), id);
    }

    let mut used_task_ids: HashSet<String> = HashSet::new();
    let mut position_by_project: HashMap<String, i64> = HashMap::new();

    for rec in &records {
        let project_name = rec.get("Project").map(|s| s.trim()).unwrap_or("");
        if project_name.is_empty() {
            summary.skipped_no_project += 1;
            continue;
        }
        let status = match map_status(rec.get("Status").map(String::as_str).unwrap_or("")) {
            Some(s) => s,
            None => {
                summary.skipped_canceled += 1;
                continue;
            }
        };

        let project_id = project_ids
            .get(project_name)
            .expect("project id resolved in first pass")
            .clone();

        let task_id = unique_task_id(&mut used_task_ids);
        let label = map_label(rec.get("Labels").map(String::as_str).unwrap_or(""));
        let priority = map_priority(rec.get("Priority").map(String::as_str).unwrap_or(""));
        // Branch only when labelled, matching the script (differs from
        // task_repo::create, which always defaults to `feat/<id>`).
        let github_branch = label.map(|l| format!("{}/{}", l.as_str(), task_id));

        let now = now_timestamp();
        let created_at = parse_ts(rec.get("Created").map(String::as_str).unwrap_or("")).unwrap_or(now);
        let updated_at =
            parse_ts(rec.get("Updated").map(String::as_str).unwrap_or("")).unwrap_or_else(|| created_at.clone());
        let planned_for = parse_ts(rec.get("Due Date").map(String::as_str).unwrap_or(""));

        let position = position_by_project.entry(project_id.clone()).or_insert(0);
        let title = rec.get("Title").map(|s| s.trim()).unwrap_or("").to_string();
        let description = rec
            .get("Description")
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        sqlx::query(
            "INSERT INTO tasks
                (id, task_id, project_id, title, description, status, priority, label, github_branch, position, planned_for, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&task_id)
        .bind(&project_id)
        .bind(&title)
        .bind(&description)
        .bind(status)
        .bind(priority)
        .bind(label)
        .bind(&github_branch)
        .bind(*position)
        .bind(&planned_for)
        .bind(&created_at)
        .bind(&updated_at)
        .execute(&mut *tx)
        .await?;

        *position += 1;
        summary.tasks_imported += 1;
    }

    tx.commit().await?;
    Ok(summary)
}

fn unique_task_id(used: &mut HashSet<String>) -> String {
    // 6-char nanoid, matching task_repo::create. Collisions are astronomically
    // unlikely; the in-run set guards against duplicates within one import.
    loop {
        let id = nanoid!(6);
        if used.insert(id.clone()) {
            return id;
        }
    }
}

// ---------------------------------------------------------------------------
// CSV parser (RFC 4180: quoted fields, embedded newlines, "" escapes)
// ---------------------------------------------------------------------------

fn parse_csv(text: &str) -> Vec<Vec<String>> {
    let mut rows: Vec<Vec<String>> = Vec::new();
    let mut row: Vec<String> = Vec::new();
    let mut field = String::new();
    let mut in_quotes = false;

    // Normalise CRLF/CR -> LF so embedded newlines are predictable.
    let s: Vec<char> = text.replace("\r\n", "\n").replace('\r', "\n").chars().collect();
    let mut i = 0;
    while i < s.len() {
        let c = s[i];
        if in_quotes {
            if c == '"' {
                if s.get(i + 1) == Some(&'"') {
                    field.push('"');
                    i += 2;
                } else {
                    in_quotes = false;
                    i += 1;
                }
            } else {
                field.push(c);
                i += 1;
            }
        } else if c == '"' {
            in_quotes = true;
            i += 1;
        } else if c == ',' {
            row.push(std::mem::take(&mut field));
            i += 1;
        } else if c == '\n' {
            row.push(std::mem::take(&mut field));
            rows.push(std::mem::take(&mut row));
            i += 1;
        } else {
            field.push(c);
            i += 1;
        }
    }
    // Flush trailing field/row (file may not end with a newline).
    if !field.is_empty() || !row.is_empty() {
        row.push(field);
        rows.push(row);
    }
    rows
}

/// Map rows to header-keyed records (first row is the header).
fn to_records(rows: Vec<Vec<String>>) -> Vec<HashMap<String, String>> {
    let mut iter = rows.into_iter();
    let Some(header) = iter.next() else {
        return Vec::new();
    };
    iter.map(|cols| {
        header
            .iter()
            .enumerate()
            .map(|(idx, h)| (h.clone(), cols.get(idx).cloned().unwrap_or_default()))
            .collect()
    })
    .collect()
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/// Returns the Monica status, or `None` to skip the row (Canceled).
fn map_status(linear: &str) -> Option<TaskStatus> {
    match linear.trim() {
        "Backlog" => Some(TaskStatus::Backlog),
        "Todo" => Some(TaskStatus::Todo),
        "In Progress" => Some(TaskStatus::InProgress),
        "Done" => Some(TaskStatus::Done),
        "Canceled" => None,        // skipped per import decision
        _ => Some(TaskStatus::Backlog), // unknown -> safest bucket
    }
}

fn map_priority(linear: &str) -> TaskPriority {
    match linear.trim() {
        "Urgent" => TaskPriority::Urgent,
        "High" => TaskPriority::High,
        // "Low", "Medium" (no Monica equivalent), "No priority", "" -> low.
        _ => TaskPriority::Low,
    }
}

/// Linear labels are version tags; only "Feature" maps to a Monica label.
fn map_label(linear: &str) -> Option<TaskLabel> {
    linear
        .split(',')
        .map(str::trim)
        .any(|l| l == "Feature")
        .then_some(TaskLabel::Feat)
}

/// Linear ts `Wed Oct 15 2025 09:33:28 GMT+0000 (...)` -> RFC 3339, or `None`.
fn parse_ts(linear: &str) -> Option<String> {
    let t = linear.trim();
    if t.is_empty() {
        return None;
    }
    // Drop the trailing ` (Coordinated Universal Time)` annotation if present.
    let core = t.split(" (").next().unwrap_or(t).trim();
    let fmt = format_description!(
        "[weekday repr:short] [month repr:short] [day] [year] [hour]:[minute]:[second] GMT[offset_hour sign:mandatory][offset_minute]"
    );
    OffsetDateTime::parse(core, &fmt)
        .ok()
        .and_then(|dt| dt.format(&Rfc3339).ok())
}
