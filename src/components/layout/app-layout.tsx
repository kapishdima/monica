import { WhichlyProvider } from "@whichly/react";
import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { ProjectDialogsProvider } from "@/components/projects/project-dialogs-provider";
import { TaskDialogsProvider } from "@/components/tasks/task-dialogs-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useTrayNavigation } from "@/hooks/use-tray-navigation";

export const AppLayout: React.FC = () => {
  useTrayNavigation();

  return (
    <ProjectDialogsProvider>
      <TaskDialogsProvider>
        <SidebarProvider>
          <AppSidebar variant="floating" />
          <SidebarInset className="container">
            <AppHeader />
            <WhichlyProvider>
              <Outlet />
            </WhichlyProvider>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </TaskDialogsProvider>
    </ProjectDialogsProvider>
  );
};
