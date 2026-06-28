import { NavLink } from "react-router-dom";
import type { PermissionKey } from "@glowbook/shared";
import { useAuthStore } from "../../store/auth";
import { initials } from "../../lib/format";
import { hasPermission } from "../../lib/permissions";

const ICONS: Record<string, string> = {
  agenda: '<path d="M4 6.5h12M4 6.5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 16 6.5v9A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5v-9Z" /><path d="M7 3v3M13 3v3M4 9.5h12" />',
  lista: '<path d="M7 6h9M7 10h9M7 14h9" /><circle cx="4" cy="6" r=".9"/><circle cx="4" cy="10" r=".9"/><circle cx="4" cy="14" r=".9"/>',
  servicos: '<path d="M6.5 6.5 13.5 13.5M13.5 6.5 6.5 13.5" /><circle cx="5" cy="5" r="1.6"/><circle cx="15" cy="15" r="1.6"/><circle cx="15" cy="5" r="1.6"/><circle cx="5" cy="15" r="1.6"/>',
  equipe: '<circle cx="7.5" cy="7" r="2.4"/><path d="M3.5 16c0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8" /><circle cx="13.8" cy="7.6" r="1.9"/><path d="M12.5 12.6c2 .1 3.8 1.5 3.8 3.4" />',
  config: '<circle cx="10" cy="10" r="2.4"/><path d="M10 3.2v1.6M10 15.2v1.6M3.2 10h1.6M15.2 10h1.6M5.2 5.2l1.1 1.1M13.7 13.7l1.1 1.1M14.8 5.2l-1.1 1.1M6.3 13.7l-1.1 1.1" />',
  clientes: '<circle cx="10" cy="7" r="2.6"/><path d="M4.5 16.2c0-2.6 2.4-4.4 5.5-4.4s5.5 1.8 5.5 4.4" />',
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      className="ico"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }}
    />
  );
}

const NAV: Array<{
  section: string;
  items: Array<{ id: string; label: string; to: string; permission: PermissionKey }>;
}> = [
  {
    section: "Principal",
    items: [
      { id: "agenda", label: "Agendamento", to: "/app/agenda", permission: "appointments.view" },
      { id: "clientes", label: "Clientes", to: "/app/clientes", permission: "clients.view" },
    ],
  },
  {
    section: "Cadastros",
    items: [
      { id: "servicos", label: "Servicos", to: "/app/servicos", permission: "services.view" },
      { id: "equipe", label: "Equipe", to: "/app/equipe", permission: "professionals.view" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { id: "config", label: "Configuracoes", to: "/app/configuracoes", permission: "settings.view" },
    ],
  },
];

interface Props {
  open: boolean;
  onNavigate: () => void;
  onLogout: () => void;
}

export function Sidebar({ open, onNavigate, onLogout }: Props) {
  const user = useAuthStore((s) => s.user);
  const brand = user?.tenant?.name ?? "Glowbook";
  const visibleNav = NAV.map((sec) => ({
    ...sec,
    items: sec.items.filter((it) => hasPermission(user, it.permission)),
  })).filter((sec) => sec.items.length > 0);

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-brand brand">
        <div className="row" style={{ gap: 7 }}>
          <span className="glyph">*</span>
          <span className="word">{brand}</span>
        </div>
        <span className="micro tag">Gestao &amp; Agenda</span>
      </div>

      {visibleNav.map((sec) => (
        <div className="nav-section" key={sec.section}>
          <div className="micro">{sec.section}</div>
          {sec.items.map((it) => (
            <NavLink
              key={it.id}
              to={it.to}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              onClick={onNavigate}
            >
              <Icon name={it.id} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sidebar-user">
        <div className="avatar">{initials(user?.name ?? "?")}</div>
        <div>
          <div className="name">{user?.name ?? "-"}</div>
          {user?.role?.name && <span className="role-badge">{user.role.name}</span>}
        </div>
        <button className="sidebar-logout" onClick={onLogout} aria-label="Sair" title="Sair">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M13 14l4-4-4-4M17 10H8" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
