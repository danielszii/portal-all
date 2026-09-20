<div align="center">
  <img src="./frontend/src/imports/Logo_Vetorizada_A.L.L_sem_fundo.svg" width="180" alt="Logo da Academia Limoeirense de Letras">

  # Portal da Academia Limoeirense de Letras

  Portal institucional para preservação e divulgação da memória, da literatura e das atividades culturais da Academia Limoeirense de Letras.
</div>

## Sobre o projeto

O portal reúne informações sobre a Academia, suas cadeiras, acadêmicos, patronos, publicações, notícias e eventos. A aplicação possui frontend responsivo e uma API responsável pela persistência e entrega dos dados institucionais.

Entre os recursos disponíveis estão:

- apresentação da instituição e de sua diretoria;
- catálogo de cadeiras, patronos, titulares e sucessões históricas;
- perfis dos acadêmicos e suas produções literárias;
- acervo digital com visualização e download de publicações;
- agenda de eventos e galeria fotográfica;
- notícias e comunicados;
- busca global no portal;
- formulário público de contato.

## Tecnologias

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

## Estrutura

```text
portal-all/
├── frontend/                 # Aplicação React
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       ├── hooks/            # Hooks de carregamento e diálogos
│       ├── pages/            # Páginas públicas
│       ├── services/         # Cliente da API
│       └── index.css         # Sistema visual e responsividade
├── backend/                  # API Express
│   ├── prisma/
│   │   ├── migrations/       # Migrações do PostgreSQL
│   │   ├── schema.prisma     # Modelo do banco
│   │   └── seed.ts           # Dados demonstrativos
│   └── src/
│       ├── controllers/
│       ├── data/             # Conteúdo demonstrativo do seed
│       ├── repositories/
│       ├── routes/
│       └── services/
└── package.json              # Comandos do monorepo
```

## Requisitos

- Node.js 22.18 ou superior
- npm
- PostgreSQL

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone URL_DO_REPOSITORIO
cd portal-all
npm run install:all
```

Crie o arquivo `backend/.env`:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/portal_all?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Não versione o arquivo `.env` nem credenciais reais.

Gere o Prisma Client e aplique as migrações:

```bash
npm --prefix backend run db:generate
npm --prefix backend run db:deploy
```

Inicie frontend e backend em modo de desenvolvimento:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Verificação da API: `http://localhost:3001/api/health`

## Dados fictícios

O projeto inclui um seed demonstrativo para desenvolvimento. Ele é aditivo: registros existentes não são apagados nem sobrescritos.

No PowerShell:

```powershell
$env:SEED_DEMO = "true"
npm --prefix backend run db:seed
Remove-Item Env:SEED_DEMO
```

No Bash:

```bash
SEED_DEMO=true npm --prefix backend run db:seed
```

Os conteúdos fictícios podem ser alterados em:

```text
backend/src/data/cadeiras.data.ts
backend/src/data/eventos.data.ts
backend/src/data/noticias.data.ts
backend/src/data/acervo.data.ts
backend/src/data/instituicao.data.ts
```

Para consultar os registros visualmente:

```bash
npm --prefix backend run db:studio
```

## Validação

Execute antes de publicar alterações:

```bash
npm run check
npm test
npm run build
```

Para executar a compilação de produção:

```bash
npm start
```

O backend serve o frontend compilado e mantém o acesso direto às rotas da aplicação React.
As informações da API ficam em `/api`. Sem um frontend compilado, `/` também mostra essas informações.

`npm test` exercita serviços, mapeamentos e rotas HTTP com persistência simulada,
sem acessar o banco configurado em `.env`. Inclui listas vazias, registros inexistentes,
IDs inválidos, falhas de persistência e validação e privacidade do contato.
`npm run check` também verifica os arquivos TypeScript dos testes.

### Integração com PostgreSQL real

Crie um banco **exclusivo de testes**, com `test` no nome, e um usuário com permissão
para criar e remover schemas nesse banco. Use UTF-8 e PostgreSQL com suporte a ICU.
A migration `20260920000100_busca_portugues` configura ICU `pt-BR` nos campos
pesquisados de notícias, acervo e tipo de evento, inclusive em bancos com localidade
`C`. Assim, `MEMÓRIAS` encontra `Memórias`; buscar sem acento continua sendo diferente.
Para aplicar em um ambiente existente, use `npm --prefix backend run db:deploy`.
A migration preserva os textos e registros; os comandos ALTER TABLE podem bloquear
temporariamente o acesso às tabelas, portanto aplique em uma janela de manutenção.
As collations são mantidas no SQL das migrations, pois não são expressas pelo schema Prisma.

No PowerShell, informe a conexão explicitamente:

```powershell
$env:TEST_DATABASE_URL = "postgresql://USUARIO:SENHA@localhost:5432/portal_all_test"
try {
  npm run test:integration
} finally {
  Remove-Item Env:TEST_DATABASE_URL
}
```

No Bash:

```bash
TEST_DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/portal_all_test" npm run test:integration
```

A suíte exige `TEST_DATABASE_URL`, sem usar `DATABASE_URL` como alternativa. A cada
execução, cria um schema aleatório `portal_test_*`, aplica as migrations versionadas,
cadastra fixtures e testa a API por HTTP com consultas reais. Ao terminar, inclusive
em caso de falha dos testes, remove apenas o schema criado nessa execução. Não executa
reset nem seed. Se o processo for encerrado à força, o schema temporário pode permanecer;
seu nome é mostrado no início da execução.

São verificados filtros e contratos públicos, sucessões e obras, visibilidade editorial
(incluindo notícias futuras), galeria, gestão e mandatos vigentes e persistência privada
das mensagens. As restrições de `backend/tests/constraints.sql` são executadas automaticamente
em uma transação revertida. Essa suíte é separada de `npm test` e falha quando a conexão
de testes não está configurada. Ela não valida navegação no navegador nem disponibilidade
dos arquivos de imagens e PDFs.

O formulário aceita até cinco tentativas por IP a cada 15 minutos, por processo, e retorna
HTTP 429 com `Retry-After` ao exceder o limite. O controle usa memória limitada e reinicia
com o servidor. Em instalações com múltiplas instâncias, aplique também um limite compartilhado
na infraestrutura. Atrás de proxy, configure a confiança apenas nos proxies conhecidos;
sem essa configuração, os clientes do mesmo proxy compartilham o limite.

## Migração de dados legados

Existe um importador aditivo para o banco SQLite utilizado por versões anteriores:

```bash
npm --prefix backend run db:import-sqlite -- "CAMINHO/PARA/dev.db"
```

O importador abre o SQLite somente para leitura e não sobrescreve registros existentes. Faça backup antes de qualquer migração e aplique as migrações do PostgreSQL antes da importação.

## Segurança e preservação dos dados

- Não utilize `prisma migrate reset` em bancos existentes.
- Não utilize `db push --accept-data-loss`.
- O seed demonstrativo exige `SEED_DEMO=true` de forma explícita.
- `GET /api/contato` permanece desativado enquanto não houver autenticação administrativa.
- Mensagens enviadas pelo formulário não devem ser disponibilizadas publicamente.
- Imagens, biografias e PDFs demonstrativos devem ser substituídos por materiais autorizados antes da publicação oficial.

## Recursos planejados

- autenticação e autorização administrativa;
- painel para gerenciamento do conteúdo;
- upload de imagens e PDFs;
- entrega de mensagens por e-mail;
- configuração dos links oficiais das redes sociais.

## Licença

Defina a licença do projeto antes de permitir reutilização ou distribuição pública do código e do conteúdo institucional.
