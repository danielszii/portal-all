-- Executar somente em banco de testes com a migration aplicada. Tudo é revertido.
BEGIN;
INSERT INTO "Patrono" (id, nome) VALUES ('test-p', 'Patrono de teste');
INSERT INTO "Cadeira" (id, numero, "patronoId", "atualizadoEm") VALUES ('test-c', 3998, 'test-p', CURRENT_TIMESTAMP);
INSERT INTO "Academico" (id, nome, "atualizadoEm") VALUES ('test-a', 'A', CURRENT_TIMESTAMP), ('test-b', 'B', CURRENT_TIMESTAMP);
INSERT INTO "OcupacaoCadeira" (id, "cadeiraId", "academicoId", vigente, fundador, "inicioAno") VALUES ('test-o', 'test-c', 'test-a', true, true, 2020);
DO $$
BEGIN
  BEGIN
    INSERT INTO "OcupacaoCadeira" (id, "cadeiraId", "academicoId", vigente) VALUES ('test-duplicate', 'test-c', 'test-b', true);
    RAISE EXCEPTION 'Falha: duas ocupações vigentes foram aceitas';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO "OcupacaoCadeira" (id, "cadeiraId", "academicoId", fundador) VALUES ('test-founder', 'test-c', 'test-b', true);
    RAISE EXCEPTION 'Falha: dois fundadores foram aceitos';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    UPDATE "OcupacaoCadeira" SET "fimAno"=2025 WHERE id='test-o';
    RAISE EXCEPTION 'Falha: ocupação vigente com fim foi aceita';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    DELETE FROM "Academico" WHERE id='test-a';
    RAISE EXCEPTION 'Falha: exclusão de acadêmico com histórico foi aceita';
  EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL; END;
  BEGIN
    INSERT INTO "Evento" (id, titulo, tipo, "inicioEm", "fimEm", local, descricao, "atualizadoEm") VALUES ('test-e', 'E', 'Sarau', '2026-09-15T19:00:00-03:00', '2026-09-14T19:00:00-03:00', 'Sede', '', CURRENT_TIMESTAMP);
    RAISE EXCEPTION 'Falha: evento com fim anterior ao início foi aceito';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
ROLLBACK;
