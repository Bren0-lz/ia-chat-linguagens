# HANDOFF — IAChat

> **Estado em 24/08/2026.** Este é o **único** handoff do projeto: em vez de criar um arquivo
> datado por sessão, atualize este. A proliferação de handoffs datados foi justamente o que
> gerou documentos contraditórios em julho e agosto.
>
> Leia isto primeiro. Depois: `PLANO_2026-08-24.md` (o que fazer a seguir) e
> `TESTES_DIAGNOSTICOS.md` (o roteiro completo dos testes).

---

## 1. TL;DR — onde estamos

| | |
|---|---|
| **Fluxo ativo** | `IAChat_Telegram_v7.4` — n8n id `9MA0o1XJjD33BnKc`, **97 nós** |
| **Arquivo de edição** | `fluxos/IAChat_Telegram_v7.4.json` |
| **Nudge** | `IAChat_Nudge_Retencao_v1` — id `DBF6NoEXRXrHAy85`, **DESATIVADO** de propósito |
| **Modelos** | `openai/gpt-oss-120b` (Conversa, Professor, Dúvida), `openai/gpt-oss-20b` (Extrator), `whisper-large-v3` |
| **Banco** | Postgres em `127.0.0.1:5433` (Docker, container `iachat-pg`), 13 migrations |
| **Regressão offline** | `node fluxos/_teststand/regressao_v7.4.js` |
| **Bateria Fase A** | **16/16** (determinísticos) |
| **Bateria Fase B** | escrita, 29 testes; 4 já verdes, 25 esperando cota |

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

### Bateria Fase B — escrita, parcialmente executada

`node fluxos/_teststand/bateria_completa_b.js` cobre 29 testes: A5, C1–C4, C7, C9, C10, C12,
C14–C17, T1–T4, T6, T8, T9, T12–T17, PS1, R4, R5.

**Quatro não tocam o LLM e já passaram:** A5, PS1, C16, C17. O C17 confirma que a blindagem
anti-fantasma funciona — a chave crua `travel`, que vazou da inferência no bug histórico, é
removida do campo manual enquanto os interesses legítimos sobrevivem.

Os outros 25 **nunca rodaram** — dependem de cota. A primeira execução real vai revelar
assertivas mal calibradas; a Fase A precisou de três rodadas para assentar.

Flags úteis: `--only=C1,C3` (subconjunto), `--from=T1` (retomar), `PACE=4000` (mais devagar).

---

## 3. Três classes de veredito — e por que isso importa

A Fase B distingue deliberadamente:

| Classe | Significado |
|---|---|
| **AUTO** (22 testes) | Asserção objetiva: formato, idioma, estado no banco, gate |
| **REVISAR** (7 testes) | A saída é capturada na transcrição com a rubrica ao lado, para leitura humana. **Não é aprovação nem falha.** |
| **INCONCLUSIVO** | O LLM não respondeu. **Nunca vira PASSOU.** |

Os 7 de REVISAR (C9, C10, C14, T1, T2, T8, T9, T17) são qualidade pedagógica e tom. Regex não
julga isso, e inventar veredito automático produziria o mesmo falso PASSOU que já apareceu duas
vezes neste projeto. **Isso é honestidade sobre o que é medível, não uma lacuna a fechar.**

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

- **Cota da Groq (plano gratuito):** interrompeu duas medições em dois dias com um único
  usuário. Some sozinha depois de algumas horas.
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
| `harness.js` | base: POST no ingress + captura da execução + `digest()` |
| `bateria_completa_a.js` | **Fase A** (16 determinísticos, sem cota) |
| `bateria_completa_b.js` | **Fase B** (29 dependentes do LLM) |
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

- **Commits sem atribuição a ferramenta.** O histórico registra só a autoria do dono do
  projeto. Sem `Co-Authored-By`, sem trailer de sessão, sem menção a assistente.
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

Detalhe completo em **`PLANO_2026-08-24.md`**. Resumo da ordem:

| # | Item | Bloqueado por |
|---|---|---|
| 1 | **Menu de comandos do Telegram** — script pronto | `TELEGRAM_BOT_TOKEN` no `.env` |
| 2 | **Plano pago da Groq** | decisão |
| 3 | **Rodar a Fase B** (25 testes restantes) | cota (§2) |
| 4 | Pendências com diagnóstico pronto | cota, em parte |
| 5 | **Hospedagem** | decisão |

### Pendências com diagnóstico pronto

| Item | Estado |
|---|---|
| Persona no A1 (PS3/PS4) | 3 hipóteses refutadas, 1 inconclusiva (n=4: 0,250 ± 0,132) |
| C1/C6 — forma telegráfica no A1 | aberto desde a v7.2, **nunca investigado** |
| Cauda de latência (L1) | causa identificada (entrega ao Telegram, 24,6s num turno); frequência desconhecida, n=6 |
| C13 — envio real do nudge | tudo verificado menos o envio |
| S3 | **nunca executado** |

### O menu de comandos, em uma linha

Nenhum fluxo chama `setMyCommands`: o `Roteador Mestre` trata **19** comandos, o `/help` lista
**9**, e o Telegram mostra **0**. O script registra os 11 canônicos. Falta só o token.

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

### Descoberta metodológica que vale manter

Em 13/07 três testes foram **excluídos** do roteiro por dificuldade de execução (X5, R1 e
outros). Dois foram recuperados em 19/08 e **os dois acharam defeito na primeira execução**: o
X5 expôs 50% de perda de escrita no menu de interesses; o R1 mostrou que nada truncava a
entrada, com prompt chegando a ~80 KB.

**Teste descartado é dívida, não escopo resolvido.** Os que continuam fora (B4, C11, L3) seguem
sem respaldo experimental.
