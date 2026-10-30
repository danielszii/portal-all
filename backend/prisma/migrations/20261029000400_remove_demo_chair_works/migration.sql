-- Remove somente obras criadas pelos scripts demonstrativos.
DELETE FROM "Obra"
WHERE "id" LIKE 'apresentacao-obra-%'
   OR "id" LIKE 'demo-extra-obra-%'
   OR "id" = 'teste-obra-001';
