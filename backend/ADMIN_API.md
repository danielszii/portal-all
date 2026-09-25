# API administrativa

O login do frontend usa os endpoints abaixo, com restauração da sessão pelo servidor
e logout real. Sessões simuladas antigas no navegador são descartadas. Os formulários
de notícias, acervo, agenda e membros gravam na API, incluindo arquivos e confirmação
de substituição de titular. A mensagem de sucesso só aparece após a gravação.

## Preparação

```powershell
npm --prefix backend run db:generate
npm --prefix backend run db:deploy
```

A migration `20260923000100_administracao` somente adiciona as tabelas de contas e
sessões. Não apaga ou modifica o conteúdo existente. Se o Windows bloquear a DLL
do Prisma, pare o servidor de desenvolvimento antes de gerar o client e reinicie
depois. Os testes de integração usam um schema temporário em banco exclusivo.

Defina `FRONTEND_URL` em `backend/.env` com a origem exata do navegador
(por exemplo, `http://localhost:5173` com Vite ou `http://localhost:3001` quando
o próprio backend serve o frontend). Requisições que alteram dados precisam enviar
esse `Origin`. `NODE_ENV=production` ativa cookie Secure, exigindo HTTPS.

### Contas predefinidas

Não existe cadastro público. Todos os administradores ativos têm as mesmas
permissões. Por padrão, a senha tem 15 a 128 caracteres e é armazenada com scrypt e salt
individual; sessões guardam apenas o hash do identificador.

Para criar uma conta sem colocar a senha no histórico do PowerShell:

```powershell
$env:ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$adminSecret = Read-Host 'Senha (15 a 128 caracteres)' -AsSecureString
try {
  $env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
  npm --prefix backend run admin:account -- create
} finally {
  Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  $adminSecret.Dispose()
}
```

Não coloque essas variáveis no Git ou em logs. `create` recusa e-mail já existente.
Use `password` no lugar de `create` para redefinir a senha e reativar uma conta;
isso revoga suas sessões. Para desativar, defina somente `ADMIN_EMAIL` e execute
`npm --prefix backend run admin:account -- disable` (também revoga sessões).
Nenhuma conta ou senha padrão é criada pelas migrations ou pelo seed.

O operador local pode autorizar uma senha menor com `--allow-short-password`
após `create` ou `password`. É uma exceção explícita de provisionamento; não há
endpoint público para habilitá-la. Prefira manter o mínimo padrão de 15 caracteres.
Não grave senhas reais neste documento nem no código do frontend.

## Autenticação e CSRF

Base: `/api/admin`. Respostas administrativas usam `Cache-Control: no-store`.

| Método | Caminho | Corpo / retorno |
| --- | --- | --- |
| POST | `/auth/login` | `{ "email": "…", "password": "…", "remember": false }` → `{ user: { id, email }, csrfToken, expiraEm }` |
| GET | `/auth/me` | Retorna usuário, token CSRF e expiração da sessão |
| POST | `/auth/logout` | Revoga a sessão e apaga o cookie; 204 |

O servidor envia cookie HttpOnly, SameSite=Strict, host-only. O frontend não recebe
o identificador de sessão no JSON. Sem `remember`, o cookie dura a sessão do
navegador e o servidor aceita até 8 horas; com `remember`, dura até 7 dias.
Novo login invalida as sessões anteriores da conta (não há renovação automática).
Contas desativadas e sessões expiradas recebem 401.

Após login, guarde `csrfToken` em memória; ao recarregar, recupere com `/auth/me`.
Envie `X-CSRF-Token` em POST/PUT/DELETE autenticados, inclusive logout e upload.
Login exige origem válida, mas não token CSRF prévio. Nunca exponha a senha em URL.

Exemplo do contrato usado pelo frontend:

```js
const response = await fetch('/api/admin/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, remember: false }),
})
if (!response.ok) throw new Error('Não foi possível entrar')
const { csrfToken } = await response.json()
// Origin é enviado pelo navegador; clientes de teste devem informá-lo.
```

