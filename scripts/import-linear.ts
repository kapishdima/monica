/**
 * Import a Linear CSV export into Monica's local SQLite database.
 *
 * Usage:
 *   bun run scripts/import-linear.ts [csv] [db] [--dry-run]
 *
 *   csv  path to the Linear export (default: public/linear-dump.csv)
 *   db   path to monica.db (default: macOS app-data path)
 *   --dry-run   transform and print the summary WITHOUT touching the DB
 *
 * Each run FULLY RESETS the database: every table is dropped, the schema is
 * rebuilt by replaying this branch's migration files (re-recording them in
 * _sqlx_migrations with the same sha384 checksums sqlx uses), then the
 * transformed Linear data is inserted. This makes the import idempotent and
 * also clears any stale migration drift (e.g. a planner migration applied on
 * another branch) that would otherwise make the Tauri app panic on startup.
 *
 * Writing directly to the SQLite file (via bun:sqlite) also lets us preserve
 * the original Linear status and created/updated timestamps — something the
 * Tauri IPC layer cannot do (create_task always forces status=todo and fresh
 * timestamps).
 *
 * IMPORTANT: this WIPES all existing data. Back up monica.db and close the app
 * before a real run.
 */

import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const positional = argv.filter((a) => !a.startsWith("--"));

const csvPath = positional[0] ?? "public/linear-dump.csv";
const dbPath =
  positional[1] ??
  join(
    homedir(),
    "Library",
    "Application Support",
    "com.dev_wandry.monica",
    "monica.db",
  );

// ---------------------------------------------------------------------------
// Migrations — read this branch's migration files so we can rebuild the schema
// and re-record them in _sqlx_migrations exactly as sqlx 0.8 does.
// ---------------------------------------------------------------------------

interface Migration {
  version: number;
  description: string;
  sql: string;
  checksum: Uint8Array; // sha384(sql bytes) — verified to match sqlx's value
}

const MIGRATIONS_DIR = join(import.meta.dir, "..", "src-tauri", "migrations");

function loadMigrations(): Migration[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) throw new Error(`Unexpected migration filename: ${file}`);
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      return {
        version: Number(match[1]),
        description: match[2].replace(/_/g, " "),
        sql,
        checksum: new Uint8Array(createHash("sha384").update(sql).digest()),
      };
    });
}

// ---------------------------------------------------------------------------
// CSV parser (RFC 4180: quoted fields, embedded newlines, "" escapes)
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  // Normalise CRLF -> LF so embedded newlines are predictable.
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += c;
        i += 1;
      }
    } else if (c === '"') {
      inQuotes = true;
      i += 1;
    } else if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else {
      field += c;
      i += 1;
    }
  }
  // Flush trailing field/row (file may not end with a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

type Record = { [key: string]: string };

function toRecords(rows: string[][]): Record[] {
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cols) => {
    const rec: Record = {};
    header.forEach((h, idx) => {
      rec[h] = cols[idx] ?? "";
    });
    return rec;
  });
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
type TaskPriority = "low" | "high" | "urgent";
type TaskLabel = "feat" | "fix" | "refactor" | "chore";

/** Returns the Monica status, or null to skip the row (Canceled). */
function mapStatus(linear: string): TaskStatus | null {
  switch (linear.trim()) {
    case "Backlog":
      return "backlog";
    case "Todo":
      return "todo";
    case "In Progress":
      return "in_progress";
    case "Done":
      return "done";
    case "Canceled":
      return null; // skipped per import decision
    default:
      return "backlog"; // unknown -> safest bucket
  }
}

function mapPriority(linear: string): TaskPriority {
  switch (linear.trim()) {
    case "Urgent":
      return "urgent";
    case "High":
      return "high";
    case "Low":
      return "low";
    case "Medium": // Monica has no medium -> low
    case "No priority":
    case "":
      return "low";
    default:
      return "low";
  }
}

/** Linear labels are version tags; only "Feature" maps to a Monica label. */
function mapLabel(linear: string): TaskLabel | null {
  const labels = linear
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  return labels.includes("Feature") ? "feat" : null;
}

