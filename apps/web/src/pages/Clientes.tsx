import { useMemo, useState } from "react";
import { Topbar } from "../components/layout/Topbar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "../components/icons";
import { initials } from "../lib/format";
import { hasPermission } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { ClienteModal } from "../features/cadastros/ClienteModal";
import { useClientsList, useDeleteClient } from "../features/cadastros/queries";
import type { CadClient } from "../features/cadastros/types";

const TAG_LABEL: Record<string, string> = { vip: "VIP", new: "Novo", regular: "Regular" };

export function ClientesPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "clients.manage");
  const { data: clients = [], isLoading } = useClientsList();
  const del = useDeleteClient();

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadClient | null>(null);
  const [toDelete, setToDelete] = useState<CadClient | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term),
    );
  }, [clients, q]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(c: CadClient) {
    setEditing(c);
    setModalOpen(true);
  }

  return (
    <>
      <Topbar title="Clientes">
        <div className="search">
          <SearchIcon />
          <input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" />
        </div>
        {canManage && <button className="btn btn-primary" onClick={openNew}>
          <PlusIcon /> Novo cliente
        </button>}
      </Topbar>

      <div className="content">
        <div className="list-toolbar">
          <span className="count">{filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}</span>
        </div>

        {isLoading ? (
          <div className="loading-state">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-title">Nenhum cliente</div>
              <p>{q ? "Nenhum resultado para a busca." : "Cadastre o primeiro cliente do seu estúdio."}</p>
              {!q && canManage && <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Novo cliente</button>}
            </div>
          </div>
        ) : (
          <div className="card table-wrap" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Classificação</th>
                  <th>Situação</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="row-id">
                        <span className="av" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{initials(c.name)}</span>
                        <div>
                          <div className="td-name">{c.name}</div>
                          {c.email && <div className="sub">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{c.phone || <span className="cell-empty">—</span>}</td>
                    <td>
                      {c.tag ? <span className={`tag-pill tag-${c.tag}`}>{TAG_LABEL[c.tag] ?? c.tag}</span> : <span className="cell-empty">—</span>}
                    </td>
                    <td>
                      <span className={`status ${c.status === "active" ? "status-ok" : "status-no"}`}>
                        <span className="dot" />{c.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => openEdit(c)} aria-label={`Editar ${c.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(c)} aria-label={`Excluir ${c.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClienteModal open={modalOpen} client={editing} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir cliente"
        message={`Deseja excluir "${toDelete?.name}"? O histórico de agendamentos é preservado.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
