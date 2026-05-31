import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { type Project, projects } from "@/lib/ipc";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "./project-status";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  url: z.string(),
  status: z.enum(["planned", "active", "cancelled"]),
});

type FormValues = z.infer<typeof schema>;

export interface ProjectFormDialogProps {
  mode: "create" | "edit";
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectFormDialog({ mode, project, open, onOpenChange }: ProjectFormDialogProps) {
  const revalidator = useRevalidator();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", url: "", status: "planned" },
  });

  // Reset the form whenever the dialog opens (prefilling for edit).
  useEffect(() => {
    if (!open) return;
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      url: project?.url ?? "",
      status: project?.status ?? "planned",
    });
  }, [open, project, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const description = values.description.trim() || null;
    const url = values.url.trim() || null;
    try {
      if (mode === "create") {
        await projects.create({ name: values.name.trim(), description, url, status: values.status });
        toast.success("Project created");
      } else if (project) {
        await projects.update(project.id, {
          name: values.name.trim(),
          description,
          url,
          status: values.status,
        });
        toast.success("Project updated");
      }
      onOpenChange(false);
      revalidator.revalidate();
    } catch (err) {
      toast.error(mode === "create" ? "Failed to create project" : "Failed to update project", {
        description: String(err),
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new project to track its tasks and GitHub activity."
              : "Update the project details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">Name</FieldLabel>
              <Input
                id="project-name"
                placeholder="My project"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea
                id="project-description"
                placeholder="What is this project about?"
                {...register("description")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-url">URL</FieldLabel>
              <Input id="project-url" placeholder="https://example.com" {...register("url")} />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-status">Status</FieldLabel>
              <NativeSelect id="project-status" className="w-full" {...register("status")}>
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
