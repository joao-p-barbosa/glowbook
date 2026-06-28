import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { startOfWeek, addWeeks, addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Topbar } from "../components/layout/Topbar";
import { hasPermission } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { useAppointments, useProfessionals } from "../features/agenda/queries";
import { NewAppointmentModal } from "../features/agenda/NewAppointmentModal";
import type { ApiAppointment } from "../features/agenda/types";

const ROWS = 22; // 08:00 → 19:00, meia em meia hora
const START_HOUR = 8;
const DOW = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DOW_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function slotIndex(d: Date): number {
  const idx = (d.getHours() - START_HOUR) * 2 + (d.getMinutes() >= 30 ? 1 : 0);
  return Math.max(0, Math.min(ROWS - 1, idx));
}
function spanOf(a: ApiAppointment): number {
  const mins = (new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000;
  return Math.max(1, Math.round(mins / 30));
}
function colorOf(a: ApiAppointment): string {
  return a.professional.color || a.service.color || "#c9958a";
}
function hhmm(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function AgendaPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "appointments.manage");
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeProf, setActiveProf] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const weekEnd = useMemo(() => {
    const e = addDays(weekStart, 6);
    e.setHours(23, 59, 59, 999);
    return e;
  }, [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const todayIdx = days.findIndex((d) => isSameDay(d, new Date()));
  const [selectedDay, setSelectedDay] = useState(todayIdx >= 0 ? todayIdx : 0);

  const { data: appointments = [], isLoading } = useAppointments(weekStart, weekEnd);
  const { data: professionals = [] } = useProfessionals();

  const visible = useMemo(
    () => appointments.filter((a) => activeProf === "all" || a.professional.id === activeProf),
    [appointments, activeProf],
  );

  function dayAppts(dayIndex: number) {
    const day = days[dayIndex];
    return visible
      .filter((a) => isSameDay(new Date(a.startsAt), day))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  const selDate = days[selectedDay];
  const selList = dayAppts(selectedDay);
  const weekLabel = `${format(weekStart, "d", { locale: ptBR })} – ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <>
      <Topbar title="Agenda">
        <div className="search">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" /><path d="m17 17-3.5-3.5" />
          </svg>
          <input type="text" placeholder="Buscar cliente, serviço…" />
        </div>
        <div className="toggle">
          <Link className="active" to="/app/agenda">Agenda</Link>
          <Link to="/app/agenda/lista">Lista</Link>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          Agendar
        </button>}
      </Topbar>

      <div className="agenda-body">
        <div className="cal-wrap">
          {/* filter bar */}
          <div className="filter-bar">
            <div className="datenav">
              <button className="navbtn" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Semana anterior">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-5 5 5 5" /></svg>
              </button>
              <span className="week-range">{weekLabel}</span>
              <button className="navbtn" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Próxima semana">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m8 5 5 5-5 5" /></svg>
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>Hoje</button>
            <div className="chips">
              <button className={`chip${activeProf === "all" ? " active" : ""}`} onClick={() => setActiveProf("all")}>Todos</button>
              {professionals.map((p) => (
                <button
                  key={p.id}
                  className={`chip${activeProf === p.id ? " active" : ""}`}
                  onClick={() => setActiveProf(p.id)}
                >
                  <span className="dot" style={{ background: p.color || "#c9958a" }} />
                  {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* calendar */}
          <div className="cal-scroll">
            <div className="cal">
              <div className="cal-corner" />
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`day-head${i === selectedDay ? " sel" : ""}`}
                  style={{ gridColumn: i + 2, gridRow: 1 }}
                  onClick={() => setSelectedDay(i)}
                >
                  <span className="dow">{DOW[i]}</span>
                  <span className="dnum">
                    {i === selectedDay ? <span className="num-ring">{format(d, "d")}</span> : format(d, "d")}
                  </span>
                </div>
              ))}

              {Array.from({ length: ROWS }, (_, s) => {
                const isHour = s % 2 === 0;
                const hour = START_HOUR + Math.floor(s / 2);
                return (
                  <Fragment key={`r${s}`}>
                    <div className="time-label" style={{ gridRow: s + 2 }}>
                      {isHour ? `${String(hour).padStart(2, "0")}:00` : ""}
                    </div>
                    {Array.from({ length: 7 }, (_, dcol) => (
                      <div
                        key={`c${s}-${dcol}`}
                        className={`cell${isHour ? " hour-line" : ""}`}
                        style={{ gridColumn: dcol + 2, gridRow: s + 2 }}
                      />
                    ))}
                  </Fragment>
                );
              })}

              {visible.map((a) => {
                const start = new Date(a.startsAt);
                const dayIndex = days.findIndex((d) => isSameDay(d, start));
                if (dayIndex < 0) return null;
                const si = slotIndex(start);
                const span = spanOf(a);
                const tall = span >= 2;
                return (
                  <div
                    key={a.id}
                    className="ev"
                    style={{ ["--c" as string]: colorOf(a), gridColumn: dayIndex + 2, gridRow: `${si + 2} / span ${span}` }}
                    onClick={() => setSelectedDay(dayIndex)}
                  >
                    <div className="et">{hhmm(a.startsAt)}</div>
                    <div className="en">{a.client.name}</div>
                    {tall && <div className="es">{a.service.name}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* day panel */}
        <aside className="day-panel">
          <div className="mobile-daystrip">
            {days.map((d, i) => (
              <button key={i} className={`ds-day${i === selectedDay ? " sel" : ""}`} onClick={() => setSelectedDay(i)}>
                <span className="dd">{DOW[i]}</span>
                <span className="dn">{format(d, "d")}</span>
              </button>
            ))}
          </div>
          <div className="day-panel-head">
            <div className="micro">Detalhe do dia</div>
            <h3>{DOW_FULL[selectedDay]}, {format(selDate, "d")}</h3>
            <div className="sub">
              {isLoading ? "Carregando…" : `${selList.length} agendamento${selList.length !== 1 ? "s" : ""} · 08:00 – 19:00`}
            </div>
          </div>
          <div className="day-list">
            {selList.length === 0 && !isLoading && (
              <div className="day-empty">Sem agendamentos neste dia.</div>
            )}
            {selList.map((a) => (
              <div key={a.id} className="dcard" style={{ ["--c" as string]: colorOf(a) }}>
                <div className="bar" />
                <div>
                  <div className="dt">{hhmm(a.startsAt)}</div>
                  <div className="dn">{a.client.name}</div>
                  <div className="dmeta">{a.service.name} · {a.professional.name.split(" ")[0]}</div>
                </div>
              </div>
            ))}
            {canManage && <button className="add-slot" onClick={() => setModalOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
              Adicionar horário
            </button>}
          </div>
        </aside>
      </div>

      <NewAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={format(selDate, "yyyy-MM-dd")}
        professionals={professionals}
      />
    </>
  );
}
