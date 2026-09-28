ALTER TABLE "GaleriaFoto" ADD COLUMN "automatica" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "GaleriaFoto" ADD CONSTRAINT "GaleriaFoto_automatica_evento_check"
  CHECK (NOT "automatica" OR "eventoId" IS NOT NULL);

CREATE UNIQUE INDEX "GaleriaFoto_evento_automatico_key"
  ON "GaleriaFoto" ("eventoId") WHERE "automatica";
