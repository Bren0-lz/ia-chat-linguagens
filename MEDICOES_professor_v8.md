# MEDIÇÕES — rota do Professor no v8 (T009)

> Medido em **06/09/2026**, no v8 publicado no n8n local, com Postgres `127.0.0.1:5433`.
> Instrumento: `fluxos/_teststand/mede_professor_v8.js` (dirige a rota) reusando o
> `decompoe()` do `fluxos/_teststand/analisa_latencia.js` (separa LLM / infra / envio).
>
> **Versão 2 — números corrigidos.** A primeira versão deste relatório publicou a condição
> "modelo" inflada em ~4,8 s por um defeito do instrumento (§0). Os dados brutos são os mesmos
> 45 turnos; o que mudou foi a conta. Tudo abaixo já é a conta certa, recalculada das execuções
> 3537–3581 ainda gravadas no n8n.
>
> Bruto: `fluxos/_teststand/lat_professor_v8.json` (turno a turno, com o id de cada execução) e
> `fluxos/_teststand/lat_professor_v8.log`. Como os dois caem no `.gitignore` do `_teststand`,
> a evidência por turno está transcrita na §7.

## 0. A armadilha que este relatório pagou: nó aninhado contado duas vezes

O `decompoe()` **somava** o `executionTime` de todos os nós do balde. Mas o
`Modelo Vertex Professor` **não roda depois** do `Agente Professor` — ele roda **dentro** da
janela do agente. Na exec 3538:

```
4,71 s  04:22:37.149  Modelo Vertex Professor
4,89 s  04:22:36.972  Agente Professor      <- começa antes, termina junto
```

Somados: 9,60 s de "LLM". Reais: **4,89 s**. A execução inteira durou 12,95 s de relógio de
parede, dos quais 7,84 s em nós de envio — sobram ~5,1 s de trabalho, contra os 9,79 s que a
versão 1 atribuiu ao turno. **Um balde maior que o relógio de parede é fisicamente impossível**,
e era o que estava publicado.

O viés atinge **só** os turnos que têm nó de modelo. A condição "banco" não tem nenhum e sempre
esteve certa — ou seja, o erro inflava exatamente o braço de comparação, e com ele o ganho.

Três consertos, todos no instrumento:

1. `decompoe()` agora soma por **união de intervalos** (`startTime`, `startTime+executionTime`),
   não por soma de durações. O CLI do `analisa_latencia.js` usa a mesma função.
2. **Os três baldes ficam disjuntos.** Um trecho de tempo pertence a um balde só, por
   precedência LLM > infra > envio. Isso resolve a variante do mesmo fenômeno: o
   `Memória Dúvida`, que é infra, roda **dentro** da janela do `Agente Dúvida` (exec 3565).
   Antes esse tempo era contado nos dois baldes.
3. **Conferência de sanidade — sobre os números publicados.** `estouroDe(baldes, wall)` compara
   `llm + infra + envio` com o relógio de parede da execução. Como os baldes são disjuntos, a
   soma **é** a união de tudo, e a comparação vira uma identidade verificável em vez de um
   palpite com folga.

   A primeira tentativa de conserto errou justamente aqui: ela recalculava o total pela `uniao()`
   a partir dos intervalos. **Um instrumento que se confere recalculando a si mesmo nunca acusa
   erro de somatório** — reintroduzindo o defeito original, aquela versão acusava em 0 de 59
   execuções. A versão que confere os escalares publicados acusa em **29 de 59** (e em 0 de 59
   com o instrumento correto); as 30 restantes são turnos sem nó de modelo, onde não há nada
   aninhado para contar duas vezes. Foi por não conferir o publicado que também se descartou,
   como "falso positivo", o alarme legítimo dos turnos de dúvida — que era o item 2 pedindo para
   ser consertado.
4. Regressão offline `fluxos/_teststand/testa_decompoe_latencia.js`, no `npm run gate`. Ela
   **reprova a versão anterior** em duas frentes: com a soma, o LLM da exec 3538 dá 9,60 s (o
   assert exige 4,89 s), e `estouroDe({llm: 9.60, infra: 0.14, envio: 7.84}, 12.95)` tem de
   acusar.

### Efeito no L1: recalculado sobre os mesmos 80 turnos

`decompoe()` veio do L1: **toda medição de LLM já feita neste repositório carrega o mesmo viés**.

