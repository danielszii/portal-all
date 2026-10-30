DROP INDEX IF EXISTS "Cadeira_numero_key";
CREATE UNIQUE INDEX "Cadeira_numero_categoria_key" ON "Cadeira"("numero", "categoria");
