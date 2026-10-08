BEGIN;

CREATE TYPE "PerfilAdministrador" AS ENUM ('ADMINISTRADOR', 'EDITOR', 'SECRETARIA', 'CONSULTA');

-- As contas existentes já tinham acesso completo; preserve esse acesso na transição.
ALTER TABLE "Administrador"
  ADD COLUMN "perfis" "PerfilAdministrador"[] NOT NULL DEFAULT ARRAY['ADMINISTRADOR']::"PerfilAdministrador"[],
  ADD COLUMN "atualizadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Contas novas recebem o menor acesso até que seus perfis sejam escolhidos.
ALTER TABLE "Administrador" ALTER COLUMN "perfis" SET DEFAULT ARRAY['CONSULTA']::"PerfilAdministrador"[];
ALTER TABLE "Administrador" ADD CONSTRAINT "Administrador_perfis_validos"
  CHECK (cardinality("perfis") BETWEEN 1 AND 4 AND array_position("perfis", NULL) IS NULL);

ALTER TYPE "RecursoAuditoria" ADD VALUE 'ADMINISTRADOR';

COMMIT;
