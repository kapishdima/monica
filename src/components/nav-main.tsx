import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { menu } from "@/config/menu";

const items = menu.filter((item) => item.position === "header");

export function NavMain() {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton render={<Link to={item.url} />}>
            <HugeiconsIcon icon={item.icon} strokeWidth={2} />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
