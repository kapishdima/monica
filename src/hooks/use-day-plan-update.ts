import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { type DayRating, plans } from "@/lib/ipc";

/**
 * Persists the end-of-day record on a daily plan: writes via the IPC layer,
 * revalidates the route loaders, and surfaces a toast on failure. Each updater
 * rethrows on error so callers can roll back optimistic UI state. Mirrors
 * `useTaskUpdate`.
 */
export function useDayPlanUpdate(date: string) {
  const revalidator = useRevalidator();

  const updateReflection = async (reflection: string | null) => {
    try {
      await plans.update(date, { reflection: reflection || null });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to save reflection", { description: String(err) });
      throw err;
    }
  };

  const updateRating = async (rating: DayRating | null) => {
    try {
      await plans.update(date, { rating });
      revalidator.revalidate();
    } catch (err) {
      toast.error("Failed to save rating", { description: String(err) });
      throw err;
    }
  };

  return { updateReflection, updateRating };
}
