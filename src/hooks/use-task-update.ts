import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { type TaskLabel, type TaskPriority, type TaskStatus, tasks } from "@/lib/ipc";

/**
 * Persisting a single task field: writes via the IPC layer, revalidates the
 * route loaders, and surfaces a toast on failure. Each updater rethrows on
 * error so callers can roll back their optimistic UI state.
 */
export function useTaskUpdate() {
  const revalidator = useRevalidator();

  const updateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await tasks.update(taskId, { status });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to update status", { description: String(err) });
      throw err;
    }
  };

  const updatePriority = async (taskId: string, priority: TaskPriority) => {
    try {
      await tasks.update(taskId, { priority });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to update priority", { description: String(err) });
      throw err;
    }
  };

  const updateLabel = async (taskId: string, label: TaskLabel | null) => {
    try {
      await tasks.update(taskId, { label });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to update label", { description: String(err) });
      throw err;
    }
  };

  const updateDescription = async (taskId: string, description: string | null) => {
    try {
      await tasks.update(taskId, { description });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to update description", { description: String(err) });
      throw err;
    }
  };

  return { updateStatus, updatePriority, updateLabel, updateDescription };
}
