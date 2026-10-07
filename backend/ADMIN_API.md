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

Configure `DATABASE_URL` e `DIRECT_URL` conforme `.env.example`. No PostgreSQL
local, ambas apontam para o mesmo banco; em instalações com pooler, `DIRECT_URL`
precisa permitir executar migrations. A suíte `test:integration` exige
`TEST_DATABASE_URL` e sobrescreve as duas variáveis nos subprocessos com o mesmo
schema temporário. Ela verifica o destino das migrations antes de testar a API
e desativa o R2 para não enviar arquivos de teste ao armazenamento da aplicação.

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

| Recurso | Listar | Detalhar | Criar | Editar | Excluir |
| --- | --- | --- | --- | --- | --- |
| Notícias | GET `/noticias` | GET `/noticias/:id` | POST `/noticias` | PUT `/noticias/:id` | DELETE `/noticias/:id` |
| Acervo | GET `/acervo` | GET `/acervo/:id` | POST `/acervo` | PUT `/acervo/:id` | DELETE `/acervo/:id` |
| Agenda | GET `/agenda` | GET `/agenda/:id` | POST `/agenda` | PUT `/agenda/:id` | DELETE `/agenda/:id` |

Listas sempre paginadas: `?page=1&pageSize=20&q=termo`, máximo 50, retorno
`{ items, total, page, pageSize, totalPages }`. Incluem todos os estados editoriais.
Detalhes retornam campos do banco (não o formato resumido público).
A busca administrativa considera título/categoria, autoria no acervo e tipo/local
na agenda. Na lista de cadeiras, considera número, patrono e nomes dos ocupantes.
POST retorna 201; PUT retorna 200 e recebe o formulário completo.
Campos opcionais omitidos são limpos/defaultados no PUT; não é PATCH.
Campos desconhecidos são recusados para evitar alterações indevidas.

Status: `RASCUNHO` (padrão), `PUBLICADO`, `ARQUIVADO`.
Use `ARQUIVADO` para retirar do portal e manter o registro recuperável no painel.
DELETE remove o registro definitivamente, conforme as regras abaixo.
Não há acesso administrativo às mensagens de contato neste escopo.

### Exclusões definitivas

Todas as rotas abaixo usam a base `/api/admin`, exigem sessão, `Origin` autorizado
e `X-CSRF-Token`, e estão sujeitas ao limite de escritas. Não recebem corpo JSON.
Retornam **204 sem corpo** somente depois da remoção, **404** para ID inexistente
(inclusive ao repetir a exclusão), **400** para ID inválido e **409** para vínculos
que impeçam a operação. Sem sessão: **401**; origem/CSRF inválidos: **403**.

| Rota DELETE | Efeito |
| --- | --- |
| `/noticias/:id` | Exclui a notícia em qualquer estado editorial. |
| `/acervo/:id` | Exclui a publicação e suas relações de autoria na mesma transação. Preserva os acadêmicos e as demais publicações. |
| `/agenda/:id` | Exclui o evento e suas linhas de galeria na mesma transação, mantendo o comportamento existente. |
| `/academicos/:id` | Exclui somente acadêmico sem ocupações, obras, produções, autorias ou mandatos. |
| `/patronos/:id` | Exclui somente patrono sem vínculo com cadeira. |
| `/galeria/:id` | Exclui somente a referência da foto na galeria; preserva o evento e as outras fotos. |

As restrições do banco protegem as pessoas inclusive contra vínculos criados
simultaneamente. Ocupações encerradas e mandatos antigos também impedem exclusão:
o histórico não é apagado. Não existe exclusão em cascata de pessoas ou cadeiras.

Exclusões atuam sobre o estado atual do registro pelo ID; diferentemente do PUT,
não recebem `atualizadoEm`. O consumidor deve apresentar o registro atual e obter
a confirmação do administrador antes de enviar DELETE. O painel possui ações
de exclusão que consomem estas rotas.

PDFs e imagens físicos **não são apagados**, pois podem ser compartilhados por
outros registros. Suas URLs diretas continuam acessíveis. O arquivamento permanece
disponível quando a intenção for apenas retirar o conteúdo das listagens públicas.

