# HANDOFF — IAChat

> **Estado em 05/09/2026.** Este é o **único** handoff do projeto: em vez de criar um arquivo
> datado por sessão, atualize este. A proliferação de handoffs datados foi justamente o que
> gerou documentos contraditórios em julho e agosto.
>
> Ele agora contém as três coisas: **o que o projeto é e aonde deve chegar** (§1), **onde
> estamos** (§2–§4) e **o plano da v8** (§5). O `PLANO_v8_2026-09-04.md` deixou de ser o plano
> e passou a ser o **registro de evidência** da bateria de 04/09 — as medições longas ficam lá.
>
> Roteiro completo dos testes: `TESTES_DIAGNOSTICOS.md`.

---

## 1. O que é o IAChat, e aonde ele precisa chegar

### O produto

Um **tutor de inglês pessoal que vive dentro do Telegram**. O aluno conversa por texto ou áudio,
e o bot faz três coisas que uma escola faz e um app de flashcards não faz:

1. **Descobre o nível dele** com um teste adaptativo de 10 questões (A1 a C2).
2. **Conversa de verdade** sobre o que ele gosta, corrigindo os erros no caminho, com uma
   personalidade que ele escolhe.
3. **Ensina de forma estruturada** no modo Professor: uma trilha de 10 tópicos por nível, com
   explicação, exercícios e tira-dúvidas.

Não é um chatbot com um prompt. O estado do aluno — nível, personalidade, interesses, progresso
na trilha, sequência de dias — vive no Postgres e sobrevive a tudo. As decisões pedagógicas
(subir de nível, avançar tópico, aceitar uma resposta) são **código determinístico**; o LLM
escreve o texto, não decide o currículo. Essa separação é a espinha dorsal do projeto e não
deve ser diluída.

### A régua de qualidade

O objetivo declarado é ter o agente **no mais alto nível possível, o quanto antes**. Na prática
isso quer dizer três coisas mensuráveis:

| | |
|---|---|
| **Ensina de verdade** | a explicação de um tópico tem de bastar para o aluno acertar as questões dele sozinho, sem buscar fora |
| **Corrige de verdade** | erro do aluno vira reparo explícito, em todos os níveis — hoje isso falha no A1 (§4) |
| **Não parece um robô** | personalidade reconhecível, usa os interesses do aluno, e não trava por 18 segundos esperando o modelo |

### Onde ele ainda não chega

Três lacunas conhecidas, em ordem de impacto:

1. **O A1 não corrige e não usa interesses.** Medido, reproduzido, e com duas hipóteses já
   refutadas (§4). É o nível de entrada — ou seja, o pior lugar possível para falhar.
2. ~~**O modo Professor é lento e a explicação é gerada na hora.**~~ **Resolvido no v8, ainda não
   no bot.** As 60 explicações vêm do banco: p90 de 0,98 s contra 8,00 s da geração ao vivo
   (`MEDICOES_professor_v8.md`). O 17,8 s que motivou isto era o instrumento com viés — o real
   era 9,0 s (§6 nº 16). **Falta a sua revisão dos 60 textos**, que é a única coisa que garante
   qualidade: o gate confere forma e cobertura, não se o texto ensina. E falta o v8 virar o bot.
3. **O material de referência ainda não existe.** Os livros WAYS 6º–9º ano estão sendo
   convertidos em `.md` para o agente usar como fonte. Isso muda o teto de qualidade do
   Professor, e ainda não começou.

### Estágio

**Pré-lançamento.** 2 contas reais no banco. Não há migração a proteger: mudanças de schema, de
prompt e de comportamento são baratas **agora** e ficam caras depois.

---

## 2. Onde estamos — TL;DR

