//! Render-ready views of Claude Code session transcripts (`~/.claude/projects`).
//!
//! These are plain serde structs — they never touch the DB. The on-disk format
//! is a `.jsonl` file per session where each line is one entry; `claude_code.rs`
//! parses those raw lines into the normalized shapes below.

use serde::Serialize;

/// A session as it appears in the list rail: just enough to render a row and to
/// re-open the full transcript via its `path`.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeSession {
    /// The session UUID (the `.jsonl` file stem).
    pub session_id: String,
    /// Absolute path to the `.jsonl`, passed back to `get_task_session`.
    pub path: String,
    pub git_branch: Option<String>,
    pub title: Option<String>,
    /// Count of user + assistant turns (meta/system entries excluded).
    pub message_count: u32,
    /// ISO-8601 timestamp of the first / last entry that carries one.
    pub started_at: Option<String>,
    pub updated_at: Option<String>,
}

/// A fully parsed transcript: the ordered, render-ready events of one session.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionTranscript {
    pub session_id: String,
    pub git_branch: Option<String>,
    pub events: Vec<SessionEvent>,
}

/// One normalized entry in a transcript. Serializes as a discriminated union
/// (`{ "kind": "assistant", ... }`) so the frontend can switch on `kind`.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum SessionEvent {
    UserText {
        uuid: Option<String>,
        timestamp: Option<String>,
        text: String,
    },
    Assistant {
        uuid: Option<String>,
        timestamp: Option<String>,
        text: String,
        model: Option<String>,
    },
    Thinking {
        uuid: Option<String>,
        timestamp: Option<String>,
        text: String,
    },
    ToolUse {
        uuid: Option<String>,
        timestamp: Option<String>,
        id: Option<String>,
        name: String,
        input: serde_json::Value,
    },
    ToolResult {
        uuid: Option<String>,
        timestamp: Option<String>,
        tool_use_id: Option<String>,
        content: String,
        is_error: bool,
    },
    System {
        uuid: Option<String>,
        timestamp: Option<String>,
        subtype: Option<String>,
        content: String,
        level: Option<String>,
    },
}
