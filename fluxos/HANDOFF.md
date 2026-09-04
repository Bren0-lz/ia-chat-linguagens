# HANDOFF — IAChat

> **Estado em 04/09/2026.** Este é o **único** handoff do projeto: em vez de criar um arquivo
> datado por sessão, atualize este. A proliferação de handoffs datados foi justamente o que
> gerou documentos contraditórios em julho e agosto.
>
> Leia isto primeiro. Depois: `PLANO_v8_2026-09-04.md` (o que fazer a seguir) e
> `TESTES_DIAGNOSTICOS.md` (o roteiro completo dos testes).

---

## 1. TL;DR — onde estamos

| | |
|---|---|
| **Fluxo ativo** | `IAChat_Telegram_v7.4` — n8n id `9MA0o1XJjD33BnKc`, **101 nós** (publicado em 04/09 com a validação de nome) |
| **Arquivo de edição** | `fluxos/IAChat_Telegram_v7.4.json` — **arquivo e live estão iguais** |
| **Nudge** | `IAChat_Nudge_Retencao_v1` — id `DBF6NoEXRXrHAy85`, **DESATIVADO** de propósito |
| **Modelos** | **Gemini desde 03/09**: `gemini-2.5-flash` (Conversa, Professor, Dúvida), `gemini-2.5-flash-lite` (Extrator, Validar Nome). Áudio segue na Groq: `whisper-large-v3` |
| **Banco** | Postgres em `127.0.0.1:5433` (Docker, container `iachat-pg`), 13 migrations |
| **Regressão offline** | `node fluxos/_teststand/regressao_v7.4.js` |
| **Bateria Fase A** | **16/16** (determinísticos) — reconfirmado em 04/09 |
| **Bateria Fase B** | **rodou inteira**: 16 passaram · 2 falharam (C1, C15) · 11 para revisar · 0 inconclusivos |
| **Jornada de usuário** | `jornada_usuario.js` — achou 2 defeitos P0 que as duas fases não veem |
| **Latência (L1)** | fechado com n=80: média **4,83 s**, p90 **11,59 s**; infra ≤0,48 s, todo o custo é LLM |

**A cota da Groq deixou de ser gargalo.** Depois da migração para o Vertex, da Groq sobrou só o
Whisper. Qualquer documento que trate "plano pago da Groq" como desbloqueador está velho.

**Nunca deixe duas versões ativas** — v7.2, v7.3 e v7.4 usam o mesmo `webhookId`
(`telegram-iachat-webhook`).

---

## 2. O que está fechado

### Bateria Fase A — 16/16

`node fluxos/_teststand/bateria_completa_a.js` cobre A1 A2 A3 A4 A6 A8 · B1 B3 B5 B6 ·
X1 X2 X3 · R2 R3 S1. Não consome cota da Groq.

Dos 11 testes que nunca haviam rodado, **todos passam**. O nivelamento adaptativo funciona nas
duas direções, o estado sobrevive à troca de modo e a 7 dias de inatividade, e o S1 confirma o
ingress de teste devolvendo 403 sem header.

**Consequência para a leitura do risco:** nas revalidações de 18–19/08 *todos* os testes
mudaram de veredito, o que sugeria que os demais estariam podres. No bloco determinístico isso
**não** se repetiu. A fragilidade está concentrada nas rotas que dependem do LLM.

### Bateria Fase B — executada por inteiro

`node fluxos/_teststand/bateria_completa_b.js` cobre 29 testes: A5, C1–C4, C7, C9, C10, C12,
C14–C17, T1–T4, T6, T8, T9, T12–T17, PS1, R4, R5.

Rodou inteira **duas vezes** (03/09 e 04/09), com o mesmo desenho de resultado — os vereditos
são estáveis, não ruído de amostragem:

| | |
|---|---|
| Passaram | **16** |
| Falharam | **2** — C1 e C15, os dois em A1 |
| Para revisar (leitura humana) | **11** |
| Inconclusivos | **0** — o LLM respondeu em todos os turnos |

**C1 e C15 estão diagnosticados, não em aberto.** A própria bateria contém o controle: no mesmo
nível e mesma persona, um erro que **está** na lista `ERROS QUE CONTAM` é corrigido (C3 passa) e
um que **não está** não é (C1 falha, 0/9 acumulado). A jornada acrescentou que no nível **C1** o
mesmo erro fora da lista **é** corrigido — ou seja, a lista fechada só limita em A1. Hipótese
(n=1 em C1): saturação de restrições no prompt A1. O experimento está no `PLANO_v8`.

