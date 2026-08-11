-- Migration 010: higiene dos interesses legados (teste C17)
-- Execute: psql $DATABASE_URL -f db/migrations/010_split_legacy_interests.sql
--
-- CONTEXTO
-- O bug historico gravava em profile.interests (campo MANUAL, o que o usuario marcou no menu)
-- itens que na verdade vinham da inferencia da conversa. Resultado: o menu /interesses exibia
-- como "selecionado" tema que o usuario nunca escolheu (teste C17 do relatorio de 13/07/2026).
--
-- O nó `Interests Engine` da v7.4 ja aplica esta mesma regra em runtime e regrava a lista limpa
-- quando o usuario abre o menu. Esta migration existe para (a) curar quem nunca abre o menu e
-- (b) deixar a base coerente antes de qualquer coleta de metrica para o artigo.
--
-- REGRA (identica a do nó, para nao divergir):
--   rotulo do catalogo (ex.: '🎮 Games')  -> manual legitimo, MANTEM
--   chave crua        (ex.: 'games')      -> vazou da inferencia, MOVE para inferred_interests
--   item ja presente em inferred_interests-> vazou, REMOVE do manual (ja esta no inferido)
--   qualquer outro texto                  -> custom que o usuario digitou em "Outro", MANTEM

BEGIN;

-- ── Catalogo canonico do menu (espelha CATALOG do nó `Interests Engine`) ──────
CREATE TEMP TABLE _catalog(key TEXT, label TEXT) ON COMMIT DROP;
INSERT INTO _catalog(key, label) VALUES
  ('travel','✈️ Viagens'), ('games','🎮 Games'), ('music','🎵 Música'),
  ('movies','🎬 Séries e filmes'), ('sports','⚽ Esportes'), ('food','🍔 Comida'),
  ('tech','💻 Tecnologia'), ('animals','🐾 Animais'), ('books','📚 Livros'),
  ('art','🎨 Arte');

-- ── Estado atual, item a item ────────────────────────────────────────────────
CREATE TEMP TABLE _items ON COMMIT DROP AS
SELECT
  s.user_id,
  i.item,
  CASE
    WHEN i.item IN (SELECT label FROM _catalog)                                  THEN 'manual'
    WHEN i.item IN (SELECT key   FROM _catalog)                                  THEN 'leaked_key'
    WHEN i.item IN (
      SELECT jsonb_array_elements_text(COALESCE(s.profile->'inferred_interests','[]'::jsonb))
    )                                                                            THEN 'leaked_dup'
    ELSE 'custom'
  END AS kind
FROM students s
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(s.profile->'interests') = 'array'
       THEN s.profile->'interests' ELSE '[]'::jsonb END
) AS i(item);

-- ── CONFERENCIA: rode este SELECT e revise antes de deixar o UPDATE valer ────
-- Comente o COMMIT do final e use ROLLBACK se quiser apenas inspecionar.
SELECT
  count(*) FILTER (WHERE kind = 'manual')     AS manuais_ok,
  count(*) FILTER (WHERE kind = 'custom')     AS customs_ok,
  count(*) FILTER (WHERE kind = 'leaked_key') AS vazados_chave,
  count(*) FILTER (WHERE kind = 'leaked_dup') AS vazados_duplicados,
  count(DISTINCT user_id) FILTER (WHERE kind LIKE 'leaked%') AS usuarios_afetados
FROM _items;

-- ── Nova lista MANUAL: so rotulo de catalogo e custom, na ordem original ─────
CREATE TEMP TABLE _clean ON COMMIT DROP AS
SELECT
  user_id,
  COALESCE(jsonb_agg(to_jsonb(item)) FILTER (WHERE kind IN ('manual','custom')), '[]'::jsonb) AS interests,
  -- chave crua vira o rotulo correspondente ao ser promovida para o inferido
  COALESCE(jsonb_agg(DISTINCT to_jsonb(
    (SELECT c.label FROM _catalog c WHERE c.key = item)
  )) FILTER (WHERE kind = 'leaked_key'), '[]'::jsonb) AS promoted
FROM _items
GROUP BY user_id;

-- ── Aplica: interests limpo, inferred_interests recebe o que foi promovido ───
UPDATE students s
SET profile = jsonb_set(
        jsonb_set(COALESCE(s.profile,'{}'::jsonb), '{interests}', c.interests),
        '{inferred_interests}',
        (
          SELECT COALESCE(jsonb_agg(DISTINCT x), '[]'::jsonb)
          FROM (
            SELECT jsonb_array_elements_text(COALESCE(s.profile->'inferred_interests','[]'::jsonb)) AS x
            UNION
            SELECT jsonb_array_elements_text(c.promoted)
          ) u
        )
      ),
    updated_at = now()
FROM _clean c
WHERE s.user_id = c.user_id
  AND (s.profile->'interests') IS DISTINCT FROM c.interests;

COMMIT;

-- ── Verificacao pos-migration: nao deve sobrar nenhuma chave crua ────────────
-- SELECT user_id, profile->'interests', profile->'inferred_interests'
-- FROM students
-- WHERE EXISTS (
--   SELECT 1 FROM jsonb_array_elements_text(COALESCE(profile->'interests','[]'::jsonb)) t(i)
--   WHERE i IN ('travel','games','music','movies','sports','food','tech','animals','books','art')
-- );