| | |
|---|---|
| **Fluxo do bot** | `IAChat_Telegram_v7.4` — n8n id `9MA0o1XJjD33BnKc`, **101 nós**, `active=true`. **CONGELADO** na tag git `v7.4-congelado`; é ele que atende o Telegram |
| **Fluxo de trabalho** | `IAChat_Telegram_v8` — n8n id `PbwEf7L9xEXhJaCg`, **106 nós**, `active=true` **em paralelo**. Só recebe tráfego de teste: ingress em `iachat-test-v8` e `Gatilho Telegram` desabilitado |
| **Arquivo de edição** | `fluxos/IAChat_Telegram_v8.json` — **nunca** o v7.4 |
| **Publicar o v8** | `node fluxos/_teststand/publica_v8.js` (único caminho autorizado; alvo cravado, aborta se o arquivo puder roubar o bot) |
| **Loop de desenvolvimento** | `PLAN.md` + `STATE.md` + `/next`; agentes em `.claude/agents/`. Gate: `npm run gate` (~7 s, offline) |
| **Nudge** | `IAChat_Nudge_Retencao_v1` — id `DBF6NoEXRXrHAy85`, **DESATIVADO** de propósito |
| **Modelos** | Vertex/Gemini desde 03/09: `gemini-2.5-flash` (Conversa, Professor, Dúvida), `gemini-2.5-flash-lite` (Extrator, Validar Nome). Áudio na Groq: `whisper-large-v3` |
| **Banco** | Postgres `127.0.0.1:5433` (Docker, `iachat-pg`), **14 migrations** (a 013 criou `topic_explanations`, 60 linhas) |
| **Regressão offline** | `npm run gate` — regressão dos nós de código, cadastro de nome, camada 1, abre-alas, explicação do banco, TRACK, conteúdo, vazamento, latência, e a prova de que o v7.4 não foi tocado |
| **Fase A** (determinísticos) | **17/17** |
| **Fase B** (LLM) | **16 passaram · 2 falharam (C1, C15) · 11 revisar · 0 inconclusivos** |
| **Latência (L1)** | **recalculado em 06/09** sobre os mesmos 80 turnos (execs 3099–3178): média **2,55 s**, p90 **6,16 s**, 4/80 acima de 8 s; infra ≤0,40 s. Os valores antigos (4,83 s / 11,59 s / 18 acima de 8 s) vinham do `decompoe()` que somava nó aninhado — ver §6 nº 16. `professor:intro`: p90 **9,01 s**, não 17,81 s |

**Nunca deixe duas versões ativas no mesmo webhook** — v7.2, v7.3 e v7.4 usam o mesmo
`webhookId` (`telegram-iachat-webhook`). O v8 convive com o v7.4 **porque tem ingress próprio e o
`Gatilho Telegram` desabilitado**; publicá-lo sem isso derruba o bot. O `publica_v8.js` aborta
antes de publicar se essas duas condições não estiverem no arquivo.

### Como retomar numa sessão nova do Claude Code

Todo o estado do loop está em arquivo — a conversa não é necessária.

1. Leia `CLAUDE.md` (convenções, gates, zonas proibidas) e este documento.
2. Leia `STATE.md` (tarefa atual, ambiente, diário de descobertas) e `PLAN.md` (T001–T012).
3. Confira o ambiente **de verdade**, não pela nota: portas 5433 e 5678 abertas, e
   `node fluxos/_teststand/gate_vivo_v8.js` respondendo — `active: true` não prova que o webhook
   registrou.
4. Rode `npm run gate`. Se estiver vermelho num repositório limpo, pare e descubra por quê antes
   de qualquer coisa.
5. `/next` executa uma tarefa: escolhe a próxima `TODO` com dependências satisfeitas, delega ao
   `implementer`, verifica com o `verifier` (que não vê o raciocínio do implementer e roda os
   gates do zero), commita e atualiza o estado. Três reprovações na mesma tarefa param o loop.

Se o n8n estiver fora, suba-o **na mesma janela** com o bloco `WEBHOOK_URL` do §7 — é a armadilha
mais cara do projeto.

### Estado que exige atenção agora

| | |
|---|---|
| ⚠ **`DEV_COMMANDS = true`** | ligado a pedido em 04/09. `/reset` e `/resetfull` funcionam **para qualquer usuário** e não checam quem digitou. Fica ligado até haver pedido explícito em contrário. **DESLIGAR ANTES DO LANÇAMENTO** — a regressão avisa a cada rodada |
| ⚠ **`Validar Nome (IA)` reapontado ao Vertex** | commitado em 05/09 (`929f5d4`) e presente nos dois fluxos, mas **ainda NÃO validado ao vivo** — é a tarefa **T010** do `PLAN.md`. Se a Service Account não autenticar nesse caminho, o `Veredito IA` cai no fail-open: nada quebra, mas nada melhora, e o `asdfgh` continua virando nome |
| ✅ ~~Docker/Postgres fora~~ | **resolvido em 05/09** — `iachat-pg` no ar, 5433 aberta. A nota antiga sobreviveu ao conserto e induziu um agente a declarar bloqueio falso: **confira a porta antes de acreditar em nota de ambiente** |

### O que foi feito em 04–05/09

- Dois defeitos **P0** de produto corrigidos e publicados (§3).
- Quatro defeitos de **instrumento** corrigidos — um deles fazia o teste de vazamento de
  gabarito julgar a string errada.
