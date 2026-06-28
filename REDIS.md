# Glowbook — Redis

Redis integrado com **degradação graciosa**: a app sobe e funciona mesmo sem Redis (cache/fila viram no-op, sessão cai para SQLite). Quando o Redis está no ar, ganha cache, rate limit distribuído, revogação rápida de sessão e fila de jobs.

## Subir o Redis (dev)

Docker (recomendado — exige Docker Desktop instalado e rodando):

```bash
cd "C:\Users\joao\Desktop\projeto glowbook\glowbook"
docker compose up -d        # sobe redis:7-alpine na 6379
docker compose ps           # status
docker compose logs -f redis
docker compose down         # parar (mantém volume redis-data)
```

Alternativas sem Docker: **Memurai** (Redis nativo Windows) ou Redis no **WSL**. Basta apontar `REDIS_URL`.

## Variáveis (`.env`)

```
REDIS_URL="redis://localhost:6379"
REDIS_MODE="auto"   # auto = conecta e degrada se cair | off = desliga de vez
```

Reinicie a API após subir o Redis. Log esperado: `🟥 Redis conectado` + `🟥 Worker de lembretes ativo`.
Sem Redis: `⚠️  Redis indisponível (...) — seguindo sem cache/fila` (e a app segue normal).

## O que usa Redis

| Recurso | Onde | Comportamento sem Redis |
|---|---|---|
| **Cache de permissões** | `middlewares/requirePermission.ts` (`perm:{tenantId}:{roleId}`, TTL 60s; invalida em update/delete de papel) | consulta o DB toda request |
| **Rate limit auth** | `middlewares/rateLimit.ts` em `/auth/login` e `/register` (10 req / 60s por IP) | usa limitador em memória (por processo) |
| **Sessões / refresh** | `auth.service` (`sess:{refreshToken}`, TTL 7d) — revogação rápida no logout | valida pela tabela `Session` (SQLite) |
| **Fila de lembretes** | `queues/reminders.ts` (BullMQ) — agenda 24h/1h antes no `appointment.create` | não agenda (lembrete não dispara) |

Chaves sempre namespaced por tenant. Worker só sobe quando o Redis conecta (evita spam de reconexão).

## Arquitetura

- `database/redis.ts` — cliente ioredis singleton (lazy, `enableOfflineQueue:false`, log único ao cair) + `bullConnectionOptions()` para o BullMQ + `closeRedis()`.
- `lib/cache.ts` — `getJson/setJson/del/delPattern/wrap` (best-effort, no-op sem Redis).
- `queues/reminders.ts` — Queue + Worker; worker logado (envio real de WhatsApp é TODO da fase de provedor/cobrança).
- `server.ts` — `startRemindersWorker()` + shutdown limpo (SIGINT/SIGTERM fecham fila e Redis).

## Verificar (com Redis no ar)

1. `docker compose up -d` e reinicie a API.
2. **Cache**: faça 2+ chamadas a uma rota protegida; a 2ª não consulta `role` no DB (TTL 60s). `redis-cli keys 'perm:*'`.
3. **Rate limit**: 11 POSTs rápidos em `/auth/login` → o 11º retorna `429`.
4. **Sessão**: login grava `sess:*` (`redis-cli keys 'sess:*'`); logout remove.
5. **Fila**: crie um agendamento com início >1h no futuro → `redis-cli keys 'bull:reminders:*'` mostra o job atrasado; o worker loga `📲 [reminder ...]` no horário.

## Notas

- **Verificado em runtime** (Docker Desktop 4.78, redis:7-alpine): cache `perm:*`, rate limit (429 no 11º login), sessão `sess:*`, fila `bull:reminders:*` (job atrasado criado e separador de jobId `_`, pois `:` é proibido). Degradação sem Redis também OK.
- Pré-requisito da cobrança: a fila já está pronta para webhooks idempotentes do provedor (Stripe) na F7.