Login: 5 tentativas malsucedidas/IP/15 minutos e até 2 verificações de senha simultâneas por
processo. Escritas: 60/IP/minuto. Consultas mantêm o limite público existente.
Tentativas em andamento contam provisoriamente; logins concluídos com sucesso
não consomem o limite. O frontend informa a espera retornada em `Retry-After`.
Esses limitadores são locais ao processo; a sessão é persistida no PostgreSQL.

## Notícias, acervo e agenda

| Recurso | Listar | Detalhar | Criar | Editar |
| --- | --- | --- | --- | --- |
| Notícias | GET `/noticias` | GET `/noticias/:id` | POST `/noticias` | PUT `/noticias/:id` |
| Acervo | GET `/acervo` | GET `/acervo/:id` | POST `/acervo` | PUT `/acervo/:id` |
| Agenda | GET `/agenda` | GET `/agenda/:id` | POST `/agenda` | PUT `/agenda/:id` |

Listas sempre paginadas: `?page=1&pageSize=20&q=termo`, máximo 50, retorno
`{ items, total, page, pageSize, totalPages }`. Incluem todos os estados editoriais.
Detalhes retornam campos do banco (não o formato resumido público).
A busca administrativa considera título/categoria, autoria no acervo e tipo/local
na agenda. Na lista de cadeiras, considera número, patrono e nomes dos ocupantes.
POST retorna 201; PUT retorna 200 e recebe o formulário completo.
Campos opcionais omitidos são limpos/defaultados no PUT; não é PATCH.
Campos desconhecidos são recusados para evitar alterações indevidas.

Status: `RASCUNHO` (padrão), `PUBLICADO`, `ARQUIVADO`.
Não existe exclusão definitiva de notícias ou obras: use `ARQUIVADO` para retirar
do portal. Não há acesso administrativo às mensagens de contato neste escopo.

### Notícia

```json
{
  "titulo": "Encontro literário",
  "categoria": "Literatura",
  "lede": "Resumo da notícia",
  "conteudo": "Texto completo, sem interpretação de HTML",
  "img": "/uploads/IDENTIFICADOR.png",
  "status": "PUBLICADO",
  "publicadoEm": "2026-09-23T18:00:00-03:00"
}
```

Título, categoria, lede e conteúdo são obrigatórios. Imagem é opcional.
`publicadoEm` é obrigatório para publicar; datas futuras seguem ocultas no portal
até a data programada. Conteúdo aceita até 100.000 caracteres, dentro do limite
HTTP de 256 KB por JSON. A API pública permanece inalterada.

### Acervo

```json
{
  "titulo": "Memórias da Academia",
  "categoria": "Livro",
  "autoriaTexto": "Nome do autor",
  "edicao": "1ª edição",
  "ano": 2026,
  "paginas": 120,
  "cor": "navy",
  "descricao": "Apresentação da obra",
  "pdfUrl": "/uploads/IDENTIFICADOR.pdf",
  "status": "PUBLICADO"
}
```

Título e categoria obrigatórios. PDF obrigatório para publicar; páginas devem ser
positivas; ano entre 1 e 9999. Cores: `navy`, `ochre`, `ink`.
O formulário envia autoria em `autoriaTexto` e tipo em `categoria`.
Relações antigas de autoria são preservadas ao editar o formulário.

### Agenda

```json
{
  "titulo": "Sarau",
  "tipo": "Sarau",
  "inicioEm": "2026-10-01T19:00:00-03:00",
  "fimEm": "2026-10-01T21:00:00-03:00",
  "local": "Sede da Academia",
  "descricao": "Programação",
  "foto": "/uploads/IDENTIFICADOR.jpg",
  "status": "PUBLICADO"
}
```

Título, tipo, início e local obrigatórios. Fim opcional, não pode preceder início.
O formulário converte data e hora para ISO com fuso de Fortaleza (`-03:00`).
`DELETE /agenda/:id` retorna 204. Exclui o evento e suas linhas de galeria numa
transação; não apaga arquivos físicos nem outras fotos. O frontend pede confirmação
ao administrador antes de chamar essa rota.

