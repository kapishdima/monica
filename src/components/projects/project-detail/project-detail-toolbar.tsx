import {
  Delete02Icon,
  Edit02Icon,
  GithubIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectDetail } from "./project-detail-context";

/** Action cluster: edit and a more-actions menu (connect GitHub, delete). */
export function ProjectDetailToolbar() {
  const {
    state: { project },
    actions: { openEdit, openDelete, openConnect },
  } = useProjectDetail();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openEdit}
        title="Edit project"
        aria-label="Edit project"
      >
        <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="More actions" />}
        >
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={openEdit}>
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            <span>Edit project</span>
          </DropdownMenuItem>
          {!project.githubUrl && (
            <DropdownMenuItem onClick={openConnect}>
              <HugeiconsIcon icon={GithubIcon} strokeWidth={2} />
              <span>Connect GitHub</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={openDelete}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            <span>Delete project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
