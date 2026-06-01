import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator, useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { type Project, type Task, tasks } from "@/lib/ipc";
import {
  TASK_LABEL_LABELS,
  TASK_LABEL_OPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "./task-meta";

const schema = z.object({
  projectId: z.string().min(1, "Project is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
  priority: z.enum(["low", "high", "urgent"]),
  label: z.enum(["", "feat", "fix", "refactor", "chore"]),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
});

type FormValues = z.infer<typeof schema>;

export interface TaskFormDialogProps {
  mode: "create" | "edit";
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDialog({ mode, task, open, onOpenChange }: TaskFormDialogProps) {
  const revalidator = useRevalidator();
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const firstProjectId = projects[0]?.id ?? "";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      priority: "low",
      label: "",
      status: "todo",
    },
  });

  // Reset the form whenever the dialog opens. On create, default the project to
  // the first available one so the required select is never empty.
  useEffect(() => {
    if (!open) return;
    reset({
      projectId: task?.projectId ?? firstProjectId,
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "low",
      label: task?.label ?? "",
      status: task?.status ?? "todo",
    });
  }, [open, task, reset, firstProjectId]);

  const noProjects = projects.length === 0;

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
      }
      onOpenChange(false);
      revalidator.revalidate();
    } catch (err) {
      toast.error(mode === "create" ? "Failed to create task" : "Failed to update task", {
        description: String(err),
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
          <DialogDescription className="text-pretty">
            {mode === "create" ? "Add a task to one of your projects." : "Update the task details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="task-project">Project</FieldLabel>
              <NativeSelect
                id="task-project"
                className="w-full"
                aria-invalid={!!errors.projectId}
                disabled={noProjects}
                {...register("projectId")}
              >
                {projects.map((project) => (
                  <NativeSelectOption key={project.id} value={project.id}>
                    {project.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {noProjects ? (
                <FieldDescription>Create a project first to add tasks.</FieldDescription>
              ) : (
                <FieldError errors={[errors.projectId]} />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                placeholder="Implement the thing"
                aria-invalid={!!errors.title}
                {...register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea
                id="task-description"
                placeholder="What needs to be done?"
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
              <NativeSelect id="task-priority" className="w-full" {...register("priority")}>
                {TASK_PRIORITY_OPTIONS.map((priority) => (
                  <NativeSelectOption key={priority} value={priority}>
                    {TASK_PRIORITY_LABELS[priority]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="task-label">Label</FieldLabel>
              <NativeSelect id="task-label" className="w-full" {...register("label")}>
                <NativeSelectOption value="">— none —</NativeSelectOption>
                {TASK_LABEL_OPTIONS.map((label) => (
                  <NativeSelectOption key={label} value={label}>
                    {TASK_LABEL_LABELS[label]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {mode === "create" && (
                <FieldDescription>
                  A git branch is generated from the label (e.g. <code>feat/a1B2c3</code>).
                </FieldDescription>
              )}
            </Field>

            {mode === "edit" && (
              <Field>
                <FieldLabel htmlFor="task-status">Status</FieldLabel>
                <NativeSelect id="task-status" className="w-full" {...register("status")}>
                  {TASK_STATUS_OPTIONS.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || noProjects}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
