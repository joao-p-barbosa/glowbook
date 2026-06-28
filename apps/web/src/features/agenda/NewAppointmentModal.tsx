import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import { useClients, useServices } from "./queries";
import type { ApiProfessional } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDate: string; // yyyy-MM-dd
  professionals: ApiProfessional[];
}

export function NewAppointmentModal({ open, onClose, defaultDate, professionals }: Props) {
  const qc = useQueryClient();
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [professionalId, setProfessionalId] = useState("");
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedService = services.find((s) => s.id === serviceId);

  const mutation = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      return api("/appointments", {
        method: "POST",
        body: { clientId, serviceId, professionalId, startsAt, notes: notes || undefined },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      reset();
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Erro ao agendar");
    },
  });

  function reset() {
    setClientId("");
    setServiceId("");
    setNotes("");
    setError(null);
  }

  function submit() {
    setError(null);
    if (!clientId || !serviceId || !professionalId) {
      setError("Preencha cliente, serviço e profissional");
      return;
    }
    mutation.mutate();
  }

  if (!open) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Novo agendamento">
        <div className="modal-head">
          <h2>Novo Agendamento</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div className="appt-form">
          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="two">
            <div className="field">
              <label>Data</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Horário</label>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Profissional</label>
            <select className="input" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
              <option value="">Selecionar profissional…</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.roleTitle ? ` · ${p.roleTitle}` : ""}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Cliente</label>
            <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Selecionar cliente…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Serviço</label>
            <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">Selecionar serviço do catálogo…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMin}min · {formatPrice(s.priceCents)}
                </option>
              ))}
            </select>
            {selectedService && (
              <span className="micro" style={{ marginTop: 4 }}>
                Duração {selectedService.durationMin}min · {formatPrice(selectedService.priceCents)}
              </span>
            )}
          </div>

          <div className="field">
            <label>Observações</label>
            <textarea
              className="input"
              placeholder="Preferências, alergias, anotações…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Confirmar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
