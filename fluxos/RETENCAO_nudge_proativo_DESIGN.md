# Retenção — Nudge proativo (design, NÃO implementado)

> Maior alavanca de retenção do modo Conversa. É a única peça que **manda mensagem sem o usuário iniciar**
> (o Telegram permite, desde que o usuário já tenha dado /start no bot). Por ser **envio em massa e outward-facing**,
> NÃO foi construída autonomamente: exige dry-run controlado e cuidado com a carga (o n8n já caiu por volume — HANDOFF §5).
> Este doc é o suficiente para construir e testar com segurança.

## Objetivo
Trazer de volta quem parou de praticar, usando **aversão à perda da sequência** (streak) e curiosidade.

## Gatilho
- **Schedule Trigger** (n8n), 1x/dia, num horário bom (ex.: 18h). Um só disparo/dia.

## Seleção (Postgres) — proteger o n8n com LIMIT
Prioriza quem está **prestes a perder streak**, depois dormentes. Não repetir no mesmo dia. Respeitar opt-out.
```sql
SELECT user_id, name, COALESCE(streak_count,0) AS streak, last_active,
       (CURRENT_DATE - last_active) AS dias_parado
FROM students
WHERE onboarding = 'done'
  AND user_id < 900000000               -- exclui faixa de teste (~993xxxxxxx)
  AND COALESCE((profile->>'nudge_opt_out')::boolean, false) = false
  AND COALESCE(profile->>'last_nudge','') <> to_char(CURRENT_DATE,'YYYY-MM-DD')
  AND last_active IS NOT NULL
  AND last_active < CURRENT_DATE         -- não incomodar quem já praticou hoje
  AND (
        (last_active = CURRENT_DATE - 1 AND COALESCE(streak_count,0) >= 2)  -- streak em risco
     OR (CURRENT_DATE - last_active) BETWEEN 3 AND 14                        -- dormente recuperável
      )
ORDER BY (last_active = CURRENT_DATE - 1) DESC, streak DESC
LIMIT 50;                                -- teto pequeno; suba com cautela
```

## Segmentos e mensagem (1 por usuário)
- **Streak em risco** (`last_active = ontem`, streak≥2): *"Oi {name}! 🔥 Você está numa sequência de {streak} dias
  de inglês — não deixa ela cair hoje. Bora 2 minutinhos? É só me mandar um oi."*
- **Dormente 3–14 dias**: *"Ei {name}, senti sua falta! 😊 Que tal voltar com um papo rápido em inglês hoje?
  Escolhi um assunto que você curte pra gente começar leve."*
- Manter **1 CTA** e caminho de volta óbvio (responder qualquer coisa cai no modo Conversa).

## Envio serializado (não derrubar o n8n)
- `Split in Batches` (batch 1) → `Wait` ~2–3s entre envios → `Telegram sendMessage`.
- `retryOnFail` baixo nos nós de envio; tratar **403 (bot bloqueado)** → marcar `profile.nudge_opt_out=true`.
- Após enviar, gravar `profile.last_nudge = to_char(CURRENT_DATE,'YYYY-MM-DD')` (dedupe do dia).

## Opt-out (dependência no fluxo principal)
- Adicionar comando **`/parar`** (e `/pausar`) no `Roteador Mestre` → `system_msg` que seta
  `profile.nudge_opt_out=true` e confirma. Sem isso, não lançar (respeito ao usuário + evitar denúncia de spam).

## Segurança / rollout
1. Começar **inativo**, testar com **1 user de teste** seu (dry-run: LIMIT 1, você mesmo).
2. Subir LIMIT aos poucos observando a carga/execuções do n8n.
3. Só então ativar de verdade.

## Schema
- Usa colunas existentes (`last_active`, `streak_count`, `onboarding`, `profile` jsonb). **Sem migração** —
  só chaves novas em `profile` (`nudge_opt_out`, `last_nudge`).

## Métrica de sucesso
- % de nudges que resultam em uma resposta em ≤ 24h (engajamento do nudge) e retenção D1/D7.
