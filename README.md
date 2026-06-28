# Glowbook

SaaS **multi-tenant** de gestão e agenda para estúdios, salões de beleza, clínicas de estética e profissionais autônomos.

## Estrutura (monorepo)

```
glowbook/
├─ apps/
│  ├─ landing/   → Landing page pública (HTML/CSS/JS estático, 6 temas)
│  ├─ web/       → SPA React + TypeScript + Vite (login + app autenticado)
│  └─ api/       → API REST Node + Express + Prisma + SQLite
├─ packages/
│  └─ shared/    → schemas Zod + types compartilhados
├─ package.json  → workspaces npm + scripts
└─ .env.example
```

## Stack

- **Frontend app:** React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, CSS tokens.
- **Landing:** HTML/CSS/JS puro — visual fiel ao app, 6 temas CSS-variable.
- **Backend:** Node, Express, Prisma, SQLite (→ PostgreSQL no futuro), JWT, refresh token em cookie HttpOnly.

## Scripts

| Comando | Ação |
|---|---|
| `npm install` | instala dependências de todos os workspaces |
| `npm run dev:landing` | sobe a landing estática |
| `npm run dev:web` | sobe a SPA React |
| `npm run dev:api` | sobe a API |
| `npm run dev` | sobe web + api juntos |
| `npm run db:migrate` | aplica migrations Prisma |
| `npm run db:seed` | popula dados iniciais |

## Status de construção

- [x] **F0** — Scaffold do monorepo
- [x] **F1** — Landing page estática (hero + features + footer, 6 temas)
- [x] **F2** — API: Prisma + SQLite + seed + auth JWT + tenant + módulos CRUD
- [x] **F3** — SPA: shell responsivo + login + ThemeSwitcher (6 temas) + Agenda real + Lista
- [x] **F4** — Cadastros: Clientes, Serviços, Equipe, Configurações (CRUD real + logo GlowBook)

- [x] **F5** - Configuracoes avancadas: Categorias, Usuarios, Papeis & Permissoes
- [x] **F6** — Preparação SaaS: signup público (novo tenant), planos (Free/Pro/Studio), pricing na landing

## Temas

`rose` (padrão) · `blush` · `sage` · `midnight` · `champagne` · `lilac`

## Multi-tenant

O frontend **nunca** envia `tenant_id`. O backend identifica o tenant pelo usuário autenticado e injeta `req.tenantId`; toda query operacional filtra por ele.
