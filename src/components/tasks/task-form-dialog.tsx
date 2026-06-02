import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowExpand01Icon,
  Attachment01Icon,
  Folder01Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRevalidator, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { type Project, type Task, tasks } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import {
  TASK_LABEL_LABELS,
  TASK_LABEL_OPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "./task-meta";
import { TaskPriorityBars } from "./task-priority";
import { TaskStatusIcon } from "./task-status";

const schema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
  priority: z.enum(["low", "high", "urgent"]),
  label: z.enum(["", "feat", "fix", "refactor", "chore"]),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
});

type FormValues = z.infer<typeof schema>;

const BLANK: FormValues = {
  projectId: "",
  title: "",
  description: "",
  priority: "low",
  label: "",
  status: "todo",
};

// Outlined, rounded property-pill trigger — Linear-style.
const PILL = "h-7 gap-1.5 rounded-full px-2.5 font-normal";

export interface TaskFormDialogProps {
  mode: "create" | "edit";
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDialog({ mode, task, open, onOpenChange }: TaskFormDialogProps) {
  const revalidator = useRevalidator();
  const projects = useRouteLoaderData<Project[] | undefined>("root") ?? [];
  const firstProjectId = projects[0]?.id ?? "";
  const noProjects = projects.length === 0;

  const [createMore, setCreateMore] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: BLANK,
  });

  // Reset the form whenever the dialog opens. On create, default the project to
  // the first available one so the required select is never empty.
  useEffect(() => {
    if (!open) return;
    setCreateMore(false);
    setExpanded(false);
    reset({
      ...BLANK,
      projectId: task?.projectId ?? firstProjectId,
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "low",
      label: task?.label ?? "",
      status: task?.status ?? "todo",
    });
  }, [open, task, reset, firstProjectId]);

  const projectId = watch("projectId");
  const projectName = projects.find((p) => p.id === projectId)?.name;

  const onSubmit = handleSubmit(async (values) => {
    const description = values.description.trim() || null;
    const label = values.label || null;
    try {
      if (mode === "create") {
        await tasks.create({
          projectId: values.projectId,
          title: values.title.trim(),
          description,
          priority: values.priority,
          label: label ?? undefined,
        });
        toast.success("Task created");
        revalidator.revalidate();
        if (createMore) {
          // Keep the composer open for the next task, preserving the project.
          reset({ ...BLANK, projectId: values.projectId });
          setFocus("title");
          return;
        }
      } else if (task) {
        await tasks.update(task.id, {
          projectId: values.projectId,
          title: values.title.trim(),
          description,
          priority: values.priority,
          label,
          status: values.status,
        });
        toast.success("Task updated");
        revalidator.revalidate();
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(mode === "create" ? "Failed to create task" : "Failed to update task", {
        description: String(err),
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden p-0 transition-[max-width]",
          expanded ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        {/* Header: project chip → title, with an expand toggle next to the close button. */}
        <div className="flex items-center gap-1.5 px-5 pt-5 pb-1">
          <Controller
            control={control}
            name="projectId"
            render={({ field }) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={noProjects}
                      className="h-7 gap-1.5 rounded-md px-2 font-medium"
                    />
                  }
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    strokeWidth={2}
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  {projectName ?? "Select project"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-48">
                  <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                    {projects.map((project) => (
                      <DropdownMenuRadioItem key={project.id} value={project.id}>
                        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
                        {project.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
          <span className="text-muted-foreground/50">›</span>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            {mode === "create" ? "New task" : "Edit task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "create" ? "Add a task to one of your projects." : "Update the task details."}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-14 text-muted-foreground"
            aria-label={expanded ? "Shrink dialog" : "Expand dialog"}
            onClick={() => setExpanded((v) => !v)}
          >
            <HugeiconsIcon icon={ArrowExpand01Icon} strokeWidth={2} />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col">
          {/* Composer: borderless title + description. */}
          <div className="flex flex-col gap-1 px-5 pt-2">
            {/* biome-ignore lint/a11y/noAutofocus: composer should focus the title on open */}
            <input
              autoFocus
              placeholder="Task title"
              aria-invalid={!!errors.title}
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/50"
              {...register("title")}
            />
            <textarea
              placeholder="Add description…"
              rows={expanded ? 6 : 3}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              {...register("description")}
            />
          </div>

          {errors.title && <p className="px-5 text-xs text-destructive">{errors.title.message}</p>}

          {/* Property pills. */}
          <div className="flex flex-wrap items-center gap-2 px-5 pt-3 pb-4">
            {mode === "edit" && (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(PILL, "text-foreground")}
                        />
                      }
                    >
                      <TaskStatusIcon status={field.value} />
                      {TASK_STATUS_LABELS[field.value]}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-44">
                      <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                        {TASK_STATUS_OPTIONS.map((status) => (
                          <DropdownMenuRadioItem key={status} value={status}>
                            <TaskStatusIcon status={status} />
                            {TASK_STATUS_LABELS[status]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            )}

            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(PILL, "text-foreground")}
                      />
                    }
                  >
                    <TaskPriorityBars priority={field.value} />
                    {TASK_PRIORITY_LABELS[field.value]}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-44">
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                      {TASK_PRIORITY_OPTIONS.map((priority) => (
                        <DropdownMenuRadioItem key={priority} value={priority}>
                          <TaskPriorityBars priority={priority} />
                          {TASK_PRIORITY_LABELS[priority]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />

            <Controller
              control={control}
              name="label"
              render={({ field }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(PILL, field.value ? "text-foreground" : "text-muted-foreground")}
                      />
                    }
                  >
                    <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                    {field.value ? TASK_LABEL_LABELS[field.value] : "Label"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-44">
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
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
              )}
            />
          </div>

          {/* Footer: attach (placeholder) · create-more toggle · primary action. */}
          <div className="flex items-center justify-between border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full text-muted-foreground"
              aria-label="Attach file"
              disabled
            >
              <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
            </Button>

            <div className="flex items-center gap-3">
              {mode === "create" && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    size="sm"
                    checked={createMore}
                    onCheckedChange={(checked) => setCreateMore(checked === true)}
                  />
                  Create more
                </label>
              )}
              <Button type="submit" disabled={isSubmitting || noProjects}>
                {mode === "create" ? "Create task" : "Save"}
              </Button>
            </div>
          </div>

          {noProjects && (
            <p className="px-5 pb-4 text-xs text-muted-foreground">
              Create a project first to add tasks.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
