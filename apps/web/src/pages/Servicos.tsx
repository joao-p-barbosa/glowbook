import { useMemo, useState } from "react";
import { Topbar } from "../components/layout/Topbar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "../components/icons";
import { formatPrice } from "../lib/format";
import { hasPermission } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { ServicoModal } from "../features/cadastros/ServicoModal";
import { useCategoriesList, useServicesList, useDeleteService } from "../features/cadastros/queries";
import type { CadService } from "../features/cadastros/types";

function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

export function ServicosPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "services.manage");
  const { data: services = [], isLoading } = useServicesList();
  const { data: categories = [] } = useCategoriesList();
  const del = useDeleteService();

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadService | null>(null);
  const [toDelete, setToDelete] = useState<CadService | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(term) || s.category?.name.toLowerCase().includes(term),
    );
  }, [services, q]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s: CadService) {
    setEditing(s);
    setModalOpen(true);
  }

  return (
    <>
      <Topbar title="Servicos">
        <div className="search">
          <SearchIcon />
          <input placeholder="Buscar servico..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar servico" />
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openNew}>
            <PlusIcon /> Novo servico
          </button>
        )}
      </Topbar>

      <div className="content">
        <div className="list-toolbar">
          <span className="count">{filtered.length} {filtered.length === 1 ? "servico" : "servicos"}</span>
        </div>

        {isLoading ? (
          <div className="loading-state">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-title">Nenhum servico</div>
              <p>{q ? "Nenhum resultado para a busca." : "Cadastre os servicos do seu catalogo."}</p>
              {!q && canManage && <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Novo servico</button>}
            </div>
          </div>
        ) : (
          <div className="card table-wrap" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Servico</th>
                  <th>Categoria</th>
                  <th>Duracao</th>
                  <th style={{ textAlign: "right" }}>Preco</th>
                  <th style={{ textAlign: "right" }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="row-id">
                        <span className="color-dot" style={{ background: s.color ?? "var(--accent)" }} />
                        <span className="td-name">{s.name}</span>
                      </div>
                    </td>
                    <td>{s.category?.name ?? <span className="cell-empty">-</span>}</td>
                    <td className="td-num">{formatDuration(s.durationMin)}</td>
                    <td className="td-num" style={{ textAlign: "right" }}>{formatPrice(s.priceCents)}</td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => openEdit(s)} aria-label={`Editar ${s.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(s)} aria-label={`Excluir ${s.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ServicoModal open={modalOpen} service={editing} categories={categories} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir servico"
        message={`Deseja excluir "${toDelete?.name}"? Agendamentos passados sao preservados.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
