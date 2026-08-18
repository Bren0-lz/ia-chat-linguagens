-- S2 — Higiene de dados: remove os usuários de teste antes de qualquer métrica pública.
--
-- CRITÉRIO (corrigido em 2026-08-18):
--   O harness gera user_id de 9 dígitos começando em 99 (990000000..999999999).
--   O critério anterior era `user_id >= 900000000`, que é PERIGOSO: IDs reais do
--   Telegram têm 10 dígitos e caem nessa faixa. Na base local havia o user_id
--   2030939834 (10 dígitos), que o critério antigo teria apagado junto.
--   Por isso a faixa agora é fechada em cima: >= 990000000 AND < 1000000000.
--
-- Rode com o bot parado. Confira o SELECT antes de executar os DELETEs.
--   psql $DATABASE_URL -f db/cleanup_test_users.sql

BEGIN;

-- 1) Confira o que será apagado (esperado: só IDs de 9 dígitos iniciando em 99)
SELECT user_id, name, level, last_active
FROM students
WHERE user_id >= 990000000 AND user_id < 1000000000
ORDER BY user_id;

-- 1b) Confira o que NÃO será apagado — inspecione antes de seguir.
--     Qualquer ID de 10 dígitos aqui é conta real do Telegram: não apague.
SELECT user_id, name, level, msg_count, last_active
FROM students
WHERE NOT (user_id >= 990000000 AND user_id < 1000000000)
ORDER BY user_id;

-- 2) Dependências primeiro
DELETE FROM placement_attempts
 WHERE user_id >= 990000000 AND user_id < 1000000000;

-- chat_memory: chaves da v7.3 são "<user_id>" puro; as da v7.4 são
-- "<user_id>:conv" / "<user_id>:doubt". split_part cobre os dois formatos.
DELETE FROM chat_memory
 WHERE split_part(session_id, ':', 1) ~ '^99[0-9]{7}$';

-- 3) Os alunos de teste
DELETE FROM students
 WHERE user_id >= 990000000 AND user_id < 1000000000;

-- 4) Conferência final (tem que voltar 0)
SELECT count(*) AS usuarios_de_teste_restantes
FROM students
WHERE user_id >= 990000000 AND user_id < 1000000000;

COMMIT;