**T15 fechou.** Em 03/09 a Fase B rodou às 19:11 e o fix do `answersMatch` só foi publicado às
20:18 — por isso ela mediu o comportamento antigo. Em 04/09, com o fix no ar, `"haves"` para o
gabarito `"have"` é corretamente recusado.

Flags úteis: `--only=C1,C3` (subconjunto), `--from=T1` (retomar), `PACE=4000` (mais devagar).

### Jornada de usuário — o que as duas fases não veem

`node fluxos/_teststand/jornada_usuario.js` percorre o produto inteiro na ordem, sem semear
estado: primeiro contato → nivelamento → persona → interesses → conversa → professor → comandos.

Achou **os dois defeitos P0 de 04/09**, ambos com 45 testes verdes ao lado. O padrão importa
mais que os defeitos: as duas fases semeiam estado direto no banco para poupar chamadas, e com
isso **pulam as transições do fluxo** — que é exatamente onde os dois estavam.

---

## 3. Três classes de veredito — e por que isso importa

A Fase B distingue deliberadamente:

| Classe | Significado |
|---|---|
| **AUTO** (18 testes) | Asserção objetiva: formato, idioma, estado no banco, gate |
| **REVISAR** (11 testes) | A saída é capturada na transcrição com a rubrica ao lado, para leitura humana. **Não é aprovação nem falha.** |
| **INCONCLUSIVO** | O LLM não respondeu. **Nunca vira PASSOU.** |

Os 11 de REVISAR (C2, C9, C10, C14, R4, T1, T2, T8, T9, T15, T17) são qualidade pedagógica e
tom. Regex não julga isso, e inventar veredito automático produziria o mesmo falso PASSOU que já
apareceu duas vezes neste projeto. **Isso é honestidade sobre o que é medível, não uma lacuna a
fechar.**

**O T15 pode sair de REVISAR:** o comportamento desejado (recusar `"haves"` para `"have"`) está
confirmado ao vivo desde 04/09, então ele virou asserção objetiva.

---

## 4. Armadilhas já pagas — NÃO repetir

As dez primeiras vêm das sessões de julho e agosto; as duas últimas são de 24/08.

1. **Resposta vazia não é aprovação.** Testes de negativa ("não revelou o gabarito") passam
   trivialmente quando o bot não responde. Gerou dois falsos PASSOU enquanto a Groq dava 404.
   Hoje o guard da Fase B torna isso impossível por construção.
2. **Duração total de execução não mede latência.** O `chat_id` sintético faz o envio falhar e
   o retry injeta 7–27s em qualquer turno. Meça `executionTime` **por nó** e descarte os nós de
   envio.
3. **Não rotule o turno pela ordem de envio.** Há corrida entre semear o `mode` e o fluxo
   anterior gravando estado. Classifique pelo que o `Roteador Mestre` registrou.
4. **Perda determinística não é corrida.** Sempre o mesmo item se perdendo indica outra causa —
   foi assim que apareceu a falta de idempotência sob `retryOnFail`.
5. **Detector de correção precisa cobrir a forma curta.** O teto de 18 palavras do A1 força
   `"We say 'are', not 'is'"`; regex só com a forma longa dá falso negativo.
6. **`msg_count` não detecta corrida** — o incremento é feito no SQL e é atômico.
7. **Controle sequencial precisa de ≥12s de espaçamento**, senão ele próprio fica sobreposto.
8. **Localizar a repetição não é localizar a causa.** A pergunta final do A1 era 3,5x mais
   repetida que a do B1; liberá-la não moveu o número.
9. **Sempre abrir a transcrição antes de reportar.** Todo falso resultado destas sessões
   sobreviveu ao agregado e morreu na evidência bruta.
10. **ID alto não significa usuário de teste.** IDs reais do Telegram têm 10 dígitos. O engano
    apareceu em dois lugares: o cleanup **apagaria** contas reais e o nudge as **ignorava**.
11. **Base suja faz o teste medir resíduo, não o fluxo.** O `bateria_completa_a.js` usava
    `uidSeq` fixo e herdava os usuários da rodada anterior. O efeito não era falhar: o A1
    reprovou reportando `nome=Lucas idade=16` — valores corretos, gravados na semana anterior.
    Um falso positivo escondido dentro de uma reprovação. **Corrigido:** o ID vem do relógio.
    Se escrever um script novo, derive o ID igual — e mantenha na faixa `990000000–999999999`,
    que é a que o `cleanup_test_users.js` apaga.
