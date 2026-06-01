import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowExpand01Icon,
  Folder01Icon,
  GithubIcon,
  Link01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
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
import { Separator } from "@/components/ui/separator";
import { type GithubRepo, type Project, projects } from "@/lib/ipc";
import { cn } from "@/lib/utils";
import { type GithubImport, GithubImportControls } from "./github-import-field";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS, ProjectStatusIcon } from "./project-status";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  url: z.string(),
  status: z.enum(["planned", "active", "cancelled"]),
});

type FormValues = z.infer<typeof schema>;

// Outlined, rounded property-pill trigger — Linear-style.
const PILL = "h-7 gap-1.5 rounded-full px-2.5 font-normal";

export interface ProjectFormDialogProps {
  mode: "create" | "edit";
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectFormDialog({ mode, project, open, onOpenChange }: ProjectFormDialogProps) {
  const revalidator = useRevalidator();
  const [expanded, setExpanded] = useState(false);
  const {
    control,
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
    setExpanded(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden p-0 transition-[max-width]",
          expanded ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        {/* Header: project chip → mode, with an expand toggle next to the close button. */}
        <div className="flex items-center gap-1.5 px-5 pt-5 pb-1">
          <span className="flex h-7 items-center gap-1.5 rounded-md bg-secondary px-2 text-sm font-medium text-secondary-foreground">
            <HugeiconsIcon
              icon={Folder01Icon}
              strokeWidth={2}
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            Project
          </span>
          <span className="text-muted-foreground/50">›</span>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            {mode === "create" ? "New project" : "Edit project"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === "create"
              ? "Create a new project to track its tasks and GitHub activity."
              : "Update the project details."}
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
          {/* Import from GitHub (create only): auto-fills the fields below. */}
          {mode === "create" && (
            <>
              <div className="flex flex-col gap-2 px-5 pt-2 pb-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <HugeiconsIcon icon={GithubIcon} strokeWidth={2} className="size-3.5 shrink-0" />
                  Import from GitHub
                </div>
                <GithubImportControls
                  open={open}
                  metrics={githubImport}
                  onImported={handleImported}
                  idPrefix="project"
                />
              </div>
              <Separator />
            </>
          )}

          {/* Composer: borderless name + description, with an inline URL row. */}
          <div className="flex flex-col gap-1 px-5 pt-3">
            {/* biome-ignore lint/a11y/noAutofocus: composer should focus the name on open */}
            <input
              autoFocus
              placeholder="Project name"
              aria-invalid={!!errors.name}
              className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/50"
              {...register("name")}
            />
            <textarea
              placeholder="Add description…"
              rows={expanded ? 6 : 3}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              {...register("description")}
            />
            <div className="flex items-center gap-2 border-t pt-2">
              <HugeiconsIcon
                icon={Link01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <input
                placeholder="https://example.com"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                {...register("url")}
              />
            </div>
          </div>

          {errors.name && (
            <p className="px-5 pt-2 text-xs text-destructive">{errors.name.message}</p>
          )}

          {/* Property pills. */}
          <div className="flex flex-wrap items-center gap-2 px-5 pt-3 pb-4">
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
                    <ProjectStatusIcon status={field.value} />
                    {PROJECT_STATUS_LABELS[field.value]}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-44">
                    <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                      {PROJECT_STATUS_OPTIONS.map((status) => (
                        <DropdownMenuRadioItem key={status} value={status}>
                          <ProjectStatusIcon status={status} />
                          {PROJECT_STATUS_LABELS[status]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </div>

          {/* Footer: primary action. */}
          <div className="flex items-center justify-end border-t px-5 py-3">
            <Button type="submit" disabled={isSubmitting}>
              {mode === "create" ? "Create project" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
