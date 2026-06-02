//! Reading Claude Code session transcripts off disk.
//!
//! Claude Code writes one `.jsonl` file per session under
//! `~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl`, and stamps a
//! top-level `gitBranch` on nearly every entry. A Monica `Project` has no local
//! repo path, so we cannot map a project to one folder — instead we scan every
//! folder and keep sessions whose branch matches a task's `github_branch`
//! (prefix match, so `feat/a1B2c3` also picks up `feat/a1B2c3_1`).
//!
//! Filesystem layer, kept out of `repositories` (which is SQL-only). Functions
//! take the projects root as an argument so tests can point at a fixture dir
//! without depending on `$HOME`; the command layer resolves the real root.

use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};

use serde::Deserialize;
use serde_json::Value;

use crate::error::{AppError, Result};
use crate::models::claude_code::{ClaudeSession, SessionEvent, SessionTranscript};

const TITLE_MAX: usize = 80;

/// Leading lines to scan when peeking a session's git branch. The branch is
/// stamped on virtually every entry, so the first line almost always has it; the
/// cap bounds work for the rare file that opens with branch-less metadata lines.
const MAX_PEEK_LINES: usize = 40;

/// List every session under `<claude_dir>/projects` that matches `branch_prefix`
/// — by its real `gitBranch` OR by the name it was given via `/rename` — newest
/// first. Missing dirs or garbled lines are tolerated (skipped) rather than fatal.
///
/// Hot path: there can be hundreds of multi-MB transcripts but typically only a
/// couple match a branch. So we cheaply peek each file's branch (and check its
/// name, which needs no read at all) and only fully read the matches — fanned
/// out across threads.
pub fn list_sessions(claude_dir: &Path, branch_prefix: &str) -> Result<Vec<ClaudeSession>> {
    let projects_root = claude_dir.join("projects");
    if !projects_root.exists() {
        return Ok(Vec::new());
    }

    // Session names aren't stored in the transcript — they live in history.jsonl
    // (`/rename` log) and the per-pid sessions/*.json. Resolve them up front,
    // keyed by sessionId, so a session named after the branch is also matched.
    let names = load_session_names(claude_dir);
    let files = collect_session_files(&projects_root)?;
    if files.is_empty() {
        return Ok(Vec::new());
    }

    let names_ref = &names;
    let threads = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
        .clamp(1, 8)
        .min(files.len());

    let mut sessions: Vec<ClaudeSession> = if threads <= 1 {
        process_files(&files, names_ref, branch_prefix)
    } else {
        let chunk_size = files.len().div_ceil(threads);
        std::thread::scope(|scope| {
            let handles: Vec<_> = files
                .chunks(chunk_size)
                .map(|chunk| scope.spawn(move || process_files(chunk, names_ref, branch_prefix)))
                .collect();
            handles
                .into_iter()
                .flat_map(|h| h.join().unwrap_or_default())
                .collect()
        })
    };

    // Newest first. RFC-3339 timestamps sort correctly as strings; sessions
    // without a timestamp sink to the bottom.
    sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(sessions)
}

/// Every `.jsonl` transcript path across all project folders.
fn collect_session_files(projects_root: &Path) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    for project_dir in read_dir_sorted(projects_root)? {
        if !project_dir.is_dir() {
            continue;
        }
        for file in read_dir_sorted(&project_dir)? {
            if file.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                files.push(file);
            }
        }
    }
    Ok(files)
}

/// Keep only the files matching `prefix` (by `/rename` name or git branch) and
/// return their metadata. Runs once per worker thread over a chunk of files.
fn process_files(
    files: &[PathBuf],
    names: &HashMap<String, String>,
    prefix: &str,
) -> Vec<ClaudeSession> {
    let mut out = Vec::new();
    for file in files {
        let session_id = file_stem(file);
        let name = names.get(&session_id).cloned();
        // Cheap pre-filter: a name match needs no file read at all; otherwise
        // peek only the first lines for the branch and skip if it doesn't match.
        if !matches_prefix(name.as_deref(), prefix) {
            let branch = peek_git_branch(file);
            if !matches_prefix(branch.as_deref(), prefix) {
                continue;
            }
        }
        if let Some(mut session) = scan_session_meta(file) {
            // An explicit /rename is the most meaningful title we have.
            if name.is_some() {
                session.title = name;
            }
            out.push(session);
        }
    }
    out
}