## Cadeiras e sucessão

- GET `/cadeiras`: lista paginada com patrono e ocupações históricas.
- GET `/cadeiras/:numero`: detalhe; aceita número decimal ou romano canônico.
- GET `/academicos?q=nome` e `/patronos?q=nome`: consultas paginadas para selecionar
  pessoas existentes. Use IDs para evitar duplicar a mesma pessoa.
- POST `/cadeiras`: cria cadeira ou substitui titular após confirmação.
- PUT `/cadeiras/:numero`: corrige dados, sem substituir titular.
- POST `/cadeiras/:numero/encerrar`: encerra ocupação por vacância ou falecimento.

Cadastro de cadeira nova:

```json
{
  "numero": 12,
  "patrono": { "nome": "Nome do patrono", "biografia": "Biografia", "fotoUrl": "" },
  "academico": { "nome": "Nome do titular", "biografia": "Biografia", "bioExtra": "", "fotoUrl": "" },
  "inicioEm": "2026-09-23"
}
```

`numero` é inteiro de 1 a 3999 (regra já existente); `inicioEm` é data civil
YYYY-MM-DD e não pode estar no futuro. Use `patronoId` em vez de `patrono`, e
`academicoId` em vez de `academico`, quando os registros já existem.
Na cadeira nova o primeiro titular é fundador por padrão. Se o fundador histórico
for outro acadêmico já cadastrado, informe `fundadorId`; para cadastrar um fundador
distinto ainda inexistente, envie `fundador: { "nome": "Nome do fundador" }`.
Ele terá ocupação histórica sem datas inventadas. Cadeiras existentes preservam
fundador e patrono na troca; dados desses dois cadastros enviados no POST são ignorados.

Quando o número já existe, a primeira tentativa retorna **409**, sem gravar nada:

```json
{
  "code": "CONFIRMACAO_CADEIRA",
  "error": "O número já existe. Confirme a substituição com a ocupação atual exibida.",
  "ocupacaoAtualId": "ID_DA_OCUPACAO_ATUAL",
  "cadeira": { "numero": 12, "ocupacoes": [] }
}
```

`cadeira` contém o detalhe completo real para o popup (ocupações não estarão
necessariamente vazias como no exemplo abreviado). Se o administrador confirmar,
repita o cadastro com:

```json
{
  "numero": 12,
  "academico": { "nome": "Novo titular" },
  "inicioEm": "2026-09-23",
  "confirmarSubstituicao": true,
  "ocupacaoAtualId": "ID_DA_OCUPACAO_ATUAL"
}
```

Para cadeira vaga, envie `ocupacaoAtualId: null`. Em cadeira existente os campos
de patrono do POST são ignorados, preservando o cadastro anterior. A data da troca
não pode preceder a posse anterior. A API encerra a ocupação antiga, registra o novo
titular e mantém o acadêmico antigo, obras e histórico. Não marca o anterior como
falecido automaticamente. Se outro administrador trocar o titular antes da
confirmação, responde novamente 409; o frontend deve reapresentar os dados atuais.

Para corrigir dados do titular atual, use PUT com `academico` e `ocupacaoAtualId`;
para corrigir patrono, use `patrono`. Cada objeto enviado exige nome e substitui
seus campos opcionais; objetos omitidos não são alterados. Editar o patrono ou
acadêmico altera a mesma pessoa nas demais relações em que ela aparece.
O PUT também aceita `encerramento: { "fimEm": "2026-09-23", "inMemoriam": false }`
junto dos dados do formulário e de `ocupacaoAtualId`, aplicando edição e encerramento
na mesma transação. Na tela, mudar a situação do titular exige data e confirmação.
Datas históricas de posse conhecidas apenas pelo ano não são convertidas em datas
completas fictícias; o formulário preserva a informação existente.

Para encerrar uma ocupação sem empossar sucessor:

