-- Open pull-request and issue counts, populated when a project is connected to
-- a GitHub repository. Nullable: projects that are only planned (or not yet
-- connected) have no GitHub metrics.
ALTER TABLE projects ADD COLUMN github_prs    INTEGER;
ALTER TABLE projects ADD COLUMN github_issues INTEGER;