- Bateria completa ao vivo, jornada de usuário ponta a ponta, L1 fechado com n=80.
- Experimento do A1: duas hipóteses refutadas com medição.
- Higiene: 296 → 161 arquivos rastreados.

### O que foi feito em 05–06/09 — o bloco do Professor

Nove tarefas do `PLAN.md`, cada uma com implementação e **verificação independente** (o verificador
não vê o raciocínio de quem implementou e roda os gates do zero). Três foram reprovadas e refeitas.

- **v8 isolado e publicado como workflow separado**, ativo em paralelo ao bot, com ingress próprio.
- **Abre-alas do Professor**: o aluno recebe `📚 Tópico N/10` 1,16 s antes de o modelo ser chamado.
- **60 explicações pré-geradas** (Gemini 2.5 Pro), validadas, versionadas em `conteudo/explicacoes/`
  e servidas do Postgres, com fallback para a geração ao vivo — provado inclusive com o banco
  inacessível.
- **Política de idioma**: B1–C2 passaram a explicar em português; enunciado em português em A1/A2 e
  em inglês de B1 para cima; resposta sempre em inglês.
- **O medidor de latência mentia** (§6 nº 16) e foi consertado; o L1 inteiro foi recalculado.

---

## 3. Os dois defeitos P0 — corrigidos, e por que a bateria não os viu

Ambos no onboarding. Ambos com 45 testes verdes ao lado. **O padrão importa mais que os
defeitos:** as duas fases semeiam estado direto no banco para poupar chamadas de LLM, e com isso
**pulam as transições do fluxo** — que é exatamente onde os dois estavam.

### 3.1 Interesse personalizado não funcionava

Tocar em "✍️ Outro" não devolvia nada, e o tema digitado era descartado.

```
jsonb_set(…, '{int_await_ts}', 1788531542825::jsonb)
ERROR: cannot cast type bigint to jsonb
```

O `UPDATE` inteiro falhava, então nem `int_await` era gravado; `Salvar Interesses` abortava e
`Enviar Pedir Outro` nunca rodava — silêncio para o aluno. Corrigido com `to_jsonb`.

**Cobertura zero:** C16 e C17 semeiam `interests` no banco e só chamam `int_open`. Ninguém
percorria *other → digitar → salvar*.

### 3.2 Validação de nome estava escrita, fiada e ignorada

O bot aceitava `oi`, `bom dia`, `teste`, `kkkk`, `admin` e palavrões como nome, e gravava para
sempre. Os nós `Triagem de Nome` / `Veredito IA` já calculavam `nameCheck`, mas a
`Etapa de Cadastro` **nunca lia esse campo**.

Agora consome o veredito, com mensagem **por motivo**, e liga o **escape do loop** que a Triagem
já previa: na 3ª recusa aceita o `first_name` do Telegram em vez de perguntar para sempre.

**Um limite que ficou:** a camada 1 pega `asdf`, `qwerty`, `zxcvbn` — mas **não** `asdfgh`, que
cai em `ask_ai`. Sem a camada 2 funcionando, tudo que escapa das listas entra como nome. É por
isso que o item 1 do plano existe.

---

## 4. C1 e C15 — o problema de qualidade que resta

Os dois únicos `FALHOU` da Fase B, ambos em **A1**, reproduzidos em três rodadas.

- **C1** — `"i like play games"` não é corrigido.
- **C15** — os interesses do aluno não são usados.

### O que o experimento de 04/09 decidiu

Protocolo do §8: baseline → uma linha → medir → reverter → conferir nas duas pontas.

| condição | correção | interesses | controle (erro **da** lista) |
|---|---|---|---|
| baseline | **0/9** | 0/9 | ~2/3 |
| A — lista fechada → regra com exemplos | 1/6 | 0/6 | 3/6 |
| B — linha de PRIORIDADE explícita | 0/6 | 0/6 | 3/6 |

**As duas caem.** A dá sinal fraco demais; B não move nada — e era a mais promissora, porque foi
esse mesmo desenho que levou o contrato de idioma de 3/12 a 12/12 em 03/09.

### O diagnóstico ficou mais afiado, e mais incômodo

O **controle deu 3/6**. O erro que *está* na lista também não é corrigido de forma confiável no
A1. Isso derruba a explicação que se vinha sustentando: **a questão não é quais erros estão na
lista — é que o A1 corrige mal, ponto.** E o C15 deu zero em todas as condições: interesses não
estão fracos no A1, estão **mortos**.