Uma versão anterior deste relatório afirmou que o L1 **não** era recalculável, porque as
execuções teriam sido apagadas. Isso estava **errado, e o erro era do método**: a consulta lia
só a primeira página da API e tomava o fim dela pelo fim do histórico. Paginando pelo
`nextCursor`, há **1201 execuções gravadas** (a mais antiga é a 2377, de 24/08) e **449 são de
04/09, todas do v7.4** (ids 3022–3470) — a população do L1 estava lá o tempo inteiro. Um "não dá"
errado é pior que um número errado: ninguém tenta de novo.

**Os 80 turnos originais foram isolados.** A janela contígua de ids **3099–3178** reproduz, pela
matemática antiga, *todas* as estatísticas que o `PLANO_v8_2026-09-04.md` §4 publicou: n=80,
média 4,83 s, p90 11,59 s, 18/80 acima de 8 s, e as três rotas com o n e os valores exatos
(`professor:intro` 14 · 12,13 · 17,81; `conversa` 16 · 6,19 · 10,36; `professor:check` 9 · 5,46 ·
12,13). Cinco coincidências independentes: é o L1, não uma população parecida.

> **A menos de 8 turnos de borda.** A verificação deslizou uma janela de 80 turnos por todas as
> 418 posições possíveis entre as execuções 3000 e 3500: **9 janelas batem as cinco estatísticas**
> (3091–3170 até 3099–3178), não uma. Elas não são populações alternativas — os turnos que entram
> e saem nas bordas são todos triviais e sem nó de modelo (`onboarding:step`, `placement:answer`,
> `menu`, de 0,112 a 0,190 s), e **as 9 dão os mesmos números corrigidos**: média 2,55 s, p90
> 6,16 s, `professor:intro` p90 9,01 s. Os acertos formam um aglomerado contíguo, não pontos
> espalhados — que é o que garimpo em ruído produziria. Nenhum resultado depende da escolha da
> janela, mas o isolamento identifica a população a menos desses 8 turnos, e não com unicidade.

**O L1 corrigido, mesmos 80 turnos, mesma exclusão de envio:**

| | n | média velha → nova | p90 velho → novo | mediana velha → nova |
|---|---|---|---|---|
| **GLOBAL (o L1 publicado)** | 80 | 4,83 → **2,55 s** | 11,59 → **6,16 s** | 3,90 → 2,10 s |
| `professor:intro` (o "17,8 s") | 14 | 12,13 → **6,19 s** | **17,81 → 9,01 s** | 11,16 → 5,69 s |
| `conversa` | 16 | 6,19 → 3,34 s | 10,36 → 6,96 s | 5,01 → 2,65 s |
| `professor:check` | 9 | 5,46 → 2,86 s | 12,13 → 6,16 s | 4,19 → 2,21 s |
| `professor:start_quiz` | 7 | 5,67 → 2,97 s | 17,79 → 9,02 s | 3,67 → 1,99 s |
| turnos **sem** nó de LLM | 30 | 0,17 → 0,17 s | 0,22 → 0,22 s | 0,16 → 0,16 s |

Turnos acima de 8 s: **18/80 viram 4/80**. Fator de inflação nos 50 turnos com LLM: **1,92× na
média, 1,88× na mediana**. Os 30 sem LLM ficaram **idênticos** — o viés é confinado ao braço que
tem nó de modelo, e é por isso que ninguém percebeu.

Na população inteira de 04/09 (449 turnos, v7.4), o quadro é o mesmo: global 1,78 → 1,04 s de
média e 5,15 → 2,84 s de p90; nos 122 com LLM, 5,88 → 3,16 s de média, com fator de 1,85× na
mediana. **Essa população não substitui o L1** — é maior e muito mais diluída em turnos
determinísticos. Quem quiser citar "o L1" deve citar a linha GLOBAL da tabela acima, que são os
mesmos 80 turnos recalculados; quem quiser citar o dia inteiro deve dizer que é o dia inteiro.

O **17,8 s do Professor no v7.4**, que motivou este trabalho, era portanto **9,0 s**. Ele continua
sendo a rota mais lenta do produto naquele dia, e a decisão de pré-gerar continua certa — mas o
tamanho do problema era metade do que se dizia.

## 1. O desenho da medição

**O controle não é o p90 histórico de 17,8 s** — que, recalculado, era **9,0 s** (§0). Aquele
número veio do v7.4, de outra época de modelo e de outro prompt: compará-lo com o v8 mediria
três mudanças de uma vez. As duas condições foram medidas **no mesmo fluxo, na mesma
sessão, alternadas**:

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
  8,04 s e **máximo 48,07 s** — nada disso entra nos números abaixo.
