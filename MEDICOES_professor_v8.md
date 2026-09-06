# MEDIÇÕES — rota do Professor no v8 (T009)

> Medido em **06/09/2026**, no v8 publicado no n8n local, com Postgres `127.0.0.1:5433`.
> Instrumento: `fluxos/_teststand/mede_professor_v8.js` (dirige a rota) reusando o
> `decompoe()` do `fluxos/_teststand/analisa_latencia.js` (separa LLM / infra / envio).
> Bruto: `fluxos/_teststand/lat_professor_v8.log` (log da corrida) e
> `fluxos/_teststand/lat_professor_v8.json` (turno a turno, com o id de cada execução).

## 1. O desenho da medição

**O controle não é o p90 histórico de 17,8 s.** Aquele número veio do v7.4, de outra época de
modelo e de outro prompt: compará-lo com o v8 mediria três mudanças de uma vez. As duas
condições foram medidas **no mesmo fluxo, na mesma sessão, alternadas**:

| condição | o que é |
|---|---|
| **banco** | a rota do Professor com a linha presente em `topic_explanations` (`explicacao_origem: 'banco'`) |
| **modelo** | a **mesma** rota, com a **mesma** linha (mesmo nível, mesmo tópico) removida momentaneamente, caindo no fallback de geração ao vivo |

O par (banco, modelo) roda em sequência e no mesmo nível, e a linha é removida e reposta a cada
par. Assim a deriva de carga do n8n e do Vertex ao longo da sessão atinge as duas condições por
igual, e nível/tópico não confundem a comparação. Doze pares, ciclando A1, A2, B1, B2, C1, C2
duas vezes, sempre no tópico 1.

### O que o instrumento faz com as armadilhas do §6 do handoff

- **nº 2 — duração total não é latência.** O balde de envio (retry do `chat_id` sintético) é
  separado e **descartado**. Ele valeu, nesta corrida, **média de 14,85 s por turno**, mediana
  8,05 s e **máximo 48,07 s** — nada disso entra nos números abaixo.
- **nº 3 — rotular pelo Roteador.** Cada turno é aceito só se o `Roteador Mestre` registrou
  `professor:intro`; qualquer outra rota seria descartada com aviso. Nenhum turno foi descartado.
- **`mode_teacher` não dispara a explicação.** O aluno de teste nasce com `mode='teacher'` e
  `teacher_state` nulo, então a **primeira mensagem de texto** cai em `professor:intro`. Não há
  turno de confirmação de modo rotulado como explicação.
- **nº 7 / nº 15 — espaçamento.** ≥13 s entre turnos sequenciais do mesmo aluno; os turnos por
  callback esperam a execução fechar (o `Responder Callback` também entra em retry).
- A condição de cada turno vem do **runData da execução**: `explicacao_origem === 'banco'` no
  nó `Explicação do Banco`, ou o `Agente Professor` ter rodado sem o nó do banco.

## 2. Resultado — latência real (envio descartado)

n = **12 por condição**, 24 turnos de `professor:intro`, 0 descartados.

| condição | n | mediana | **p90** | média | min | max |
|---|---|---|---|---|---|---|
| **banco** | 12 | **0,25 s** | **0,98 s** | 0,38 s | 0,19 s | 1,10 s |
| **modelo** | 12 | **11,31 s** | **12,80 s** | 11,55 s | 9,45 s | 17,99 s |

**Ganho: p90 de 12,80 s → 0,98 s (−11,82 s, 92%). Mediana de 11,31 s → 0,25 s (−11,05 s, 98%).**

Decomposto:

| | banco (mediana / p90) | modelo (mediana / p90) |
|---|---|---|
| LLM | 0,00 / 0,00 s | 10,45 / 12,60 s |
| infra | 0,25 / 0,98 s | 0,26 / 3,14 s |
| consulta `Buscar Explicação` | 0,01 / 0,04 s | 0,01 / 0,04 s |
| tamanho do texto entregue | 2263 / 3039 chars | 2079 / 2380 chars |

A conta é inteira do LLM: na condição banco o `Agente Professor` **não roda** — 0,00 s de LLM em
12 de 12 turnos. O que sobra é infra, e infra é praticamente ruído (0,19–1,10 s). Na condição
modelo, dois turnos tiveram infra de 3,14 s e 4,00 s (execs 3554 e 3546); é a cauda de infra que
aparece só quando o turno é longo, e ela some junto com o modelo.

## 3. A sobrecarga que nós introduzimos

O nó `Buscar Explicação` fica na saída `llm` do switch `Envio Professor`, que atende
`explain`, `advance`, `question` e `wrong`. Ou seja: **ele roda também em questão e em
correção, e o `Rota Explicação` joga o resultado fora** (o `llmTask` não é `explain`).

