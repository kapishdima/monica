import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { ProjectDialogsProvider } from "@/components/projects/project-dialogs-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const AppLayout: React.FC = () => {
  return (
    <ProjectDialogsProvider>
      <SidebarProvider>
        <AppSidebar variant="floating" />
        <SidebarInset>
          <AppHeader />
          <div className="container">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </ProjectDialogsProvider>
  );
};