### A hipótese que sobra, ainda não testada

A linha de IDIOMA do A1 traz um **exemplo de formato** (`Nice! Do you play on your phone?` +
tradução) que não contém correção nem interesse. O modelo pode estar imitando a **forma** do
exemplo em vez de seguir as diretivas — few-shot vencendo instrução. É uma linha, e é a próxima
variável a mexer.

### E um erro de medição que contaminava o número

O detector do C1 testava `/playing/i`, mas depois de `like` **as duas formas são corretas**. Ele
marcou `ok=false` numa resposta que corrigia certinho (`We say 'I like TO play games'`). A Fase B
usava o mesmo teste. Corrigido nos dois lugares: aceita as duas formas e exige o **reparo
explícito**, não apenas o bot usando a forma certa na própria frase.

---

## 5. Plano da v8

> Ordem por retorno, não por facilidade. Os itens 1–4 são o caminho para "agente no mais alto
> nível"; 5–7 são infraestrutura e decisões já tomadas.

### Concluído em 04–06/09

| | Item | Estado |
|---|---|---|
| ✅ | Cast do `int_await_ts` | publicado, verificado ao vivo |
| ✅ | `Etapa de Cadastro` consumir o `nameCheck` | publicado, verificado ao vivo |
| ✅ | Testes que teriam pego os dois | A2 com entradas reais + A2b; reprovam a versão anterior |
| ✅ | Higiene do repositório | 296 → 161 arquivos rastreados |
| ✅ | Experimento do A1 | duas hipóteses refutadas, detector corrigido |
| ✅ | **Item 2 inteiro — modo Professor** | abre-alas + 60 explicações servidas do banco (T002–T009) |
| ✅ | **Loop de desenvolvimento** | `PLAN.md`/`STATE.md`/`/next` + implementer e verifier |
| ✅ | **Medidor de latência** | defeito de nó aninhado corrigido, L1 recalculado (§6 nº 16) |

### 1 — Fechar a camada 2 da validação de nome · **próxima tarefa (T010)**

Reapontado para o Vertex, reusando a `Google Service Account` (id `mKfC2ANkOKHfbKal`) que os 4
nós de modelo já usam — assim não é preciso criar conta no Google AI Studio.

**Commitado (`929f5d4`) e presente nos dois fluxos, ainda não validado ao vivo.** Falta mandar
`asdfgh` (deve recusar) e `Kaique` (deve aceitar) pelo ingress do v8 e conferir se o nó autentica.
Se não autenticar, a alternativa é criar a credencial `googlePalmApi` com uma API key do AI Studio.
**Enquanto isso não fecha, `asdfgh` vira nome de aluno** — a camada 1 pega `asdf` e `qwerty`, mas
não sequências de 6 letras.

### 2 — Modo Professor · **CONCLUÍDO em 05–06/09**

Decisão de 04/09: quanto mais determinismo, melhor, e a explicação tem de ser "bem mastigada".

**(a) Abre-alas determinístico** — o aluno recebe `📚 Tópico N/10: <título>` **antes** da chamada
ao modelo. Medido ao vivo: cabeçalho aos 521 ms, modelo aos 1681 ms, explicação aos 7827 ms. Só na
rota de explicação; em questão, correção e dúvida o nó roda e devolve `[]`.

**(b) 60 explicações pré-geradas** — geradas com Gemini 2.5 Pro, validadas, versionadas em
`conteudo/explicacoes/<NIVEL>/<NN>-<slug>.md` e servidas da tabela `topic_explanations` pelo nó
`Buscar Explicação`. Fallback para a geração ao vivo, provado nas duas formas de falha: linha
ausente **e** banco inacessível.

Resultado medido, n=12 por condição no mesmo v8:

| | mediana | p90 |
|---|---|---|
| servida do banco | 0,25 s | **0,98 s** |
| gerada ao vivo | 5,82 s | **8,00 s** |

Ganho de **7,02 s (88%)** no p90. Todo ele vem do LLM: na condição servida o `Agente Professor`
não roda.

> **O 17,8 s nunca existiu.** Era 9,01 s — o medidor somava nós aninhados (§6 nº 16). O ganho é
> real e medido, mas a motivação original deste bloco estava inflada em ~1,9×.

**O que o gate NÃO garante, e por isso a revisão humana continua devendo:** o validador confere
forma, cobertura de vocabulário, idioma, HTML e vazamento de gabarito — **não se o texto ensina**.
Está medido: um arquivo gramaticalmente correto, sem repetição, cobrindo os termos e com as cinco
seções, que nunca enuncia a regra, **passa**. Ler os 60 no diff é a única rede contra isso.

