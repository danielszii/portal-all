CREATE TYPE "AcaoAuditoria" AS ENUM ('CRIAR', 'EDITAR', 'PUBLICAR', 'ARQUIVAR', 'EXCLUIR', 'TROCAR_TITULAR', 'ENCERRAR_OCUPACAO', 'ENVIAR_ARQUIVO', 'LOGIN', 'LOGOUT');
CREATE TYPE "RecursoAuditoria" AS ENUM ('NOTICIA', 'ACERVO', 'EVENTO', 'CADEIRA', 'ACADEMICO', 'PATRONO', 'GALERIA', 'UPLOAD', 'SESSAO');

CREATE TABLE "RegistroAuditoria" (
  "id" TEXT NOT NULL,
  "administradorId" TEXT NOT NULL,
  "administradorEmail" TEXT NOT NULL,
  "acao" "AcaoAuditoria" NOT NULL,
  "recurso" "RecursoAuditoria" NOT NULL,
  "registroId" TEXT NOT NULL,
  "resumo" TEXT NOT NULL,
  "detalhes" JSONB NOT NULL DEFAULT '{}',
  "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistroAuditoria_criadoEm_id_idx" ON "RegistroAuditoria" ("criadoEm", "id");
CREATE INDEX "RegistroAuditoria_recurso_registroId_criadoEm_idx" ON "RegistroAuditoria" ("recurso", "registroId", "criadoEm");
CREATE INDEX "RegistroAuditoria_administradorId_criadoEm_idx" ON "RegistroAuditoria" ("administradorId", "criadoEm");
CREATE INDEX "RegistroAuditoria_acao_criadoEm_idx" ON "RegistroAuditoria" ("acao", "criadoEm");

CREATE FUNCTION impedir_alteracao_auditoria() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria não podem ser alterados ou apagados.' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER auditoria_imutavel BEFORE UPDATE OR DELETE ON "RegistroAuditoria"
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_auditoria();
CREATE TRIGGER auditoria_sem_truncate BEFORE TRUNCATE ON "RegistroAuditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION impedir_alteracao_auditoria();
