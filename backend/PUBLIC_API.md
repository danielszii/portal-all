# Buscas, filtros e destaques públicos

Base: `/api`. Estas rotas não exigem login. O backend não substitui falhas de
persistência por conteúdo demonstrativo: retorna erro HTTP 500 sem detalhes internos.

## Busca de cadeiras

- `GET /cadeiras?q=12` e `GET /cadeiras?q=XII` encontram a cadeira 12.
- `GET /busca?q=12` e `GET /busca?q=XII` também encontram essa cadeira na busca global.
- O número é comparado por igualdade: pesquisar `12` não seleciona a cadeira 112
  somente por causa do número. Aceita decimais de 1 a 3999 e romanos canônicos,
  ignorando caixa e espaços externos.
- Patrono, titular e fundador continuam pesquisáveis por trechos do nome, sem
  diferenciar caixa e acentos. Essa busca textual também se aplica a termos numéricos.
- O campo `number` da resposta mantém o contrato romano (`"XII"`); a formatação
  visual do número continua sob responsabilidade do consumidor.

`GET /busca` retorna `{ cadeiras, noticias, acervo, page, totalPages }`, com itens
resumidos. Aceita `page` e `pageSize` (máximo 50). Sem ambos, usa página 1 e tamanho
30; ao informar paginação sem `pageSize`, usa o padrão 12. A paginação é aplicada
separadamente a cada grupo depois dos filtros. Grupos sem itens na página pedida
retornam `[]`; não repetem a última página. Termo vazio retorna os três grupos vazios.

## Filtros já disponíveis

| Rota | Parâmetros | Comportamento |
| --- | --- | --- |
| `/cadeiras` | `q` ou `search`, `status` | Número/nome e situação combinados. Situações: `Titular em exercício`, `In memoriam`, `Vaga`; `Todos` não restringe. |
| `/eventos` | `tipo` | Tipo completo sem diferenciar caixa. `Todos` não restringe. Apenas publicados. |
| `/noticias` | `q` ou `search`, `categoria`, `resumo`, `page`, `pageSize` | Busca em título, resumo, conteúdo e categoria, sem caixa/acentos. Apenas publicados cuja data de publicação já chegou. |
| `/acervo` | `q` ou `search`, `tipo`, `page`, `pageSize` | Busca em título, autoria, descrição, edição, categoria e ano, sem caixa/acentos. Apenas publicados. |

Em notícias/acervo, categoria e tipo usam igualdade sem caixa/acentos; `Todos` e
`Todas` não restringem. `q` tem precedência sobre `search`. Sem paginação, retornam
uma lista; com paginação, `{ items, total, page, pageSize, totalPages }`. Nessas duas
rotas, uma página além do final é ajustada à última disponível. `resumo=true` omite
o conteúdo completo da notícia. Cadeiras e eventos retornam listas sem paginação.

Exemplos:

```text
GET /api/cadeiras?q=12&status=Vaga
GET /api/eventos?tipo=Sarau
GET /api/noticias?q=memorias&categoria=Cultura&resumo=true&page=1&pageSize=10
GET /api/acervo?q=joao&tipo=Livro&page=1&pageSize=8
```

Disponibilidade de um filtro na API não significa que a tela tenha um controle
visual para ele. Estes ajustes não alteram o frontend.

## Destaques da página inicial

| Rota | Retorno |
| --- | --- |
| `/inicio/cadeiras` | Total de cadeiras e até quatro ocupadas ou in memoriam: `{ total, items }`. |
| `/inicio/acervo` | Total de obras publicadas e até três destaques: `{ total, items }`. |
| `/inicio/noticias` | Até três notícias publicadas, com data de publicação já alcançada. |
| `/inicio/eventos` | Até três eventos publicados, futuros ou em andamento. |

Eventos são ordenados por início crescente, com desempate por ID. Com data de fim,
permanecem elegíveis até esse instante; sem fim, até o instante de início. Encerrados,
rascunhos e arquivados não aparecem. Sem resultados, retorna `[]`.

Exemplo de item de `/inicio/eventos`:

```json
{
  "id": "identificador-do-evento",
  "titulo": "Sarau literário",
  "tipo": "Sarau",
  "data": "2026-10-01",
  "hora": "19h00",
  "local": "Sede da Academia",
  "foto": "/uploads/identificador.jpg"
}
```

Data e hora usam `America/Fortaleza`, como a agenda existente. `foto` é omitida
quando ausente. Descrição, galeria e campos editoriais não são carregados nessa
consulta; o detalhe permanece em `/eventos/:id`. O endpoint fica disponível para
integração futura: sozinho, não acrescenta eventos à página inicial do site.

## Validação

Na raiz do projeto, execute `npm run check`, `npm test` e `npm run build`.
Os testes rápidos usam persistência simulada. Com `TEST_DATABASE_URL` apontando
para um PostgreSQL exclusivo de testes, `npm run test:integration` também verifica
a busca numérica e a seleção/ordenação dos destaques com migrations e banco real.
O runner cria e remove apenas um schema temporário nesse banco.
