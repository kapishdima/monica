import { invoke } from "@tauri-apps/api/core";

// --- Enums (mirror the Rust models) ---

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "high" | "urgent";
export type TaskLabel = "feat" | "fix" | "refactor" | "chore";
export type ProjectStatus = "active" | "cancelled" | "planned";
export type DayRating = "great" | "good" | "okay" | "bad" | "terrible";

// --- Models ---

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  logoPath: string | null;
  url: string | null;
  githubUrl: string | null;
  githubStars: number | null;
  githubPrs: number | null;
  githubIssues: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewProject {
  name: string;
  description?: string | null;
  url?: string | null;
  githubUrl?: string | null;
  githubStars?: number | null;
  githubPrs?: number | null;
  githubIssues?: number | null;
  status?: ProjectStatus;
}

// Universal patch: omit a field to leave it unchanged; pass `null` to clear a
// nullable column. `id`/`createdAt` are immutable.
export interface UpdateProject {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  logoPath?: string | null;
  url?: string | null;
  githubUrl?: string | null;
  githubStars?: number | null;
  githubPrs?: number | null;
  githubIssues?: number | null;
}

export interface Task {
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

export interface NewTask {
  projectId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  label?: TaskLabel;
  plannedFor?: string | null;
}

// Universal patch: omit a field to leave it unchanged; pass `null` to clear a
// nullable column. `id`/`taskId`/`createdAt` are immutable.
export interface UpdateTask {
  projectId?: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  label?: TaskLabel | null;
  githubBranch?: string | null;
  position?: number;
  plannedFor?: string | null;
}

// Application settings (a singleton row). `notificationTime` is local 'HH:MM'.
export interface Settings {
  id: number;
  notificationTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettings {
  notificationTime?: string;
}

// A single day's plan: the end-of-day reflection + rating. The day's tasks are
// linked separately via each task's `plannedFor` date.
export interface DailyPlan {
  date: string;
  reflection: string | null;
  rating: DayRating | null;
  createdAt: string;
  updatedAt: string;
}

// Universal patch: omit a field to leave it unchanged; pass `null` to clear.
export interface UpdateDailyPlan {
  reflection?: string | null;
  rating?: DayRating | null;
}

// A pull request or issue fetched live from GitHub for the project detail tabs.
export interface GithubItem {
  number: number;
  title: string;
  htmlUrl: string;
  state: string;
  author: string | null;
}

export interface GithubActivity {
  prs: GithubItem[];
  issues: GithubItem[];
}

export interface GithubRepo {
  name: string;
  description: string | null;
  url: string | null;
  stars: number;
  prs: number;
  issues: number;
}

// --- Claude Code session transcripts (read from ~/.claude/projects) ---

// A session in the list rail. `path` re-opens its full transcript.
export interface ClaudeSession {
  sessionId: string;
  path: string;
  gitBranch: string | null;
  title: string | null;
  messageCount: number;
  startedAt: string | null;
  updatedAt: string | null;
}

// One normalized transcript entry — discriminated union keyed by `kind`.
export type SessionEvent =
  | { kind: "userText"; uuid: string | null; timestamp: string | null; text: string }
  | {
      kind: "assistant";
      uuid: string | null;
      timestamp: string | null;
      text: string;
      model: string | null;
    }
  | { kind: "thinking"; uuid: string | null; timestamp: string | null; text: string }
  | {
      kind: "toolUse";
      uuid: string | null;
      timestamp: string | null;
      id: string | null;
      name: string;
      input: unknown;
    }
  | {
      kind: "toolResult";
      uuid: string | null;
      timestamp: string | null;
      toolUseId: string | null;
      content: string;
      isError: boolean;
    }
  | {
      kind: "system";
      uuid: string | null;
      timestamp: string | null;
      subtype: string | null;
      content: string;
      level: string | null;
    };

export interface SessionTranscript {
  sessionId: string;
  gitBranch: string | null;
  events: SessionEvent[];
}

// --- API: errors reject as { kind, message } from the Rust AppError ---

export const projects = {
  create: (input: NewProject) => invoke<Project>("create_project", { input }),
  list: () => invoke<Project[]>("list_projects"),
  get: (id: string) => invoke<Project>("get_project", { id }),
  update: (id: string, patch: UpdateProject) => invoke<Project>("update_project", { id, patch }),
  remove: (id: string) => invoke<void>("remove_project", { id }),
};

export const github = {
  // Fetch GitHub stats for `url`, persist them on the project, return it updated.
  connect: (id: string, url: string) => invoke<Project>("connect_github_project", { id, url }),
  // Live open PRs and issues for a repository (not persisted).
  activity: (url: string) => invoke<GithubActivity>("fetch_github_activity", { url }),
  // Repository metadata (name, description, homepage, counts) for pre-filling
  // the create form when importing from a GitHub URL (not persisted).
  fetchRepo: (url: string) => invoke<GithubRepo>("fetch_github_repo", { url }),
};

export const tasks = {
  // `taskId` and `githubBranch` are generated by the backend.
  create: (input: NewTask) => invoke<Task>("create_task", { input }),
  list: (projectId: string) => invoke<Task[]>("list_tasks", { projectId }),
  listAll: () => invoke<Task[]>("list_all_tasks"),
  // Tasks planned for a given local date ('YYYY-MM-DD'); backs the Today/Tomorrow views.
  plannedFor: (date: string) => invoke<Task[]>("list_planned_tasks", { date }),
  // Open, unassigned tasks — the candidate pool when planning a day.
  plannable: () => invoke<Task[]>("list_plannable_tasks"),
  get: (id: string) => invoke<Task>("get_task", { id }),
  update: (id: string, patch: UpdateTask) => invoke<Task>("update_task", { id, patch }),
  remove: (id: string) => invoke<void>("remove_task", { id }),
};

export const settings = {
  get: () => invoke<Settings>("get_settings"),
  update: (patch: UpdateSettings) => invoke<Settings>("update_settings", { patch }),
};

export interface ImportSummary {
  projectsCreated: number;
  projectsReused: number;
  tasksImported: number;
  skippedCanceled: number;
  skippedNoProject: number;
}

export const imports = {
  // Import a Linear CSV export (raw file contents). Appends — existing projects
  // are reused by name, nothing is deleted.
  linearCsv: (csv: string) => invoke<ImportSummary>("import_linear_csv", { csv }),
};

export const plans = {
  // Returns the day's plan, creating an empty one if it doesn't exist yet.
  get: (date: string) => invoke<DailyPlan>("get_daily_plan", { date }),
  update: (date: string, patch: UpdateDailyPlan) =>
    invoke<DailyPlan>("update_daily_plan", { date, patch }),
};

export const claudeSessions = {
  // Sessions whose git branch matches `branch` (prefix), newest first.
  list: (branch: string) => invoke<ClaudeSession[]>("list_task_sessions", { branch }),
  // The full parsed transcript for one session, by its file `path`.
  get: (path: string) => invoke<SessionTranscript>("get_task_session", { path }),
};

export const tray = {
  // Rebuild the tray menu after planning or status changes.
  refresh: () => invoke<void>("refresh_tray"),
};
