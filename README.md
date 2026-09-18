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