fn matches_prefix(value: Option<&str>, prefix: &str) -> bool {
    value.is_some_and(|v| v == prefix || v.starts_with(prefix))
}

/// Read just the leading lines of a transcript to find its `gitBranch`, without
/// loading the whole (potentially multi-MB) file.
fn peek_git_branch(path: &Path) -> Option<String> {
    #[derive(Deserialize)]
    struct BranchPeek {
        #[serde(rename = "gitBranch")]
        git_branch: Option<String>,
    }

    let reader = BufReader::new(File::open(path).ok()?);
    for line in reader.lines().take(MAX_PEEK_LINES).map_while(|l| l.ok()) {
        if let Ok(peek) = serde_json::from_str::<BranchPeek>(&line) {
            if let Some(branch) = peek.git_branch.filter(|b| !b.is_empty()) {
                return Some(branch);
            }
        }
    }
    None
}

/// Map of sessionId → current name. A session is named via the `/rename`
/// command; the name is persisted in two places (neither inside the transcript):
/// `history.jsonl` (an append-only log of every `/rename`, so the *last* entry
/// per session wins) and `sessions/<pid>.json` (the live name, which overrides).
fn load_session_names(claude_dir: &Path) -> HashMap<String, String> {
    #[derive(Deserialize)]
    struct HistoryLine {
        display: Option<String>,
        #[serde(rename = "sessionId")]
        session_id: Option<String>,
    }
    #[derive(Deserialize)]
    struct SessionNameFile {
        #[serde(rename = "sessionId")]
        session_id: Option<String>,
        name: Option<String>,
    }

    let mut names = HashMap::new();

    if let Ok(lines) = read_lines(&claude_dir.join("history.jsonl")) {
        for line in lines {
            let Ok(entry) = serde_json::from_str::<HistoryLine>(&line) else {
                continue;
            };
            let (Some(display), Some(sid)) = (entry.display, entry.session_id) else {
                continue;
            };
            if let Some(name) = display.strip_prefix("/rename ") {
                let name = name.trim();
                if !name.is_empty() {
                    names.insert(sid, name.to_string());
                }
            }
        }
    }

    if let Ok(entries) = std::fs::read_dir(claude_dir.join("sessions")) {
        for path in entries.flatten().map(|e| e.path()) {
            if path.extension().and_then(|e| e.to_str()) != Some("json") {
                continue;
            }
            let Ok(text) = std::fs::read_to_string(&path) else {
                continue;
            };
            let Ok(entry) = serde_json::from_str::<SessionNameFile>(&text) else {
                continue;
            };
            if let (Some(sid), Some(name)) = (entry.session_id, entry.name) {
                if !name.is_empty() {
                    names.insert(sid, name);
                }
            }
        }
    }

    names
}

/// Parse a single session file into its ordered, render-ready events.
/// Rejects any path that isn't a `.jsonl` living under `projects_root`.
pub fn load_session(claude_dir: &Path, path: &Path) -> Result<SessionTranscript> {
    let root = claude_dir
        .join("projects")
        .canonicalize()
        .map_err(|e| AppError::Validation(format!("invalid sessions root: {e}")))?;
    let canonical = path
        .canonicalize()
        .map_err(|e| AppError::Validation(format!("session not found: {e}")))?;
    if !canonical.starts_with(&root)
        || canonical.extension().and_then(|e| e.to_str()) != Some("jsonl")
    {
        return Err(AppError::Validation(
            "path is outside the Claude sessions directory".into(),
        ));
    }

    let session_id = file_stem(&canonical);
    let mut git_branch = None;
    let mut events = Vec::new();

    for line in read_lines(&canonical)? {
        let Ok(entry) = serde_json::from_str::<Value>(&line) else {
            continue; // tolerate the occasional malformed line
        };
        if git_branch.is_none() {
            git_branch = git_branch_of(&entry);
        }
        push_events(&entry, &mut events);
    }

    Ok(SessionTranscript {
        session_id,
        git_branch,
        events,
    })
}

