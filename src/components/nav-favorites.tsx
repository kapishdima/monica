import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  FolderLibraryIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { useProjectDialogs } from "@/components/projects/project-dialogs-provider";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Project } from "@/lib/ipc";

export function NavFavorites() {
  const { isMobile } = useSidebar();
  const { openCreate } = useProjectDialogs();
  const projects = (useRouteLoaderData("root") as Project[] | undefined) ?? [];
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupAction title="Add project" onClick={openCreate}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        <span className="sr-only">Add project</span>
      </SidebarGroupAction>
      <SidebarMenu>
        {projects.length === 0 && (
          <SidebarMenuItem>
            <span className="px-2 text-sidebar-foreground/60 text-xs">No projects yet</span>
          </SidebarMenuItem>
        )}
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton
              render={<Link to={`/projects/${project.id}`} title={project.name} />}
            >
              <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} />
              <span>{project.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuAction showOnHover className="aria-expanded:bg-muted" />}
              >
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={() => setEditProject(project)}>
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    strokeWidth={2}
                    className="text-muted-foreground"
                  />
                  <span>Edit project</span>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteProject(project)}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  <span>Delete project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {editProject && (
        <ProjectFormDialog
          mode="edit"
          project={editProject}
          open={!!editProject}
          onOpenChange={(open) => !open && setEditProject(null)}
        />
      )}
      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          open={!!deleteProject}
          onOpenChange={(open) => !open && setDeleteProject(null)}
        />
      )}
    </SidebarGroup>
  );
}
