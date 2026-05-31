import { AppLayout } from "@/components/layout/app-layout";
import { Home } from "@/pages/home";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
        {
            path: '/',
            index: true,
            Component: Home,
        }
    ]
  },
]);