// --- metadata scan (list view) -------------------------------------------------

fn scan_session_meta(path: &Path) -> Option<ClaudeSession> {
    // Typed partial deserialize: serde skips the heavy fields we don't list
    // (`usage`, `snapshot`, tool payloads, …), so we never build a full `Value`
    // DOM per line — only the few metadata fields below are allocated.
    #[derive(Deserialize)]
    struct MetaLine {
        #[serde(rename = "type")]
        kind: Option<String>,
        #[serde(rename = "gitBranch")]
        git_branch: Option<String>,
        timestamp: Option<String>,
        #[serde(default, rename = "isMeta")]
        is_meta: bool,
        #[serde(rename = "aiTitle")]
        ai_title: Option<String>,
        message: Option<MetaMessage>,
    }
    #[derive(Deserialize)]
    struct MetaMessage {
        content: Option<Value>,
    }

    let lines = read_lines(path).ok()?;

    let mut git_branch = None;
    let mut ai_title = None;
    let mut first_user_text = None;
    let mut message_count: u32 = 0;
    let mut started_at: Option<String> = None;
    let mut updated_at: Option<String> = None;

    for line in lines {
        let Ok(entry) = serde_json::from_str::<MetaLine>(&line) else {
            continue;
        };

        if git_branch.is_none() {
            git_branch = entry.git_branch.filter(|b| !b.is_empty());
        }
        if let Some(ts) = entry.timestamp {
            if started_at.is_none() {
                started_at = Some(ts.clone());
            }
            updated_at = Some(ts);
        }

        match entry.kind.as_deref() {
            Some("ai-title") => {
                if ai_title.is_none() {
                    ai_title = entry.ai_title;
                }
            }
            Some("user") if !entry.is_meta => {
                message_count += 1;
                if first_user_text.is_none() {
                    first_user_text = entry.message.and_then(|m| m.content).and_then(user_text);
                }
            }
            Some("assistant") => message_count += 1,
            _ => {}
        }
    }

    let title = ai_title.or_else(|| first_user_text.map(|t| truncate_title(&t)));

    Some(ClaudeSession {
        session_id: file_stem(path),
        path: path.to_string_lossy().into_owned(),
        git_branch,
        title,
        message_count,
        started_at,
        updated_at,
    })
}

// --- event normalization (detail view) -----------------------------------------