Para obter o ID de uma foto, use **GET `/galeria?page=1&pageSize=20`** autenticado.
Pode filtrar por `eventoId`; retorna `{ items, total, page, pageSize, totalPages }`
com os campos da galeria, inclusive `id`, `eventoId`, `src` e `legenda`. Inclui fotos
de eventos em rascunho/arquivados, por ser administrativo. Limite de 50 itens por
página, ordem por `ordem` e `id`, e páginas além do final ajustadas à última.
A rota pública `/api/eventos/galeria` mantém seu contrato e filtro de publicação.

```js
const response = await fetch('/api/admin/acervo/' + encodeURIComponent(id), {
  method: 'DELETE', credentials: 'include',
  headers: { 'X-CSRF-Token': csrfToken },
})
if (!response.ok) throw new Error('Não foi possível excluir a publicação')
// 204 não possui JSON. Atualize a lista somente após o sucesso.
```

Os testes de integração verificam remoção, bloqueio por vínculos, preservação de
arquivos compartilhados e reversão completa caso a exclusão de acervo falhe.

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
positivas; ano entre 1 e 9999.
O formulário envia autoria em `autoriaTexto` e tipo em `categoria`.
Relações antigas de autoria são preservadas ao editar o formulário.
`cor` aceita `navy` (padrão), `ochre`, `ink`, `green` e `red`, incluindo os valores
já usados pelos registros demonstrativos. Editar uma obra não exige trocar sua cor.

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

Ao criar ou salvar um evento `PUBLICADO` com `foto`, o backend inclui essa imagem
automaticamente na galeria **Registros de eventos**, com o título como legenda.
Evento e foto são gravados na mesma transação. O formulário atual envia uma foto;
salvamentos repetidos não geram novas cópias. Alterar a foto ou o título atualiza
a referência automática; limpar `foto`, arquivar ou voltar para rascunho remove
essa referência. Fotos extras cadastradas manualmente são preservadas e só ficam
públicas enquanto o evento estiver publicado. Se a mesma imagem já estiver
vinculada manualmente ao evento, sua legenda e seus metadados são preservados,
sem criar uma cópia automática.

`automatica` é um campo interno da galeria; não é aceito no formulário do evento.
Excluir uma foto automática por `DELETE /galeria/:id` não limpa `Evento.foto`:
salvar o evento publicado novamente recria a referência. Arquivos físicos não
são apagados. A resposta pública da galeria continua `{ src, legenda }`.
Eventos anteriores passam por essa sincronização no próximo salvamento;
a migration preserva as fotos existentes como manuais.

Antes de iniciar a versão atualizada, execute `npm --prefix backend run db:generate`
e `npm --prefix backend run db:deploy` para adicionar o campo e suas restrições.

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

As consultas de acadêmicos e patronos retornam todas as pessoas por padrão,
inclusive as vinculadas, para permitir reutilizar cadastros. O filtro opcional
`semVinculos=true` retorna somente pessoas que podem ser excluídas: acadêmicos
sem ocupações (inclusive históricas), obras, produções, autorias ou mandatos;
patronos sem cadeiras. `semVinculos=false` equivale ao comportamento padrão.
Valores diferentes ou repetidos retornam 400. O filtro precisa ser enviado
explicitamente pelo consumidor; o backend não o presume pelo nome da tela.

Essas listas aceitam `page`, `pageSize` (padrão 20, máximo 50) e `q` (até 200
caracteres), com retorno `{ items, total, page, pageSize, totalPages }`. A ordem
é por nome e ID; páginas além do final são ajustadas à última, inclusive após
uma exclusão. Lista vazia retorna página 1 e `totalPages: 1`. Contagem e itens
são lidos na mesma transação. A busca ignora diferenças de caixa e trata `%`,
`_` e barra invertida como caracteres literais.

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

