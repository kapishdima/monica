import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { tasks, tray } from "@/lib/ipc";

/**
 * Assigning a task to a day (or clearing it): writes `plannedFor` via the IPC
 * layer, rebuilds the tray menu, then revalidates the route loaders. Rethrows
 * on failure after a toast. Mirrors `useTaskUpdate`.
 */
export function useTaskPlanning() {
  const revalidator = useRevalidator();

  const planFor = async (taskId: string, date: string | null) => {
    try {
      await tasks.update(taskId, { plannedFor: date });
      await tray.refresh();
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to plan task", { description: String(err) });
      throw err;
    }
  };

  return { planFor };
}