### 3 — Material de referência: livros → `.md`

Os quatro PDFs WAYS 6º–9º ano viram `.md` para o agente usar como fonte. Isso é **conteúdo de
produto**, não material de consulta: os `.md` entram versionados, os PDFs ficam fora do git.

Conecta com o item 2: explicação pré-gerada **a partir do material real** é outro patamar de
qualidade em relação a explicação gerada do nada.

> **Decisão de escopo pendente:** os livros são de 6º–9º ano (11–14 anos), mas o cadastro
> rejeita idade abaixo de 16. Ou o material não é para os alunos, ou a faixa etária muda.

### 4 — C1 e C15 no A1

Testar a hipótese do exemplo de formato (§4). Uma linha, protocolo de sempre.

### 5 — Menu de comandos do Telegram · **adiado por decisão**

Roteador trata 19 comandos, `/help` lista 11, o Telegram mostra **0**. O
`IAChat_SetCommands_oneshot.json` está pronto e nunca foi importado; usa
`$env.TELEGRAM_BOT_TOKEN`, que basta exportar no mesmo bloco de startup do `WEBHOOK_URL`.
**Decisão de 05/09: fica como está, discutir depois.**

### 6 — Hospedagem

O ngrok gratuito troca de URL a cada restart e derruba a ativação inteira. Recomendação:

- **agora:** ngrok pago com domínio fixo (~US$ 8/mês) — mata a causa raiz sem tocar em nada
- **no lançamento:** **VPS** (2 vCPU / 4 GB) com n8n + Postgres em Docker Compose. **Não** n8n
  Cloud: todo o estado do aluno vive no Postgres, e o Cloud não o hospeda

### 7 — Painel web · **secundário por decisão**

`web/` **não compila**: importa `./pages/Landing` e `./pages/Test`, que não existem, e
`react-router-dom`, que não está no `package.json`. O `main.tsx` nem usa o `App.tsx` — são duas
tentativas sobrepostas. O backend (`api/`, 9 handlers) é a parte decente.

**Decisão de 05/09: quer o painel, mas o agente vem primeiro.** Fica quebrado e registrado.

### Dívida com prazo

| | |
|---|---|
| `DEV_COMMANDS` de volta a `false` | antes do lançamento |
| Ligar `jornada_usuario.js` e `mede_c8_teto_a1.js` à suíte | hoje rodam só à mão |
| 7 testes sem automação: `A7 B2 C8 L2 R7 S2 S3` | **teste descartado é dívida** |
| **Revisar os 60 `.md` de explicação** | antes de o v8 virar o bot — o gate não julga se o texto ensina |
| **`bateria_completa_b.js` T3 contradiz o produto** | assere "sem português na explicação de B2"; com o T005b isso é o comportamento correto. Vai dar **falso vermelho** na próxima bateria. Conferir junto a linha 257 e o cabeçalho do `revalida_niveis.js` |
| **`gate_vivo_v8.js` só percorre o onboarding** | qualquer tarefa que mexa em outra rota passa sem tocar no que mudou. Hoje se compensa com verificação manual por rota |
| **`postUpdate` do harness não tem teto** | com o n8n fora, cada turno leva ~100 min em vez de falhar. Bateria longa trava em silêncio |
| **`bateria_completa_a.js` sai 0 mesmo reprovando** | só sai ≠0 em erro fatal. Não serve como gate enquanto isso não mudar |
| **`COBERTURA` quase cega em `C2/4` e `C2/7`** | 1 e 2 termos exigíveis; a `descricao` desses tópicos no TRACK quase não tem matéria fora dos exemplos |
| **Corpo do banco não é escapado** | hoje é seguro (varri os 60), mas se a fonte do corpo mudar vira HTML quebrado no Telegram |

---

## 6. Armadilhas já pagas — NÃO repetir

As dez primeiras vêm de julho/agosto; as demais de 24/08, 04/09 e 06/09.

1. **Resposta vazia não é aprovação.** Testes de negativa passam trivialmente quando o bot não
   responde. Gerou dois falsos PASSOU enquanto a Groq dava 404.
2. **Duração total não mede latência.** O `chat_id` sintético faz o envio falhar e o retry
   injeta 7–27 s. Meça `executionTime` por nó e descarte os nós de envio.
3. **Não rotule o turno pela ordem de envio.** Classifique pelo que o `Roteador Mestre`
   registrou.
