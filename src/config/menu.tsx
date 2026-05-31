import type { ComponentType } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  SearchIcon,
  HomeIcon,
  InboxIcon,
  CalendarIcon,
  Settings05Icon,
  MessageQuestionIcon,
} from "@hugeicons/core-free-icons";

import { Home } from "@/pages/home";
import { Search } from "@/pages/search";
import { Inbox } from "@/pages/inbox";
import { Calendar } from "@/pages/calendar";
import { Settings } from "@/pages/settings";
import { Help } from "@/pages/help";

export type MenuPosition = "header" | "footer";

export interface MenuItem {
  label: string;
  icon: IconSvgElement;
  url: string;
  component: ComponentType;
  position: MenuPosition;
}

export const menu: MenuItem[] = [
  { label: "Search", icon: SearchIcon, url: "/search", component: Search, position: "header" },
  { label: "Home", icon: HomeIcon, url: "/", component: Home, position: "header" },
  { label: "Inbox", icon: InboxIcon, url: "/inbox", component: Inbox, position: "header" },
  { label: "Calendar", icon: CalendarIcon, url: "/calendar", component: Calendar, position: "footer" },
  { label: "Settings", icon: Settings05Icon, url: "/settings", component: Settings, position: "footer" },
  { label: "Help", icon: MessageQuestionIcon, url: "/help", component: Help, position: "footer" },
];
