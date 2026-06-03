import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Checks GitHub releases for a newer version once on app launch. If one is
 * available, prompts the user via a toast; on confirm it downloads, installs,
 * and relaunches into the new version. Failures (offline, dev build, no signed
 * release) are logged and swallowed so a failed check never blocks the UI.
 */
export function useUpdater() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const update = await check();
        if (!update) return;

        toast(`Доступна версия ${update.version}`, {
          description: "Готово к установке",
          duration: Number.POSITIVE_INFINITY,
          action: {
            label: "Обновить",
            onClick: async () => {
              const progress = toast.loading("Загрузка обновления…", {
                duration: Number.POSITIVE_INFINITY,
              });
              try {
                await update.downloadAndInstall();
                await relaunch();
              } catch (err) {
                toast.error("Не удалось установить обновление", {
                  id: progress,
                  description: String(err),
                });
              }
            },
          },
        });
      } catch (err) {
        console.error("Update check failed", err);
      }
    })();
  }, []);
}