/** Linear ts "Wed Oct 15 2025 09:33:28 GMT+0000 (...)" -> RFC3339, or null. */
function parseTs(linear: string): string | null {
  const t = linear.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// nanoid-style 6-char id (matches the shape of Monica's Rust task_id).
const NANO_ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

function nanoid6(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += NANO_ALPHABET[b & 63];
  return out;
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

interface ProjectRow {
  id: string;
  name: string;
  status: "active";
  createdAt: string;
  updatedAt: string;
}

interface TaskRow {
  id: string;
  taskId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  label: TaskLabel | null;
  githubBranch: string | null;
  position: number;
  plannedFor: string | null;
  createdAt: string;
  updatedAt: string;
}

const csvText = await Bun.file(csvPath).text();
const records = toRecords(parseCsv(csvText));

const now = new Date().toISOString();

// Build projects from distinct non-empty Project names.
const projectByName = new Map<string, ProjectRow>();
for (const rec of records) {
  const name = rec["Project"]?.trim();
  if (!name) continue;
  if (!projectByName.has(name)) {
    projectByName.set(name, {
      id: crypto.randomUUID(),
      name,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }
}

const usedTaskIds = new Set<string>();
function uniqueTaskId(): string {
  let id = nanoid6();
  while (usedTaskIds.has(id)) id = nanoid6();
  usedTaskIds.add(id);
  return id;
}

const tasks: TaskRow[] = [];
const positionByProject = new Map<string, number>();
const skipped = { canceled: 0, noProject: 0 };
const statusHist: globalThis.Record<string, number> = {};
const priorityHist: globalThis.Record<string, number> = {};

for (const rec of records) {
  const projectName = rec["Project"]?.trim();
  if (!projectName) {
    skipped.noProject += 1;
    continue;
  }
  const status = mapStatus(rec["Status"] ?? "");
  if (status === null) {
    skipped.canceled += 1;
    continue;
  }

  const project = projectByName.get(projectName)!;
  const taskId = uniqueTaskId();
  const label = mapLabel(rec["Labels"] ?? "");
  const priority = mapPriority(rec["Priority"] ?? "");
  const createdAt = parseTs(rec["Created"] ?? "") ?? now;
  const updatedAt = parseTs(rec["Updated"] ?? "") ?? createdAt;
  const position = positionByProject.get(project.id) ?? 0;
  positionByProject.set(project.id, position + 1);

  const description = (rec["Description"] ?? "").trim() || null;

  tasks.push({
    id: crypto.randomUUID(),
    taskId,
    projectId: project.id,
    title: (rec["Title"] ?? "").trim(),
    description,
    status,
    priority,
    label,
    githubBranch: label ? `${label}/${taskId}` : null,
    position,
    plannedFor: parseTs(rec["Due Date"] ?? ""),
    createdAt,
    updatedAt,
  });

  statusHist[status] = (statusHist[status] ?? 0) + 1;
  priorityHist[priority] = (priorityHist[priority] ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const migrations = loadMigrations();

console.log(`\nLinear → Monica import (FULL RESET)`);
console.log(`  CSV:        ${csvPath} (${records.length} issues)`);
console.log(`  DB:         ${dbPath}`);
console.log(`  Migrations: ${migrations.map((m) => m.version).join(", ")} (${MIGRATIONS_DIR})`);
console.log(`  Mode:       ${dryRun ? "DRY RUN (no writes)" : "APPLY"}\n`);
console.log(`  Projects:        ${projectByName.size}`);
console.log(`  Tasks imported:  ${tasks.length}`);
console.log(`  Skipped:         ${skipped.canceled} canceled, ${skipped.noProject} no-project`);
console.log(`  Status:          ${JSON.stringify(statusHist)}`);
console.log(`  Priority:        ${JSON.stringify(priorityHist)}\n`);

if (dryRun) {
  console.log("Dry run complete — no changes written.");
  console.log("Re-run without --dry-run to wipe the DB and import (back up monica.db first).\n");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Write — wipe everything, rebuild schema from migrations, then insert data.
// ---------------------------------------------------------------------------

const db = new Database(dbPath, { create: true, readwrite: true });
db.run("PRAGMA foreign_keys = OFF");

// Drop every existing user table (clears stale data AND migration drift such
// as planner tables applied on another branch).
const existingTables = (
  db
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all()
).map((r) => r.name);
for (const name of existingTables) {
  db.run(`DROP TABLE IF EXISTS "${name}"`);
}

// Recreate sqlx's bookkeeping table (CREATE IF NOT EXISTS matches the app's).
db.run(`CREATE TABLE IF NOT EXISTS _sqlx_migrations (
    version BIGINT PRIMARY KEY,
    description TEXT NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    checksum BLOB NOT NULL,
    execution_time BIGINT NOT NULL
)`);

const recordMigration = db.prepare(
  `INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time)
   VALUES ($version, $description, 1, $checksum, 0)`,
);

// Replay each migration's SQL and record it so the Tauri app sees the schema
// as already-migrated (matching checksums => no re-run, no panic).
for (const m of migrations) {
  db.run(m.sql);
  recordMigration.run({
    $version: m.version,
    $description: m.description,
    $checksum: m.checksum,
  });
}

db.run("PRAGMA foreign_keys = ON");

const insertProject = db.prepare(
  `INSERT INTO projects (id, name, description, status, logo_path, url, github_url, github_stars, github_prs, github_issues, created_at, updated_at)
   VALUES ($id, $name, NULL, $status, NULL, NULL, NULL, NULL, NULL, NULL, $createdAt, $updatedAt)`,
);

const insertTask = db.prepare(
  `INSERT INTO tasks (id, task_id, project_id, title, description, status, priority, label, github_branch, position, planned_for, created_at, updated_at)
   VALUES ($id, $taskId, $projectId, $title, $description, $status, $priority, $label, $githubBranch, $position, $plannedFor, $createdAt, $updatedAt)`,
);

const apply = db.transaction(() => {
  for (const p of projectByName.values()) {
    insertProject.run({
      $id: p.id,
      $name: p.name,
      $status: p.status,
      $createdAt: p.createdAt,
      $updatedAt: p.updatedAt,
    });
  }
  for (const t of tasks) {
    insertTask.run({
      $id: t.id,
      $taskId: t.taskId,
      $projectId: t.projectId,
      $title: t.title,
      $description: t.description,
      $status: t.status,
      $priority: t.priority,
      $label: t.label,
      $githubBranch: t.githubBranch,
      $position: t.position,
      $plannedFor: t.plannedFor,
      $createdAt: t.createdAt,
      $updatedAt: t.updatedAt,
    });
  }
});

apply();
db.close();

console.log(
  `Reset DB and imported ${projectByName.size} projects and ${tasks.length} tasks into ${dbPath}\n`,
);