```json
{
  "ocupacaoAtualId": "ID_DA_OCUPACAO_ATUAL",
  "fimEm": "2026-09-23",
  "inMemoriam": false
}
```

`inMemoriam: true` também marca o acadêmico como falecido. Ninguém pode ocupar
duas cadeiras vigentes, e um acadêmico in memoriam não pode assumir uma cadeira.
Não existe DELETE de cadeira ou histórico.

## Uploads

POST `/uploads` (sob `/api/admin`) recebe **o arquivo binário**, não FormData.
Envie `Content-Type: application/pdf`, `image/png`, `image/jpeg` ou `image/webp`,
cookie, origem e `X-CSRF-Token`. Máximo 10 MB; tipo e assinatura precisam coincidir.
SVG, HTML, executáveis e nomes de arquivo fornecidos pelo cliente não são aceitos.
O servidor cria nome UUID e responde 201 com `{ url, contentType, size }`.

```js
const response = await fetch('/api/admin/uploads', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrfToken },
  body: file,
})
// Use a URL retornada em img, foto, fotoUrl ou pdfUrl do formulário.
```

Arquivos ficam em `backend/uploads`, ignorado pelo Git; `UPLOAD_DIR` permite
configurar outro diretório. URLs são públicas, inclusive antes da publicação do
registro: não envie documentos confidenciais. A checagem de assinatura não é
antivírus nem validação completa de PDF. Arquivos recebem nosniff e CSP sandbox.
Uploads sem registro e arquivos de registros excluídos não são removidos
automaticamente, evitando apagar arquivos ainda utilizados por outro conteúdo.
O Vite encaminha `/uploads` ao backend. A prévia de foto usa uma URL temporária
`blob:`, liberada ao trocar o arquivo ou fechar o formulário. Imagens cadastradas
são usadas nas páginas públicas; os retratos demonstrativos permanecem apenas
quando o registro não possui foto.

## Erros e validação

400: corpo/campos inválidos; 401: sessão ausente/expirada; 403: origem/CSRF;
404: registro inexistente; 409: confirmação ou conflito; 413: tamanho;
429: excesso de requisições. Não use uma mensagem de sucesso antes do retorno 2xx.

`npm test` inclui bloqueio de acesso, validação, hash de senha e uploads inválidos.
`npm run test:integration` inclui login, CSRF, publicação pública, exclusão de agenda,
upload, histórico de cadeiras, confirmações antigas, concorrência e revogação.

Referências de segurança: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
e [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Integridade das edições

PUT de notícias, acervo e agenda exige `atualizadoEm` recebido no GET que abriu
a edição. A comparação ocorre na própria escrita: uma versão antiga retorna
409 sem sobrescrever o registro; versão ausente ou inválida retorna 400. Reabra
o registro para comparar as alterações e aplicar sua edição à versão atual.

Cadastros de pessoas com o mesmo nome (ignorando caixa, acentos e espaços
repetidos) retornam 409 `CONFIRMACAO_PESSOA`, com `role` e `candidates`.
O painel permite confirmar a reutilização por `academicoId`, `fundadorId` ou
`patronoId`, preservando biografia e relações existentes. Se forem pessoas
diferentes, a confirmação explícita envia o papel em `confirmarHomonimos`.
Nomes iguais nunca são mesclados automaticamente. Reservas transacionais por
nome impedem que cadastros simultâneos criem duplicatas sem essa confirmação.

Portal e painel compartilham a ordem das ocupações, considerando fundador,
datas completas, anos conhecidos e um desempate estável. Uma posse não pode
anteceder o encerramento de ocupações anteriores, mesmo em cadeira vaga.

Falhas temporárias em `/auth/me` preservam formulários abertos e a sessão em
memória. Respostas 401 e a expiração da sessão continuam encerrando o acesso;
todas as escritas permanecem autenticadas pelo backend.

Para preservar a aparência existente, os retratos ilustrativos foram mantidos
quando não há foto cadastrada; seu texto alternativo identifica a ilustração
sem atribuir o rosto ao acadêmico. Cadastre fotos reais antes da publicação.