Todo PUT também exige `versao`, exatamente como recebido ao abrir a cadeira no
GET administrativo. Listagens, detalhes e respostas de gravação incluem esse
campo. A versão considera cadeira, ocupações e pessoas relacionadas, inclusive
patronos compartilhados. Ausência/formato inválido retorna 400; dados alterados
desde a leitura ou gravações concorrentes retornam 409 sem alteração parcial ou
registro de sucesso na auditoria. Reabra o formulário e confira os dados antes
de tentar novamente; não busque uma versão nova apenas para reenviar dados antigos.
Essa proteção também se aplica à edição do patrono de uma cadeira vaga. A versão
é calculada a partir dos dados existentes, sem migration ou mudança na API pública.

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

## Informações institucionais e diretoria

Base `/api/admin`. As rotas exigem sessão; escritas também exigem origem autorizada
e `X-CSRF-Token`. A migration `20261005000100_administracao_institucional` adiciona
controle de edição e recursos de auditoria, sem apagar os dados existentes.
Execute `npm --prefix backend run db:generate` e `npm --prefix backend run db:deploy`.

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/instituicao` | `{ info }`, com todos os dados e `atualizadoEm`; `info: null` se ainda não existe. |
| PUT | `/instituicao` | Cria (201) ou atualiza (200) o registro institucional único, retornando `{ info }`. |
| GET | `/gestoes?page=1&pageSize=20` | Lista paginada de gestões históricas, atuais e futuras, com `_count.mandatos` e `atualizadoEm`. |
| GET | `/gestoes/:id` | Gestão completa com `mandatos`, cada um com ID e dados básicos do acadêmico. |
| POST | `/gestoes` | Cria gestão e, opcionalmente, seus mandatos na mesma transação; 201. |
| PUT | `/gestoes/:id` | Edita o período da gestão, preservando seus mandatos; 200. |
| DELETE | `/gestoes/:id` | Remove somente gestão sem mandatos; 204. Com mandatos, retorna 409. |
| POST | `/gestoes/:id/mandatos` | Inclui integrante; 201 com a gestão completa e a nova versão. |
| PUT | `/gestoes/:id/mandatos/:mandatoId` | Corrige integrante/cargo/datas ou encerra mandato; 200 com a gestão atualizada. |
| DELETE | `/gestoes/:id/mandatos/:mandatoId` | Remove cadastro incorreto de mandato; 200 com a gestão atualizada. Preserva o acadêmico. |

A lista de gestões usa `{ items, total, page, pageSize, totalPages }`, máximo 50
por página, ordem por ano inicial decrescente e ID, com páginas além do final
ajustadas à última. Datas administrativas são ISO; datas civis dos mandatos
devem ser enviadas como `YYYY-MM-DD`, sem conversão para o fuso do navegador.

### Informações institucionais

```json
{
  "nome": "Academia Limoeirense de Letras",
  "historia": "História da instituição",
  "missao": "Missão da instituição",
  "fundacaoAno": 1964,
  "endereco": "Endereço da sede",
  "email": "contato@example.com",
  "telefone": "Telefone institucional",
  "sedeTexto": "Apresentação da sede",
  "trajetoriaTexto": "Trajetória da instituição",
  "horarioAtendimento": "Horário de atendimento",
  "atualizadoEm": null
}
```

`nome`, `historia` e `missao` são obrigatórios; limites de 300, 100.000 e 20.000
caracteres, respectivamente. `fundacaoAno` aceita inteiro entre 1 e o ano atual
em Fortaleza. E-mail é validado e normalizado; endereço aceita até 1.000 caracteres,
telefone até 50, horário até 500 e sede/trajetória até 20.000 cada. Campos opcionais
omitidos ou nulos são limpos no PUT. Campos desconhecidos, inclusive `id`, são recusados.

Na primeira gravação, envie `atualizadoEm: null`. Nas edições, envie o valor do
último GET administrativo. Não use o GET público como fonte da versão: o contrato
público é preservado e não expõe esse metadado. Uma versão antiga retorna 409,
e uma versão ausente/malformada retorna 400. Duas criações simultâneas também
não podem sobrescrever uma à outra.

### Gestões, cargos e sucessões da diretoria

```json
{
  "inicioAno": 2027,
  "fimAno": 2028,
  "mandatos": [
    {
      "academicoId": "ID_DE_UM_ACADEMICO_EXISTENTE",
      "cargo": "Presidente",
      "inicioEm": "2027-01-01",
      "fimEm": "2028-12-31"
    }
  ]
}
```

O POST aceita até 100 mandatos iniciais; a lista é opcional. Os anos são inteiros
de 1 a 9999, com `fimAno >= inicioAno`; `fimAno: null` representa uma gestão sem
término definido. A seleção pública existente trabalha com anos inclusivos:
uma gestão 2027–2028 inclui os dois anos. Novas escritas não permitem sobreposição
com outra gestão; feche a anterior antes de cadastrar a seguinte. Duas gestões
distintas no mesmo ano não são representadas por este modelo anual.

`cargo` aceita até 100 caracteres. Mandatos devem apontar para acadêmicos existentes.
Datas são opcionais para preservar registros históricos conhecidos apenas pelo ano;
na verificação dos períodos, datas ausentes usam os limites da gestão. Datas explícitas
precisam ficar dentro desses limites. Reduzir a gestão não pode deixar mandatos fora
do período. Acadêmicos in memoriam só podem ser atribuídos a períodos já encerrados.

Um cargo não pode ter dois ocupantes no mesmo intervalo, ignorando diferenças de
caixa, acentos e espaços. As datas finais são inclusivas: se o antecessor encerrou em
30/06, o sucessor pode começar em 01/07. Para substituição, encerre o mandato anterior
com PUT e inclua o sucessor; isso mantém o histórico. A mesma pessoa pode exercer
cargos diferentes. DELETE de mandato é uma correção explícita de cadastro, auditada;
não deve ser usado para representar uma sucessão.

PUT/DELETE de gestão e POST/PUT/DELETE de mandato exigem **`atualizadoEm` da gestão**
no corpo JSON. No PUT da gestão, envie somente `inicioAno`, `fimAno` e `atualizadoEm`.
No POST/PUT de mandato, envie seus campos e essa versão; no DELETE, apenas a versão.
Toda alteração de integrante também avança a versão da gestão. Use a gestão retornada
na próxima operação ou consulte-a novamente; uma versão antiga recebe 409. Não existe
remoção implícita de integrantes ao editar os anos da gestão.

As escritas e a auditoria são transacionais. Falha ao registrar o histórico reverte
os dados, inclusive mandatos iniciais e versões. Novos recursos de auditoria:
`INSTITUICAO`, `GESTAO` e `MANDATO`, com ações `CRIAR`, `EDITAR` e `EXCLUIR` conforme
a operação. Textos institucionais completos não são copiados para o histórico.

O endpoint público `/api/instituicao` passa a refletir as gravações, mantendo
`{ info, gestao }` e a seleção de gestão/mandatos vigentes em Fortaleza. As rotas
administrativas permitem consultar também os períodos passados e futuros.
A tela administrativa atual continua somente para consulta: sua edição e os filtros
visuais para os novos recursos da auditoria precisam ser conectados pelo frontend.

## Uploads

POST `/uploads` (sob `/api/admin`) recebe **o arquivo binário**, não FormData.
Envie `Content-Type: application/pdf`, `image/png`, `image/jpeg` ou `image/webp`,
cookie, origem e `X-CSRF-Token`. Máximo 10 MB; o conteúdo precisa corresponder ao tipo.
SVG, HTML, executáveis e nomes de arquivo fornecidos pelo cliente não são aceitos.
O servidor cria nome UUID e responde 201 com `{ url, contentType, size }`.

Imagens passam por decodificação de pixels com `sharp`, incluindo os quadros de
WebP animado, e têm limite de 40 milhões de pixels no total. PDFs passam por
leitura estrutural com `pdf-lib`: precisam ter páginas, dimensões válidas e não
podem estar criptografados/protegidos por senha. Cabeçalhos isolados, arquivos
truncados e tipos divergentes retornam 400 antes de gravar no armazenamento. Os arquivos
aceitos são preservados byte a byte, sem recompressão ou alteração do documento.

O formulário verifica o tipo de cada campo antes do envio: imagens para membros,
notícias e eventos; PDF para acervo. A API também valida as URLs ao criar ou editar,
impedindo que um upload PDF seja usado como foto e uma imagem como PDF. Extensões
são verificadas sem query/fragmento e após decodificação. Links externos sem
extensão (por exemplo, endpoints de download) continuam aceitos por compatibilidade;
o backend não baixa arquivos remotos nem garante o conteúdo desses links.

```js
const response = await fetch('/api/admin/uploads', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrfToken },
  body: file,
})
// Use a URL retornada em img, foto, fotoUrl ou pdfUrl do formulário.
```

Com banco local em desenvolvimento, arquivos podem ficar em `backend/uploads`,
ignorado pelo Git. Com banco remoto (inclusive Supabase) ou em produção, a ausência
de armazenamento configurado retorna 503 no upload, sem gravar arquivo ou auditoria
de sucesso. Isso evita registrar no banco compartilhado URLs que só funcionam na
máquina de quem enviou. Arquivos já cadastrados permanecem acessíveis.

`UPLOAD_DIR` explícito tem prioridade sobre R2 e permite armazenamento local em
um backend central com disco persistente, ou em testes isolados. Esse diretório
não é sincronizado pelo banco; compartilhar somente o `.env` não distribui arquivos.
Para usar Cloudflare R2, configure as cinco variáveis de `.env.example`:
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` e
`R2_PUBLIC_URL`. O ID da conta deve ter 32 caracteres hexadecimais e a URL pública
deve usar HTTPS, sem credenciais, query ou fragmento. Ela pode incluir um prefixo
de caminho se o domínio servir os objetos nesse caminho. Configuração parcial
ou inválida é recusada antes da gravação; a API não troca para disco silenciosamente.
O backend usa nomes UUID, preserva o tipo do arquivo e retorna sua URL pública.
Cada operação no R2 tem limite de 60 segundos e libera o cliente ao terminar.

