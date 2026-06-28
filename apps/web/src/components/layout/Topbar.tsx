import type { ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { LayoutContext } from "./AppLayout";

interface Props {
  title: string;
  children?: ReactNode; // ações à direita (search, toggle, botões)
}

export function Topbar({ title, children }: Props) {
  const { openSidebar } = useOutletContext<LayoutContext>();

  return (
    <header className="topbar">
      <button className="hamburger" onClick={openSidebar} aria-label="Abrir menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>
      <h1 className="page-title">{title}</h1>
      <div className="topbar-spacer" />
      <ThemeSwitcher />
      {children}
    </header>
  );
}
