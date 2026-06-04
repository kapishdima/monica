import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";

/**
 * Shared updater logic, reused by the launch auto-check (`useUpdater`) and the
 * manual "Check for updates" button in Settings. The endpoint and signature
 * verification are configured in `src-tauri/tauri.conf.json`.
 */

/** Downloads, installs and relaunches into the given update, with a progress toast. */
export async function installUpdate(update: Update) {
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
    throw err;
  }
}

/** Non-intrusive "update available" toast with an action that installs it. */
export function promptUpdate(update: Update) {
  toast(`Доступна версия ${update.version}`, {
    description: "Готово к установке",
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: "Обновить",
      onClick: () => {
        void installUpdate(update);
      },
    },
  });
}

/**
 * Launch auto-check: prompts only when an update exists; any failure (offline,
 * dev build, no signed release) is logged and swallowed so it never blocks the UI.
 */
export async function checkForUpdateOnLaunch() {
  try {
    const update = await check();
    if (update) promptUpdate(update);
  } catch (err) {
    console.error("Update check failed", err);
  }
}

/**
 * Manual check (Settings button): if an update is found it is installed right
 * away (the click is the confirmation); otherwise the user is told they're up to
 * date. Unlike the launch check this surfaces errors instead of swallowing them.
 */
export async function manualCheckAndInstall() {
  let update: Update | null;
  try {
    update = await check();
  } catch (err) {
    toast.error("Не удалось проверить обновления", { description: String(err) });
    return;
  }

  if (!update) {
    toast.success("У вас установлена последняя версия");
    return;
  }

  await installUpdate(update);
}
