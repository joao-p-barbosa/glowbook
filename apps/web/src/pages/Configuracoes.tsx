import { useEffect, useMemo, useState } from "react";
import { THEMES, type PermissionKey, type Theme } from "@glowbook/shared";
import { Topbar } from "../components/layout/Topbar";
import { SWATCH } from "../components/layout/ThemeSwitcher";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlusIcon, PencilIcon, TrashIcon } from "../components/icons";
import { applyTheme } from "../lib/theme";
import { initials, formatPrice } from "../lib/format";
import { hasPermission } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { CategoriaModal } from "../features/cadastros/CategoriaModal";
import { UsuarioModal } from "../features/cadastros/UsuarioModal";
import { PapelModal } from "../features/cadastros/PapelModal";
import {
  useCategoriesList,
  useDeleteCategory,
  useDeleteRole,
  useDeleteUser,
  useProfessionalsList,
  usePlans,
  useChangePlan,
  useRolesList,
  useSettings,
  useSaveSettings,
  useSaveTenant,
  useTenant,
  useUsersList,
} from "../features/cadastros/queries";
import type { CadPlan, CadRole, CadServiceCategory, CadSettings, CadUser } from "../features/cadastros/types";

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Fortaleza",
  "America/Cuiaba",
  "America/Recife",
  "America/Bahia",
  "America/Belem",
  "America/Rio_Branco",
];

type ToggleKey = "whatsappEnabled" | "appointmentConfirmMsg" | "reminder24h" | "reminder1h" | "reviewRequest";
type TabId = "brand" | "plan" | "notifications" | "categories" | "users" | "roles";

const NOTIFS: { key: ToggleKey; title: string; desc: string }[] = [
  { key: "appointmentConfirmMsg", title: "Confirmacao de agendamento", desc: "Envia confirmacao ao cliente quando um horario e marcado." },
  { key: "reminder24h", title: "Lembrete 24h antes", desc: "Lembra o cliente um dia antes do atendimento." },
  { key: "reminder1h", title: "Lembrete 1h antes", desc: "Lembra o cliente uma hora antes do atendimento." },
  { key: "reviewRequest", title: "Pedido de avaliacao", desc: "Solicita avaliacao apos o atendimento concluido." },
];

function useCan(permission: PermissionKey) {
  const user = useAuthStore((s) => s.user);
  return hasPermission(user, permission);
}

export function ConfiguracoesPage() {
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState<TabId>("brand");
  const tabs = useMemo(
    () => [
      { id: "brand" as const, label: "Marca", visible: hasPermission(user, "settings.view") },
      { id: "plan" as const, label: "Plano", visible: hasPermission(user, "settings.view") },
      { id: "notifications" as const, label: "Notificacoes", visible: hasPermission(user, "settings.view") },
      { id: "categories" as const, label: "Categorias", visible: hasPermission(user, "categories.view") },
      { id: "users" as const, label: "Usuarios", visible: hasPermission(user, "users.view") },
      { id: "roles" as const, label: "Permissoes", visible: hasPermission(user, "roles.view") },
    ].filter((tab) => tab.visible),
    [user],
  );

  useEffect(() => {
    if (tabs.length && !tabs.some((tab) => tab.id === active)) setActive(tabs[0].id);
  }, [active, tabs]);

  return (
    <>
      <Topbar title="Configuracoes" />
      <div className="content">
        {tabs.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-title">Acesso indisponivel</div>
              <p>Seu usuario nao tem permissao para visualizar configuracoes.</p>
            </div>
          </div>
        ) : (
          <div className="settings-shell">
            <div className="settings-tabs" role="tablist" aria-label="Secoes de configuracoes">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={active === tab.id ? "active" : ""}
                  role="tab"
                  aria-selected={active === tab.id}
                  onClick={() => setActive(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {active === "brand" && <BrandTab />}
            {active === "plan" && <PlanTab />}
            {active === "notifications" && <NotificationsTab />}
            {active === "categories" && <CategoriesTab />}
            {active === "users" && <UsersTab />}
            {active === "roles" && <RolesTab />}
          </div>
        )}
      </div>
    </>
  );
}

function BrandTab() {
  const { data: settings } = useSettings();
  const { data: tenant } = useTenant();
  const saveSettings = useSaveSettings();
  const saveTenant = useSaveTenant();
  const canManage = useCan("settings.manage");

  const [brandName, setBrandName] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [theme, setTheme] = useState<Theme>("rose");
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (settings) {
      setBrandName(settings.brandName);
      if (THEMES.includes(settings.theme as Theme)) setTheme(settings.theme as Theme);
    }
  }, [settings]);
  useEffect(() => {
    if (tenant) setTimezone(tenant.timezone);
  }, [tenant]);

  function pickTheme(t: Theme) {
    setTheme(t);
    setSavedOk(false);
    applyTheme(t);
  }

  async function saveBrand() {
    setSavedOk(false);
    await Promise.all([
      saveSettings.mutateAsync({ brandName, theme }),
      saveTenant.mutateAsync({ name: brandName, timezone, defaultTheme: theme }),
    ]);
    setSavedOk(true);
  }

  const brandPending = saveSettings.isPending || saveTenant.isPending;

  return (
    <section className="card settings-card">
      <h2>Marca &amp; empresa</h2>
      <p className="sub">Identidade exibida no app e nas mensagens aos clientes.</p>

      <div className="settings-grid">
        <div className="field">
          <label htmlFor="cfg-brand">Nome da marca</label>
          <input id="cfg-brand" className="input" value={brandName} disabled={!canManage} onChange={(e) => { setBrandName(e.target.value); setSavedOk(false); }} placeholder="Studio Bella" />
        </div>
        <div className="field">
          <label htmlFor="cfg-tz">Fuso horario</label>
          <select id="cfg-tz" className="input" value={timezone} disabled={!canManage} onChange={(e) => { setTimezone(e.target.value); setSavedOk(false); }}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("America/", "").replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Tema</label>
        <div className="theme-picker">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`tdot${t === theme ? " active" : ""}`}
              style={{ background: SWATCH[t] }}
              onClick={() => pickTheme(t)}
              aria-label={`Tema ${t}`}
              aria-pressed={t === theme}
              disabled={!canManage}
            />
          ))}
        </div>
      </div>

      <div className="settings-foot" style={{ marginTop: 20 }}>
        {savedOk && <span className="save-hint ok">Alteracoes salvas.</span>}
        {canManage && (
          <button className="btn btn-primary" onClick={saveBrand} disabled={brandPending || !brandName.trim()}>
            {brandPending ? "Salvando..." : "Salvar alteracoes"}
          </button>
        )}
      </div>
    </section>
  );
}

