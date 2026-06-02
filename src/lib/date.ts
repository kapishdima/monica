import { addDays, format, parseISO } from "date-fns";

/** Local day key (`YYYY-MM-DD`) — matches the backend's `local_today()` and the
 * format stored in `tasks.plannedFor` / `dailyPlans.date`. */
export function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayKey(): string {
  return dayKey(new Date());
}

export function tomorrowKey(): string {
  return dayKey(addDays(new Date(), 1));
}

/** Human label for a `YYYY-MM-DD` key, e.g. "Mon, Jun 2". */
export function formatDayKey(key: string): string {
  return format(parseISO(key), "EEE, MMM d");
}
