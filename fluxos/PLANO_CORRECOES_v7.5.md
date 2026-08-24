# Plano de correções pós-bateria diagnóstica

> ⚠️ **DOCUMENTO SUPERADO (escrito em 11/08/2026).** O item central daqui — o **Bloco 0,
> "publicar e revalidar"** — **foi executado em 18/08**: a v7.4 está ativa no n8n
> (`9MA0o1XJjD33BnKc`) e é a única ativa. Os números do cabeçalho abaixo também envelheceram
> (o fluxo tem **97 nós**, não 93). **Para o plano atual, leia `PLANO_2026-08-24.md` primeiro.**
>
> Este arquivo continua útil por duas razões: a tabela do §0, que mapeia cada marcador da v7.4
> ao teste que ele endereça, e o registro do raciocínio que levou a concluir que o maior
> impacto não era escrever código novo, e sim publicar o que já estava escrito.
>
> Uma ressalva ao ler o resto: ele foi redigido quando o n8n ainda rodava a v7.2 e quando os
> modelos Llama ainda existiam na conta Groq. Ambas as premissas caíram em 18/08 — ver
> `HANDOFF_2026-08-19.md`.

Base: `documentos/Relatorio_Testes_IAChat.txt` (relatório de 13/07/2026, versão avaliada **v7.2**) e
`documentos/Resultado dos testes.txt` (notas cruas do avaliador).
Estado do repositório na análise: `fluxos/IAChat_Telegram_v7.4.json` (93 nós), regressão offline
`node fluxos/_teststand/regressao_v7.4.js` → **40/40 verdes** (verificado).

---

## 0. Leitura do estado atual

O relatório avaliou a **v7.2**. Desde então a **v7.4** já foi escrita e já implementa, no arquivo, a maior
parte das correções dirigidas pelos testes reprovados. Confirmado por inspeção do JSON:

| Marcador no v7.4 | Teste que endereça | Presente |
|---|---|---|
| Parser tolerante + fallback `practice_questions` | T5, T7 ("Questão indisponível") | sim |
| `t_resume` / `resume_q` | T11 (quiz reiniciava) | sim |
| Classificador de intenção + prompt de dúvida sem gabarito | T7, T10, R6 | sim |
| `cleanPersona` + pacote de personalidade | PS2, PS3, PS4, T17 | sim |
| `MOOD` nível-aware + `correctionLine` único | C5, C6 | sim |
| `pickNext` por nível corrente | B3 | sim |
| `first_today` (streak em qualquer modo) | C12 | sim |
| `DEV_COMMANDS=false`, `TEST Ingress` removido | S1, A8 | sim |
| `/parar` e `/voltar` + `nudge_opt_out` no workflow de nudge | C13 | sim |
| `db/cleanup_test_users.sql` | S2 | sim |

**Consequência prática: o item de maior impacto não é escrever código novo — é publicar.** Enquanto o n8n
continuar rodando a v7.2, todos os testes acima permanecem reprovados na prática, e qualquer nova coleta de
métricas para o artigo mede a versão errada.

O que segue é o que **ainda falta**, separado do que já está pronto e só precisa ir ao ar.

---

## Bloco 0 — Publicar e revalidar (bloqueia todo o resto)

| # | Ação | Detalhe |
|---|---|---|
| 0.1 | Confirmar a versão ativa no n8n | Se ainda for v7.2/v7.3, todo o diagnóstico abaixo muda de escala |
| 0.2 | `node fluxos/_teststand/regressao_v7.4.js` | Já verificado verde nesta análise |
| 0.3 | Importar `IAChat_Telegram_v7.4.json`, reconferir as credenciais dos **dois** nós de memória (`conv` e `doubt`) e ativar | A separação de `sessionKey` é o que impede o vazamento de gabarito entre agentes |
| 0.4 | `psql $DATABASE_URL -f db/cleanup_test_users.sql` | Antes de qualquer métrica publicável |
| 0.5 | Reexecutar a bateria priorizada: T5/T7/T10/T11/R6 → PS2–PS4/T17 → C5/C6 → B3/B6 → C12 | Marca o baseline real da v7.4 |

**Efeito esperado:** 14 reprovados do relatório → ~4 remanescentes (B7, L1, L2 e o legado de C17).

---

## Bloco 1 — Lacunas reais encontradas na análise (não cobertas pela v7.4)

> **Status em 11/08/2026:** 1.1 e 1.2 implementados (migrations 009 e 010, alteração do fluxo e 9 checks
> novos de regressão — 49/49 verdes). Falta publicar. 1.3 e 1.4 continuam abertos.

