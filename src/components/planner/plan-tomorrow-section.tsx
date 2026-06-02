import { Add01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { PlanTaskRow } from "@/components/planner/plan-task-row";
import { SectionLabel } from "@/components/detail/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskPlanning } from "@/hooks/use-task-planning";
import { type Project, type Task, tasks, tray } from "@/lib/ipc";

interface PlanTomorrowSectionProps {
  tomorrow: string;
  /** Tasks already planned for tomorrow. */
  planned: Task[];
  /** Today's unfinished tasks, offered for carryover. */
  carryover: Task[];
  /** Open, unassigned tasks across all projects. */
  plannable: Task[];
  projects: Project[];
  projectNames: Map<string, string>;
}

/** Evening planning: carry today's unfinished work forward, pull from the
 * backlog, or quick-create — all stamped with tomorrow's date. */
export function PlanTomorrowSection({
  tomorrow,
  planned,
  carryover,
  plannable,
  projects,
  projectNames,
}: PlanTomorrowSectionProps) {
  const { planFor } = useTaskPlanning();
  const plannedIds = new Set(planned.map((t) => t.id));

  return (
    <section className="flex flex-col gap-5">
      {planned.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Planned</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {planned.map((task) => (
              <PlanTaskRow
                key={task.id}
                task={task}
                projectName={projectNames.get(task.projectId)}
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove from tomorrow"
                    onClick={() => planFor(task.id, null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {carryover.filter((t) => !plannedIds.has(t.id)).length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Carry over from today</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {carryover
              .filter((t) => !plannedIds.has(t.id))
              .map((task) => (
                <PlanTaskRow
                  key={task.id}
                  task={task}
                  projectName={projectNames.get(task.projectId)}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => planFor(task.id, tomorrow)}
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                      Tomorrow
                    </Button>
                  }
                />
              ))}
          </div>
        </div>
      )}

      {plannable.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>Add from backlog</SectionLabel>
          <div className="divide-y divide-border rounded-lg border">
            {plannable.map((task) => (
              <PlanTaskRow
                key={task.id}
                task={task}
                projectName={projectNames.get(task.projectId)}
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Add to tomorrow"
                    onClick={() => planFor(task.id, tomorrow)}
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <QuickCreate tomorrow={tomorrow} projects={projects} />
    </section>
  );
}

/** Inline new-task composer that plans the task for tomorrow on submit. Requires
 * a project (NewTask is project-scoped). */
function QuickCreate({ tomorrow, projects }: { tomorrow: string; projects: Project[] }) {
  const revalidator = useRevalidator();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length > 0 && projectId && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await tasks.create({ projectId, title: title.trim(), plannedFor: tomorrow });
      await tray.refresh();
      setTitle("");
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to create task", { description: String(err) });
    } finally {
      setBusy(false);
    }
  };

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Create a project first to plan new tasks.</p>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border p-1">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Plan a new task for tomorrow…"
        className="border-0 shadow-none focus-visible:ring-0"
      />
      <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
        <SelectTrigger className="w-40 shrink-0">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!canSubmit} onClick={submit}>
        Add
      </Button>
    </div>
  );
}