12. **Teste que sorteia a própria condição mede sorte.** O B6 exigia que texto sem sentido não
    avançasse a questão. Em múltipla escolha o motor rejeita corretamente; em resposta livre ele
    não tem como separar nonsense de erro. Como o pool A1 tem 6 MC e 4 written, o teste
    reprovava em ~40% das rodadas. **Corrigido:** o teste força MC.
13. **O instrumento pode julgar a string errada.** O `digest()` montava o texto da dúvida a
    partir do **`Agente Dúvida`**, que roda ANTES do `Filtro Anti-Spoiler`. Consomem esse campo o
    `smoke.js` (teste "PR5 dúvida NÃO revela o gabarito"), o `bateria_critica.js` (que cobre
    **T7 e R6**), `teste_gate_frase.js`, `teste_gate_nova_questao.js` e `tick.js` — ou seja, a
    proteção que de fato chega ao aluno **nunca foi validada ao vivo**, só por unitário offline.
    Ao vivo esses testes davam alarme falso, ou passavam sem exercitar o filtro. **Corrigido:**
    o `digest()` prefere a saída do filtro e expõe `duvidaCrua` à parte.
14. **Resposta "vazia" pode ser cegueira do digest, não silêncio do bot.** `Etapa de Modo`
    publica em `confirm` (não `reply`/`text`), e `Mensagem Sistema` e `Interests Engine` não eram
    lidos — então troca de modo, `/help` e menu de interesses apareciam como vazio. É a armadilha
    nº 1 embutida no instrumento. **Corrigido**, mas o texto de nós Telegram estáticos (ex.:
    `Enviar Menu`) continua invisível por construção: confira na execução antes de acusar.
15. **Turno iniciado por CALLBACK precisa de ~35 s de espaçamento**, não os 12 s da nº 7. O
    `Responder Callback` também é nó Telegram e entra em retry com o callback sintético,
    atrasando toda a escrita a jusante. Em 04/09 isso fez um teste de interesse personalizado
    parecer falhar: o `int_await_ts` gravado marcava `14:50:31` e a execução seguinte começou
    `14:50:18` — leu o aluno 13 s **antes** da escrita existir. **Sempre confira o relógio do
    campo gravado contra o `startedAt` da execução antes de culpar o produto.**

---

## 5. Ambiente — o que quebra

### `WEBHOOK_URL` (o mais caro de todos)

Sem `WEBHOOK_URL` no ambiente do processo, o n8n oferece `http://localhost:5678/` ao Telegram,
que **recusa não-HTTPS**. A falha derruba a **ativação inteira do workflow** e leva junto o
`TEST Ingress`, que nem depende do Telegram — o sintoma é 404 em *todos* os webhooks, com o
workflow marcado `active: true` no banco.

Subir assim, tudo na **mesma** janela:

```powershell
$env:WEBHOOK_URL="https://SUA-URL.ngrok-free.dev"
$env:N8N_PROTOCOL="https"
$env:N8N_HOST="SUA-URL.ngrok-free.dev"
npx n8n
```

A URL do ngrok muda a cada restart do túnel no plano gratuito, então **isso reincide**. É a
razão de a hospedagem ter subido de prioridade no plano.

Confirme a URL corrente em `http://localhost:4040/api/tunnels`.

### Outros

- ~~**Cota da Groq (plano gratuito)**~~ — **deixou de ser problema em 03/09.** Os quatro agentes
  foram para o Vertex; da Groq sobrou só o Whisper, que uma bateria inteira mal encosta. As duas
  rodadas completas da Fase B em 03 e 04/09 não bateram em cota nenhuma.
- **Docker/Postgres:** quando cai, a conexão **pendura** em vez de recusar — scripts travam
  minutos. Se um teste parar de escrever no log, cheque o Postgres antes do código.
- **Ativação via MCP que falha desativa o workflow.** Mesmo com `rollbackPerformed: false`.
  Confira `active` depois de qualquer update e reative.
- **MCP do n8n:** precisa de `WEBHOOK_SECURITY_MODE=moderate` no env do servidor, lido no
  startup.

---

## 6. Ferramental (`fluxos/_teststand/`)

Todos leem `N8N_API_KEY` do ambiente ou do `.env` da raiz, e o `IACHAT_TEST_SECRET` do `.env`.

