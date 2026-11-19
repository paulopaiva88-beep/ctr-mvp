# CTR — Chavinho Trail Running

Painel web para cadastro de alunos, valor individual e baixa manual de pagamentos.

## Acesso (admins sem conta Cursor)

1. Publique o app como **public** (Publish Settings), para qualquer pessoa abrir o link.
2. Defina o segredo `CTR_PANEL_PASSWORD` (senha compartilhada dos admins) em Secrets.
3. No site, digite a senha (e um nome) → `/painel`.

Contas Cursor em app **private/team** também entram automaticamente, se a visibilidade for essa.

O Postgres da app é provisionado automaticamente (`cursor-app.json`). Preview usa dados isolados; produção usa o Postgres da app.

## Local

```bash
env -u DATABASE_URL npm run dev
```

Abra http://127.0.0.1:3000 — login Cursor simulado. Para testar senha do painel localmente:

```bash
CTR_PANEL_PASSWORD='sua-senha' env -u DATABASE_URL npm run dev
```