4. **Perda determinística não é corrida.** Sempre o mesmo item se perdendo indica outra causa.
5. **Detector de correção precisa cobrir a forma curta.** O teto de 18 palavras do A1 força
   `"We say 'are', not 'is'"`.
6. **`msg_count` não detecta corrida** — o incremento é atômico no SQL.
7. **Controle sequencial precisa de ≥12 s de espaçamento.**
8. **Localizar a repetição não é localizar a causa.**
9. **Sempre abrir a transcrição antes de reportar.** Todo falso resultado sobreviveu ao agregado
   e morreu na evidência bruta.
10. **ID alto não significa usuário de teste.** IDs reais do Telegram têm 10 dígitos.
11. **Base suja faz o teste medir resíduo.** Derive o ID do relógio, na faixa
    `990000000–999999999`, que é a que o `cleanup_test_users.js` apaga.
12. **Teste que sorteia a própria condição mede sorte.** O B6 reprovava em ~40% das rodadas.
    Em 04/09 a mesma armadilha voltou em forma nova: o A2 mandava 10 nomes inválidos ao **mesmo**
    aluno e batia no escape do loop, medindo a própria feature.
13. **O instrumento pode julgar a string errada.** O `digest()` montava a dúvida a partir do
    `Agente Dúvida`, que roda **antes** do `Filtro Anti-Spoiler`. `smoke.js`,
    `bateria_critica.js` (T7 e R6), `teste_gate_frase.js`, `teste_gate_nova_questao.js` e
    `tick.js` consomem esse campo — a proteção que chega ao aluno **nunca foi validada ao vivo**.
    Corrigido.
14. **Resposta "vazia" pode ser cegueira do digest.** `Etapa de Modo` publica em `confirm`, e
    `Mensagem Sistema` e `Interests Engine` não eram lidos. Corrigido — mas texto de nó Telegram
    estático continua invisível por construção.
15. **Turno iniciado por CALLBACK precisa de ~35 s**, não os 12 s da nº 7: `Responder Callback`
    também entra em retry. Confira o relógio do campo gravado contra o `startedAt` da execução
    antes de culpar o produto.
16. **Nó aninhado contado duas vezes.** O `decompoe()` do `analisa_latencia.js` **somava**
    `executionTime`, mas o `Modelo Vertex X` roda **dentro** da janela do `Agente X` (e o
    `Memória Dúvida`, que é infra, roda dentro do agente também). Na exec 3538 do T009, 4,89 s
    viraram 9,60 s — número **maior que o relógio de parede da execução**, que é impossível. O
    viés atingia só os turnos com nó de modelo — ou seja, exatamente o braço de comparação. Toda
    medição de LLM feita antes de 06/09 saiu deste instrumento e está inflada. **Não reuse número
    antigo sem recalcular.** Recalculados: L1 4,83 → **2,55 s** de média e 11,59 →
    **6,16 s** de p90; `professor:intro` 17,81 → **9,01 s** de p90. Fator ~1,9× nos turnos com
    nó de modelo; turnos sem LLM ficam idênticos, e é por isso que ninguém viu.
    **Duas lições de método, além do conserto:** (a) *a API do n8n pagina* — a primeira tentativa
    de recálculo declarou o L1 perdido porque leu só a primeira página e tomou o fim dela pelo
    fim do histórico; há 1201 execuções gravadas, desde 24/08, e os 80 turnos do L1 estavam lá;
    (b) *conferência de sanidade tem de conferir o que é publicado* — a primeira versão do alarme
    recalculava o total a partir dos intervalos, isto é, conferia o instrumento contra ele mesmo,
    e acusava em 0 de 59 execuções com o defeito reintroduzido. Conferindo os escalares
    publicados contra o relógio de parede, acusa em 29 de 59.
    Corrigido em 06/09: soma por **união de intervalos**, baldes **disjuntos** (infra que roda
    dentro de um agente pertence a um balde só), `estouroDe()` e a regressão offline
    `_teststand/testa_decompoe_latencia.js`, no `npm run gate`. Detalhes em
    `MEDICOES_professor_v8.md` §0.
17. **Mudança de produto quebra fixture de teste.** A validação de nome passou a recusar
    `'Teste'`, que o `jornadaPlacement` digitava — B1, B3, B5 e A8 reprovaram de uma vez, por
    causa do fixture. Extraído para `NOME_VALIDO`.

---

## 7. Ambiente — o que quebra

### `WEBHOOK_URL` (o mais caro de todos)

