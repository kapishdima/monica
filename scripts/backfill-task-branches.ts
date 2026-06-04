/**
 * Backfill (or regenerate) `github_branch` for tasks in Monica's local SQLite DB.
 *
 * Usage:
 *   bun run scripts/backfill-task-branches.ts [db] [--dry-run] [--all]
 *
 *   db          path to monica.db (default: macOS app-data path)
 *   --dry-run   print what would change WITHOUT touching the DB
 *   --all       regenerate the branch for EVERY task (default: only tasks
 *               whose github_branch is NULL or empty)
 *
 * The branch is generated exactly as task_repo::create does it:
 *   `<prefix>/<task_id>` where prefix = the task's label (feat/fix/refactor/
 *   chore) or `feat` when the label is null. The same rule the
 *   0004_backfill_task_branches migration applies at app startup — this script
 *   just lets you run it on demand (e.g. without restarting the app), and can
 *   force-regenerate all branches with --all.
 *
 * NOTE: close the Monica app before a real run so the WAL is flushed and the
 * file isn't locked. Back up monica.db first if you pass --all.
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const all = argv.includes("--all");
const positional = argv.filter((a) => !a.startsWith("--"));

const dbPath =
  positional[0] ??
  join(
    homedir(),
    "Library",
    "Application Support",
    "com.kapishdima.monica",
    "monica.db",
  );

// ---------------------------------------------------------------------------
// Read the tasks that need a branch
// ---------------------------------------------------------------------------

interface TaskRow {
  id: string;
  task_id: string;
  title: string;
  label: string | null;
  github_branch: string | null;
}

// Same rule as task_repo::create / migration 0004.
function branchFor(task: TaskRow): string {
  return `${task.label ?? "feat"}/${task.task_id}`;
}

const db = new Database(dbPath, { create: false, readwrite: true });

// Without --all, only touch tasks that have no branch yet.
const where = all ? "" : "WHERE github_branch IS NULL OR github_branch = ''";
const candidates = db
  .query<TaskRow, []>(
    `SELECT id, task_id, title, label, github_branch FROM tasks ${where} ORDER BY created_at`,
  )
  .all();

const changes = candidates
  .map((task) => ({ task, next: branchFor(task) }))
  .filter(({ task, next }) => task.github_branch !== next);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nBackfill task branches`);
console.log(`  DB:    ${dbPath}`);
console.log(`  Scope: ${all ? "ALL tasks (regenerate)" : "tasks missing a branch"}`);
console.log(`  Mode:  ${dryRun ? "DRY RUN (no writes)" : "APPLY"}`);
console.log(`  Tasks to update: ${changes.length} of ${candidates.length} scanned\n`);

for (const { task, next } of changes) {
  const from = task.github_branch ? `${task.github_branch} → ` : "";
  console.log(`  ${task.task_id}  ${from}${next}  (${task.title})`);
}
console.log("");

if (changes.length === 0) {
  console.log("Nothing to do — every task already has the expected branch.\n");
  db.close();
  process.exit(0);
}

if (dryRun) {
  console.log("Dry run complete — no changes written. Re-run without --dry-run to apply.\n");
  db.close();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Apply — bump updated_at alongside the branch, matching the update path.
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const updateBranch = db.prepare(
  "UPDATE tasks SET github_branch = $branch, updated_at = $now WHERE id = $id",
);

const apply = db.transaction(() => {
  for (const { task, next } of changes) {
    updateBranch.run({ $branch: next, $now: now, $id: task.id });
  }
});

apply();
db.close();

console.log(`Updated ${changes.length} task branch(es) in ${dbPath}\n`);
