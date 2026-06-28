# Glowbook — Plano F6 (Preparação SaaS)

Objetivo: tornar o Glowbook auto-serviço — qualquer estúdio cria a própria conta (tenant) e escolhe um plano. Sem gateway de pagamento real (sem chaves) → planos são tiers lógicos com limites + trial; seleção sem cobrança.

## Estado atual
- Tenant criado **só via seed**. Login/refresh/me prontos; `/auth/register` não existe.
- Permissões aplicadas (F5). `Role {all:true}` = admin.
- Landing (`apps/landing/index.html`) sem seção de planos. Web routes em `apps/web/src/app/routes.tsx` (`/login` público, `/app/*` protegido).
- Sem model de Plano no schema.

## Sub-fases

### F6a — Onboarding / signup público (sem migration)
- **Shared**: `registerSchema` (studioName, name, email, password min 6).
- **API**: `authService.register` + `POST /auth/register` (público). Cria, em transação: Tenant (slug único derivado de studioName), Role "Admin" `{all:true}`, User admin (senha hash), TenantSetting default. Retorna `{accessToken, user}` + cookie refresh (igual login = auto-login).
- **Web**: `pages/Signup.tsx` + rota `/signup`; reusa visual do login (logo chip). Links login↔signup.

### F6b — Planos (migration)
- **Schema**: model `Plan { id, key @unique, name, priceCents, interval, maxProfessionals Int?, maxServices Int?, maxClients Int?, highlighted Boolean }`. `Tenant += planId?, planStatus @default("trial"), trialEndsAt?`. Migration + seed (free / pro / studio) e tenant seed recebe plano.
- **API**: módulo `plans` → `GET /plans` (público). `tenants/current` (GET) inclui `plan`; `PATCH /tenants/current/plan { planKey }` (requer `settings.manage`).
- **Web**: nova aba **Plano** em Configurações — plano atual, status/trial, cards de planos com upgrade/downgrade.
- **Signup**: opcional escolher plano no registro (default trial do "pro").

### F6c — Landing pricing + CTA signup
- Seção de planos na landing (3 cards, 6 temas) + botões "Começar agora" → `http://localhost:5173/signup`. Reusar tokens CSS da landing.

### F6d — Enforcement de limites (stretch)
- Bloquear criar profissional/serviço/cliente acima do limite do plano (checar no service da API; mensagem clara no front com CTA upgrade).

## Decisões / premissas
- **Sem cobrança real** (sem Stripe). `priceCents` é exibição; troca de plano é imediata e lógica.
- Trial: `trialEndsAt = now + 14 dias` no registro; sem bloqueio automático nesta fase (só exibição).
- slug único: slugify(studioName); colisão → sufixo `-2`, `-3`…

## Regras do projeto (não violar)
1. Frontend nunca envia `tenant_id`.
2. API real, sem mock. RHF + zodResolver + schemas `@glowbook/shared`.
3. Responsivo 390/768/1366. Reusar design system (`app.css`).
4. `requirePermission` nas rotas mutantes novas (exceto públicas: register, GET /plans).
5. Validar cada sub-fase com Playwright (dev server). tsc --noEmit limpo em apps/web e apps/api.
6. Armadilha HTML5 `step`: `step={1}` em inputs número inteiros.

## Ordem
F6a → F6b → F6c → (F6d stretch). Migration só na F6b (`npm run db:migrate`; re-seed limpa). Parar/avisar só se a próxima sub-fase esgotar tokens.
```
