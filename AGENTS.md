# Portal Academia Limoeirense de Letras

Monorepo com frontend React/TypeScript/Vite e backend Express/TypeScript/Prisma/PostgreSQL.

## Estrutura

- `frontend/src/pages`: páginas públicas; dados vêm de `services/api.ts`.
- `frontend/src/hooks/useResource.ts`: carregamento, cancelamento e nova tentativa.
- `backend/src/routes`, `controllers`, `services`, `repositories`: camadas HTTP, regras e persistência.
- `backend/src/repositories/mappers.ts`: adapta entidades do banco ao contrato público existente.
- `backend/prisma/schema.prisma` e `migrations`: schema PostgreSQL e restrições.
- `backend/prisma/seed.ts`: dados demonstrativos opt-in, sem apagar dados.
- `backend/prisma/import-sqlite.ts`: migração aditiva do SQLite antigo, aberto somente para leitura.

## Validação

Leia README.md para instalação e limitações de validação desta cópia.
Execute `npm run check`, `npm test` e `npm run build` após instalar as dependências e gerar o Prisma Client.

## Dados e acesso

Preserve o contrato das respostas usado pelas telas e não retorne dados demonstrativos quando a API falhar.
Não execute reset ou seed destrutivo em banco existente.
`GET /api/contato` está desativado até existir autenticação administrativa; não publique mensagens pessoais.
