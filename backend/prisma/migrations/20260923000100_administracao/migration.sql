CREATE TABLE "Administrador" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "senhaHash" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");
CREATE TABLE "SessaoAdmin" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "administradorId" TEXT NOT NULL REFERENCES "Administrador"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "csrfToken" TEXT NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "SessaoAdmin_expiraEm_idx" ON "SessaoAdmin"("expiraEm");
CREATE INDEX "SessaoAdmin_administradorId_idx" ON "SessaoAdmin"("administradorId");
