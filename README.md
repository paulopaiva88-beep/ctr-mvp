# CTR — Chavinho Trail Running

Painel web para cadastro de alunos, valor individual e baixa manual de pagamentos.

## Publicação (obrigatório)

Publique **somente** como app **private** ou **team** no Cursor (**nunca public**).

Em app **public**, o Cursor **não envia** a identidade da pessoa logada — `/painel` não consegue autorizar ninguém e redireciona para a home.

1. Publish Settings → visibilidade **private** ou **team**.
2. Segredo `CTR_ADMIN_EMAILS`: e-mails Cursor dos admins (vírgula), ex. `voce@email.com,outro@email.com`.
3. Abra o app logado na conta Cursor cujo e-mail está na lista → `/painel`.

O Postgres da app é provisionado automaticamente (`cursor-app.json`). Preview usa dados isolados; produção usa o Postgres da app.

## Local

```bash
env -u DATABASE_URL npm run dev
```

Abra http://127.0.0.1:3000 — o login de admin é simulado via `cursor/identity.dev.ts`.
