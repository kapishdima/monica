//! Commands for reading Claude Code session transcripts. No DB — these resolve
//! the on-disk `~/.claude/projects` tree and delegate to `crate::claude_code`.

use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::claude_code;
use crate::error::{AppError, Result};
use crate::models::claude_code::{ClaudeSession, SessionTranscript};

/// `~/.claude` — holds `projects/` (per-session `.jsonl`), `history.jsonl` (the
/// `/rename` log) and `sessions/` (live session names).
fn claude_dir(app: &AppHandle) -> Result<PathBuf> {
    let home = app
        .path()
        .home_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    Ok(home.join(".claude"))
}

/// All Claude Code sessions matching `branch` (prefix) — by real git branch or
/// by the name set via `/rename` — newest first. A blank branch yields nothing.
#[tauri::command]
pub async fn list_task_sessions(app: AppHandle, branch: String) -> Result<Vec<ClaudeSession>> {
    if branch.trim().is_empty() {
        return Ok(Vec::new());
    }
    let dir = claude_dir(&app)?;
    claude_code::list_sessions(&dir, &branch)
}

/// The fully parsed transcript for one session, identified by its file `path`
/// (as returned in a `ClaudeSession`). The path is validated against the root.
#[tauri::command]
pub async fn get_task_session(app: AppHandle, path: String) -> Result<SessionTranscript> {
    let dir = claude_dir(&app)?;
    claude_code::load_session(&dir, &PathBuf::from(path))
}
