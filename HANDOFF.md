# Glowbook - Handoff de retomada

Documento para retomar a construcao apos `/clear`.

## Onde estamos

| Fase | Status |
|---|---|
| F0 - Scaffold monorepo | concluido |
| F1 - Landing estatica (hero + features + footer, 6 temas) | concluido |
| F2 - API (auth JWT + tenant + CRUD + conflito) | concluido e testado curl |
| F3 - SPA (login + shell + Agenda real + Lista) | concluido e testado Playwright |
| F4 - Cadastros (Clientes/Servicos/Equipe/Configuracoes) | concluido e testado Playwright |
| F5 - Configuracoes avancadas (categorias, usuarios, permissoes) | concluido e testado Playwright |
| F6 - Preparacao SaaS (signup tenant, planos, pricing landing) | concluido e testado Playwright |
| F7 - Cobranca real / limites por plano | proximo |

## Como rodar

```bash
cd "C:\Users\joao\Desktop\projeto glowbook\glowbook"
npm install
docker compose up -d   # Redis (opcional — app degrada sem ele). Ver REDIS.md
npm run db:migrate
npm run db:seed
npm run dev:api        # API -> http://localhost:3333/api
npm run dev:web        # SPA -> http://localhost:5173
npm run dev:landing    # Landing -> http://localhost:5500
```

Login: **admin@glowbook.local** / **123456**

## F5 concluido

Backend:
- `categories`: CRUD em `/api/categories`; ao excluir, a API seta `service.categoryId = null` antes de remover a categoria.
- `users`: CRUD em `/api/users`; senha com hash, e-mail unico por tenant, vinculo opcional com `professional`, bloqueio de autoexclusao e do ultimo admin ativo.
- `roles`: CRUD em `/api/roles`; `permissionsJson` usa `{ all?: true, perms?: Record<string, boolean> }`; bloqueia papel em uso e remocao do ultimo admin ativo.
- `requirePermission(permission)`: aplicado nas rotas protegidas; `{ all: true }` faz bypass e `*.manage` tambem permite `*.view`.
- Login e `/api/auth/me` retornam `permissions`, `role` e `tenant`.

Shared:
- Schemas Zod: `categoryCreateSchema`, `categoryUpdateSchema`, `userCreateSchema`, `userUpdateSchema`, `roleCreateSchema`, `roleUpdateSchema`.
- Catalogo: `PERMISSIONS`, `PERMISSION_MODULES`, `PERMISSION_ACTIONS` e tipos de permissao.

Frontend:
- `pages/Configuracoes.tsx` virou abas: Marca, Notificacoes, Categorias, Usuarios e Permissoes.
- `ServicoModal` consome categorias reais via API.
- Novos modais: `CategoriaModal`, `UsuarioModal`, `PapelModal`, todos com RHF + zodResolver.
- Sidebar e acoes principais fazem gating visual por `user.permissions`.
- CSS novo em `styles/app.css`: tabs, section head e permission grid reutilizando tokens existentes.

Validacao executada:
- `npx.cmd tsc --noEmit -p tsconfig.json` limpo em `apps/api`.
- `npx.cmd tsc --noEmit -p tsconfig.json` limpo em `apps/web`.
- Smoke Playwright Chromium com login admin em viewports 390, 768 e 1366: Configuracoes -> Categorias/Usuarios/Permissoes sem overflow horizontal.

## F6 concluido (testado Playwright)

Plano em `glowbook/F6-PLAN.md`. Premissa: **sem gateway de pagamento** — planos sao tiers logicos + trial; troca imediata.

Backend:
- `POST /api/auth/register` (publico): cria Tenant (slug unico), Role Admin `{all:true}`, User admin (hash), TenantSetting; `planStatus=trial`, `trialEndsAt=+14d`; auto-login (cookie refresh + accessToken). `registerSchema` em shared.
- Schema: model `Plan` + `Tenant.planId/planStatus/trialEndsAt` (migration `add_plans`). Seed cria Free/Pro/Studio e poe Studio Bella no Pro.
- `GET /api/plans` (publico). `GET /api/tenants/current` inclui `plan`. `PATCH /api/tenants/current/plan { planKey }` (requer `settings.manage`).

Frontend:
- `pages/Signup.tsx` + rota `/signup` (reusa visual do login); links login<->signup.
- Nova aba **Plano** em Configuracoes: plano atual + status/trial + 3 cards com troca. `usePlans`/`useChangePlan` em queries; `CadPlan` em types; CSS `.plan-grid/.plan-card`.
- Landing (`apps/landing/index.html`): secao `#planos` (3 cards, reusa `.features`), link no nav, CTAs hero/band/header apontando para `/signup` ("Comecar gratis").

Validacao:
- tsc --noEmit limpo em apps/api e apps/web.
- Playwright: signup cria tenant isolado (Espaco Aurora, agenda vazia) + auto-login; aba Plano mostra Pro atual e troca Pro->Studio persistida; pricing da landing renderiza nos temas.

Stretch nao feito: **F6d** (enforcement de limites por plano — bloquear criar acima do max). Fica para F7 junto de cobranca.

## Notas

- Frontend continua sem enviar `tenant_id`; todas as queries operacionais derivam tenant do token.
- F6b exigiu migration (`add_plans`). `prisma generate` falha com EPERM se o `dev:api` estiver rodando (DLL travada) — pare a API antes de `generate`/`migrate`.
- F5a-F5c nao exigiram migration. O `tsconfig` da API foi ajustado para `rootDir: "."` porque ele ja inclui `prisma/**/*.ts`.
- F5d ficou como stretch nao implementado: templates e horarios avancados de notificacao exigem migration.
- Armadilha HTML5 `step`: manter `step={1}` em campos numericos inteiros, especialmente duracao.

## Proximo

F6 - preparacao SaaS: onboarding tenant, planos e fluxo comercial.
