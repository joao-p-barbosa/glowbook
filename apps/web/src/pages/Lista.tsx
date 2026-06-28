import { useMemo } from "react";
import { Link } from "react-router-dom";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Topbar } from "../components/layout/Topbar";
import { useAppointments } from "../features/agenda/queries";
import { formatPrice } from "../lib/format";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Agendado", cls: "status-wait" },
  confirmed: { label: "Confirmado", cls: "status-ok" },
  pending: { label: "Pendente", cls: "status-wait" },
  completed: { label: "Concluído", cls: "status-ok" },
  canceled: { label: "Cancelado", cls: "status-no" },
  no_show: { label: "Faltou", cls: "status-no" },
};

export function ListaPage() {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekEnd = useMemo(() => endOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const { data: appointments = [], isLoading } = useAppointments(weekStart, weekEnd);

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <>
      <Topbar title="Lista">
        <div className="toggle">
          <Link to="/app/agenda">Agenda</Link>
          <Link className="active" to="/app/agenda/lista">Lista</Link>
        </div>
      </Topbar>

      <div className="content">
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-dim)" }}>
                <th style={th}>Data</th>
                <th style={th}>Horário</th>
                <th style={th}>Cliente</th>
                <th style={th}>Serviço</th>
                <th style={th}>Profissional</th>
                <th style={th}>Valor</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} style={td}><div className="loading-state">Carregando…</div></td></tr>
              )}
              {!isLoading && sorted.length === 0 && (
                <tr><td colSpan={7} style={td}><div className="day-empty">Nenhum agendamento nesta semana.</div></td></tr>
              )}
              {sorted.map((a) => {
                const st = STATUS_LABEL[a.status] ?? { label: a.status, cls: "status-wait" };
                return (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <td style={td}>{format(new Date(a.startsAt), "EEE, d MMM", { locale: ptBR })}</td>
                    <td style={td}>{format(new Date(a.startsAt), "HH:mm")}</td>
                    <td style={{ ...td, fontWeight: 500 }}>{a.client.name}</td>
                    <td style={td}>{a.service.name}</td>
                    <td style={td}>{a.professional.name}</td>
                    <td style={td}>{formatPrice(a.priceCents)}</td>
                    <td style={td}><span className={`status ${st.cls}`}><span className="dot" />{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: "12px 16px", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 500 };
const td: React.CSSProperties = { padding: "12px 16px" };