| Script | Para quê |
|---|---|
| `harness.js` | base: POST no ingress + captura da execução + `digest()`. Lê `N8N_API_KEY` do `.env` ou do ambiente |
| `bateria_completa_a.js` | **Fase A** (16 determinísticos) |
| `bateria_completa_b.js` | **Fase B** (29 dependentes do LLM) |
| `jornada_usuario.js` | **jornada contínua**, sem semear estado — achou os dois P0 de 04/09 |
| `testa_cadastro_nome.js` | A2 com entradas reais: saudação, palavra comum, palavrão, leet |
| `mede_c8_teto_a1.js` | C8 — teto de palavras do A1, por distribuição (média, desvio, estouros) |
| `set_telegram_commands.js` | registra o menu de comandos (`setMyCommands`) |
| `regressao_v7.4.js` | regressão offline; faz parse dos nós de código |
| `revalida_personas.js` | PS3/PS4 com N repetições, média e desvio |
| `revalida_niveis.js` | C5/C6 — idioma e coerência por nível |
| `teste_concorrencia.js` | X5 — perda de escrita sob concorrência |
| `teste_entrada_gigante.js` | R1 |
| `mede_latencia_real.js` | L1 com `chat_id` real (**envia mensagens de verdade**) |
| `analisa_latencia.js` | L1 por rota, a partir das execuções gravadas |
| `dryrun_nudge.js` | C13 sem enviar mensagem |
| `db/cleanup_test_users.js` | limpeza, dry-run por padrão |

---

## 7. Convenções acertadas

- **Commits COM atribuição** (`Co-Authored-By` + `Claude-Session`). A regra mudou no commit
  `125fd88`: os anteriores não têm os trailers, os de 03/09 em diante têm. Esta linha dizia o
  contrário até 04/09 e contradizia o próprio histórico — se a decisão for voltar a não atribuir,
  mude aqui **e** avise, senão a divergência volta.
- **Não publicar nem ativar sem pedido explícito.** Vale para ativar workflow, `git push` e
  qualquer coisa que mande mensagem real no Telegram.
- **Protocolo de experimento no fluxo ao vivo:** baseline com N=3 → alterar **uma** linha →
  medir → **reverter** → conferir com `git diff`. Nunca reverter com rodada em voo.
- **Nunca editar o fluxo com bateria rodando** — contamina a medição.
- **Limpar usuários de teste ao fim:** `node db/cleanup_test_users.js --apply`.
- **Validar sintaxe antes de publicar** (`node --check`) — uma edição já subiu quebrada para
  produção por um `}` removido sem querer.
- **`/reset` e `/resetfull` ficam no fluxo.** Decisão de 24/08. Estão desligados por
  `DEV_COMMANDS = false`, o comportamento visível já é o correto, e mantê-los preserva o atalho
  de desenvolvimento.
- **Credenciais não passam pelo assistente.** O token do bot e a chave da API ficam no `.env`
  (ignorado pelo git). O store de credenciais do n8n não deve ser decifrado, mesmo com a
  `encryptionKey` à mão.

---

## 8. O que vem a seguir

Detalhe completo em **`PLANO_v8_2026-09-04.md`**. Resumo da ordem:

| # | Item | Estado |
|---|---|---|
| 1 | Cast do `int_await_ts` (interesse personalizado) | ✅ **feito e publicado em 04/09** |
| 2 | `Etapa de Cadastro` consumir o `nameCheck` | ✅ **feito e publicado em 04/09** |
| 3 | Testes que teriam pego os dois | ✅ escritos; **falta ligá-los à Fase A** |
| 4 | **Sincronizar handoff e roteiro** | este documento; falta o `TESTES_DIAGNOSTICOS.md` |
| 5 | **Menu de comandos do Telegram** | falta `TELEGRAM_BOT_TOKEN` no ambiente do n8n |
| 6 | **Experimento de A1** (C1 e C15) | diagnóstico pronto, experimento desenhado |
| 7 | `professor:intro` — p90 de 17,8 s | só se for inaceitável para o lançamento |
| 8 | Higiene do repo e decisão sobre `web/` | `web/` **não compila** |
| 9 | **Hospedagem** | decisão |

### Pendências com diagnóstico pronto

| Item | Estado |
|---|---|
| **Credencial do `Validar Nome (IA)`** | nó **sem credencial**: a camada 2 fica sempre em fail-open. A camada 1 (que barra as 27 entradas ruins) funciona |
| C1 e C15 no A1 | **causa isolada** — a lista fechada `ERROS QUE CONTAM`. Em C1 (nível) o mesmo erro é corrigido |
| Persona no A1 (PS3/PS4) | 3 hipóteses refutadas, 1 inconclusiva (n=4: 0,250 ± 0,132) |
| Cauda de latência (L1) | **fechado**: n=80, média 4,83 s, p90 11,59 s. O alvo é `professor:intro` |
| C13 — envio real do nudge | tudo verificado menos o envio |
| S3 | **nunca executado** |

