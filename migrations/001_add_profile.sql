-- Etapa 1 da memória em duas camadas: perfil persistente do aluno (long-term memory)
-- Rode no Supabase (SQL Editor) ANTES de importar o workflow v4.

-- Perfil estruturado do aluno, atualizado em lote pelo agente.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Contador de turnos desde a última atualização do perfil.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS msg_count integer NOT NULL DEFAULT 0;

-- (Verificação opcional) Confirme as colunas:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'students' ORDER BY ordinal_position;

-- (Verificação opcional) Confirme o schema da tabela de memória do LangChain.
-- O ramo de resumo assume as colunas padrão: id (serial), session_id (text), message (jsonb).
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'chat_memory' ORDER BY ordinal_position;
