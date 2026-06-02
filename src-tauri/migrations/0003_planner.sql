-- Daily planning: a typed singleton settings row (drives the evening reminder)
-- and a per-day plan record holding the end-of-day reflection and rating.
-- Tasks belong to a day via their existing `planned_for` date (idx_tasks_planned).

CREATE TABLE settings (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    notification_time TEXT NOT NULL DEFAULT '20:00',   -- 'HH:MM', local time
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);

INSERT INTO settings (id, notification_time, created_at, updated_at)
VALUES (1, '20:00', strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));

CREATE TABLE daily_plans (
    date       TEXT PRIMARY KEY NOT NULL,              -- 'YYYY-MM-DD', local date
    reflection TEXT,
    rating     TEXT CHECK (rating IN ('great','good','okay','bad','terrible')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
