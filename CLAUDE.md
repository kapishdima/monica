# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Monica is a **local-first desktop app** (Tauri 2 + React 19 + TypeScript) for managing projects and their tasks, with planned git/PR, AI-session, and time-tracking integrations (see `PLAN.md`). All data lives in a per-user SQLite file on the machine — there is no cloud or sync. The frontend is a Vite SPA; the backend is a Rust library (`monica_lib`) exposing Tauri commands.

## Commands

Package manager is **bun** (`bun.lock`); npm scripts also work.

| Task | Command |
|------|---------|
| Run the desktop app (Vite + Rust, hot reload) | `bun run tauri dev` |
| Frontend only (browser, port 1420) | `bun run dev` |
| Type-check + build frontend | `bun run build` |
| Build the installable app | `bun run tauri build` |
| Rust tests (all) | `cd src-tauri && cargo test --lib` |
| A single Rust test | `cd src-tauri && cargo test --lib <name>` (e.g. `update_clears_nullable_label`) |
| One test module | `cd src-tauri && cargo test --lib repositories::tests::task` |

There is no frontend lint/test setup yet.

**Every backend task must ship with a test.** When you add or change repository/command/model behavior, write or update a test for it in `repositories/tests/` (reuse the `support.rs` helpers). A backend change is not done until its test exists and passes.

**Do not run `tauri dev` to verify changes.** It is a long-running, interactive process. Verify backend changes with `cargo test --lib` rather than launching the app.

## Backend architecture (`src-tauri/src/`)

Strictly layered; data flows **command → repository → sqlx → SQLite**. Keep SQL out of the command layer.

- **`lib.rs`** — `run()` builds the Tauri app, opens the DB in `setup` and stores it via `app.manage(db)`, and registers every command in `invoke_handler!`. **A new command is not callable from the frontend until it is added to this `generate_handler!` list.**
- **`db/mod.rs`** — `Db` wraps the `SqlitePool` and is the single piece of Tauri managed state. On startup it resolves the OS app-data dir, opens `monica.db` (WAL, `foreign_keys = ON`, `create_if_missing`), and runs migrations. Commands get it via `State<'_, Db>` and call `db.pool()`.
- **`commands/`** — thin `#[tauri::command]` async fns. They only translate IPC args (`input` / `id` / `patch`) into a repository call. No business logic.
- **`repositories/`** — all SQL lives here as `sqlx::query_as` with `RETURNING *`. `create`/`list`/`get`/`update`/`remove` per entity.
- **`models/`** — three structs per entity: the row (`Project`, `sqlx::FromRow`, serialized `camelCase`), the create input (`NewProject`), and the universal patch (`UpdateProject`). Enums derive `sqlx::Type` with `#[sqlx(rename_all = "snake_case")]` and map to `TEXT` columns with `CHECK` constraints.
- **`error.rs`** — `AppError` (`thiserror` + `Serialize`); `sqlx::Error::RowNotFound` maps to `AppError::NotFound`. Errors serialize to `{ kind, message }` and surface as a rejected promise on the JS side.

### Universal update pattern (important)

Updates are **read-modify-write**, not a command-per-field. `Update*` patches use a nested-Option convention that the whole stack respects:

- field **omitted** (`None`) → leave the column unchanged
- field present as `Some(value)` → set it
- nullable field present as `Some(None)` (i.e. JSON `null`) → clear the column

`repositories::*::update` loads the row via `get` (returning `NotFound` if absent), applies only the present patch fields, bumps `updated_at`, then writes every column back. `id`/`created_at` (and `task_id`) are immutable. Prefer extending the universal patch over adding new single-purpose commands — see the `prefer-universal-crud` memory.

### Entity specifics

- **Task** has a human-friendly `task_id` (6-char `nanoid`, `UNIQUE`) distinct from its UUID `id`. When a `label` is given on create, `github_branch` is auto-generated as `<label>/<task_id>` (e.g. `feat/a1B2c3`). Tasks `ON DELETE CASCADE` with their project. `list_by_project` orders by `position, created_at`.
- Schema lives in `migrations/0001_init.sql`. **Never edit an applied migration** — add a new numbered file; `sqlx::migrate!` runs them at startup and in tests.

### Tests (`repositories/tests/`)

- `support.rs` is the test harness: `memory_pool()` gives a fresh migrated in-memory SQLite DB per test (`max_connections(1)` so the in-memory DB is shared across queries), `run()` blocks on the async body, and `new_project`/`new_task`/`seed_project`/`seed_task` are builders/seeders. Reuse these instead of hand-rolling setup.
- `project.rs` / `task.rs` hold the CRUD tests. Tests assert against the real query layer (RETURNING, enum encode/decode, FK cascade, the universal-update null semantics).

## Frontend architecture (`src/`)

- **IPC boundary — `src/lib/ipc.ts`**: the *only* place that calls `invoke`. It mirrors the Rust models/enums as TS types (`snake_case` enum values, `camelCase` fields — matching the serde renames) and exposes typed `projects` / `tasks` API objects. **When you change a Rust model, command, or enum, update this file to match.**
- **Config-driven routing**: `src/config/menu.tsx` is the single source of truth — each `MenuItem` carries its `url`, `component`, icon, and sidebar `position`. `src/router/index.tsx` generates the React Router routes by mapping over `menu` (all wrapped in `AppLayout`), and the sidebar nav reads the same array. Add a page by adding one `menu` entry, not by touching the router.
- `@/` is aliased to `src/` (Vite + tsconfig). UI is shadcn/ui components in `src/components/ui/` (Tailwind v4); pages live in `src/pages/`.
- **Always use the `shadcn` skill when building or modifying UI** — for adding, searching, composing, styling, or debugging components. This project is shadcn-based (`components.json`); reach for the skill rather than hand-writing components from scratch.