Sem `WEBHOOK_URL` no ambiente do processo, o n8n oferece `http://localhost:5678/` ao Telegram,
que **recusa não-HTTPS**. A falha derruba a **ativação inteira do workflow** e leva junto o
`TEST Ingress` — o sintoma é 404 em *todos* os webhooks, com o workflow marcado `active: true`.

Subir assim, tudo na **mesma** janela:

```powershell
$env:WEBHOOK_URL="https://SUA-URL.ngrok-free.dev"
$env:N8N_PROTOCOL="https"
$env:N8N_HOST="SUA-URL.ngrok-free.dev"
# $env:TELEGRAM_BOT_TOKEN="..."   # necessário só para o one-shot do menu de comandos
npx n8n
```

URL corrente em `http://localhost:4040/api/tunnels`.

### Outros

- **Docker/Postgres:** quando o engine trava (comum após suspensão no Windows), o processo do
  Docker Desktop continua vivo, `docker ps` **pendura** e a porta 5433 fica fechada. O sintoma no
  fluxo é `Connection refused` em `::1:5433` no `Carregar Aluno`. Reinicie o Docker Desktop.
- ~~Cota da Groq~~ — não é mais gargalo desde 03/09; da Groq sobrou só o Whisper.
- **Ativação via MCP que falha desativa o workflow.** Confira `active` depois de qualquer update.
- **MCP do n8n:** precisa de `WEBHOOK_SECURITY_MODE=moderate` no env do servidor.
- **Leitura de credenciais pela API pública está bloqueada** (405). Para achar o id de uma
  credencial, abra na interface do n8n — o id está na URL.

---

## 8. Convenções acertadas

- **Commits COM atribuição** (`Co-Authored-By` + `Claude-Session`). A regra mudou no commit
  `125fd88`; se voltar atrás, mude aqui **e** avise.
- **Não publicar nem ativar sem pedido explícito.** Vale para ativar workflow, `git push` e
  qualquer coisa que mande mensagem real no Telegram.
- **Protocolo de experimento no fluxo ao vivo:** baseline com N=3 → alterar **uma** linha →
  medir → **reverter** → conferir nas duas pontas com `git diff`. Nunca reverter com rodada em
  voo.
- **Nunca editar o fluxo com bateria rodando** — contamina a medição.
- **Escrever o teste JUNTO com a correção**, e conferir que ele **reprova a versão anterior**.
  Teste que não reprova o código velho não prova nada.
- **Validar sintaxe antes de publicar** (`node --check`) — uma edição já subiu quebrada por um
  `}` removido sem querer.
- **Fazer backup do live antes de publicar** (`_teststand/backup_live_*.json`).
- **Limpar usuários de teste ao fim:** `node db/cleanup_test_users.js --apply`.
- **`/reset` e `/resetfull` ficam no fluxo.** Hoje **LIGADOS** por `DEV_COMMANDS = true`, a
  pedido — ver §2.
- **Credenciais não passam pelo assistente.** O token do bot e as chaves ficam no `.env`
  (ignorado pelo git) ou no store do n8n, que não deve ser decifrado.

---

## 9. Ferramental (`fluxos/_teststand/`)

Leem `N8N_API_KEY` e `IACHAT_TEST_SECRET` do ambiente ou do `.env` da raiz.

