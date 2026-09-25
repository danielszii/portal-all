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
- formulário público de contato;
- painel administrativo autenticado para membros, notícias, agenda e acervo, com uploads.

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
- PostgreSQL com banco em UTF-8 e suporte a ICU

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

Copie o modelo [backend/.env.example](backend/.env.example) para `backend/.env`.
No PowerShell, a partir da raiz do projeto:

```powershell
Copy-Item backend/.env.example backend/.env
```

No Bash, use `cp backend/.env.example backend/.env`. Se já houver um `.env`,
preserve-o e ajuste apenas as configurações necessárias.

Crie o banco `portal_all` no PostgreSQL e ajuste `DATABASE_URL` com o usuário,
a senha e o endereço dessa máquina. O modelo explica as demais configurações,
incluindo origem do frontend e diretório de uploads. Não versione o arquivo
`.env` nem credenciais reais.

O frontend não precisa de `.env`: usa `/api` e `/uploads`, encaminhados ao backend
na porta 3001 pelo Vite. Se alterar `PORT`, ajuste também os dois destinos em
`frontend/vite.config.ts`.

Gere o Prisma Client e aplique as migrações:

```bash
npm --prefix backend run db:generate
npm --prefix backend run db:deploy
```

Para acessar o painel, crie uma conta seguindo o [guia administrativo](backend/ADMIN_API.md#contas-predefinidas).
As migrations não criam usuário ou senha padrão. Para levar os dados existentes
a outra máquina, transfira também um backup do PostgreSQL e os arquivos de
`backend/uploads` (ou do diretório definido em `UPLOAD_DIR`); eles não acompanham o Git.

Inicie frontend e backend em modo de desenvolvimento:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Verificação da API: `http://localhost:3001/api/health`
- Disponibilidade do banco: `http://localhost:3001/api/ready`

`/api/health` verifica o processo HTTP. `/api/ready` consulta o PostgreSQL e retorna
HTTP 200 (`database: "up"`) ou 503 (`database: "down"`), com limite de espera de
3 segundos e sem expor erros internos. Use `/api/ready` para verificar disponibilidade
antes de encaminhar tráfego; ela não verifica se todas as migrations foram aplicadas.

A página de notícias filtra por categoria e termo na API. A listagem usa
`GET /api/noticias?resumo=true`, que omite o texto completo, e o detalhe usa
`GET /api/noticias/:id`. Sem `resumo=true`, a API preserva a resposta completa existente.
Categoria e busca são mantidas na URL ao abrir uma notícia e voltar para a listagem.

Notícias exibem 1 destaque e até 9 itens na grade por página (10 no total); acervo exibe 8, com botões Anterior/Próxima. A API aceita
`page` e `pageSize` (1 a 50, padrão 12) e retorna `{ items, total, page, pageSize, totalPages }`.
Sem esses parâmetros, mantém a lista tradicional para consumidores existentes.
Páginas além do final são limitadas à última disponível; parâmetros inválidos retornam 400.
Filtros são aplicados antes da contagem e paginação, com desempate por ID na ordenação.
Os filtros de categoria, tipo e busca são aceitos pela API e pela URL das páginas;
as telas atuais não apresentam controles locais de filtro. `GET /api/acervo/:id` mantém os links diretos para PDFs funcionais
mesmo quando a publicação não está na página atual.

A busca em cadeiras, notícias e acervo ignora acentos e diferenças de caixa:
`memorias` encontra `Memórias` e `joao` encontra `João`. Os textos originais não são alterados.
As consultas normalizam Unicode e usam parâmetros SQL, tratando `%` e `_` como texto literal.

A busca global usa `GET /api/busca?q=...&page=1&pageSize=30`, com resultados
resumidos por categoria. As próximas páginas são carregadas ao rolar a listagem,
sem transferir biografias, obras ou textos completos de notícias. As rotas públicas
existentes preservam seus contratos.

O [guia administrativo](backend/ADMIN_API.md) descreve acesso, cadastro de pessoas,
edição concorrente e uploads. Os tipos públicos são definidos uma única vez em
`backend/src/types/index.ts` e importados pelo frontend somente como tipos.

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
Ao abrir essa versão localmente, ajuste `FRONTEND_URL` para `http://localhost:3001`.
Em produção, configure a origem HTTPS real do site e `NODE_ENV=production`.

`npm test` exercita serviços, mapeamentos e rotas HTTP com persistência simulada,
sem acessar o banco configurado em `.env`. Inclui listas vazias, registros inexistentes,
IDs inválidos, falhas de persistência e validação e privacidade do contato.
`npm run check` também verifica os arquivos TypeScript dos testes.
Os testes React do frontend usam DOM simulado e verificam a preservação do
formulário durante indisponibilidade da sessão e o bloqueio após revogação.

### Integração com PostgreSQL real

Crie um banco **exclusivo de testes**, com `test` no nome, e um usuário com permissão
para criar e remover schemas nesse banco. Use UTF-8 e PostgreSQL com suporte a ICU.
A migration `20260920000100_busca_portugues` configura ICU `pt-BR` nos campos
pesquisados de notícias, acervo e tipo de evento, inclusive em bancos com localidade
`C`. Assim, `MEMÓRIAS` encontra `Memórias`. Além disso, as buscas de texto do catálogo
normalizam acentos durante a consulta, permitindo também pesquisar `memorias`.
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

### Demonstração temporária com SQL rastreado

O comando abaixo aceita somente a versão revisada do arquivo `demo-inserts.sql`
(verificada por SHA-256). Ele usa o banco de `backend/.env`, no schema `public`:

```powershell
npm --prefix backend run db:demo-session -- import "C:\Users\Caue\Downloads\demo-inserts.sql"
```

Cada execução retorna um ID e registra atomicamente apenas as linhas realmente
inseridas em `public."_PortalDemoSession"`. Registros preexistentes não são assumidos
como parte da importação. O registro inclui o ID automático da notícia e a instituição
`all` somente se ela tiver sido criada pelo comando. Não execute o SQL diretamente
se precisar deste controle de remoção.

Importação local realizada em 22/09/2026: `33883c04-8046-4bf1-a0f7-266058f5926a`
(15 registros; notícia ID 1). Para conferir a remoção sem executá-la:

```powershell
npm --prefix backend run db:demo-session -- remove 33883c04-8046-4bf1-a0f7-266058f5926a
```

Quando terminar de testar, acrescente `--apply` para remover os registros dessa
importação. A remoção é transacional, respeita os relacionamentos e não usa CASCADE.
Se uma linha tiver sido editada ou possuir novas referências que impeçam a exclusão,
a operação é cancelada integralmente. O histórico da importação permanece no banco.
Os arquivos externos de imagens e PDF não são importados: o SQL guarda seus links.

Lote ampliado: `backend/prisma/demo-expanded.sql`, com 12 novas cadeiras/patronos/acadêmicos,
24 notícias (quatro categorias), 12 eventos em diferentes meses e tipos, 12 fotos e
12 publicações nas seis categorias do acervo, além das obras e relações.
Inclui duas cadeiras vagas e duas in memoriam. Conteúdo exclusivamente fictício.

```powershell
npm --prefix backend run db:demo-session -- import prisma/demo-expanded.sql
```

Lote ampliado importado em 22/09/2026: `37019c1f-3435-4152-9aa7-2917c33dad59`
(142 registros novos). A remoção desse lote é independente do SQL inicial:

```powershell
# Prévia; acrescente --apply somente quando quiser remover o lote.
npm --prefix backend run db:demo-session -- remove 37019c1f-3435-4152-9aa7-2917c33dad59
```

### Importação do SQLite

Existe um importador aditivo para o banco SQLite utilizado por versões anteriores:

```bash
npm --prefix backend run db:import-sqlite -- "CAMINHO/PARA/dev.db"
```

O importador abre o SQLite somente para leitura e não sobrescreve registros existentes. Faça backup antes de qualquer migração e aplique as migrações do PostgreSQL antes da importação.

## Segurança e preservação dos dados

- Consultas GET/HEAD em `/api` aceitam até 120 requisições por IP por minuto,
  por processo; o excesso retorna 429 com `Retry-After`. `/api/health` é isento.
  O limite de contato continua separado (5 tentativas em 15 minutos).
- Filtros `q`, `search`, `categoria` e `tipo` aceitam uma única string de até
  200 caracteres. Listas sem paginação continuam disponíveis por compatibilidade;
  o limitador reduz abuso, mas não limita o custo de uma consulta individual.
- O backend envia CSP, proteção contra enquadramento, `nosniff`, política de
  referência e restrição de câmera, microfone e geolocalização. A CSP permite
  as fontes Google, imagens externas e o visualizador em `docs.google.com`.
  Estes cabeçalhos se aplicam ao frontend servido pelo backend, não ao Vite.
- Logs de acesso omitem query strings, corpos e cabeçalhos privados.
  Retenção de logs, HTTPS e limites compartilhados dependem da infraestrutura.

- Não utilize `prisma migrate reset` em bancos existentes.
- Não utilize `db push --accept-data-loss`.
- O seed demonstrativo exige `SEED_DEMO=true` de forma explícita.
- `GET /api/contato` permanece desativado enquanto não houver autenticação administrativa.
- Mensagens enviadas pelo formulário não devem ser disponibilizadas publicamente.
- Imagens, biografias e PDFs demonstrativos devem ser substituídos por materiais autorizados antes da publicação oficial.

## Recursos planejados

- entrega de mensagens por e-mail;
- configuração dos links oficiais das redes sociais.

## Licença

Defina a licença do projeto antes de permitir reutilização ou distribuição pública do código e do conteúdo institucional.
