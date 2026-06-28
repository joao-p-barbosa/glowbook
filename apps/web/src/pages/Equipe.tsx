import { useMemo, useState } from "react";
import { Topbar } from "../components/layout/Topbar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "../components/icons";
import { initials as toInitials } from "../lib/format";
import { hasPermission } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { EquipeModal } from "../features/cadastros/EquipeModal";
import { useProfessionalsList, useServicesList, useDeleteProfessional } from "../features/cadastros/queries";
import type { CadProfessional } from "../features/cadastros/types";

export function EquipePage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "professionals.manage");
  const { data: professionals = [], isLoading } = useProfessionalsList();
  const { data: services = [] } = useServicesList();
  const del = useDeleteProfessional();

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadProfessional | null>(null);
  const [toDelete, setToDelete] = useState<CadProfessional | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return professionals;
    return professionals.filter(
      (p) => p.name.toLowerCase().includes(term) || p.roleTitle?.toLowerCase().includes(term),
    );
  }, [professionals, q]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: CadProfessional) {
    setEditing(p);
    setModalOpen(true);
  }

  return (
    <>
      <Topbar title="Equipe">
        <div className="search">
          <SearchIcon />
          <input placeholder="Buscar profissional…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar profissional" />
        </div>
        {canManage && <button className="btn btn-primary" onClick={openNew}>
          <PlusIcon /> Novo profissional
        </button>}
      </Topbar>

      <div className="content">
        <div className="list-toolbar">
          <span className="count">{filtered.length} {filtered.length === 1 ? "profissional" : "profissionais"}</span>
        </div>

        {isLoading ? (
          <div className="loading-state">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-title">Nenhum profissional</div>
              <p>{q ? "Nenhum resultado para a busca." : "Monte a equipe do seu estúdio."}</p>
              {!q && canManage && <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Novo profissional</button>}
            </div>
          </div>
        ) : (
          <div className="card table-wrap" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>Função</th>
                  <th>Serviços</th>
                  <th>Situação</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="row-id">
                        <span className="av" style={{ background: p.color ?? "var(--accent)" }}>{p.initials || toInitials(p.name)}</span>
                        <div>
                          <div className="td-name">{p.name}</div>
                          {p.email && <div className="sub">{p.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{p.roleTitle || <span className="cell-empty">—</span>}</td>
                    <td>
                      {p.professionalServices.length
                        ? <span className="pill">{p.professionalServices.length} serviço{p.professionalServices.length > 1 ? "s" : ""}</span>
                        : <span className="cell-empty">—</span>}
                    </td>
                    <td>
                      <span className={`status ${p.status === "active" ? "status-ok" : "status-no"}`}>
                        <span className="dot" />{p.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(p)} aria-label={`Excluir ${p.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EquipeModal open={modalOpen} professional={editing} services={services} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir profissional"
        message={`Deseja excluir "${toDelete?.name}"? Agendamentos passados são preservados.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
