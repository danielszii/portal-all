-- PostgreSQL: migração inicial. Não usar migrate reset em bancos existentes.

CREATE TYPE "StatusEditorial" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

CREATE TABLE "Patrono" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "biografia" TEXT,
  "fotoUrl" TEXT,
  CONSTRAINT "Patrono_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Academico" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "biografia" TEXT,
  "bioExtra" TEXT,
  "fotoUrl" TEXT,
  "inMemoriam" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Academico_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cadeira" (
  "id" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "patronoId" TEXT NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cadeira_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OcupacaoCadeira" (
  "id" TEXT NOT NULL,
  "cadeiraId" TEXT NOT NULL,
  "academicoId" TEXT NOT NULL,
  "fundador" BOOLEAN NOT NULL DEFAULT false,
  "vigente" BOOLEAN NOT NULL DEFAULT false,
  "inicioEm" DATE,
  "fimEm" DATE,
  "inicioAno" INTEGER,
  "fimAno" INTEGER,
  "periodoTexto" TEXT,
  CONSTRAINT "OcupacaoCadeira_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Obra" (
  "id" TEXT NOT NULL,
  "academicoId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "ano" TEXT,
  "tipo" TEXT,
  CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProducaoLiteraria" (
  "id" TEXT NOT NULL,
  "academicoId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "status" "StatusEditorial" NOT NULL DEFAULT 'RASCUNHO',
  "publicadoEm" TIMESTAMP(3),
  CONSTRAINT "ProducaoLiteraria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evento" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "inicioEm" TIMESTAMPTZ(3) NOT NULL,
  "fimEm" TIMESTAMPTZ(3),
  "local" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "foto" TEXT,
  "status" "StatusEditorial" NOT NULL DEFAULT 'RASCUNHO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GaleriaFoto" (
  "id" TEXT NOT NULL,
  "eventoId" TEXT,
  "src" TEXT NOT NULL,
  "legenda" TEXT NOT NULL,
  "textoAlternativo" TEXT,
  "credito" TEXT,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "GaleriaFoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Noticia" (
  "id" SERIAL NOT NULL,
  "categoria" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "lede" TEXT NOT NULL,
  "img" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "status" "StatusEditorial" NOT NULL DEFAULT 'RASCUNHO',
  "publicadoEm" TIMESTAMPTZ(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcervoItem" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "edicao" TEXT,
  "ano" INTEGER,
  "cor" TEXT NOT NULL DEFAULT 'navy',
  "autoriaTexto" TEXT,
  "categoria" TEXT NOT NULL,
  "paginas" INTEGER,
  "descricao" TEXT NOT NULL,
  "pdfUrl" TEXT NOT NULL,
  "status" "StatusEditorial" NOT NULL DEFAULT 'RASCUNHO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcervoItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutoriaAcervo" (
  "acervoId" TEXT NOT NULL,
  "academicoId" TEXT NOT NULL,
  "papel" TEXT NOT NULL DEFAULT 'Autor',
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AutoriaAcervo_pkey" PRIMARY KEY ("acervoId", "academicoId")
);

CREATE TABLE "Instituicao" (
  "id" TEXT NOT NULL DEFAULT 'all',
  "nome" TEXT NOT NULL,
  "historia" TEXT NOT NULL,
  "missao" TEXT NOT NULL,
  "endereco" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "fundacaoAno" INTEGER,
  "sedeTexto" TEXT,
  "trajetoriaTexto" TEXT,
  "horarioAtendimento" TEXT,
  CONSTRAINT "Instituicao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gestao" (
  "id" TEXT NOT NULL,
  "inicioAno" INTEGER NOT NULL,
  "fimAno" INTEGER,
  CONSTRAINT "Gestao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MandatoDiretoria" (
  "id" TEXT NOT NULL,
  "gestaoId" TEXT NOT NULL,
  "academicoId" TEXT NOT NULL,
  "cargo" TEXT NOT NULL,
  "inicioEm" DATE,
  "fimEm" DATE,
  CONSTRAINT "MandatoDiretoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContatoMensagem" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "assunto" TEXT NOT NULL,
  "mensagem" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOVA',
  "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContatoMensagem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Academico_nome_idx" ON "Academico" ("nome");

CREATE UNIQUE INDEX "Cadeira_numero_key" ON "Cadeira" ("numero");

CREATE INDEX "OcupacaoCadeira_cadeiraId_inicioAno_idx" ON "OcupacaoCadeira" ("cadeiraId", "inicioAno");

CREATE INDEX "OcupacaoCadeira_academicoId_idx" ON "OcupacaoCadeira" ("academicoId");

CREATE INDEX "Obra_academicoId_idx" ON "Obra" ("academicoId");

CREATE INDEX "ProducaoLiteraria_academicoId_status_idx" ON "ProducaoLiteraria" ("academicoId", "status");

CREATE INDEX "Evento_status_inicioEm_idx" ON "Evento" ("status", "inicioEm");

CREATE INDEX "GaleriaFoto_eventoId_ordem_idx" ON "GaleriaFoto" ("eventoId", "ordem");

CREATE INDEX "Noticia_status_publicadoEm_idx" ON "Noticia" ("status", "publicadoEm");

CREATE INDEX "AcervoItem_status_categoria_ano_idx" ON "AcervoItem" ("status", "categoria", "ano");

CREATE INDEX "MandatoDiretoria_gestaoId_idx" ON "MandatoDiretoria" ("gestaoId");

CREATE INDEX "ContatoMensagem_dataEnvio_idx" ON "ContatoMensagem" ("dataEnvio");

ALTER TABLE "Cadeira" ADD CONSTRAINT "Cadeira_patronoId_fkey" FOREIGN KEY ("patronoId") REFERENCES "Patrono"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OcupacaoCadeira" ADD CONSTRAINT "OcupacaoCadeira_cadeiraId_fkey" FOREIGN KEY ("cadeiraId") REFERENCES "Cadeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OcupacaoCadeira" ADD CONSTRAINT "OcupacaoCadeira_academicoId_fkey" FOREIGN KEY ("academicoId") REFERENCES "Academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Obra" ADD CONSTRAINT "Obra_academicoId_fkey" FOREIGN KEY ("academicoId") REFERENCES "Academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProducaoLiteraria" ADD CONSTRAINT "ProducaoLiteraria_academicoId_fkey" FOREIGN KEY ("academicoId") REFERENCES "Academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GaleriaFoto" ADD CONSTRAINT "GaleriaFoto_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutoriaAcervo" ADD CONSTRAINT "AutoriaAcervo_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "AcervoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AutoriaAcervo" ADD CONSTRAINT "AutoriaAcervo_academicoId_fkey" FOREIGN KEY ("academicoId") REFERENCES "Academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MandatoDiretoria" ADD CONSTRAINT "MandatoDiretoria_gestaoId_fkey" FOREIGN KEY ("gestaoId") REFERENCES "Gestao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MandatoDiretoria" ADD CONSTRAINT "MandatoDiretoria_academicoId_fkey" FOREIGN KEY ("academicoId") REFERENCES "Academico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ocupacao_vigente_cadeira" ON "OcupacaoCadeira" ("cadeiraId") WHERE "vigente" = true;

CREATE UNIQUE INDEX "ocupacao_vigente_academico" ON "OcupacaoCadeira" ("academicoId") WHERE "vigente" = true;

CREATE UNIQUE INDEX "fundador_cadeira" ON "OcupacaoCadeira" ("cadeiraId") WHERE "fundador" = true;

ALTER TABLE "Cadeira" ADD CONSTRAINT "numero_cadeira_valido" CHECK ("numero" BETWEEN 1 AND 3999);

ALTER TABLE "OcupacaoCadeira" ADD CONSTRAINT "periodo_anos_valido" CHECK ("fimAno" IS NULL OR "inicioAno" IS NULL OR "fimAno" >= "inicioAno");

ALTER TABLE "OcupacaoCadeira" ADD CONSTRAINT "periodo_datas_valido" CHECK ("fimEm" IS NULL OR "inicioEm" IS NULL OR "fimEm" >= "inicioEm");

ALTER TABLE "OcupacaoCadeira" ADD CONSTRAINT "ocupacao_vigente_sem_fim" CHECK (NOT "vigente" OR ("fimEm" IS NULL AND "fimAno" IS NULL));

ALTER TABLE "Evento" ADD CONSTRAINT "duracao_evento_valida" CHECK ("fimEm" IS NULL OR "fimEm" >= "inicioEm");

ALTER TABLE "AcervoItem" ADD CONSTRAINT "paginas_positivas" CHECK ("paginas" IS NULL OR "paginas" > 0);
