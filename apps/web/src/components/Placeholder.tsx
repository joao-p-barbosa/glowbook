import { Topbar } from "./layout/Topbar";

export function Placeholder({ title }: { title: string }) {
  return (
    <>
      <Topbar title={title} />
      <div className="content">
        <div className="empty-state">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 4.6L19 9.2l-3.6 3.3.9 5L12 14.9 7.7 17.5l.9-5L5 9.2l5.1-1.6z" />
          </svg>
          <div className="es-title">{title}</div>
          <p>Este módulo chega na <strong>Fase 4</strong> (cadastros operacionais).</p>
        </div>
      </div>
    </>
  );
}