### O menu de comandos, em uma linha

Nenhum fluxo chama `setMyCommands`: o `Roteador Mestre` trata **19** comandos, o `/help` lista
**11**, e o Telegram mostra **0**. O `IAChat_SetCommands_oneshot.json` faz o trabalho (getMe →
diff → aplicar → conferir, com ramo dry-run), mas **nunca foi importado no n8n** e usa
`$env.TELEGRAM_BOT_TOKEN`. Basta exportar o token no mesmo bloco de startup que já exporta
`WEBHOOK_URL` — zero código novo.

---

## 9. Como reproduzir (detalhes operacionais)

### Testar sem Telegram real

`POST http://localhost:5678/webhook/iachat-test` com um update do Telegram no corpo (o nó
`TEST Shim` faz `item.json.body`). **Exige o header `x-iachat-test`** com o valor de
`IACHAT_TEST_SECRET` — sem ele o n8n responde 403 (é o teste S1).

O fluxo processa normalmente e **tenta enviar ao Telegram**; com `chatId` sintético esse envio
falha (400), mas todos os nós a montante rodam. A resposta gerada é lida de
`GET /api/v1/executions/{id}?includeData=true` — é o que o `digest()` do harness faz.

**Filtre a execução pelo `user_id` do corpo**, nunca pegue "a mais nova" cegamente: há
execuções concorrentes e órfãs. E não re-poste o mesmo webhook (processamento duplo → desync).

### Callbacks úteis

`pl_start_A1` … `pl_start_B2` · `ans_A` … `ans_D` · `pl_pause` / `pl_resume` ·
`persona_buddy` / `persona_coach` / `persona_comedian` / `persona_debater` / `persona_formal` ·
`int_open` / `int_games` / `int_music` / `int_other` / `int_done` ·
`mode_chat` / `mode_teacher` · `t_start` / `t_doubt` / `t_next` / `t_resume` · `cfg_open`

### Chegar a um nível específico

Duas formas:

1. **Dirigindo o placement real** — o teste é adaptativo (2 acertos seguidos sobem um nível,
   2 erros descem; clamp A1–C2). Para *ficar* num nível, alterne acerto e erro; para *subir*,
   2 acertos e depois alterne. As respostas do seed estão em
   `db/migrations/005_v6_seed_exam.sql`.
2. **Semeando direto no banco** — é o que a Fase B faz (`semear()`), com as personas P1–P8 do
   roteiro. Muito mais barato: passar por onboarding + nivelamento custa ~13 chamadas de LLM
   por teste só para chegar ao ponto de interesse.

---

## 10. Evidência preservada

Não apague, não são regeneráveis:

- `MEDICOES_PERSONAS_2026-08-18.md`, `MEDICOES_NIVEIS_2026-08-19.md`,
  `MEDICOES_LATENCIA_2026-08-19.md`, `INVESTIGACAO_PERSONA_A1_2026-08-19.md`
- `documentos/transcricoes/` — transcrições brutas das medições
- `documentos/Resultado dos testes.txt` / `.pdf` — notas cruas do avaliador, fonte primária
- `CHANGELOG_v7.*.md` — histórico das versões
- `tr_bateria_a.md` / `tr_bateria_b.md` — vereditos das duas fases ao vivo
- `tr_jornada.md` — a conversa inteira da jornada de usuário, do jeito que o aluno a veria
- `tr_experimento_a1.md` / `tr_experimento_persona.md` — os experimentos com baseline e reversão
- `_teststand/backup_live_v7.4_2026-09-04T14-47-04.json` — o live **antes** da publicação dos
  dois P0. É o caminho de volta se algo aparecer depois.

### Descoberta metodológica que vale manter

Em 13/07 três testes foram **excluídos** do roteiro por dificuldade de execução (X5, R1 e
outros). Dois foram recuperados em 19/08 e **os dois acharam defeito na primeira execução**: o
X5 expôs 50% de perda de escrita no menu de interesses; o R1 mostrou que nada truncava a
entrada, com prompt chegando a ~80 KB.

**Teste descartado é dívida, não escopo resolvido.** Os que continuam fora (B4, C11, L3) seguem
sem respaldo experimental.
