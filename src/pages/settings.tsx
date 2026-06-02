import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PropertyGroup, SectionLabel } from "@/components/detail/property";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Settings as ISettings, settings } from "@/lib/ipc";

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<ISettings | null>(null);

  useEffect(() => {
    settings
      .get()
      .then(setConfig)
      .catch(() => {});
  }, []);

  const onNotificationTime = async (value: string) => {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, notificationTime: value });
    try {
      const updated = await settings.update({ notificationTime: value });
      setConfig(updated);
    } catch (err) {
      setConfig(prev);
      toast.error("Failed to save settings", { description: String(err) });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Preferences for monica.</p>
      </header>

      <section className="flex flex-col gap-2">
        <SectionLabel>Planning</SectionLabel>
        <PropertyGroup>
          <div className="flex items-center justify-between gap-4 px-2 py-1.5">
            <div className="flex flex-col">
              <Label htmlFor="notification-time" className="text-sm font-normal">
                Evening reminder
              </Label>
              <span className="text-xs text-muted-foreground">
                When to remind you to review today and plan tomorrow.
              </span>
            </div>
            <Input
              id="notification-time"
              type="time"
              value={config?.notificationTime ?? ""}
              disabled={!config}
              onChange={(e) => onNotificationTime(e.target.value)}
              className="w-32 shrink-0"
            />
          </div>
        </PropertyGroup>
      </section>
    </div>
  );
};
