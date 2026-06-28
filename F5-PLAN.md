# Glowbook — Plano F5 (Configurações avançadas)

Objetivo: completar a lacuna da F4 (CRUD de categorias) e entregar gestão de **usuários**, **papéis/permissões** e refino de **notificações**. Backend + frontend.

## Estado atual (relevante para F5)
- `Role.permissionsJson` e `User.roleId` existem no schema, **mas permissões não são aplicadas em lugar nenhum**. JWT carrega `roleId` (`authMiddleware`).
- **Não existem** rotas/módulos para `categories`, `roles`, `users`. Rotas montadas em `apps/api/src/routes.ts`.
- Padrão de módulo API: `modules/<x>/{x.routes,x.controller,x.service}.ts` (ver `clients`). Respostas = JSON puro (sem envelope). DELETE = exclusão lógica (`deletedAt`) onde houver coluna.
- Padrão frontend cadastro: `pages/*` + `features/cadastros/{types,queries}.ts` + `*Modal.tsx` (RHF + zodResolver, schemas `@glowbook/shared`). CSS em `styles/app.css` (seção F4 reutilizável).
- **Armadilha conhecida**: `type="number"` com `step` incompatível bloqueia submit nativo em silêncio. Usar `step={1}`.

## Escopo F5 — dividido em sub-fases

### F5a — Categorias de serviço (CRUD) [completa F4]
- **API**: módulo `categories`. `GET/POST /categories`, `PATCH/DELETE /categories/:id`. Tenant-scoped. `ServiceCategory` não tem `deletedAt` → DELETE físico; ao excluir, setar `service.categoryId = null` dos serviços que a usam (não bloquear).
- **Shared**: `categoryCreateSchema` (name obrigatório, icon opcional), `categoryUpdateSchema`.
- **Frontend**: seção/aba "Categorias" em Configurações — lista + modal criar/editar + excluir (`ConfirmDialog`). Atualizar `ServicoModal` para consumir categorias reais (via `useCategories`) e oferecer atalho "nova categoria" (opcional).

### F5b — Usuários da conta (CRUD)
- **API**: módulo `users`. `GET/POST /users`, `PATCH/DELETE /users/:id`. Tenant-scoped, `deletedAt`. Criar: nome, email (único por tenant), senha (hash via `utils/password`), `roleId`, vínculo opcional a `professional` (`professional.userId`). Regras: não excluir a si mesmo; não excluir/inativar o último usuário com papel admin.
- **Shared**: `userCreateSchema` (name, email, password min 6, roleId opcional, professionalId opcional, status), `userUpdateSchema` (senha opcional).
- **Frontend**: aba "Usuários" — lista (nome, email, papel, situação), modal criar/editar, excluir.

### F5c — Papéis & Permissões (CRUD + enforcement)
- **Catálogo de permissões** em `@glowbook/shared`: `PERMISSIONS` = matriz módulo × ação. Sugestão de módulos: `clients, services, categories, professionals, appointments, users, roles, settings`. Ações: `view`, `manage`. Forma do `permissionsJson`: `{ all?: true, perms?: { "clients.manage": true, ... } }`.
- **API**: módulo `roles`. `GET/POST /roles`, `PATCH/DELETE /roles/:id`. Não excluir papel em uso por usuário; não remover o último admin.
- **Enforcement backend**: middleware `requirePermission("modulo.acao")`. `all:true` faz bypass. Aplicar nas rotas protegidas conforme módulo. Carregar permissões do papel via `roleId` (cache leve por request ou query).
- **Auth**: estender `authService.me()` para retornar `permissions` (parse do `permissionsJson` do papel) → frontend usa para gatear nav (`Sidebar`) e ações (botões criar/editar/excluir).
- **Frontend**: aba "Permissões" — lista de papéis + modal com grade de toggles (módulo × ação) usando `.switch`/checkbox-grid. Gatear UI por `useAuthStore().user.permissions`.

### F5d — Notificações avançadas (stretch, opcional)
- Templates de mensagem por evento (confirmação, lembrete 24h/1h, avaliação) e horários configuráveis. Estender `TenantSetting` com campos de texto OU novo model `NotificationTemplate`. Só fazer se sobrar orçamento.

## Estrutura de UI sugerida
Transformar `pages/Configuracoes.tsx` em **abas**: `Marca` | `Notificações` | `Categorias` | `Usuários` | `Permissões`. Componente de tabs simples reusando `.toggle`/nav existente. Cada aba = subcomponente em `features/cadastros/` (ou novo `features/config/`).

## Regras do projeto (não violar)
1. Frontend **nunca** envia `tenant_id` (backend deriva).
2. CRUD sempre contra API real (sem mock).
3. Responsivo 390 / 768 / 1366.
4. Reusar design system (`app.css`): `.card .field .input .switch .modal .status .btn .empty-state .data-table .chk-grid .icon-btn`.
5. RHF + zodResolver com schemas de `@glowbook/shared`.
6. Validar cada sub-fase com Playwright (dev server; `file://` bloqueado). Login: `admin@glowbook.local` / `123456`.
7. `npx tsc --noEmit -p tsconfig.json` limpo em `apps/web` e `apps/api` ao fim.

## Ordem recomendada
F5a → F5b → F5c → (F5d se sobrar). Parar e avisar só se a próxima sub-fase esgotar tokens.

## Migrations
Não há mudança de schema obrigatória em F5a/F5b/F5c (modelos já existem). Só F5d exige migration. Rodar `npm run db:migrate` apenas se alterar schema; re-seed limpa dados de teste.
