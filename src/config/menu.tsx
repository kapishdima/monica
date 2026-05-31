import {
  CalendarIcon,
  FolderLibraryIcon,
  HomeIcon,
  InboxIcon,
  MessageQuestionIcon,
  SearchIcon,
  Settings05Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ComponentType } from "react";
import type { LoaderFunction } from "react-router";
import { Calendar } from "@/pages/calendar";
import { Help } from "@/pages/help";
import { Home } from "@/pages/home";
import { Inbox } from "@/pages/inbox";
import { Projects } from "@/pages/projects";
import { Search } from "@/pages/search";
import { Settings } from "@/pages/settings";

export type MenuPosition = "header" | "footer";

export interface MenuItem {
  label: string;
  icon: IconSvgElement;
  url: string;
  component: ComponentType;
  position: MenuPosition;
  /** Optional react-router data loader; the router wires it onto the route. */
  loader?: LoaderFunction;
}

export const menu: MenuItem[] = [
  { label: "Search", icon: SearchIcon, url: "/search", component: Search, position: "header" },
  { label: "Home", icon: HomeIcon, url: "/", component: Home, position: "header" },
  {
    label: "Projects",
    icon: FolderLibraryIcon,
    url: "/projects",
    component: Projects,
    position: "header",
  },
  { label: "Inbox", icon: InboxIcon, url: "/inbox", component: Inbox, position: "header" },
  {
    label: "Calendar",
    icon: CalendarIcon,
    url: "/calendar",
    component: Calendar,
    position: "footer",
  },
  {
    label: "Settings",
    icon: Settings05Icon,
    url: "/settings",
    component: Settings,
    position: "footer",
  },
  { label: "Help", icon: MessageQuestionIcon, url: "/help", component: Help, position: "footer" },
];
