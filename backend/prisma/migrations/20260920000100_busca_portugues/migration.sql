-- Comparações ILIKE em português mesmo quando o banco usa a localidade C.
-- Determinística para manter compatibilidade com ILIKE. Não remove acentos.
BEGIN;

CREATE COLLATION "portal_pt_br" (provider = icu, locale = 'pt-BR', deterministic = true);

ALTER TABLE "Noticia"
  ALTER COLUMN "titulo" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "lede" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "conteudo" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "categoria" TYPE TEXT COLLATE "portal_pt_br";

ALTER TABLE "AcervoItem"
  ALTER COLUMN "titulo" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "autoriaTexto" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "descricao" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "edicao" TYPE TEXT COLLATE "portal_pt_br",
  ALTER COLUMN "categoria" TYPE TEXT COLLATE "portal_pt_br";

ALTER TABLE "Evento"
  ALTER COLUMN "tipo" TYPE TEXT COLLATE "portal_pt_br";

COMMIT;