- **nº 3 — rotular pelo Roteador.** Cada turno é aceito só se o `Roteador Mestre` registrou
  a rota esperada. Nenhum turno foi descartado por rota errada.
- **nova — nó aninhado.** União de intervalos, baldes disjuntos, e a soma do que é publicado
  conferida contra o relógio de parede (§0). Nenhuma das 45 execuções acusou estouro depois do
  conserto; com o defeito reintroduzido, o alarme acusa em 29 delas.
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
| **modelo** | 12 | **5,82 s** | **8,00 s** | 6,46 s | 4,97 s | 13,64 s |

**Ganho: p90 de 8,00 s → 0,98 s (−7,02 s, 88%). Mediana de 5,82 s → 0,25 s (−5,57 s, 96%).**

Decomposto:

| | banco (mediana / p90) | modelo (mediana / p90) |
|---|---|---|
| LLM | 0,00 / 0,00 s | 5,28 / 6,31 s |
| infra | 0,25 / 0,98 s | 0,25 / 3,14 s |
| consulta `Buscar Explicação` | 0,010 / 0,045 s | 0,009 / 0,035 s |
| tamanho do texto entregue | 2263 / 3039 chars | 2079 / 2380 chars |

A conta é inteira do LLM: na condição banco o `Agente Professor` **não roda** — 0,00 s de LLM em
12 de 12 turnos. O que sobra é infra, e infra é praticamente ruído (0,19–1,10 s). Na condição
modelo, dois turnos tiveram infra de 3,14 s e 4,00 s (execs 3554 e 3546); é a cauda de infra que
aparece só quando o turno é longo, e ela some junto com o modelo.

O ganho é **menor do que a versão 1 anunciou** (eram 11,82 s no p90). Continua sendo a maior
economia de latência já medida no produto, e continua vindo inteira de não chamar o modelo — mas
o número honesto é 7 s, não 12.

## 3. A sobrecarga que nós introduzimos

O nó `Buscar Explicação` fica na saída `llm` do switch `Envio Professor`, que atende
`explain`, `advance`, `question` e `wrong`. Ou seja: **ele roda também em questão e em
correção, e o `Rota Explicação` joga o resultado fora** (o `llmTask` não é `explain`).

| turno | n | a consulta rodou | custo da consulta (mediana / p90) | latência real do turno (mediana) | peso |
|---|---|---|---|---|---|
| questão (`professor:start_quiz`) | 4 | 4/4 | 0,007 / 0,013 s | 2,56 s | ~0,3% |
| correção (`professor:check`) | 4 | 4/4 | 0,006 / 0,014 s | 2,87 s | ~0,2% |
| pedir dúvida (`professor:ask_doubt`) | 4 | **0/4** | — | 0,17 s | — |
| dúvida (`professor:doubt_msg`) | 4 | **0/4** | — | 3,70 s | — |
| posicionamento (`professor:intro`, servido do banco) | 5 | 5/5 | 0,026 / 0,036 s | 0,27 s | 10% |

A última linha é o contraponto e **não** é sobrecarga: ali a consulta é o produto, não o
desperdício. Ela aparece porque é o único turno em que a consulta pesa alguma coisa (10% de um
turno de 0,27 s), e porque a contabilidade da §4 exige que os 5 turnos apareçam em algum lugar.

**Correção à premissa da tarefa:** a dúvida **não** paga a consulta. Ela sai pela saída `doubt`
do switch, que vai direto ao `Agente Dúvida` — o `Buscar Explicação` nem aparece no runData dos
8 turnos de dúvida medidos. Sobra questão e correção, e ali a consulta custa **6 a 7 ms**, contra
turnos de 2,5 a 3 s: é sobrecarga real, mas de terceira casa decimal. Não justifica mover o nó
para depois do switch.

## 4. Contabilidade dos turnos

45 execuções rodadas, 45 no relatório, nenhuma fora:

| | n | onde aparece |
|---|---|---|
| explicação, condição banco | 12 | §2, §7 |
| explicação, condição modelo | 12 | §2, §7 |
| posicionamento (`professor:intro`, banco) — punha o aluno no tópico antes da trilha de sobrecarga | 5 | §3, §7 |
| questão / correção / pedir dúvida / dúvida | 16 | §3, §7 |
| **total** | **45** | |

Os 5 turnos de posicionamento são todos "banco" e ficam **fora** da comparação da §2 por
desenho: neles a linha nunca foi removida, então não têm par na condição modelo. Ficam
registrados porque um turno rodado e não relatado é um buraco na conta do leitor. Note que eles
são mais rápidos que os 12 da §2 (mediana 0,27 s contra 0,25 s — praticamente o mesmo); incluí-los
não moveria o resultado.