| turno | n | a consulta rodou | custo da consulta (mediana / p90) | latência real do turno (mediana) | peso |
|---|---|---|---|---|---|
| questão (`professor:start_quiz`) | 4 | 4/4 | 0,01 / 0,01 s | 4,40 s | ~0,2% |
| correção (`professor:check`) | 4 | 4/4 | 0,01 / 0,01 s | 5,49 s | ~0,2% |
| pedir dúvida (`professor:ask_doubt`) | 4 | **0/4** | — | 0,18 s | — |
| dúvida (`professor:doubt_msg`) | 4 | **0/4** | — | 7,21 s | — |

**Correção à premissa da tarefa:** a dúvida **não** paga a consulta. Ela sai pela saída `doubt`
do switch, que vai direto ao `Agente Dúvida` — o `Buscar Explicação` nem aparece no runData dos
8 turnos de dúvida medidos. Sobra questão e correção, e ali a consulta custa **10 ms**, contra
turnos de 4 a 6 s: é sobrecarga real, mas de terceira casa decimal. Não justifica mover o nó
para depois do switch.

## 4. O que esta medição **não** mostra

1. **Não mede qualidade.** Só tempo. A explicação do banco é mais longa (mediana 2263 contra
   2079 caracteres) e foi revisada; a comparação de conteúdo é outra tarefa.
2. **Não é o tempo até o aluno ver alguma coisa.** O abre-alas determinístico (T002) já vem
   antes nas duas condições. O que se mede aqui é a **segunda** mensagem, a da explicação.
3. **Só o tópico 1 de cada nível.** Tópicos mais adiante podem ter explicações mais longas, e a
   geração ao vivo cresce com o tamanho da saída; servir do banco não cresce. Se houver viés,
   ele é **contra** o ganho medido, não a favor.
4. **O envio real ao Telegram não está em nenhum dos dois números.** Ele é comum aos dois
   braços, então a *diferença* sobrevive; o tempo absoluto que o aluno sente é maior que
   0,25 s por causa dele.
5. **Uma sessão, uma máquina, um aluno por vez.** ~40 min de relógio, `gemini-2.5-flash`, sem
   carga concorrente. Com vários alunos ao mesmo tempo a condição modelo tende a degradar mais
   (fila no Vertex) e a do banco quase nada — não medido.
6. **p90 com n=12 é grosso por construção** (é o 11º valor ordenado, pela mesma definição de
   `pct()` que o `analisa_latencia.js` usa desde o L1). A mediana é o número mais estável dos
   dois. O max de 17,99 s da condição modelo mostra que a cauda existe e não foi bem amostrada.
7. **A comparação é de rota, não de texto.** O texto gerado ao vivo não é o texto do banco;
   as duas condições entregam conteúdos diferentes pela mesma rota.
8. **O caminho de geração ao vivo não carimba `explicacao_origem`.** Só o do banco carimba; o
   outro foi rotulado pela presença do `Agente Professor` e ausência do `Explicação do Banco` no
   runData — ainda a partir do registro da execução, mas por ausência. Carimbar
   `explicacao_origem: 'modelo'` no `Parse Professor` fecharia isso (fora do escopo do T009).
9. **O n8n caiu no fim da corrida**, depois dos 24 turnos de explicação e de 4 das 5 sequências
   de sobrecarga planejadas — daí n=4 (e não 5) na §3, e daí o resumo ter sido agregado a partir
   do log bruto em vez de impresso pelo próprio script. Os 24 turnos da comparação principal
   estão completos e nenhum deles foi afetado.

## 5. Contexto histórico (não é a linha de base)

O p90 de **17,8 s** registrado no handoff §5 é do **v7.4**, com outro modelo e outro prompt.
Ele explica por que este trabalho foi priorizado; ele **não** é o controle desta medição. Para
efeito de contexto: a geração ao vivo, hoje, no v8, tem p90 de 12,80 s — ou seja, parte da
melhora desde agosto veio da troca de modelo, e **não** da explicação pré-gerada. O que a
explicação pré-gerada entrega, medido limpo, são os 11,8 s de p90 da §2.

## 6. Como reproduzir

```
node fluxos/_teststand/mede_professor_v8.js 12 5     # ~40 min, exige n8n com o v8 ativo + Postgres
node conteudo/confere_explicacoes_db.js              # 60 linhas de volta
node db/cleanup_test_users.js --apply                # limpa a faixa 990000000-999999999
```

O script só escreve em duas coisas: alunos de teste na faixa `990000000–999999999` e a linha de
`topic_explanations` que ele remove e repõe a cada par (restaurada também por
`conteudo/seed_explicacoes.js` no fim).

## 7. Bruto — os 40 turnos

Os artefatos `lat_professor_v8.log` e `lat_professor_v8.json` caem no `.gitignore` do
`_teststand` (`*.log`, `lat_*.json`), então a evidência por turno fica aqui.