URLs são públicas, inclusive antes da publicação do
registro: não envie documentos confidenciais. A validação estrutural não é
antivírus nem garantia de renderização de todo PDF. Arquivos servidos pelo backend
recebem nosniff e CSP sandbox; cabeçalhos dos arquivos no R2 dependem da configuração
do domínio/bucket.
Uploads sem registro e arquivos de registros excluídos não são removidos
automaticamente, evitando apagar arquivos ainda utilizados por outro conteúdo.
O Vite encaminha `/uploads` ao backend. A prévia de foto usa uma URL temporária
`blob:`, liberada ao trocar o arquivo ou fechar o formulário. Imagens cadastradas
são usadas nas páginas públicas; os retratos demonstrativos permanecem apenas
quando o registro não possui foto.

## Auditoria administrativa — sprint 5

As operações administrativas bem-sucedidas passam a gerar registros permanentes
em `RegistroAuditoria`. Cada entrada guarda ID/e-mail do administrador autenticado,
ação, recurso, ID do registro afetado, resumo, data/hora UTC e detalhes essenciais.
O usuário é obtido da sessão; não pode ser informado no corpo da requisição.

| Ação | Operações registradas |
| --- | --- |
| `CRIAR` | Cadastro de notícia, acervo, evento, cadeira, instituição, gestão ou mandato. O estado editorial inicial, quando aplicável, fica nos detalhes. |
| `EDITAR` | Edição de conteúdo, cadeira/pessoas, instituição, gestão ou mandato. Inclui retorno a rascunho e encerramento de mandato da diretoria. |
| `PUBLICAR` / `ARQUIVAR` | Mudança de estado editorial em uma edição. |
| `TROCAR_TITULAR` | Posse em cadeira já cadastrada, após confirmação. |
| `ENCERRAR_OCUPACAO` | Encerramento por rota própria ou pelo formulário de edição. |
| `EXCLUIR` | Exclusão de notícia, acervo, evento, acadêmico, patrono, foto da galeria, gestão vazia ou mandato incorreto. |
| `ENVIAR_ARQUIVO` | Upload concluído, com URL, tipo e tamanho; sem os bytes do arquivo. |
| `LOGIN` / `LOGOUT` | Entrada e saída administrativas concluídas. |