## 5. O que esta medição **não** mostra

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
   dois. O max de 13,64 s da condição modelo mostra que a cauda existe e não foi bem amostrada.
7. **A comparação é de rota, não de texto.** O texto gerado ao vivo não é o texto do banco;
   as duas condições entregam conteúdos diferentes pela mesma rota.
8. **O caminho de geração ao vivo não carimba `explicacao_origem`.** Só o do banco carimba; o
   outro foi rotulado pela presença do `Agente Professor` e ausência do `Explicação do Banco` no
   runData — ainda a partir do registro da execução, mas por ausência. Carimbar
   `explicacao_origem: 'modelo'` no `Parse Professor` fecharia isso (fora do escopo do T009).
9. **O n8n caiu no fim da corrida**, depois dos 24 turnos de explicação e de 4 das 5 sequências
   de sobrecarga planejadas — daí n=4 (e não 5) nas quatro linhas da §3. Os 24 turnos da
   comparação principal estão completos e nenhum deles foi afetado; a queda é comprovadamente
   posterior a eles.
10. **A versão 1 deste relatório errou em 4,8 s no número de manchete** (§0). Isso não é uma
    ressalva sobre o produto, é sobre o instrumento — e é a razão de a §0 existir.

## 6. Como reproduzir

```
node fluxos/_teststand/mede_professor_v8.js 12 5     # ~40 min, exige n8n com o v8 ativo + Postgres
node fluxos/_teststand/testa_decompoe_latencia.js    # offline: a matemática do medidor
node conteudo/confere_explicacoes_db.js              # 60 linhas de volta
node db/cleanup_test_users.js --apply                # limpa a faixa 990000000-999999999
```

O script só escreve em duas coisas: alunos de teste na faixa `990000000–999999999` e a linha de
`topic_explanations` que ele remove e repõe a cada par (restaurada também por
`conteudo/seed_explicacoes.js` no fim).

## 7. Bruto — os 45 turnos

Os artefatos `lat_professor_v8.log` e `lat_professor_v8.json` caem no `.gitignore` do
`_teststand` (`*.log`, `lat_*.json`), entao a evidencia por turno fica aqui. Todos os valores
ja sao a conta por uniao de intervalos; a coluna `real (v1)` mostra o que a versao 1 publicava,
para que a diferenca seja auditavel. `wall` e o relogio de parede da execucao.

| # | condição | nível | exec | real (s) | real v1 (s) | LLM (s) | infra (s) | busca PG (s) | envio (descartado) | wall (s) | chars |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | banco | A1 | 3537 | 0.24 | 0.24 | 0.00 | 0.24 | 0.010 | 7.88 | 8.17 | 2394 |
| 2 | modelo | A1 | 3538 | 5.09 | 9.79 | 4.89 | 0.20 | 0.010 | 7.84 | 12.95 | 2077 |
| 3 | banco | A2 | 3539 | 0.26 | 0.26 | 0.00 | 0.26 | 0.007 | 7.78 | 8.06 | 2026 |
| 4 | modelo | A2 | 3540 | 5.04 | 9.76 | 4.88 | 0.16 | 0.009 | 7.80 | 12.87 | 2041 |
| 5 | banco | B1 | 3541 | 0.25 | 0.25 | 0.00 | 0.25 | 0.007 | 27.93 | 28.20 | 2080 |
| 6 | modelo | B1 | 3542 | 6.50 | 12.80 | 6.31 | 0.20 | 0.006 | 7.85 | 14.37 | 1981 |
| 7 | banco | B2 | 3543 | 0.19 | 0.19 | 0.00 | 0.19 | 0.010 | 7.88 | 8.09 | 2132 |
| 8 | modelo | B2 | 3544 | 5.11 | 9.92 | 4.94 | 0.17 | 0.006 | 29.30 | 34.43 | 2234 |
| 9 | banco | C1 | 3545 | 0.23 | 0.23 | 0.00 | 0.23 | 0.008 | 27.92 | 28.17 | 2676 |
| 10 | modelo | C1 | 3546 | 13.63 | 17.99 | 9.64 | 4.00 | 0.174 | 8.10 | 21.76 | 2080 |
| 11 | banco | C2 | 3547 | 0.31 | 0.31 | 0.00 | 0.31 | 0.016 | 28.00 | 28.33 | 3039 |
| 12 | modelo | C2 | 3548 | 5.88 | 11.44 | 5.58 | 0.30 | 0.007 | 8.39 | 14.33 | 2334 |
| 13 | banco | A1 | 3549 | 0.19 | 0.19 | 0.00 | 0.19 | 0.015 | 8.00 | 8.22 | 2394 |
| 14 | modelo | A1 | 3550 | 6.16 | 11.91 | 5.81 | 0.34 | 0.010 | 7.79 | 13.97 | 2297 |
| 15 | banco | A2 | 3551 | 0.19 | 0.19 | 0.00 | 0.19 | 0.006 | 7.78 | 7.98 | 2026 |
| 16 | modelo | A2 | 3552 | 5.76 | 11.30 | 5.58 | 0.18 | 0.035 | 8.08 | 13.86 | 2064 |
| 17 | banco | B1 | 3553 | 0.25 | 0.25 | 0.00 | 0.25 | 0.018 | 8.01 | 8.29 | 2080 |
| 18 | modelo | B1 | 3554 | 8.00 | 12.61 | 4.86 | 3.14 | 0.010 | 11.11 | 19.33 | 2038 |
| 19 | banco | B2 | 3555 | 0.31 | 0.31 | 0.00 | 0.31 | 0.045 | 48.07 | 48.43 | 2132 |
| 20 | modelo | B2 | 3556 | 5.95 | 11.31 | 5.38 | 0.57 | 0.018 | 8.97 | 14.96 | 2380 |
| 21 | banco | C1 | 3557 | 1.10 | 1.10 | 0.00 | 1.10 | 0.010 | 27.95 | 29.13 | 2676 |
| 22 | modelo | C1 | 3558 | 4.97 | 9.45 | 4.68 | 0.29 | 0.008 | 7.89 | 12.88 | 1956 |
| 23 | banco | C2 | 3559 | 0.98 | 0.98 | 0.00 | 0.98 | 0.395 | 28.19 | 29.67 | 3039 |
| 24 | modelo | C2 | 3560 | 5.39 | 10.37 | 5.17 | 0.22 | 0.007 | 7.92 | 13.34 | 2427 |

