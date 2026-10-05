-- Migração aditiva: preserva os registros institucionais e as gestões existentes.
ALTER TYPE "RecursoAuditoria" ADD VALUE 'INSTITUICAO';
ALTER TYPE "RecursoAuditoria" ADD VALUE 'GESTAO';
ALTER TYPE "RecursoAuditoria" ADD VALUE 'MANDATO';

ALTER TABLE "Instituicao" ADD COLUMN "atualizadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Gestao" ADD COLUMN "atualizadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- NOT VALID mantém dados legados; novas escritas precisam respeitar as regras.
ALTER TABLE "Gestao" ADD CONSTRAINT "gestao_periodo_valido"
  CHECK ("inicioAno" BETWEEN 1 AND 9999 AND ("fimAno" IS NULL OR "fimAno" BETWEEN "inicioAno" AND 9999)) NOT VALID;
ALTER TABLE "MandatoDiretoria" ADD CONSTRAINT "mandato_periodo_valido"
  CHECK ("fimEm" IS NULL OR "inicioEm" IS NULL OR "fimEm" >= "inicioEm") NOT VALID;
