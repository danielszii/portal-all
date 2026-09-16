-- Dados exclusivamente demonstrativos para PostgreSQL/DBeaver.
-- Pode ser executado mais de uma vez: os registros com IDs fixos não serão duplicados.

BEGIN;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'teste-patrono-001',
  'Patrono de Teste',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'teste-academico-001',
  'Acadêmico de Teste',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('teste-cadeira-001', 3999, 'teste-patrono-001', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'teste-ocupacao-001',
  'teste-cadeira-001',
  'teste-academico-001',
  true,
  true,
  DATE '2026-01-01',
  NULL,
  2026,
  NULL,
  'Desde 2026'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Obra" ("id", "academicoId", "titulo", "ano", "tipo")
VALUES (
  'teste-obra-001',
  'teste-academico-001',
  'Livro Demonstrativo',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'teste-producao-001',
  'teste-academico-001',
  'Crônica Demonstrativa',
  'Crônica',
  'Este texto foi criado apenas para validar a apresentação da produção literária.',
  'PUBLICADO',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Evento" (
  "id", "titulo", "tipo", "inicioEm", "fimEm", "local", "descricao",
  "foto", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'teste-evento-001',
  'Sarau Literário de Teste',
  'Sarau',
  TIMESTAMPTZ '2026-10-20 19:00:00-03',
  TIMESTAMPTZ '2026-10-20 21:00:00-03',
  'Sede da Academia',
  'Evento demonstrativo criado para testar a agenda do portal.',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."GaleriaFoto" (
  "id", "eventoId", "src", "legenda", "textoAlternativo", "credito", "ordem"
)
VALUES (
  'teste-foto-001',
  'teste-evento-001',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Registro demonstrativo do sarau literário.',
  'Público acompanhando uma apresentação cultural.',
  'Imagem demonstrativa — Unsplash',
  1
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Institucional',
  'Notícia geral de teste do banco',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Este conteúdo é exclusivamente demonstrativo e pode ser removido depois da validação.',
  'PUBLICADO',
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Notícia geral de teste do banco'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'teste-acervo-001',
  'Caderno Literário de Teste',
  'Edição demonstrativa',
  2026,
  'navy',
  'Acadêmico de Teste',
  'Caderno',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('teste-acervo-001', 'teste-academico-001', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

-- O portal procura a instituição de id "all". Não altera uma instituição já cadastrada.
INSERT INTO public."Instituicao" (
  "id", "nome", "historia", "missao", "endereco", "email", "telefone",
  "fundacaoAno", "sedeTexto", "trajetoriaTexto", "horarioAtendimento"
)
VALUES (
  'all',
  'Academia Limoeirense de Letras',
  'Texto demonstrativo sobre a história da instituição.',
  'Promover a literatura, a cultura e a preservação da memória local.',
  'Endereço de teste, Limoeiro do Norte - CE',
  'teste@academialimoeirense.org.br',
  '(88) 0000-0000',
  1998,
  'Descrição demonstrativa da sede.',
  'Descrição demonstrativa da trajetória institucional.',
  'Segunda a sexta, das 8h às 12h'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Gestao" ("id", "inicioAno", "fimAno")
VALUES ('teste-gestao-001', 2026, 2028)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."MandatoDiretoria" (
  "id", "gestaoId", "academicoId", "cargo", "inicioEm", "fimEm"
)
VALUES (
  'teste-mandato-001',
  'teste-gestao-001',
  'teste-academico-001',
  'Presidente de Teste',
  DATE '2026-01-01',
  DATE '2028-12-31'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ContatoMensagem" (
  "id", "nome", "email", "assunto", "mensagem", "status", "dataEnvio"
)
VALUES (
  'teste-contato-001',
  'Visitante de Teste',
  'visitante.teste@example.com',
  'Mensagem de demonstração',
  'Esta mensagem existe apenas para validar o armazenamento do formulário de contato.',
  'NOVA',
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- Conferência rápida da quantidade de registros de teste por tabela:
SELECT 'Patrono' AS tabela, COUNT(*) AS quantidade FROM public."Patrono" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'Academico', COUNT(*) FROM public."Academico" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'Cadeira', COUNT(*) FROM public."Cadeira" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'OcupacaoCadeira', COUNT(*) FROM public."OcupacaoCadeira" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'Obra', COUNT(*) FROM public."Obra" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'ProducaoLiteraria', COUNT(*) FROM public."ProducaoLiteraria" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'Evento', COUNT(*) FROM public."Evento" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'GaleriaFoto', COUNT(*) FROM public."GaleriaFoto" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'Noticia', COUNT(*) FROM public."Noticia" WHERE "titulo" = 'Notícia geral de teste do banco'
UNION ALL SELECT 'AcervoItem', COUNT(*) FROM public."AcervoItem" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'AutoriaAcervo', COUNT(*) FROM public."AutoriaAcervo" WHERE "acervoId" LIKE 'teste-%'
UNION ALL SELECT 'Instituicao', COUNT(*) FROM public."Instituicao" WHERE "id" = 'all'
UNION ALL SELECT 'Gestao', COUNT(*) FROM public."Gestao" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'MandatoDiretoria', COUNT(*) FROM public."MandatoDiretoria" WHERE "id" LIKE 'teste-%'
UNION ALL SELECT 'ContatoMensagem', COUNT(*) FROM public."ContatoMensagem" WHERE "id" LIKE 'teste-%'
ORDER BY tabela;
