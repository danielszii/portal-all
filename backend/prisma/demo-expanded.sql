-- Conteúdo fictício para testar listagens e filtros. Importar pelo comando rastreado.

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-001',
  'Patrono Fictício 01',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-001',
  'Aurora das Letras (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-001', 1, 'demo-extra-patrono-001', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-001',
  'demo-extra-cadeira-001',
  'demo-extra-academico-001',
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
  'demo-extra-obra-001',
  'demo-extra-academico-001',
  'Memórias do Vale — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-001',
  'demo-extra-academico-001',
  'Crônica: Memórias do Vale — teste',
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
  'demo-extra-evento-001',
  'Sessão Solene: Memórias do Vale (teste)',
  'Sessão Solene',
  TIMESTAMPTZ '2026-01-20 19:00:00-03',
  TIMESTAMPTZ '2026-01-20 21:00:00-03',
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
  'demo-extra-foto-001',
  'demo-extra-evento-001',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Memórias do Vale — registro fictício.',
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
  'Memórias do Vale — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre memórias do vale, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '1 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Memórias do Vale — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Institucional',
  'Agenda cultural: Memórias do Vale — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre memórias do vale, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '1 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Memórias do Vale — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-001',
  'Memórias do Vale — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Aurora das Letras (fictício)',
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
VALUES ('demo-extra-acervo-001', 'demo-extra-academico-001', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-002',
  'Patrono Fictício 02',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-002',
  'Bento do Vale (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-002', 2, 'demo-extra-patrono-002', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-002',
  'demo-extra-cadeira-002',
  'demo-extra-academico-002',
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
  'demo-extra-obra-002',
  'demo-extra-academico-002',
  'Vozes do Sertão — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-002',
  'demo-extra-academico-002',
  'Crônica: Vozes do Sertão — teste',
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
  'demo-extra-evento-002',
  'Posse: Vozes do Sertão (teste)',
  'Posse',
  TIMESTAMPTZ '2026-02-20 19:00:00-03',
  TIMESTAMPTZ '2026-02-20 21:00:00-03',
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
  'demo-extra-foto-002',
  'demo-extra-evento-002',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Vozes do Sertão — registro fictício.',
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
  'Publicações',
  'Vozes do Sertão — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre vozes do sertão, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '2 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Vozes do Sertão — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Publicações',
  'Agenda cultural: Vozes do Sertão — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre vozes do sertão, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '2 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Vozes do Sertão — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-002',
  'Vozes do Sertão — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Bento do Vale (fictício)',
  'Antologia',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-002', 'demo-extra-academico-002', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-003',
  'Patrono Fictício 03',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-003',
  'Clara dos Versos (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-003', 3, 'demo-extra-patrono-003', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-003',
  'demo-extra-cadeira-003',
  'demo-extra-academico-003',
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
  'demo-extra-obra-003',
  'demo-extra-academico-003',
  'Poesia na Praça — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-003',
  'demo-extra-academico-003',
  'Crônica: Poesia na Praça — teste',
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
  'demo-extra-evento-003',
  'Palestra: Poesia na Praça (teste)',
  'Palestra',
  TIMESTAMPTZ '2026-03-20 19:00:00-03',
  TIMESTAMPTZ '2026-03-20 21:00:00-03',
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
  'demo-extra-foto-003',
  'demo-extra-evento-003',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Poesia na Praça — registro fictício.',
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
  'Acervo',
  'Poesia na Praça — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre poesia na praça, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '3 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Poesia na Praça — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Acervo',
  'Agenda cultural: Poesia na Praça — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre poesia na praça, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '3 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Poesia na Praça — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-003',
  'Poesia na Praça — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Clara dos Versos (fictício)',
  'Revista',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-003', 'demo-extra-academico-003', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-004',
  'Patrono Fictício 04',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-004',
  'Davi da Serra (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-004', 4, 'demo-extra-patrono-004', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-004',
  'demo-extra-cadeira-004',
  'demo-extra-academico-004',
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
  'demo-extra-obra-004',
  'demo-extra-academico-004',
  'Caminhos da Leitura — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-004',
  'demo-extra-academico-004',
  'Crônica: Caminhos da Leitura — teste',
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
  'demo-extra-evento-004',
  'Lançamento: Caminhos da Leitura (teste)',
  'Lançamento',
  TIMESTAMPTZ '2026-04-20 19:00:00-03',
  TIMESTAMPTZ '2026-04-20 21:00:00-03',
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
  'demo-extra-foto-004',
  'demo-extra-evento-004',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Caminhos da Leitura — registro fictício.',
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
  'Eventos',
  'Caminhos da Leitura — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre caminhos da leitura, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '4 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Caminhos da Leitura — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Eventos',
  'Agenda cultural: Caminhos da Leitura — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre caminhos da leitura, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '4 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Caminhos da Leitura — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-004',
  'Caminhos da Leitura — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Davi da Serra (fictício)',
  'Livro',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-004', 'demo-extra-academico-004', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-005',
  'Patrono Fictício 05',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-005',
  'Elisa do Rio (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-005', 5, 'demo-extra-patrono-005', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-005',
  'demo-extra-cadeira-005',
  'demo-extra-academico-005',
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
  'demo-extra-obra-005',
  'demo-extra-academico-005',
  'Cartas do Rio — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-005',
  'demo-extra-academico-005',
  'Crônica: Cartas do Rio — teste',
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
  'demo-extra-evento-005',
  'Sarau: Cartas do Rio (teste)',
  'Sarau',
  TIMESTAMPTZ '2026-05-20 19:00:00-03',
  TIMESTAMPTZ '2026-05-20 21:00:00-03',
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
  'demo-extra-foto-005',
  'demo-extra-evento-005',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Cartas do Rio — registro fictício.',
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
  'Cartas do Rio — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre cartas do rio, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '5 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Cartas do Rio — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Institucional',
  'Agenda cultural: Cartas do Rio — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre cartas do rio, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '5 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Cartas do Rio — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-005',
  'Cartas do Rio — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Elisa do Rio (fictício)',
  'Discurso',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-005', 'demo-extra-academico-005', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-006',
  'Patrono Fictício 06',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-006',
  'Felipe das Crônicas (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-006', 6, 'demo-extra-patrono-006', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-006',
  'demo-extra-cadeira-006',
  'demo-extra-academico-006',
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
  'demo-extra-obra-006',
  'demo-extra-academico-006',
  'Retratos da Cidade — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-006',
  'demo-extra-academico-006',
  'Crônica: Retratos da Cidade — teste',
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
  'demo-extra-evento-006',
  'Reunião: Retratos da Cidade (teste)',
  'Reunião',
  TIMESTAMPTZ '2026-06-20 19:00:00-03',
  TIMESTAMPTZ '2026-06-20 21:00:00-03',
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
  'demo-extra-foto-006',
  'demo-extra-evento-006',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Retratos da Cidade — registro fictício.',
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
  'Publicações',
  'Retratos da Cidade — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre retratos da cidade, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '6 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Retratos da Cidade — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Publicações',
  'Agenda cultural: Retratos da Cidade — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre retratos da cidade, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '6 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Retratos da Cidade — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-006',
  'Retratos da Cidade — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Felipe das Crônicas (fictício)',
  'Estatuto',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-006', 'demo-extra-academico-006', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-007',
  'Patrono Fictício 07',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-007',
  'Helena da Praça (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-007', 7, 'demo-extra-patrono-007', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-007',
  'demo-extra-cadeira-007',
  'demo-extra-academico-007',
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
  'demo-extra-obra-007',
  'demo-extra-academico-007',
  'Encontro de Gerações — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-007',
  'demo-extra-academico-007',
  'Crônica: Encontro de Gerações — teste',
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
  'demo-extra-evento-007',
  'Sessão Solene: Encontro de Gerações (teste)',
  'Sessão Solene',
  TIMESTAMPTZ '2026-07-20 19:00:00-03',
  TIMESTAMPTZ '2026-07-20 21:00:00-03',
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
  'demo-extra-foto-007',
  'demo-extra-evento-007',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Encontro de Gerações — registro fictício.',
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
  'Acervo',
  'Encontro de Gerações — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre encontro de gerações, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '7 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Encontro de Gerações — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Acervo',
  'Agenda cultural: Encontro de Gerações — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre encontro de gerações, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '7 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Encontro de Gerações — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-007',
  'Encontro de Gerações — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Helena da Praça (fictício)',
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
VALUES ('demo-extra-acervo-007', 'demo-extra-academico-007', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-008',
  'Patrono Fictício 08',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-008',
  'Ícaro dos Contos (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-008', 8, 'demo-extra-patrono-008', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-008',
  'demo-extra-cadeira-008',
  'demo-extra-academico-008',
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
  'demo-extra-obra-008',
  'demo-extra-academico-008',
  'Biblioteca Aberta — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-008',
  'demo-extra-academico-008',
  'Crônica: Biblioteca Aberta — teste',
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
  'demo-extra-evento-008',
  'Posse: Biblioteca Aberta (teste)',
  'Posse',
  TIMESTAMPTZ '2026-08-20 19:00:00-03',
  TIMESTAMPTZ '2026-08-20 21:00:00-03',
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
  'demo-extra-foto-008',
  'demo-extra-evento-008',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Biblioteca Aberta — registro fictício.',
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
  'Eventos',
  'Biblioteca Aberta — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre biblioteca aberta, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '8 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Biblioteca Aberta — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Eventos',
  'Agenda cultural: Biblioteca Aberta — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre biblioteca aberta, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '8 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Biblioteca Aberta — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-008',
  'Biblioteca Aberta — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Ícaro dos Contos (fictício)',
  'Antologia',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-008', 'demo-extra-academico-008', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-009',
  'Patrono Fictício 09',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-009',
  'Júlia da Memória (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-009', 9, 'demo-extra-patrono-009', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-009',
  'demo-extra-cadeira-009',
  'demo-extra-academico-009',
  true,
  false,
  DATE '2026-01-01',
  NULL,
  2026,
  2026,
  '2026 (demonstração)'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Obra" ("id", "academicoId", "titulo", "ano", "tipo")
VALUES (
  'demo-extra-obra-009',
  'demo-extra-academico-009',
  'Histórias da Infância — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-009',
  'demo-extra-academico-009',
  'Crônica: Histórias da Infância — teste',
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
  'demo-extra-evento-009',
  'Palestra: Histórias da Infância (teste)',
  'Palestra',
  TIMESTAMPTZ '2026-09-20 19:00:00-03',
  TIMESTAMPTZ '2026-09-20 21:00:00-03',
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
  'demo-extra-foto-009',
  'demo-extra-evento-009',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Histórias da Infância — registro fictício.',
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
  'Histórias da Infância — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre histórias da infância, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '9 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Histórias da Infância — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Institucional',
  'Agenda cultural: Histórias da Infância — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre histórias da infância, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '9 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Histórias da Infância — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-009',
  'Histórias da Infância — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Júlia da Memória (fictício)',
  'Revista',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-009', 'demo-extra-academico-009', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-010',
  'Patrono Fictício 10',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-010',
  'Lucas do Sertão (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-010', 10, 'demo-extra-patrono-010', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."OcupacaoCadeira" (
  "id", "cadeiraId", "academicoId", "fundador", "vigente",
  "inicioEm", "fimEm", "inicioAno", "fimAno", "periodoTexto"
)
VALUES (
  'demo-extra-ocupacao-010',
  'demo-extra-cadeira-010',
  'demo-extra-academico-010',
  true,
  false,
  DATE '2026-01-01',
  NULL,
  2026,
  2026,
  '2026 (demonstração)'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Obra" ("id", "academicoId", "titulo", "ano", "tipo")
VALUES (
  'demo-extra-obra-010',
  'demo-extra-academico-010',
  'Cultura e Educação — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-010',
  'demo-extra-academico-010',
  'Crônica: Cultura e Educação — teste',
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
  'demo-extra-evento-010',
  'Lançamento: Cultura e Educação (teste)',
  'Lançamento',
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
  'demo-extra-foto-010',
  'demo-extra-evento-010',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Cultura e Educação — registro fictício.',
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
  'Publicações',
  'Cultura e Educação — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre cultura e educação, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '10 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Cultura e Educação — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Publicações',
  'Agenda cultural: Cultura e Educação — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre cultura e educação, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '10 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Cultura e Educação — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-010',
  'Cultura e Educação — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Lucas do Sertão (fictício)',
  'Livro',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-010', 'demo-extra-academico-010', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-011',
  'Patrono Fictício 11',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-011',
  'Marina dos Livros (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-011', 11, 'demo-extra-patrono-011', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Obra" ("id", "academicoId", "titulo", "ano", "tipo")
VALUES (
  'demo-extra-obra-011',
  'demo-extra-academico-011',
  'Palavras ao Vento — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-011',
  'demo-extra-academico-011',
  'Crônica: Palavras ao Vento — teste',
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
  'demo-extra-evento-011',
  'Sarau: Palavras ao Vento (teste)',
  'Sarau',
  TIMESTAMPTZ '2026-11-20 19:00:00-03',
  TIMESTAMPTZ '2026-11-20 21:00:00-03',
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
  'demo-extra-foto-011',
  'demo-extra-evento-011',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Palavras ao Vento — registro fictício.',
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
  'Acervo',
  'Palavras ao Vento — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre palavras ao vento, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '11 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Palavras ao Vento — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Acervo',
  'Agenda cultural: Palavras ao Vento — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre palavras ao vento, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '11 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Palavras ao Vento — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-011',
  'Palavras ao Vento — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Marina dos Livros (fictício)',
  'Discurso',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-011', 'demo-extra-academico-011', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;

INSERT INTO public."Patrono" ("id", "nome", "biografia", "fotoUrl")
VALUES (
  'demo-extra-patrono-012',
  'Patrono Fictício 12',
  'Biografia demonstrativa usada para validar o cadastro de patronos.',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Academico" (
  "id", "nome", "biografia", "bioExtra", "fotoUrl", "inMemoriam", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-academico-012',
  'Nilo da Poesia (fictício)',
  'Biografia demonstrativa do acadêmico.',
  'Informação complementar criada para testar a página do membro.',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Cadeira" ("id", "numero", "patronoId", "criadoEm", "atualizadoEm")
VALUES ('demo-extra-cadeira-012', 12, 'demo-extra-patrono-012', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."Obra" ("id", "academicoId", "titulo", "ano", "tipo")
VALUES (
  'demo-extra-obra-012',
  'demo-extra-academico-012',
  'Caderno de Viagens — demonstração',
  '2026',
  'Livro'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."ProducaoLiteraria" (
  "id", "academicoId", "titulo", "tipo", "texto", "status", "publicadoEm"
)
VALUES (
  'demo-extra-producao-012',
  'demo-extra-academico-012',
  'Crônica: Caderno de Viagens — teste',
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
  'demo-extra-evento-012',
  'Reunião: Caderno de Viagens (teste)',
  'Reunião',
  TIMESTAMPTZ '2026-12-20 19:00:00-03',
  TIMESTAMPTZ '2026-12-20 21:00:00-03',
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
  'demo-extra-foto-012',
  'demo-extra-evento-012',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Caderno de Viagens — registro fictício.',
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
  'Eventos',
  'Caderno de Viagens — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre caderno de viagens, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '12 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Caderno de Viagens — notícia fictícia'
);

INSERT INTO public."Noticia" (
  "categoria", "titulo", "lede", "img", "conteudo", "status",
  "publicadoEm", "criadoEm", "atualizadoEm"
)
SELECT
  'Eventos',
  'Agenda cultural: Caderno de Viagens — notícia fictícia',
  'Registro criado pelo script de demonstração para validar a página de notícias.',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  'Esta é uma notícia fictícia sobre caderno de viagens, criada para testar o portal.

O encontro reúne leitores e autores imaginários para atividades de literatura, memória e cultura. Nenhuma informação deste texto representa uma programação oficial.',
  'PUBLICADO',
  NOW() - INTERVAL '12 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public."Noticia" WHERE "titulo" = 'Agenda cultural: Caderno de Viagens — notícia fictícia'
);

INSERT INTO public."AcervoItem" (
  "id", "titulo", "edicao", "ano", "cor", "autoriaTexto", "categoria",
  "paginas", "descricao", "pdfUrl", "status", "criadoEm", "atualizadoEm"
)
VALUES (
  'demo-extra-acervo-012',
  'Caderno de Viagens — edição fictícia',
  'Edição demonstrativa',
  2026,
  'navy',
  'Nilo da Poesia (fictício)',
  'Estatuto',
  32,
  'Item criado para validar a listagem e os detalhes do acervo.',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'PUBLICADO',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO public."AutoriaAcervo" ("acervoId", "academicoId", "papel", "ordem")
VALUES ('demo-extra-acervo-012', 'demo-extra-academico-012', 'Autor', 1)
ON CONFLICT ("acervoId", "academicoId") DO NOTHING;
