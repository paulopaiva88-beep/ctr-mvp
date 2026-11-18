# CTR — Chavinho Trail Running

Painel web para cadastro de alunos, valor individual e baixa manual de pagamentos.

## Publicação (obrigatório)

Publique como app **private** ou **team** no Cursor (**nunca public**).

- Em **private** / **team**, quem pode abrir o app (você + convidados, ou o time) já é admin do painel — sem lista de e-mails.
- Em **public**, o Cursor não envia a identidade da pessoa — `/painel` não autoriza ninguém.

O Postgres da app é provisionado automaticamente (`cursor-app.json`). Preview usa dados isolados; produção usa o Postgres da app.

## Local

```bash
env -u DATABASE_URL npm run dev
```

Abra http://127.0.0.1:3000 — o login de admin é simulado via `cursor/identity.dev.ts`.
