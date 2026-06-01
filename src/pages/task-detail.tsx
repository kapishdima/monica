import {
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  GitBranchIcon,
  MoreHorizontalCircle01Icon,
  Tag01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link, useLoaderData, useNavigate, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import {
  TASK_LABEL_LABELS,
  TASK_LABEL_OPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/components/tasks/task-meta";
import { TaskPriorityBars } from "@/components/tasks/task-priority";
import { TaskStatusIcon } from "@/components/tasks/task-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskUpdate } from "@/hooks/use-task-update";
import type { Project, Task, TaskLabel, TaskPriority, TaskStatus } from "@/lib/ipc";
import { cn } from "@/lib/utils";

// Full-width, left-aligned sidebar property row — Linear-style.
const ROW =
  "h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-foreground [&_svg]:text-muted-foreground";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-2 text-xs font-medium tracking-wide text-muted-foreground">{children}</h2>
  );
}

/** Subtle bordered group that holds one section's rows, matching Linear's sidebar. */
function PropertyGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-0.5 rounded-lg border p-1">{children}</div>;
}

function StatusProperty({ task }: { task: Task }) {
  const { updateStatus } = useTaskUpdate();
  const [value, setValue] = useState(task.status);

  const onChange = async (next: TaskStatus) => {
    const prev = value;
    setValue(next);
    try {
      await updateStatus(task.id, next);
    } catch {
      setValue(prev);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className={ROW} />}>
        <TaskStatusIcon status={value} />
        <span className="truncate">{TASK_STATUS_LABELS[value]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as TaskStatus)}>
          {TASK_STATUS_OPTIONS.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              <TaskStatusIcon status={status} />
              {TASK_STATUS_LABELS[status]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityProperty({ task }: { task: Task }) {
  const { updatePriority } = useTaskUpdate();
  const [value, setValue] = useState(task.priority);

  const onChange = async (next: TaskPriority) => {
    const prev = value;
    setValue(next);
    try {
      await updatePriority(task.id, next);
    } catch {
      setValue(prev);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className={ROW} />}>
        <TaskPriorityBars priority={value} />
        <span className="truncate">{TASK_PRIORITY_LABELS[value]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as TaskPriority)}>
          {TASK_PRIORITY_OPTIONS.map((priority) => (
            <DropdownMenuRadioItem key={priority} value={priority}>
              <TaskPriorityBars priority={priority} />
              {TASK_PRIORITY_LABELS[priority]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LabelProperty({ task }: { task: Task }) {
  const { updateLabel } = useTaskUpdate();
  const [value, setValue] = useState<TaskLabel | "">(task.label ?? "");

  const onChange = async (next: string) => {
    const prev = value;
    setValue(next as TaskLabel | "");
    try {
      await updateLabel(task.id, (next || null) as TaskLabel | null);
    } catch {
      setValue(prev);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className={cn(ROW, !value && "text-muted-foreground")} />}
      >
        <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4 shrink-0" />
        <span className="truncate">{value ? TASK_LABEL_LABELS[value] : "No label"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="">— None —</DropdownMenuRadioItem>
          {TASK_LABEL_OPTIONS.map((label) => (
            <DropdownMenuRadioItem key={label} value={label}>
              <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} />
              {TASK_LABEL_LABELS[label]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Icon-only button that copies the auto-generated git branch name. */
function CopyBranchButton({ branch }: { branch: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(branch);
      setCopied(true);
      toast.success("Branch name copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy branch name");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onCopy}
      title={`Copy branch name: ${branch}`}
      aria-label="Copy branch name"
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : GitBranchIcon}
        strokeWidth={2}
        className={cn(copied && "text-emerald-500")}
      />
    </Button>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const TaskDetail: React.FC = () => {
  const task = useLoaderData() as Task;
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const project = projects.find((p) => p.id === task.projectId);

  return (
    <>
      {/* Breadcrumb + action toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/tasks" className="shrink-0 hover:text-foreground">
            Tasks
          </Link>
          <span className="text-muted-foreground/50">›</span>
          {project && (
            <>
              <Link to={`/projects/${project.id}`} className="truncate hover:text-foreground">
                {project.name}
              </Link>
              <span className="shrink-0 text-muted-foreground/50">›</span>
            </>
          )}
          <span className="shrink-0 font-medium text-foreground tabular-nums">{task.taskId}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
          {task.githubBranch && <CopyBranchButton branch={task.githubBranch} />}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditOpen(true)}
            title="Edit task"
            aria-label="Edit task"
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}
            >
              <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                <span>Edit task</span>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                <span>Delete task</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Two-column body: content + properties sidebar */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <main className="min-w-0 flex-1">
          <p className="mb-3 text-sm text-muted-foreground tabular-nums">{task.taskId}</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            {task.title}
          </h1>
          {task.description ? (
            <p className="mt-4 max-w-[70ch] text-sm whitespace-pre-wrap text-pretty text-foreground/80">
              {task.description}
            </p>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No description.</p>
          )}
        </main>

        <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-64">
          <section className="flex flex-col gap-2">
            <SectionLabel>Properties</SectionLabel>
            <PropertyGroup>
              <StatusProperty task={task} />
              <PriorityProperty task={task} />
              <LabelProperty task={task} />
            </PropertyGroup>
          </section>

          <section className="flex flex-col gap-2">
            <SectionLabel>Project</SectionLabel>
            <PropertyGroup>
              {project ? (
                <Button
                  variant="ghost"
                  className={ROW}
                  render={<Link to={`/projects/${project.id}`} />}
                >
                  <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </Button>
              ) : (
                <div className={cn(ROW, "flex items-center text-muted-foreground")}>
                  <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-4 shrink-0" />
                  <span className="truncate">Unknown project</span>
                </div>
              )}
            </PropertyGroup>
          </section>

          {task.githubBranch && (
            <section className="flex flex-col gap-2">
              <SectionLabel>Git branch</SectionLabel>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <span className="min-w-0 flex-1 truncate px-1.5 font-mono text-sm">
                  {task.githubBranch}
                </span>
                <CopyBranchButton branch={task.githubBranch} />
              </div>
            </section>
          )}

          <div className="flex flex-col gap-1 px-2 text-xs text-muted-foreground tabular-nums">
            <span>Created {formatDate(task.createdAt)}</span>
            <span>Updated {formatDate(task.updatedAt)}</span>
          </div>
        </aside>
      </div>

      <TaskFormDialog mode="edit" task={task} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTaskDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/tasks")}
      />
    </>
  );
};
