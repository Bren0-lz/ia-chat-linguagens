-- S2 — Higiene de dados: remove os usuários de teste antes de qualquer métrica pública.
-- Convenção: a faixa de teste do harness usa user_id >= 900000000 (ex.: 99xxxxxxxx).
-- Rode com o bot parado. Confira o SELECT antes de executar os DELETEs.
--   psql $DATABASE_URL -f db/cleanup_test_users.sql

BEGIN;

-- 1) Confira o que será apagado
SELECT user_id, name, level, last_active
FROM students
WHERE user_id >= 900000000
ORDER BY user_id;

-- 2) Dependências primeiro
DELETE FROM placement_attempts WHERE user_id >= 900000000;
DELETE FROM chat_memory
 WHERE session_id ~ '^9[0-9]{8,}'         -- chaves novas: "<user_id>:conv" / "<user_id>:doubt"
    OR split_part(session_id, ':', 1) ~ '^9[0-9]{8,}';

-- 3) Os alunos de teste
DELETE FROM students WHERE user_id >= 900000000;

-- 4) Conferência final (tem que voltar 0)
SELECT count(*) AS usuarios_de_teste_restantes FROM students WHERE user_id >= 900000000;

COMMIT;
