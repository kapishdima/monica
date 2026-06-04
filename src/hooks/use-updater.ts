import { useEffect, useRef } from "react";
import { checkForUpdateOnLaunch } from "@/lib/updater";

/**
 * Checks GitHub releases for a newer version once on app launch and, if one is
 * available, prompts the user via a toast. The manual "Check for updates" button
 * in Settings reuses the same underlying logic (see `@/lib/updater`).
 */
export function useUpdater() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    void checkForUpdateOnLaunch();
  }, []);
}
