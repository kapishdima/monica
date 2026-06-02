-- Backfill github_branch for tasks created before branches were always
-- auto-generated (e.g. the bulk Linear import created tasks without a label,
-- so they had no branch). Use the label's prefix when present, otherwise the
-- `feat` default — matching the create-time logic in task_repo::create.
UPDATE tasks
SET github_branch = COALESCE(label, 'feat') || '/' || task_id
WHERE github_branch IS NULL;
