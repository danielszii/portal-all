CREATE TYPE "CategoriaCadeira" AS ENUM ('TITULAR', 'HONORARIO', 'IN_MEMORIAM');

ALTER TABLE "Cadeira" ADD COLUMN "categoria" "CategoriaCadeira";

UPDATE "Cadeira" AS cadeira
SET "categoria" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "OcupacaoCadeira" ocupacao
    JOIN "Academico" academico ON academico.id = ocupacao."academicoId"
    WHERE ocupacao."cadeiraId" = cadeira.id
      AND academico."inMemoriam" = true
  ) THEN 'IN_MEMORIAM'::"CategoriaCadeira"
  ELSE 'TITULAR'::"CategoriaCadeira"
END;

ALTER TABLE "Cadeira" ALTER COLUMN "categoria" SET NOT NULL;
ALTER TABLE "Cadeira" ALTER COLUMN "categoria" SET DEFAULT 'TITULAR';