O registro corresponde à operação: cadastrar uma cadeira inclui suas pessoas e
ocupações; salvar um evento inclui a sincronização da galeria; excluir acervo/evento
inclui a remoção dos respectivos vínculos/fotos. Os detalhes de cadeira identificam
número, patrono, fundador e titulares anterior/atual. Nas edições são guardados os
nomes dos campos alterados e, quando aplicável, os estados editoriais anterior/atual.
Salvar sem mudança de conteúdo continua sendo uma operação `EDITAR`, com a lista
de campos alterados vazia. Não se trata de versionamento integral dos conteúdos.

Senhas, hashes, cookies, tokens, corpos HTTP, mensagens de contato, arquivos binários
e textos completos de conteúdo/biografia não são copiados para a auditoria.
IDs e e-mail são snapshots sem exclusão em cascata; permanecem após excluir o
conteúdo ou a conta administrativa. A migration bloqueia UPDATE, DELETE e TRUNCATE
na tabela. Não existem rotas para criar, editar ou apagar esses registros manualmente.

Alteração e auditoria são gravadas na mesma transação de banco. Se o registro de
auditoria falhar, a alteração é revertida e a API não confirma sucesso. Nos uploads,
o backend tenta remover o arquivo novo se a gravação da auditoria falhar. No R2,
se a remoção também falhar, o erro interno preserva ambas as causas e identifica
o objeto para manutenção. Banco e armazenamento não formam uma transação
distribuída: falhas de remoção ou interrupção abrupta podem deixar arquivo órfão.
Validações recusadas, conflitos, falhas de login, acessos negados e
leituras não geram entradas de sucesso. Os logs técnicos de acesso continuam separados.