| turno | condição | nível | exec | real (s) | LLM (s) | infra (s) | busca PG (s) | envio (descartado) | chars |
|---|---|---|---|---|---|---|---|---|---|
| 1 | banco | A1 | 3537 | 0.24 | 0.00 | 0.24 | 0.01 | 7.88 | 2394 |
| 2 | modelo | A1 | 3538 | 9.79 | 9.60 | 0.20 | 0.01 | 7.84 | 2077 |
| 3 | banco | A2 | 3539 | 0.26 | 0.00 | 0.26 | 0.01 | 7.78 | 2026 |
| 4 | modelo | A2 | 3540 | 9.76 | 9.60 | 0.16 | 0.01 | 7.80 | 2041 |
| 5 | banco | B1 | 3541 | 0.25 | 0.00 | 0.25 | 0.01 | 27.93 | 2080 |
| 6 | modelo | B1 | 3542 | 12.80 | 12.60 | 0.20 | 0.01 | 7.85 | 1981 |
| 7 | banco | B2 | 3543 | 0.19 | 0.00 | 0.19 | 0.01 | 7.88 | 2132 |
| 8 | modelo | B2 | 3544 | 9.92 | 9.75 | 0.17 | 0.01 | 29.30 | 2234 |
| 9 | banco | C1 | 3545 | 0.23 | 0.00 | 0.23 | 0.01 | 27.92 | 2676 |
| 10 | modelo | C1 | 3546 | 17.99 | 13.99 | 4.00 | 0.17 | 8.10 | 2080 |
| 11 | banco | C2 | 3547 | 0.31 | 0.00 | 0.31 | 0.02 | 28.00 | 3039 |
| 12 | modelo | C2 | 3548 | 11.44 | 11.14 | 0.30 | 0.01 | 8.39 | 2334 |
| 13 | banco | A1 | 3549 | 0.19 | 0.00 | 0.19 | 0.01 | 8.00 | 2394 |
| 14 | modelo | A1 | 3550 | 11.91 | 11.57 | 0.34 | 0.01 | 7.79 | 2297 |
| 15 | banco | A2 | 3551 | 0.19 | 0.00 | 0.19 | 0.01 | 7.78 | 2026 |
| 16 | modelo | A2 | 3552 | 11.30 | 11.13 | 0.18 | 0.04 | 8.08 | 2064 |
| 17 | banco | B1 | 3553 | 0.25 | 0.00 | 0.25 | 0.02 | 8.01 | 2080 |
| 18 | modelo | B1 | 3554 | 12.61 | 9.47 | 3.14 | 0.01 | 11.11 | 2038 |
| 19 | banco | B2 | 3555 | 0.31 | 0.00 | 0.31 | 0.04 | 48.07 | 2132 |
| 20 | modelo | B2 | 3556 | 11.31 | 10.74 | 0.57 | 0.02 | 8.97 | 2380 |
| 21 | banco | C1 | 3557 | 1.10 | 0.00 | 1.10 | 0.01 | 27.95 | 2676 |
| 22 | modelo | C1 | 3558 | 9.45 | 9.17 | 0.29 | 0.01 | 7.89 | 1956 |
| 23 | banco | C2 | 3559 | 0.98 | 0.00 | 0.98 | 0.40 | 28.19 | 3039 |
| 24 | modelo | C2 | 3560 | 10.37 | 10.15 | 0.22 | 0.01 | 7.92 | 2427 |

| turno | fase | rota registrada | exec | real (s) | `Buscar Explicação` |
|---|---|---|---|---|---|
| 25 | questao | `professor:start_quiz` | 3562 | 4.46 | 0.01 s |
| 26 | correcao | `professor:check` | 3563 | 4.97 | 0.01 s |
| 27 | pede_duvida | `professor:ask_doubt` | 3564 | 0.20 | NAO RODOU |
| 28 | duvida | `professor:doubt_msg` | 3565 | 7.56 | NAO RODOU |
| 29 | questao | `professor:start_quiz` | 3567 | 3.57 | 0.00 s |
| 30 | correcao | `professor:check` | 3568 | 5.55 | 0.01 s |
| 31 | pede_duvida | `professor:ask_doubt` | 3569 | 0.18 | NAO RODOU |
| 32 | duvida | `professor:doubt_msg` | 3570 | 7.24 | NAO RODOU |
| 33 | questao | `professor:start_quiz` | 3572 | 4.79 | 0.01 s |
| 34 | correcao | `professor:check` | 3573 | 5.57 | 0.01 s |
| 35 | pede_duvida | `professor:ask_doubt` | 3574 | 0.14 | NAO RODOU |
| 36 | duvida | `professor:doubt_msg` | 3575 | 7.18 | NAO RODOU |
| 37 | questao | `professor:start_quiz` | 3577 | 4.34 | 0.01 s |
| 38 | correcao | `professor:check` | 3578 | 5.42 | 0.01 s |
| 39 | pede_duvida | `professor:ask_doubt` | 3579 | 0.17 | NAO RODOU |
| 40 | duvida | `professor:doubt_msg` | 3580 | 5.23 | NAO RODOU |
