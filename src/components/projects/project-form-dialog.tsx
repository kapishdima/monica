import { zodResolver } from "@hookform/resolvers/zod";
import { Github01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { NamedSeparator, Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type GithubRepo, type Project, projects } from "@/lib/ipc";
import { type GithubImport, GithubImportControls } from "./github-import-field";
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", url: "", status: "planned" },
  });

  const [githubImport, setGithubImport] = useState<GithubImport | null>(null);

  // Reset the form (and any imported metrics) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      url: project?.url ?? "",
      status: project?.status ?? "planned",
    });
    setGithubImport(null);
  }, [open, project, reset]);

  const handleImported = (repo: GithubRepo, url: string) => {
    setValue("name", repo.name);
    setValue("description", repo.description ?? "");
    setValue("url", repo.url ?? "");
    // Metrics only render once the project is non-planned (see hasGithubMetrics).
    setValue("status", "active");
    setGithubImport({ githubUrl: url, stars: repo.stars, prs: repo.prs, issues: repo.issues });
  };

  const onSubmit = handleSubmit(async (values) => {
    const description = values.description.trim() || null;
    const url = values.url.trim() || null;
    try {
      if (mode === "create") {
        await projects.create({
          name: values.name.trim(),
          description,
          url,
          status: values.status,
          githubUrl: githubImport?.githubUrl ?? null,
          githubStars: githubImport?.stars ?? null,
          githubPrs: githubImport?.prs ?? null,
          githubIssues: githubImport?.issues ?? null,
        });
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

  // Details fields, parameterized by an id prefix so several layout variants can
  // render them at once without colliding on element ids.
  const renderDetails = (idPrefix: string) => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          placeholder="My project"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-description`}>Description</FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="What is this project about?"
          {...register("description")}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-url`}>URL</FieldLabel>
        <Input id={`${idPrefix}-url`} placeholder="https://example.com" {...register("url")} />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-status`}>Status</FieldLabel>
        <NativeSelect id={`${idPrefix}-status`} className="w-full" {...register("status")}>
          {PROJECT_STATUS_OPTIONS.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {PROJECT_STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
    </FieldGroup>
  );

  const importProps = { open, metrics: githubImport, onImported: handleImported };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New project" : "Edit project"}</DialogTitle>
          <DialogDescription className="text-pretty">
            {mode === "create"
              ? "Create a new project to track its tasks and GitHub activity."
              : "Update the project details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          {mode === "create" ? (
            <div className="flex flex-col gap-5">
              {/* <div className="rounded-2xl bg-muted/50 p-4">
                <p className="mb-3 text-sm font-medium">Import from GitHub</p>

              </div> */}
              <div className="flex flex-col ">
                <div className="flex items-center gap-x-2 pb-4">
                  <HugeiconsIcon icon={Github01FreeIcons} size={16} />
                  <Label>Import from Github</Label>
                </div>
                <GithubImportControls {...importProps} />
              </div>
              <NamedSeparator title="or" />
              {renderDetails("project")}
            </div>
          ) : (
            renderDetails("edit")
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
