# CTR — Chavinho Trail Running

Painel web para cadastro de alunos, valor individual e baixa manual de pagamentos.

## Publicação

Publique **somente** como app **private** ou **team** no Cursor (nunca public). Admins entram com a conta Cursor.

1. Confirme a publicação e aceite os termos.
2. Defina o segredo `CTR_ADMIN_EMAILS` com os e-mails Cursor dos admins (separados por vírgula), por exemplo `voce@email.com,outro@email.com`.
3. O Postgres da app é provisionado automaticamente (`cursor-app.json`). Preview usa dados isolados; produção usa o Postgres da app.

## Local

```bash
env -u DATABASE_URL npm run dev
```

Abra http://127.0.0.1:3000 — o login de admin é simulado via `cursor/identity.dev.ts`.
