import {
  Add01Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChartIcon,
  Copy01Icon,
  Delete02Icon,
  DeleteIcon,
  File01Icon,
  LayoutBottomIcon,
  LinkIcon,
  MoreHorizontalCircle01Icon,
  NotificationIcon,
  RedoIcon,
  Settings05Icon,
  StarIcon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";
import { useProjectDialogs } from "@/components/projects/project-dialogs-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = [
  [
    {
      label: "Customize Page",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    },
    {
      label: "Turn into wiki",
      icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
    },
  ],
  [
    {
      label: "Copy Link",
      icon: <HugeiconsIcon icon={LinkIcon} strokeWidth={2} />,
    },
    {
      label: "Duplicate",
      icon: <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />,
    },
    {
      label: "Move to",
      icon: <HugeiconsIcon icon={RedoIcon} strokeWidth={2} />,
    },
    {
      label: "Move to Trash",
      icon: <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />,
    },
  ],
  [
    {
      label: "Undo",
      icon: <HugeiconsIcon icon={UndoIcon} strokeWidth={2} />,
    },
    {
      label: "View analytics",
      icon: <HugeiconsIcon icon={ChartIcon} strokeWidth={2} />,
    },
    {
      label: "Version History",
      icon: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
    },
    {
      label: "Show delete pages",
      icon: <HugeiconsIcon icon={DeleteIcon} strokeWidth={2} />,
    },
    {
      label: "Notifications",
      icon: <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />,
    },
  ],
  [
    {
      label: "Import",
      icon: <HugeiconsIcon icon={ArrowUpIcon} strokeWidth={2} />,
    },
    {
      label: "Export",
      icon: <HugeiconsIcon icon={ArrowDownIcon} strokeWidth={2} />,
    },
  ],
];
export function NavActions() {
  const { openCreate } = useProjectDialogs();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button variant="outline" size="sm" onClick={openCreate}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        Add project
      </Button>
    </div>
  );
}
