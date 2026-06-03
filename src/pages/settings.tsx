import { CloudUploadIcon, Csv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { PropertyGroup, SectionLabel } from "@/components/detail/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { imports, type Settings as ISettings, settings } from "@/lib/ipc";
import { cn } from "@/lib/utils";

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

      <ImportSection />
    </div>
  );
};

const ImportSection: React.FC = () => {
  const revalidator = useRevalidator();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  const pickFile = (selected: File | null | undefined) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a Linear CSV export (.csv)");
      return;
    }
    setFile(selected);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length > 1) {
      toast.error("Drop a single .csv file");
      return;
    }
    pickFile(dropped[0]);
  };

  const onImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const csv = await file.text();
      const s = await imports.linearCsv(csv);
      const projects = s.projectsCreated + s.projectsReused;
      const skipped = s.skippedCanceled + s.skippedNoProject;
      toast.success(
        `Imported ${s.tasksImported} ${s.tasksImported === 1 ? "task" : "tasks"} into ${projects} ${
          projects === 1 ? "project" : "projects"
        }`,
        skipped > 0
          ? { description: `Skipped ${skipped} (${s.skippedCanceled} canceled, ${s.skippedNoProject} without a project)` }
          : undefined,
      );
      setFile(null);
      revalidator.revalidate();
    } catch (err) {
      toast.error("Import failed", { description: String(err) });
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Import</SectionLabel>
      <PropertyGroup>
        <div className="flex flex-col gap-3 px-2 py-2">
          <span className="text-xs text-muted-foreground">
            Import projects and tasks from a Linear CSV export. Existing projects are matched by name; nothing is deleted.
          </span>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:bg-muted/40",
              dragging && "border-primary/60 bg-primary/5",
            )}
          >
            <HugeiconsIcon
              icon={file ? Csv01Icon : CloudUploadIcon}
              className="size-6 text-muted-foreground"
              strokeWidth={1.8}
            />
            {file ? (
              <span className="text-sm font-medium">{file.name}</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Drag a <span className="font-medium text-foreground">.csv</span> here, or click to choose
              </span>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="flex justify-end">
            <Button onClick={onImport} disabled={!file || importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
        </div>
      </PropertyGroup>
    </section>
  );
};
