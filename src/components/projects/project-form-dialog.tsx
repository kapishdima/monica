import { zodResolver } from "@hookform/resolvers/zod";
import { GitPullRequestIcon, RecordIcon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { type GithubRepo, github, type Project, projects } from "@/lib/ipc";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from "./project-status";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  url: z.string(),
  status: z.enum(["planned", "active", "cancelled"]),
});

type FormValues = z.infer<typeof schema>;

/** GitHub metrics pulled from an import, carried into `projects.create`. */
type GithubImport = { githubUrl: string; stars: number; prs: number; issues: number };

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

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [githubImport, setGithubImport] = useState<GithubImport | null>(null);

  // Reset the form (and any import state) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      url: project?.url ?? "",
      status: project?.status ?? "planned",
    });
    setImportUrl("");
    setGithubImport(null);
  }, [open, project, reset]);

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const repo: GithubRepo = await github.fetchRepo(url);
      setValue("name", repo.name);
      setValue("description", repo.description ?? "");
      setValue("url", repo.url ?? "");
      // Metrics only render once the project is non-planned (see hasGithubMetrics).
      setValue("status", "active");
      setGithubImport({ githubUrl: url, stars: repo.stars, prs: repo.prs, issues: repo.issues });
      toast.success("Imported from GitHub");
    } catch (err) {
      toast.error("Failed to import from GitHub", { description: String(err) });
    } finally {
      setImporting(false);
    }
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

  const detailsFields = (
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
    </FieldGroup>
  );

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
          {mode === "create" ? (
            <Accordion defaultValue={["import"]}>
              <AccordionItem value="import">
                <AccordionTrigger>Import from GitHub</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-end gap-2">
                      <Field className="flex-1">
                        <FieldLabel htmlFor="import-url">Repository URL</FieldLabel>
                        <Input
                          id="import-url"
                          placeholder="https://github.com/owner/repo"
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleImport();
                            }
                          }}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImport}
                        disabled={importing || !importUrl.trim()}
                      >
                        {importing ? <Spinner /> : "Import"}
                      </Button>
                    </div>

                    {githubImport && (
                      <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
                        <ImportMetric icon={StarIcon} value={githubImport.stars} />
                        <ImportMetric icon={GitPullRequestIcon} value={githubImport.prs} />
                        <ImportMetric icon={RecordIcon} value={githubImport.issues} />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="details">
                <AccordionTrigger>Project details</AccordionTrigger>
                <AccordionContent>{detailsFields}</AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            detailsFields
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

function ImportMetric({ icon, value }: { icon: typeof StarIcon; value: number }): ReactNode {
  return (
    <span className="flex items-center gap-1">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      {value}
    </span>
  );
}
