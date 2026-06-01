import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Full-width, left-aligned sidebar property row — Linear-style.
export const PROPERTY_ROW =
  "h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-foreground [&_svg]:text-muted-foreground";

/** Small muted heading shown above a property group. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-2 text-xs font-medium tracking-wide text-muted-foreground">{children}</h2>
  );
}

/** Subtle bordered container that holds one section's rows, matching Linear's sidebar. */
export function PropertyGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-0.5 rounded-lg border p-1">{children}</div>;
}

export interface PropertyOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

/**
 * Generic inline-editable property row: a dropdown that optimistically updates
 * its displayed value and reverts if `persist` rejects. The concrete
 * status/priority/label rows are explicit variants built on top of this.
 */
export function PropertySelect<T extends string>({
  value: initial,
  options,
  persist,
}: {
  value: T;
  options: PropertyOption<T>[];
  persist: (value: T) => Promise<void>;
}) {
  const [value, setValue] = useState<T>(initial);
  const current = options.find((option) => option.value === value);

  const onChange = async (next: T) => {
    const prev = value;
    setValue(next);
    try {
      await persist(next);
    } catch {
      setValue(prev);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className={cn(PROPERTY_ROW, !value && "text-muted-foreground")} />
        }
      >
        {current?.icon}
        <span className="truncate">{current?.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.icon}
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
