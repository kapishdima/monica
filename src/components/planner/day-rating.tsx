import {
  ConfusedIcon,
  LaughingIcon,
  NeutralIcon,
  SadIcon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type React from "react";
import type { DayRating } from "@/lib/ipc";
import { cn } from "@/lib/utils";

const icons: Record<DayRating, IconSvgElement> = {
  great: LaughingIcon,
  good: SmileIcon,
  okay: NeutralIcon,
  bad: ConfusedIcon,
  terrible: SadIcon,
};

const colors: Record<DayRating, string> = {
  great: "text-emerald-500",
  good: "text-green-500",
  okay: "text-muted-foreground",
  bad: "text-orange-500",
  terrible: "text-red-500",
};

export const DAY_RATING_LABELS: Record<DayRating, string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  bad: "Bad",
  terrible: "Terrible",
};

export const DAY_RATING_OPTIONS: DayRating[] = ["great", "good", "okay", "bad", "terrible"];

/** Read-only, colored day-rating glyph — mirrors `TaskStatusIcon`. */
export const DayRatingIcon: React.FC<{ rating: DayRating; className?: string }> = ({
  rating,
  className,
}) => (
  <HugeiconsIcon
    icon={icons[rating]}
    strokeWidth={1.5}
    className={cn("size-4 shrink-0", colors[rating], className)}
  />
);