function PlanTab() {
  const { data: tenant } = useTenant();
  const { data: plans = [] } = usePlans();
  const change = useChangePlan();
  const canManage = useCan("settings.manage");

  const currentKey = tenant?.plan?.key ?? null;
  const trialMsg =
    tenant?.planStatus === "trial" && tenant?.trialEndsAt
      ? `Teste gratis ate ${new Date(tenant.trialEndsAt).toLocaleDateString("pt-BR")}`
      : null;

  function limitText(p: CadPlan) {
    const prof = p.maxProfessionals == null ? "Profissionais ilimitados" : `${p.maxProfessionals} profissional(is)`;
    const svc = p.maxServices == null ? "Servicos ilimitados" : `${p.maxServices} servicos`;
    const cli = p.maxClients == null ? "Clientes ilimitados" : `${p.maxClients} clientes`;
    return [prof, svc, cli];
  }

  return (
    <section className="card settings-card">
      <h2>Plano &amp; assinatura</h2>
      <p className="sub">
        {tenant?.plan ? `Plano atual: ${tenant.plan.name}.` : "Nenhum plano selecionado."}
        {trialMsg ? ` ${trialMsg}.` : ""}
      </p>

      <div className="plan-grid">
        {plans.map((p) => {
          const isCurrent = p.key === currentKey;
          return (
            <div key={p.id} className={`plan-card${p.highlighted ? " highlighted" : ""}${isCurrent ? " current" : ""}`}>
              {p.highlighted && <span className="plan-badge">Recomendado</span>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                {p.priceCents === 0 ? "Gratis" : formatPrice(p.priceCents)}
                {p.priceCents > 0 && <span className="plan-per">/mes</span>}
              </div>
              <ul className="plan-feats">
                {limitText(p).map((f) => <li key={f}>{f}</li>)}
              </ul>
              {isCurrent ? (
                <button className="btn btn-ghost" disabled>Plano atual</button>
              ) : canManage ? (
                <button
                  className="btn btn-primary"
                  disabled={change.isPending}
                  onClick={() => change.mutate(p.key)}
                >
                  {change.isPending ? "Aplicando..." : "Escolher"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NotificationsTab() {
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();
  const canManage = useCan("settings.manage");
  const wpp = settings?.whatsappEnabled ?? false;

  function toggleNotif(key: ToggleKey, value: boolean) {
    saveSettings.mutate({ [key]: value } as Partial<CadSettings>);
  }

  return (
    <section className="card settings-card">
      <h2>Notificacoes WhatsApp</h2>
      <p className="sub">Automatize a comunicacao com os clientes.</p>

      <div className="toggle-row">
        <div className="tr-text">
          <div className="t">WhatsApp ativo</div>
          <div className="d">Chave geral. Desligado, nenhuma mensagem e enviada.</div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={wpp} disabled={!canManage} onChange={(e) => toggleNotif("whatsappEnabled", e.target.checked)} aria-label="WhatsApp ativo" />
          <span className="track" />
        </label>
      </div>

      {NOTIFS.map((n) => (
        <div className="toggle-row" key={n.key}>
          <div className="tr-text">
            <div className="t">{n.title}</div>
            <div className="d">{n.desc}</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={settings?.[n.key] ?? false} disabled={!canManage || !wpp} onChange={(e) => toggleNotif(n.key, e.target.checked)} aria-label={n.title} />
            <span className="track" />
          </label>
        </div>
      ))}
    </section>
  );
}

function CategoriesTab() {
  const { data: categories = [], isLoading } = useCategoriesList();
  const del = useDeleteCategory();
  const canManage = useCan("categories.manage");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadServiceCategory | null>(null);
  const [toDelete, setToDelete] = useState<CadServiceCategory | null>(null);

  return (
    <>
      <section className="card settings-card">
        <div className="section-head">
          <div>
            <h2>Categorias</h2>
            <p className="sub">Organize o catalogo de servicos.</p>
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><PlusIcon /> Nova categoria</button>}
        </div>
        {isLoading ? <div className="loading-state">Carregando...</div> : categories.length === 0 ? (
          <div className="empty-state"><div className="es-title">Nenhuma categoria</div><p>Crie categorias para agrupar seus servicos.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Categoria</th><th>Servicos</th><th style={{ textAlign: "right" }}>Acoes</th></tr></thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td><div className="td-name">{category.name}</div></td>
                    <td className="td-num">{category._count?.services ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => { setEditing(category); setModalOpen(true); }} aria-label={`Editar ${category.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(category)} aria-label={`Excluir ${category.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CategoriaModal open={modalOpen} category={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir categoria"
        message={`Deseja excluir "${toDelete?.name}"? Os servicos vinculados ficarao sem categoria.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function UsersTab() {
  const { data: users = [], isLoading } = useUsersList();
  const { data: roles = [] } = useRolesList();
  const { data: professionals = [] } = useProfessionalsList();
  const del = useDeleteUser();
  const canManage = useCan("users.manage");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadUser | null>(null);
  const [toDelete, setToDelete] = useState<CadUser | null>(null);

  return (
    <>
      <section className="card settings-card wide-card">
        <div className="section-head">
          <div>
            <h2>Usuarios</h2>
            <p className="sub">Controle acessos da conta e vinculos com a equipe.</p>
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><PlusIcon /> Novo usuario</button>}
        </div>
        {isLoading ? <div className="loading-state">Carregando...</div> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Usuario</th><th>Papel</th><th>Profissional</th><th>Situacao</th><th style={{ textAlign: "right" }}>Acoes</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="row-id">
                        <span className="av">{initials(u.name)}</span>
                        <div><div className="td-name">{u.name}</div><div className="sub">{u.email}</div></div>
                      </div>
                    </td>
                    <td>{u.role?.name ?? <span className="cell-empty">Sem papel</span>}</td>
                    <td>{u.professional?.name ?? <span className="cell-empty">Sem vinculo</span>}</td>
                    <td><span className={`status ${u.status === "active" ? "status-ok" : "status-no"}`}><span className="dot" />{u.status === "active" ? "Ativo" : "Inativo"}</span></td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => { setEditing(u); setModalOpen(true); }} aria-label={`Editar ${u.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(u)} aria-label={`Excluir ${u.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <UsuarioModal key={editing?.id ?? "new-user"} open={modalOpen} user={editing} roles={roles} professionals={professionals} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir usuario"
        message={`Deseja excluir "${toDelete?.name}"?`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function RolesTab() {
  const { data: roles = [], isLoading } = useRolesList();
  const del = useDeleteRole();
  const canManage = useCan("roles.manage");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CadRole | null>(null);
  const [toDelete, setToDelete] = useState<CadRole | null>(null);

  return (
    <>
      <section className="card settings-card wide-card">
        <div className="section-head">
          <div>
            <h2>Permissoes</h2>
            <p className="sub">Defina o que cada papel pode visualizar ou gerenciar.</p>
          </div>
          {canManage && <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><PlusIcon /> Novo papel</button>}
        </div>
        {isLoading ? <div className="loading-state">Carregando...</div> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Papel</th><th>Escopo</th><th>Usuarios</th><th style={{ textAlign: "right" }}>Acoes</th></tr></thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td><div className="td-name">{role.name}</div>{role.description && <div className="sub">{role.description}</div>}</td>
                    <td>{role.permissions.all ? <span className="pill">Acesso total</span> : <span className="cell-empty">Personalizado</span>}</td>
                    <td className="td-num">{role._count?.users ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        {canManage && <button className="icon-btn" onClick={() => { setEditing(role); setModalOpen(true); }} aria-label={`Editar ${role.name}`}><PencilIcon /></button>}
                        {canManage && <button className="icon-btn danger" onClick={() => setToDelete(role)} aria-label={`Excluir ${role.name}`}><TrashIcon /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <PapelModal open={modalOpen} role={editing} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir papel"
        message={`Deseja excluir "${toDelete?.name}"? Papeis em uso nao podem ser removidos.`}
        pending={del.isPending}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