### Consultar histórico

**GET `/api/admin/auditoria`**, com sessão administrativa. Retorna
`{ items, total, page, pageSize, totalPages }`, ordenado do mais recente para o mais
antigo, com desempate pelo ID. Padrão de 20 itens, máximo 50, e páginas além do final
limitadas à última. Os filtros são combinados antes da contagem e da paginação:

| Parâmetro | Valores |
| --- | --- |
| `page`, `pageSize` | Inteiros positivos; `pageSize` até 50. |
| `acao` | Uma das ações da tabela acima. |
| `recurso` | `NOTICIA`, `ACERVO`, `EVENTO`, `CADEIRA`, `ACADEMICO`, `PATRONO`, `GALERIA`, `UPLOAD`, `SESSAO`, `INSTITUICAO`, `GESTAO`, `MANDATO`. |
| `registroId` | ID exato do registro; para cadeira, seu UUID (o número está em `detalhes.numero`). |
| `administradorId` | ID exato do administrador. |
| `inicio`, `fim` | Datas ISO com fuso; limites inclusivos. Ex.: `2026-09-28T00:00:00-03:00`. |

```js
const filtros = new URLSearchParams({
  recurso: 'NOTICIA', acao: 'EXCLUIR', page: '1', pageSize: '20',
  inicio: '2026-09-28T00:00:00-03:00',
})
const response = await fetch('/api/admin/auditoria?' + filtros, { credentials: 'include' })
if (!response.ok) throw new Error('Não foi possível consultar o histórico')
const pagina = await response.json()
```

Sem sessão: 401; filtros inválidos: 400. A auditoria não é exposta pelas rotas
públicas. O painel também oferece a consulta em `/admin/auditoria`, após o login.
Depois de atualizar as dependências, gere o cliente e aplique a migration
`20260928000100_auditoria_administrativa` com `npm --prefix backend run db:generate`
e `npm --prefix backend run db:deploy`. O registro começa após a implantação:
não reconstrói alterações anteriores, e não cobre SQL manual, seed/importações
ou comandos de manutenção de contas executados fora da API administrativa.

## Erros e validação

400: corpo/campos inválidos; 401: sessão ausente/expirada; 403: origem/CSRF;
404: registro inexistente; 409: confirmação ou conflito; 413: tamanho;
429: excesso de requisições. Não use uma mensagem de sucesso antes do retorno 2xx.

`npm test` inclui bloqueio de acesso, validação, hash de senha e uploads inválidos.
O fluxo R2 é testado com o SDK simulado: imagens/PDFs, metadados, auditoria,
configuração incompleta, falhas do provedor e compensação quando a auditoria falha.
Esses testes não verificam credenciais, permissões nem acesso público de um bucket real.
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
