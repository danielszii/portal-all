# Portal da Academia Limoeirense de Letras

Frontend React com TypeScript e backend Express com Prisma e PostgreSQL. Esta cópia foi preparada a partir do commit `0a0a601`, preservando a imagem local do projeto. O repositório original em `Documents/GitHub/portal-all` não foi alterado.

## Alterações

- O contato confirma o envio somente após resposta bem-sucedida da API. Falhas mantêm o formulário e os dados para nova tentativa.
- A leitura pública de mensagens foi removida. `GET /api/contato` retorna 404; a criação continua em `POST /api/contato`. Não há login ou painel administrativo nesta entrega.
- Validação de tipos, campos obrigatórios, e-mail e tamanho das mensagens no servidor. JSON inválido retorna 400 e corpo excessivo retorna 413.
- Repositórios Prisma substituem os repositórios em memória. As mensagens passam a ser persistidas no PostgreSQL; não há envio de e-mail implementado.
- Cadeiras, patronos, acadêmicos e ocupações históricas são entidades separadas. Obras e textos pertencem ao acadêmico. Acervo aceita autoria múltipla; galeria permite vínculo com eventos; instituição e mandatos de diretoria possuem tabelas próprias.
- Migration com chaves estrangeiras, restrição de exclusão de histórico, uma ocupação vigente por cadeira e por acadêmico, um fundador por cadeira e verificações de períodos.
- Início, instituição, cadeiras, membros, agenda, galeria, notícias, acervo e dados institucionais do contato consomem a API. Busca global consulta cadeiras, notícias e acervo.
- Removidos os dados locais de fallback do frontend. Falhas agora são visíveis, com nova tentativa. Dados demonstrativos ficam apenas no backend, usados por seed explícito.
- Corrigidos o título da produção literária no seed, imports de tipos, carregamento de cadeiras desconhecidas, datas dos eventos e informações ocultas por `dt, dd { display: none; }`.
- Mantidos fontes, cores, imagens e classes do layout; ajustes pontuais de teclado, modais e telas pequenas.
- O backend serve o frontend compilado, incluindo acesso direto às rotas do React. A configuração Vite usa carregamento nativo, testado com Node 24.13.

## Requisitos e instalação

Use Node.js 22.18 ou superior e um PostgreSQL local ou remoto. Na raiz do projeto:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
```

Edite `backend/.env` com a conexão correta. Não versione senhas. Use um banco PostgreSQL próprio para este projeto.

```text
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/portal_all?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Depois:

```powershell
npm --prefix backend run db:generate
npm --prefix backend run db:deploy
npm run check
npm test
npm run build
npm run dev
```

O frontend de desenvolvimento fica em `http://localhost:5173`, com proxy `/api` para a porta 3001. Para executar a versão compilada, use `npm start` e acesse `http://localhost:3001`.

`GET /api/health` é uma verificação do processo; não mede a disponibilidade do banco. O servidor valida a conexão inicial antes de escutar a porta.

## Preservação de dados

A migration inicial cria as novas tabelas no PostgreSQL. Ela não converte um SQLite existente nem deve ser aplicada como substituição destrutiva de uma estrutura PostgreSQL já utilizada. Não use `prisma migrate reset` ou `db push --accept-data-loss` para essa atualização.

Se houver dados no SQLite do schema anterior, faça uma cópia de segurança, prepare um PostgreSQL vazio com `db:deploy` e execute:

```powershell
npm --prefix backend run db:import-sqlite -- "C:\caminho\do\banco\dev.db"
```

O importador abre o SQLite somente para leitura, importa para PostgreSQL em uma transação e mantém os IDs das mensagens. Registros já existentes não são sobrescritos. Execute a importação antes de qualquer seed demonstrativo. Datas de eventos legadas são interpretadas no offset `-03:00`; dados históricos com outro offset precisam de conferência. Registros de pessoas são conciliados pelo nome no conjunto legado, portanto homônimos exigem revisão antes da importação.

O importador espera as nove tabelas do schema SQLite do commit de origem. Uma tabela ausente ou um histórico incompatível causa erro, preservando o destino pela transação. Ele não recupera mensagens que existiam apenas na memória do processo antigo.

As datas históricas incompletas conservam o ano e o texto original; não são inventados dias ou meses. Para preservar a apresentação anterior, uma cadeira sem ocupação vigente pode destacar o último acadêmico falecido com o rótulo “In memoriam”. A existência de uma ocupação vigente é a referência para decidir se a cadeira está ocupada.

## Dados demonstrativos

Opcionalmente, em um banco de desenvolvimento:

```powershell
$env:SEED_DEMO = "true"
npm --prefix backend run db:seed
Remove-Item Env:SEED_DEMO
```

O seed é aditivo e não apaga ou sobrescreve registros. As biografias, informações institucionais, fotografias e PDFs herdados do projeto são demonstrativos e precisam ser substituídos pelos materiais aprovados pela Academia. O seed não envia mensagens nem e-mails.

## Verificações desta entrega

| Verificação | Resultado |
| --- | --- |
| TypeScript do frontend | Passou |
| Build de produção do frontend | Passou, Vite 8.2.2 / Node 24.13 |
| Testes unitários de contato, cadeiras e datas | 6 passaram, executados offline contra fontes transpiladas; acesso ao Prisma isolado e persistência simulada por injeção de repositório |
| Migration inicial | Aplicada em PostgreSQL 18.3 isolado, sem usar banco existente |
| Restrições de histórico, ocupação, fundador e datas | Passaram no PostgreSQL; transação de teste revertida |
| Formulário no navegador com API indisponível | Mostrou erro, conservou dados e não exibiu sucesso |
| Formulário com resposta de sucesso controlada | Exibiu confirmação somente após HTTP 201 |
| Cadeira IX e cadeira inexistente no navegador | Carregamento pela API de teste e mensagem de não encontrado confirmados |
| Instalação completa de dependências do backend | Bloqueada: acesso ao registro npm recusado nesta sessão |
| Prisma generate, checagem completa do backend, seed/importador e integração API–Prisma | Não validados em execução; faltaram Prisma e CORS instalados |

Os testes de navegador usaram respostas controladas, não a integração real com Prisma. Nenhum build completo de ponta a ponta é declarado como aprovado. Com as dependências instaladas, execute os comandos de validação acima antes de usar o sistema com dados reais.

Para repetir os testes de integridade em um banco descartável com a migration aplicada:

```powershell
psql "postgresql://USUARIO:SENHA@localhost:5432/BANCO_DE_TESTES" -v ON_ERROR_STOP=1 -f backend/tests/constraints.sql
```

## Próximos recursos

Autenticação administrativa, telas de edição, armazenamento/upload de PDFs e imagens e entrega de e-mails continuam sendo etapas próprias. A listagem de mensagens deve permanecer desativada até receber autenticação e autorização. Os links genéricos das redes sociais também precisam dos endereços oficiais.