fn push_events(entry: &Value, out: &mut Vec<SessionEvent>) {
    let uuid = str_field(entry, "uuid");
    let timestamp = str_field(entry, "timestamp");

    match str_field(entry, "type").as_deref() {
        Some("user") if !is_meta(entry) => {
            let Some(content) = message_content(entry) else {
                return;
            };
            if let Some(text) = content.as_str() {
                if !text.trim().is_empty() {
                    out.push(SessionEvent::UserText {
                        uuid,
                        timestamp,
                        text: text.to_string(),
                    });
                }
                return;
            }
            if let Some(blocks) = content.as_array() {
                for block in blocks {
                    match str_field(block, "type").as_deref() {
                        Some("text") => {
                            if let Some(text) = str_field(block, "text") {
                                out.push(SessionEvent::UserText {
                                    uuid: uuid.clone(),
                                    timestamp: timestamp.clone(),
                                    text,
                                });
                            }
                        }
                        Some("tool_result") => out.push(SessionEvent::ToolResult {
                            uuid: uuid.clone(),
                            timestamp: timestamp.clone(),
                            tool_use_id: str_field(block, "tool_use_id"),
                            content: flatten_text(block.get("content")),
                            is_error: block
                                .get("is_error")
                                .and_then(Value::as_bool)
                                .unwrap_or(false),
                        }),
                        _ => {}
                    }
                }
            }
        }
        Some("assistant") => {
            let model = entry
                .get("message")
                .and_then(|m| str_field(m, "model"));
            let Some(blocks) = message_content(entry).and_then(|c| c.as_array().cloned()) else {
                return;
            };
            for block in &blocks {
                match str_field(block, "type").as_deref() {
                    Some("text") => {
                        if let Some(text) = str_field(block, "text") {
                            out.push(SessionEvent::Assistant {
                                uuid: uuid.clone(),
                                timestamp: timestamp.clone(),
                                text,
                                model: model.clone(),
                            });
                        }
                    }
                    Some("thinking") => {
                        if let Some(text) = str_field(block, "thinking") {
                            out.push(SessionEvent::Thinking {
                                uuid: uuid.clone(),
                                timestamp: timestamp.clone(),
                                text,
                            });
                        }
                    }
                    Some("tool_use") => out.push(SessionEvent::ToolUse {
                        uuid: uuid.clone(),
                        timestamp: timestamp.clone(),
                        id: str_field(block, "id"),
                        name: str_field(block, "name").unwrap_or_default(),
                        input: block.get("input").cloned().unwrap_or(Value::Null),
                    }),
                    _ => {}
                }
            }
        }
        Some("system") => out.push(SessionEvent::System {
            uuid,
            timestamp,
            subtype: str_field(entry, "subtype"),
            content: flatten_text(entry.get("content")),
            level: str_field(entry, "level"),
        }),
        _ => {} // file-history-snapshot, attachment, mode, ai-title, … are noise
    }
}

// --- helpers -------------------------------------------------------------------

/// Directory children as paths, sorted for deterministic output.
fn read_dir_sorted(dir: &Path) -> Result<Vec<std::path::PathBuf>> {
    let mut paths: Vec<_> = std::fs::read_dir(dir)?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .collect();
    paths.sort();
    Ok(paths)
}

fn read_lines(path: &Path) -> Result<Vec<String>> {
    let content = std::fs::read_to_string(path)?;
    Ok(content.lines().map(str::to_string).collect())
}

fn file_stem(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_string()
}

fn str_field(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(Value::as_str).map(str::to_string)
}

fn git_branch_of(entry: &Value) -> Option<String> {
    str_field(entry, "gitBranch").filter(|b| !b.is_empty())
}

fn is_meta(entry: &Value) -> bool {
    entry.get("isMeta").and_then(Value::as_bool).unwrap_or(false)
}

fn message_content(entry: &Value) -> Option<Value> {
    entry.get("message").and_then(|m| m.get("content")).cloned()
}

/// The user-visible prompt text of a `user` message: a bare string, or the
/// concatenated `text` blocks. Returns `None` for tool-result-only turns.
fn user_text(content: Value) -> Option<String> {
    if let Some(s) = content.as_str() {
        let s = s.trim();
        return (!s.is_empty()).then(|| s.to_string());
    }
    if let Some(blocks) = content.as_array() {
        let joined = blocks
            .iter()
            .filter(|b| str_field(b, "type").as_deref() == Some("text"))
            .filter_map(|b| str_field(b, "text"))
            .collect::<Vec<_>>()
            .join("\n");
        let joined = joined.trim();
        return (!joined.is_empty()).then(|| joined.to_string());
    }
    None
}

/// Flatten a `content` value (string, or array of `{type:"text", text}` blocks)
/// into plain text. Used for tool results and system entries.
fn flatten_text(content: Option<&Value>) -> String {
    match content {
        Some(Value::String(s)) => s.clone(),
        Some(Value::Array(blocks)) => blocks
            .iter()
            .filter_map(|b| str_field(b, "text"))
            .collect::<Vec<_>>()
            .join("\n"),
        _ => String::new(),
    }
}