### 1.1 Banco de questões de fallback é insuficiente — risco de reincidência do T5 (prioridade máxima) — ✅ FEITO

A v7.4 resolve "(Questão indisponível)" com parser tolerante **e** com fallback para `practice_questions`.
Mas o banco semeado (`db/migrations/006_v6_seed_practice.sql`) tem apenas **30 questões em 6 temas**:

```
A1:  6    A2: 11    B1: 10    B2:  3    C1:  0
temas: articles, past_simple, phrasal_verbs, prepositions, present_perfect, third_person_s
```

Ou seja: **para um aluno C1 o fallback não tem para onde cair**, em B2 ele se esgota em 3 questões, e os 6
temas não cobrem a trilha de 60 tópicos — o fallback devolve uma questão de outro assunto.

Implementação:
- `db/migrations/009_seed_practice_b2_c1.sql`: elevar para **≥5 questões por nível × por tema**, incluindo
  C1 (hoje zero) e completando B2.
- Mapear `practice_questions.theme` → tópicos da `TRACK` do nó Professor (hoje são vocabulários
  independentes). Adicionar coluna `track_topic` ou uma tabela de correspondência.
- No nó de fallback, ordenar a escolha por: mesmo tópico → mesmo nível/tema vizinho → mesmo nível qualquer
  tema → nível vizinho. Só então a mensagem amigável.
- Teste de regressão novo: para cada nível A1–C1 e cada tópico da TRACK, o fallback devolve questão válida.

### 1.2 Interesses legados sem migração (C17) — ✅ FEITO (mas é higiene, não bug ativo)

**Correção da análise inicial:** o nó `Interests Engine` da v7.4 já aplica a blindagem anti-fantasma na
leitura e **regrava a lista limpa quando o usuário abre o menu** — cada usuário se auto-cura ao entrar em
`/interesses`. A migration continua valendo para curar quem nunca abre o menu e para deixar a base coerente
antes da coleta de métricas, mas C17 não é um defeito que o usuário ainda encontre em uso normal.

Implementação:
- `db/migrations/010_split_legacy_interests.sql`: mover para `inferred_interests` tudo que estiver em
  `interests` e não pertencer ao conjunto canônico do menu; deduplicar; preservar o restante do `profile`.
- Rodar com `SELECT` de conferência antes do `UPDATE` (o relatório insiste, com razão, em higiene de dados).

### 1.3 Nudge de retenção existe mas nasce inativo (C13)

`IAChat_Nudge_Retencao_v1.json` está correto e já filtra `nudge_opt_out` e `last_nudge` — mas nunca foi
executado. Falta o procedimento de ativação:
1. Importar, apontar o `LIMIT 1` para o próprio `user_id` e executar manualmente (dry-run).
2. Conferir `profile.last_nudge` gravado e a espera de 3 s entre envios.
3. Subir o `LIMIT` gradualmente (10 → 50) e só então ativar o Schedule das 18h.
4. Validar `/parar` → nenhum nudge no dia seguinte; `/voltar` → volta.

### 1.4 Latência acima do alvo (L1)

A v7.4 já tirou a memória do `Agente Professor` (uma chamada a menos por turno). Falta medir e atacar o
resto:
- Instrumentar: registrar o tempo por turno e por rota (conversa / explicação / questão / dúvida) para achar
  qual interação "complexa" estoura os 8 s — hoje isso é afirmação sem número.
- Candidatos conhecidos: a explicação de ~2500 caracteres do Professor é o prompt mais caro; enviar um
  "digitando…" imediato muda a latência **percebida** sem tocar no modelo; e a chamada de memória da
  Conversa (janela 20) pode cair para 10.

---

## Bloco 2 — Infraestrutura (pré-condição declarada pelo próprio relatório)

O relatório condiciona A6, B3, C17 e S1–S3 à migração. A v7.4 já corrige A6 e B3 **na lógica**, então a
migração deixa de ser bloqueio funcional — mas continua sendo pré-condição para medir segurança e carga.

| # | Ação | Destrava |
|---|---|---|
| 2.1 | Postgres hospedado (Neon/Supabase/RDS) + rodar todas as migrations, incluindo as novas 009/010 | C17, higiene de dados, S2 |
| 2.2 | n8n em servidor (não `localhost:5678`), execuções com poda automática | L3, estabilidade |
| 2.3 | Reexecutar S1 (ingress sem auth — os nós já foram removidos), S2 e S3 no ambiente hospedado | S1–S3, hoje "pendentes" |
| 2.4 | Plano pago do Groq **ou** fila serializada por usuário com limite de concorrência | L2 |

