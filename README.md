# CTR — Chavinho Trail Running

Painel web para cadastro de alunos, valor individual e baixa manual de pagamentos.

## Local

```bash
env -u DATABASE_URL npm run dev
```

Abra http://127.0.0.1:3000 — o login de admin é simulado via `cursor/identity.dev.ts`.

## Publicado

Publique como app **private** ou **team** no Cursor. Admins entram com a conta Cursor. O Postgres da app é provisionado automaticamente (`cursor-app.json`).
