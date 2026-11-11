CREATE TABLE "LivroBiblioteca" (
  "id" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "autor" TEXT,
  "editora" TEXT,
  "ano" INTEGER,
  "tombo" TEXT,
  "localizacao" TEXT,
  "quantidade" INTEGER NOT NULL DEFAULT 1,
  "observacoes" TEXT,
  "status" "StatusEditorial" NOT NULL DEFAULT 'RASCUNHO',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LivroBiblioteca_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LivroBiblioteca_status_titulo_idx" ON "LivroBiblioteca"("status", "titulo");
