import { type PropertyOption, PropertySelect } from "@/components/detail/property";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS,
  ProjectStatusIcon,
} from "@/components/projects/project-status";
import { useProjectUpdate } from "@/hooks/use-project-update";
import type { ProjectStatus } from "@/lib/ipc";
import { useProjectDetail } from "./project-detail-context";

const OPTIONS: PropertyOption<ProjectStatus>[] = PROJECT_STATUS_OPTIONS.map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
  icon: <ProjectStatusIcon status={status} />,
}));

export function ProjectStatusProperty() {
  const {
    state: { project },
  } = useProjectDetail();
  const { updateStatus } = useProjectUpdate();

  return (
    <PropertySelect
      value={project.status}
      options={OPTIONS}
      persist={(status) => updateStatus(project.id, status)}
    />
  );
}
