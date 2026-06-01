import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { type ProjectStatus, projects } from "@/lib/ipc";

/**
 * Persisting a single project field: writes via the IPC layer, revalidates the
 * route loaders, and surfaces a toast on failure. Each updater rethrows on
 * error so callers can roll back their optimistic UI state.
 */
export function useProjectUpdate() {
  const revalidator = useRevalidator();

  const updateStatus = async (projectId: string, status: ProjectStatus) => {
    try {
      await projects.update(projectId, { status });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to update status", { description: String(err) });
      throw err;
    }
  };

  return { updateStatus };
}
