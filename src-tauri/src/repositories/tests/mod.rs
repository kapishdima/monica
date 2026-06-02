//! Repository test suite.
//!
//! Exercises the real query layer (RETURNING, enum encode/decode, universal
//! update read-modify-write, remove, FK cascade) against an in-memory SQLite DB.
//! Shared fixtures live in [`support`]; per-entity tests in [`project`]/[`task`].

mod support;

mod daily_plan;
mod project;
mod settings;
mod task;
