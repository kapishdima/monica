import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Deep-links from the tray/notification: the Rust side emits a `navigate` event
 * with a route path (e.g. `/tasks/<id>`) when a tray task is clicked, after
 * showing the window. This routes the SPA to it.
 */
export function useTrayNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const unlisten = listen<string>("navigate", (event) => {
      navigate(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);
}
