PRAGMA foreign_keys = ON;

CREATE TABLE projects (
    id            TEXT PRIMARY KEY NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT,
    status        TEXT NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('active','cancelled','planned')),
    logo_path     TEXT,
    url           TEXT,
    github_url    TEXT,
    github_stars  INTEGER,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE tasks (
    id            TEXT PRIMARY KEY NOT NULL,
    task_id       TEXT NOT NULL UNIQUE,
    project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT,
    status        TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('backlog','todo','in_progress','in_review','done')),
    priority      TEXT NOT NULL DEFAULT 'low'
                  CHECK (priority IN ('low','high','urgent')),
    label         TEXT CHECK (label IN ('feat','fix','refactor','chore')),
    github_branch TEXT,
    position      INTEGER NOT NULL DEFAULT 0,
    planned_for   TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status  ON tasks(status);
CREATE INDEX idx_tasks_planned ON tasks(planned_for);
