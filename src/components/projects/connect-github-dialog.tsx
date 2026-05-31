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
import { github, type Project } from "@/lib/ipc";

const schema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Repository URL is required")
    .refine((v) => v.includes("github.com/"), "Must be a github.com repository URL"),
});

type FormValues = z.infer<typeof schema>;

export interface ConnectGithubDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectGithubDialog({ project, open, onOpenChange }: ConnectGithubDialogProps) {
  const revalidator = useRevalidator();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
  });

  useEffect(() => {
    if (open) reset({ url: project.githubUrl ?? "" });
  }, [open, project.githubUrl, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await github.connect(project.id, values.url.trim());
      toast.success("GitHub connected");
      onOpenChange(false);
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to connect GitHub", { description: String(err) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect GitHub</DialogTitle>
          <DialogDescription>
            Paste the repository URL to fetch stars, pull requests and issues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="github-url">Repository URL</FieldLabel>
              <Input
                id="github-url"
                placeholder="https://github.com/owner/repo"
                aria-invalid={!!errors.url}
                {...register("url")}
              />
              <FieldError errors={[errors.url]} />
            </Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Connect
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