L2 não se resolve só com dinheiro: mesmo com plano pago, vale serializar por `user_id` para evitar o desync
que o próprio roteiro de testes já documenta.

---

## Bloco 3 — Decisão de produto pendente (B7 / C2)

**Correção da análise inicial:** o `Professor Engine` **já tem uma trilha C2 completa, com os 10 tópicos
escritos** (Registro e conotação sutis, Elipse e substituição, Fronting e ênfase, Pragmática e implicatura…).
O que falta é só o lado do nivelamento. Ou seja, o problema não é "C2 não foi desenvolvido" — é que o aluno
nunca consegue *chegar* ao C2 que já existe. Isso barateia muito a opção (b).

Estado factual: `exam_questions` tem `CHECK (cefr_level IN ('A1','A2','B1','B2','C1'))` — **C2 não existe no
schema do nivelamento**, além de faltar em `LEVELS` e nos botões `pl_start_*`. O banco de reserva C2 já foi
semeado pela migration 009. Duas saídas coerentes:

- **(a) Manter o teto em C1** (posição atual do relatório): então remover as menções a C2 dos prompts e da
  documentação, e reportar no artigo como escopo, não como falha. Custo baixo, coerência imediata.
- **(b) Habilitar C2**: alterar o `CHECK`, semear 10 questões C2, incluir C2 em `LEVELS`, no switch de nível
  da Conversa e na TRACK do Professor. Custo alto para um público que o próprio relatório considera raro.

**Recomendação revista: (b)**, agora que se sabe que a trilha C2 e o banco de reserva C2 já existem. O custo
caiu para: alterar o `CHECK`, semear 10 questões de prova C2 e incluir C2 em `LEVELS` e nos botões. O que não
pode continuar é o estado atual, em que o C2 existe no Professor mas é inalcançável pelo nivelamento — é isso
que faz B7 ser "reprovado" em vez de "fora de escopo".

---

## Bloco 4 — Metodologia e documentação dos testes

- `fluxos/TESTES_DIAGNOSTICOS.md` ainda diz "Referência: v7.3 / ativo é v7.2". Atualizar para v7.4.
- O avaliador pediu explicitamente para **excluir B4, C11, X5, R1 e L3** e para **incluir A8** (bot não
  responde a comandos comuns durante o nivelamento). O roteiro ainda não reflete isso; o relatório sim.
- A rubrica foi aplicada **uma vez** (12/16, persona = 0). O próprio documento reconhece que saídas de LLM
  não são determinísticas: definir N = 3 repetições por persona (P1–P8) e reportar média e desvio. Sem isso
  a seção de resultados do artigo não se sustenta.
- Automação: `regressao_v7.4.js` cobre 40 checks **offline** (lógica pura). A bateria ao vivo continua
  manual. Estender `_teststand/smoke.js` para cobrir ao menos o caminho crítico T5/T7/T11 de ponta a ponta
  reduz o custo de cada revalidação — respeitando as cautelas já documentadas (pausa de 2,5 s, um nível por
  vez, filtrar execução por `user_id`).

---

## Priorização

| Ordem | Item | Justificativa |
|---|---|---|
| 1 | Bloco 0 (publicar v7.4 + revalidar) | Converte trabalho já feito em resultado; sem isso nada mais importa |
| 2 | 1.1 (banco de fallback B2/C1 + alinhamento com a TRACK) | O defeito nº 1 do relatório volta em C1/B2 sem isso |
| 3 | 1.2 (migração de interesses legados) | Único item de dados que o usuário final enxerga |
| 4 | 2.1 e 2.2 (banco hospedado + n8n em servidor) | Pré-condição declarada de S1–S3 e da coleta de métricas |
| 5 | 1.3 (ativar o nudge com dry-run) | Fecha C13, hoje "não implementado" |
| 6 | 3 (decidir C2) | Barato e destrava a redação do artigo |
| 7 | 1.4 e 2.4 (latência e carga) | Depende de medição e de plano pago; entra como limitação no artigo |
| 8 | Bloco 4 (docs e rubrica N=3) | Necessário para o artigo, não para o produto |

## Critério de pronto

- Bateria reexecutada sobre a v7.4 publicada, com os 14 reprovados reclassificados.
- Reprovados aceitáveis ao final: **B7** (decisão de produto) e **L2** (plano do Groq) — e apenas esses dois
  declarados como limitação no artigo.
- Rubrica repetida N = 3 por persona, com fidelidade de persona saindo de 0.
