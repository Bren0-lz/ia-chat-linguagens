-- Migration 008: idempotência de updates do Telegram.
-- Guarda o último update_id processado por aluno para descartar entregas/execuções
-- duplicadas (evita processar a mesma resposta duas vezes no teste de nível).
-- Idempotente: pode rodar duas vezes sem quebrar.

ALTER TABLE students ADD COLUMN IF NOT EXISTS last_update_id BIGINT;
