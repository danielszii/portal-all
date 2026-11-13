ALTER TABLE "MandatoDiretoria"
ADD COLUMN "conselho" TEXT NOT NULL DEFAULT 'DIRETOR';

ALTER TABLE "MandatoDiretoria"
ADD CONSTRAINT "mandato_conselho_valido"
CHECK ("conselho" IN ('DIRETOR', 'CONSULTIVO', 'FISCAL'));

CREATE INDEX "MandatoDiretoria_gestaoId_conselho_idx"
ON "MandatoDiretoria" ("gestaoId", "conselho");