| Script | Para quê |
|---|---|
| `harness.js` | base: POST no ingress + captura da execução + `digest()` |
| `bateria_completa_a.js` | **Fase A** — 17 determinísticos |
| `bateria_completa_b.js` | **Fase B** — 29 dependentes do LLM |
| `jornada_usuario.js` | **jornada contínua**, sem semear estado — achou os dois P0 |
| `testa_cadastro_nome.js` | validação de nome, encadeando Triagem → Etapa de Cadastro |
| `experimento_a1.js` | C1/C15 com baseline e variantes |
| `mede_c8_teto_a1.js` | C8 — teto de palavras do A1, por distribuição |
| `regressao_v7.4.js` | regressão offline dos nós de código |
| `publica_v8.js` | **único** caminho autorizado de publicação; alvo cravado no v8 |
| `gate_vivo_v8.js` | gate ao vivo — uma mensagem pelo ingress do v8 (**só cobre onboarding**) |
| `vivo_explicacao_banco.js` | os dois caminhos da explicação, ao vivo |
| `mede_professor_v8.js` | latência banco × modelo |
| `testa_abre_alas_professor.js` · `testa_explicacao_do_banco.js` · `testa_decompoe_latencia.js` | offline, dentro do `npm run gate` |
| `conteudo/extrai_track.js` · `valida_track.js` | TRACK do fluxo → `track.json`, e a prova de que são a mesma verdade |
| `conteudo/gerar_explicacoes.js` | gera os 60 `.md` com Gemini 2.5 Pro (ADC, projeto `agent-hackton`) |
| `conteudo/valida_explicacoes.js` · `simula_vazamento.js` | validação de conteúdo e a simulação do detector |
| `conteudo/seed_explicacoes.js` · `confere_explicacoes_db.js` | `.md` → Postgres, e a conferência |
| `conteudo/extrai_questoes.js` | retrato versionado das questões (`--conferir` bate contra o banco) |
| `analisa_latencia.js` | L1 por rota, a partir das execuções gravadas |
| `mede_latencia_real.js` | L1 com `chat_id` real (**envia mensagens de verdade**) |
| `revalida_personas.js` / `revalida_niveis.js` | PS3/PS4 · C5/C6 |
| `teste_concorrencia.js` / `teste_entrada_gigante.js` | X5 · R1 |
| `dryrun_nudge.js` | C13 sem enviar mensagem |
| `set_telegram_commands.js` | registra o menu (`setMyCommands`) |
| `db/cleanup_test_users.js` | limpeza, dry-run por padrão |

---

## 10. Como reproduzir

### Testar sem Telegram real

`POST http://localhost:5678/webhook/iachat-test` com um update do Telegram no corpo (o
`TEST Shim` faz `item.json.body`). **Exige o header `x-iachat-test`** com o valor de
`IACHAT_TEST_SECRET` — sem ele o n8n responde 403 (teste S1).

O fluxo processa e **tenta enviar ao Telegram**; com `chatId` sintético o envio falha (400), mas
todos os nós a montante rodam. A resposta é lida de
`GET /api/v1/executions/{id}?includeData=true`.

**Filtre a execução pelo `user_id` do corpo**, nunca pegue "a mais nova": há execuções
concorrentes e órfãs. E não re-poste o mesmo webhook (processamento duplo → desync).

### Callbacks úteis

`pl_start_A1` … `pl_start_B2` · `ans_A` … `ans_D` · `pl_pause` / `pl_resume` ·
`persona_buddy` / `persona_coach` / `persona_comedian` / `persona_debater` / `persona_formal` ·
`int_open` / `int_games` / `int_music` / `int_other` / `int_done` ·
`mode_chat` / `mode_teacher` · `t_start` / `t_doubt` / `t_next` / `t_resume` · `cfg_open`

### Chegar a um nível específico

1. **Dirigindo o placement real** — adaptativo: 2 acertos seguidos sobem, 2 erros descem, clamp
   A1–C2. Respostas do seed em `db/migrations/005_v6_seed_exam.sql`.
2. **Semeando no banco** — é o que a Fase B faz (`semear()`), com as personas P1–P8. Muito mais
   barato: passar por onboarding + nivelamento custa ~13 chamadas de LLM por teste.

---

## 11. Evidência preservada

Não apague, não são regeneráveis:

- `MEDICOES_*.md`, `INVESTIGACAO_PERSONA_A1_2026-08-19.md` — medições de agosto
- `PLANO_v8_2026-09-04.md` — registro detalhado da bateria de 04/09
- `documentos/transcricoes/` — transcrições brutas
- `documentos/Resultado dos testes.txt` / `.pdf` — notas cruas do avaliador, fonte primária
- `CHANGELOG_v7.*.md` — histórico das versões
- `tr_bateria_a.md` / `tr_bateria_b.md` — vereditos das duas fases ao vivo
- `tr_jornada.md` — a conversa da jornada de usuário, como o aluno a veria
- `tr_experimento_a1.md` / `tr_experimento_persona.md` — experimentos com baseline e reversão
- `_teststand/backup_live_v7.4_2026-09-04T14-47-04.json` — o live **antes** dos dois P0

### Descoberta metodológica que vale manter

Em 13/07 três testes foram excluídos do roteiro por dificuldade de execução. Dois foram
recuperados em 19/08 e **os dois acharam defeito na primeira execução**: o X5 expôs 50% de perda
de escrita no menu de interesses; o R1 mostrou que nada truncava a entrada.

Em 04/09 a mesma lição voltou de outro jeito: **a bateria inteira estava verde e um usuário
comum achou dois defeitos P0 em dez minutos**, porque nenhum teste percorria as transições do
fluxo.

**Teste descartado é dívida, não escopo resolvido.**
