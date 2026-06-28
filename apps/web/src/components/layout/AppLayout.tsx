import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "../../store/auth";
import { api } from "../../lib/api";

export interface LayoutContext {
  openSidebar: () => void;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST", skipAuthRetry: true });
    } catch {
      /* ignora */
    }
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app">
      {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      <div className="main">
        <Outlet context={{ openSidebar: () => setSidebarOpen(true) } satisfies LayoutContext} />
      </div>
    </div>
  );
}