fn truncate_title(text: &str) -> String {
    let line = text.lines().next().unwrap_or("").trim();
    if line.chars().count() <= TITLE_MAX {
        return line.to_string();
    }
    let truncated: String = line.chars().take(TITLE_MAX).collect();
    format!("{truncated}…")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    /// Write `lines` (each a JSON value) as a `.jsonl` session file under
    /// `root/<project>/<session>.jsonl` and return its path.
    fn write_session(root: &Path, project: &str, session: &str, lines: &[Value]) -> PathBuf {
        let dir = root.join("projects").join(project);
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join(format!("{session}.jsonl"));
        let body = lines
            .iter()
            .map(|l| l.to_string())
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(&path, body).unwrap();
        path
    }

    /// Write `~/.claude/history.jsonl` (the `/rename` log) for the fixture root.
    fn write_history(root: &Path, lines: &[Value]) {
        let body = lines
            .iter()
            .map(|l| l.to_string())
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(root.join("history.jsonl"), body).unwrap();
    }

    fn fixture() -> (tempfile::TempDir, PathBuf) {
        let tmp = tempfile::tempdir().unwrap();
        let root = tmp.path().to_path_buf();

        // Session A — exact branch, full mix of entry types + noise.
        write_session(
            &root,
            "proj1",
            "aaaa1111",
            &[
                serde_json::json!({
                    "type": "user",
                    "message": {"role": "user", "content": "Hello world"},
                    "uuid": "u1", "timestamp": "2026-06-01T10:00:00Z",
                    "gitBranch": "feat/a1B2c3"
                }),
                serde_json::json!({
                    "type": "assistant",
                    "message": {"model": "claude-opus-4-8", "content": [
                        {"type": "thinking", "thinking": "hmm"},
                        {"type": "text", "text": "Hi there"},
                        {"type": "tool_use", "id": "t1", "name": "Read", "input": {"file": "x"}}
                    ]},
                    "uuid": "a1", "timestamp": "2026-06-01T10:00:05Z",
                    "gitBranch": "feat/a1B2c3"
                }),
                serde_json::json!({
                    "type": "user",
                    "message": {"role": "user", "content": [
                        {"type": "tool_result", "tool_use_id": "t1", "content": "file contents", "is_error": false}
                    ]},
                    "uuid": "u2", "timestamp": "2026-06-01T10:00:06Z",
                    "gitBranch": "feat/a1B2c3"
                }),
                serde_json::json!({"type": "ai-title", "aiTitle": "My session title", "sessionId": "aaaa1111"}),
                serde_json::json!({"type": "file-history-snapshot", "messageId": "x", "snapshot": {}}),
            ],
        );

        // Session B — prefixed branch, should match.
        write_session(
            &root,
            "proj1",
            "bbbb2222",
            &[serde_json::json!({
                "type": "user",
                "message": {"role": "user", "content": "second branch"},
                "uuid": "u1", "timestamp": "2026-06-02T09:00:00Z",
                "gitBranch": "feat/a1B2c3_1"
            })],
        );

        // Session C — unrelated branch, must be excluded.
        write_session(
            &root,
            "proj2",
            "cccc3333",
            &[serde_json::json!({
                "type": "user",
                "message": {"role": "user", "content": "nope"},
                "uuid": "u1", "timestamp": "2026-06-03T09:00:00Z",
                "gitBranch": "other/zzz"
            })],
        );

        // Session D — its real branch is `feat/cc` (no match), but it was renamed
        // to `feat/NGo9DE` via /rename, so it must match that branch by name.
        write_session(
            &root,
            "proj3",
            "renamed1",
            &[serde_json::json!({
                "type": "user",
                "message": {"role": "user", "content": "do the thing"},
                "uuid": "u1", "timestamp": "2026-06-04T09:00:00Z",
                "gitBranch": "feat/cc"
            })],
        );
        // history.jsonl records every /rename; the last one for a session wins.
        write_history(
            &root,
            &[
                serde_json::json!({"display": "/rename feat/NGo9DE_001", "sessionId": "renamed1", "timestamp": 1}),
                serde_json::json!({"display": "/rename feat/NGo9DE", "sessionId": "renamed1", "timestamp": 2}),
            ],
        );

        (tmp, root)
    }

    #[test]
    fn lists_only_branch_matches_newest_first() {
        let (_tmp, root) = fixture();
        let sessions = list_sessions(&root, "feat/a1B2c3").unwrap();

        let ids: Vec<_> = sessions.iter().map(|s| s.session_id.as_str()).collect();
        // B (2026-06-02) is newer than A (2026-06-01); C is excluded.
        assert_eq!(ids, vec!["bbbb2222", "aaaa1111"]);
    }

    #[test]
    fn title_prefers_ai_title_and_counts_turns() {
        let (_tmp, root) = fixture();
        let sessions = list_sessions(&root, "feat/a1B2c3").unwrap();
        let a = sessions.iter().find(|s| s.session_id == "aaaa1111").unwrap();

        assert_eq!(a.title.as_deref(), Some("My session title"));
        assert_eq!(a.git_branch.as_deref(), Some("feat/a1B2c3"));
        // two user entries + one assistant entry; ai-title/snapshot don't count.
        assert_eq!(a.message_count, 3);
        assert_eq!(a.started_at.as_deref(), Some("2026-06-01T10:00:00Z"));
        assert_eq!(a.updated_at.as_deref(), Some("2026-06-01T10:00:06Z"));
    }

    #[test]
    fn title_falls_back_to_first_prompt() {
        let (_tmp, root) = fixture();
        let sessions = list_sessions(&root, "feat/a1B2c3_1").unwrap();
        let b = &sessions[0];
        assert_eq!(b.title.as_deref(), Some("second branch"));
    }

    #[test]
    fn matches_by_renamed_session_name() {
        let (_tmp, root) = fixture();
        let sessions = list_sessions(&root, "feat/NGo9DE").unwrap();

        let session = sessions
            .iter()
            .find(|s| s.session_id == "renamed1")
            .expect("renamed session should match by its /rename name");
        // Real branch is feat/cc, but the latest /rename name is used as title.
        assert_eq!(session.git_branch.as_deref(), Some("feat/cc"));
        assert_eq!(session.title.as_deref(), Some("feat/NGo9DE"));
    }

    #[test]
    fn loads_normalized_events_and_drops_noise() {
        let (_tmp, root) = fixture();
        let path = root.join("projects").join("proj1").join("aaaa1111.jsonl");
        let transcript = load_session(&root, &path).unwrap();

        assert_eq!(transcript.git_branch.as_deref(), Some("feat/a1B2c3"));
        let kinds: Vec<_> = transcript
            .events
            .iter()
            .map(|e| match e {
                SessionEvent::UserText { .. } => "user",
                SessionEvent::Assistant { .. } => "assistant",
                SessionEvent::Thinking { .. } => "thinking",
                SessionEvent::ToolUse { .. } => "toolUse",
                SessionEvent::ToolResult { .. } => "toolResult",
                SessionEvent::System { .. } => "system",
            })
            .collect();
        // ai-title and file-history-snapshot are dropped.
        assert_eq!(
            kinds,
            vec!["user", "thinking", "assistant", "toolUse", "toolResult"]
        );

        match &transcript.events[4] {
            SessionEvent::ToolResult { content, is_error, tool_use_id, .. } => {
                assert_eq!(content, "file contents");
                assert!(!is_error);
                assert_eq!(tool_use_id.as_deref(), Some("t1"));
            }
            other => panic!("expected tool result, got {other:?}"),
        }
    }

    #[test]
    fn rejects_path_outside_root() {
        let (_tmp, root) = fixture();
        let outside = tempfile::tempdir().unwrap();
        let stray = outside.path().join("evil.jsonl");
        fs::write(&stray, "{}").unwrap();

        let err = load_session(&root, &stray).unwrap_err();
        assert!(matches!(err, AppError::Validation(_)));
    }
}
