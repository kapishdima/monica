import { AppLayout } from "@/components/layout/app-layout";
import { menu } from "@/config/menu";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: menu.map((item) => ({ path: item.url, Component: item.component })
    ),
  },
]);