| # | fase | rota registrada | exec | real (s) | real v1 (s) | Buscar Explicação |
|---|---|---|---|---|---|---|
| 25 | posicionamento | `professor:intro` | 3561 | 0.27 | 0.27 | 0.011 s |
| 26 | questao | `professor:start_quiz` | 3562 | 2.69 | 4.46 | 0.013 s |
| 27 | correcao | `professor:check` | 3563 | 2.70 | 4.97 | 0.005 s |
| 28 | pede_duvida | `professor:ask_doubt` | 3564 | 0.20 | 0.20 | NAO RODOU |
| 29 | duvida | `professor:doubt_msg` | 3565 | 3.94 | 7.56 | NAO RODOU |
| 30 | posicionamento | `professor:intro` | 3566 | 0.23 | 0.23 | 0.026 s |
| 31 | questao | `professor:start_quiz` | 3567 | 1.89 | 3.57 | 0.004 s |
| 32 | correcao | `professor:check` | 3568 | 2.90 | 5.55 | 0.006 s |
| 33 | pede_duvida | `professor:ask_doubt` | 3569 | 0.18 | 0.18 | NAO RODOU |
| 34 | duvida | `professor:doubt_msg` | 3570 | 3.71 | 7.24 | NAO RODOU |
| 35 | posicionamento | `professor:intro` | 3571 | 0.18 | 0.18 | 0.014 s |
| 36 | questao | `professor:start_quiz` | 3572 | 2.75 | 4.79 | 0.010 s |
| 37 | correcao | `professor:check` | 3573 | 2.92 | 5.57 | 0.014 s |
| 38 | pede_duvida | `professor:ask_doubt` | 3574 | 0.14 | 0.14 | NAO RODOU |
| 39 | duvida | `professor:doubt_msg` | 3575 | 3.69 | 7.18 | NAO RODOU |
| 40 | posicionamento | `professor:intro` | 3576 | 0.31 | 0.31 | 0.036 s |
| 41 | questao | `professor:start_quiz` | 3577 | 2.43 | 4.34 | 0.005 s |
| 42 | correcao | `professor:check` | 3578 | 2.83 | 5.42 | 0.006 s |
| 43 | pede_duvida | `professor:ask_doubt` | 3579 | 0.17 | 0.17 | NAO RODOU |
| 44 | duvida | `professor:doubt_msg` | 3580 | 2.74 | 5.23 | NAO RODOU |
| 45 | posicionamento | `professor:intro` | 3581 | 0.35 | 0.35 | 0.036 s |
