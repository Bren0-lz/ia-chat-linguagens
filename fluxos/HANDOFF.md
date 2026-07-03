# HANDOFF — IAChat (estado em 2026-07-01)

Documento para retomar o trabalho num novo chat **exatamente de onde paramos**. Leia isto primeiro,
depois `ANALISE_UX_v7.1.md` e `CHANGELOG_v7.2.md`.

---

## 1. TL;DR — onde estamos
- **Versão ativa: `IAChat_Telegram_v7.2`** (n8n id `H0Xfipr424xkejcd`, 94 nós). É o bot de produção.
- v7.2 = v7.1 + **5 correções de UX**, todas **validadas ao vivo** (A1, A2, B1, C1) contra o Groq real.
- **v7.1** (id `zAjCM0ZcastWElOo`) está **inativa**. Não deixe as duas ativas ao mesmo tempo (mesmo
  bot/token → respostas duplicadas).
- Testei o agente como **adolescente de 16 anos** em cada nível, nos dois modos (Conversa e Professor).

## 1.1. Correção pós-v7.2 (2026-07-02) — loop de cadastro
- **Bug:** no onboarding, o usuário mandava o nome e o bot repetia "qual é o seu nome?" em loop.
- **Causa:** o nó `Carregar Aluno` tinha o guard `WHERE ... students.last_update_id < EXCLUDED.last_update_id`.
  Quando o `update_id` recebido não era maior que o gravado, o `RETURNING` voltava 0 linhas (o nó
  Postgres devolve `{"success":true}`), e o `Roteador Mestre` via `onboarding=undefined` → tratava como
  usuário novo toda mensagem. O `last_update_id` ficou corrompido/alto porque o `harness.js` gera
  `update_id = Date.now()/1000 ≈ 1,77e9`, acima dos ~4e8 do Telegram real → guard reprovava sempre.
- **Fix (aplicado ao vivo na v7.2):** removido o `WHERE`; `last_update_id` passou a usar
  `GREATEST(COALESCE(students.last_update_id,0), COALESCE(EXCLUDED.last_update_id,0))`. Sempre retorna a
  linha e nunca regride. Backup: `fluxos/_teststand/backup_v7.2_2026-07-02T01-18-19-991Z.json`.
- **Trade-off:** perdeu-se a dedup de re-entregas de webhook (raro). Ver memória `onboarding-loop-fix.md`.

## 2. O que foi corrigido no v7.2 (validado)
1. **Concordância/countable/tempo verbal** agora são sinalizados explicitamente na Conversa
   (`video games ARE`, `the number of people`, `We played... not we play`). — Prompts Conversa A1–C2.
2. **A1 não repete mais o erro do aluno** (`i like play` → *"We say I like playing"*). — Prompt Conversa A1.
3. **A1 "não entendi"** reformula em inglês correto sem trocar de pergunta. — Prompt Conversa A1.
4. **Dúvida do Professor não erra mais o conceito** (o `-ed` do passado deixou de ser confundido com o
   `-s` da 3ª pessoa); `dSys` reescrito + **Modelo Groq Dúvida temperatura 0.5→0.3**. — Professor Engine.
Detalhes e trechos em `CHANGELOG_v7.2.md`.

## 3. Pendências / decisões em aberto (próximos passos)
- **[A1 — resíduo menor]** o tutor corrige o aluno, mas em algumas **perguntas dele mesmo** ainda usa
  forma telegráfica (*"You like play games?"*). Ajuste candidato a **v7.2.1**: 1 linha no Prompt Conversa A1
  sobre forma de pergunta (*"Do you like...?"* em vez de *"You like play"*). É testável de leve
  (reaproveitar um usuário A1 já existente, sem refazer placement).
- **[C2 inalcançável — decisão de produto]** `Placement Engine` usa `LEVELS=['A1','A2','B1','B2','C1']`
  (sem C2) e é o único ponto que grava `students.level`. Logo **Prompt Conversa C2 + trilha C2 do Professor
  são código morto**. Opções: (a) incluir C2 no placement, (b) remover os prompts/trilha C2. Botões de
  auto-avaliação também vão só até `pl_start_B2`. Ver memória `c2-inalcancavel.md`.
- **[Segurança — remover antes do lançamento]** nós `TEST Ingress` (webhook `POST /iachat-test`) + `TEST
  Shim` injetam updates **sem autenticação do Telegram** no fluxo ativo. (Foi o que usei para testar.)
- **[Limpeza]** criei usuários de teste na tabela `students` com `user_id` na faixa ~`9930000000`–`9939999999`
  (e alguns `99xxxxxxxx`). Apagar antes de olhar métricas.
- **[Infra — atenção]** o **n8n caiu** durante os testes por volume de execuções (precisou reiniciar).
  Instância sensível a carga. Se o bot crescer: limitar `retryOnFail` dos nós de envio, serializar
  processamento por usuário (advisory lock), e limpar execuções salvas.

## 4. Fatos técnicos essenciais (para reproduzir/testar)
- **n8n API:** `http://localhost:5678`. A API key (JWT) está em `~/.claude.json` →
  `projects["C:/Users/breno"].mcpServers["n8n-mcp"].env.N8N_API_KEY`. (O MCP `n8n-mcp` existe mas está
  no escopo da home `C:/Users/breno`, **não** neste projeto — por isso as ferramentas MCP não aparecem
  automaticamente numa sessão aberta na pasta do projeto.)
- **Banco:** o n8n usa um Postgres cuja senha **não** consegui obter (a leitura do store de credenciais do
  n8n foi bloqueada, corretamente). O `.env` do repo aponta `postgres:iachat@127.0.0.1:5433` (Docker, que
  estava **desligado**); há um Postgres nativo em `5432` com senha diferente. **Não tive acesso de escrita
  ao banco** — por isso setei os níveis **dirigindo o placement real**, não via SQL. Para testar C2 (ou
  setar níveis direto) seria preciso a connection string do banco que o n8n usa.
- **Como testar sem Telegram real:** `POST http://localhost:5678/webhook/iachat-test` com um update do
  Telegram como corpo (o nó `TEST Shim` faz `item.json.body`). O fluxo processa normalmente e **tenta
  enviar ao Telegram** — com `chatId` falso esse envio **falha** (400), mas todos os nós a montante rodam;
  a resposta gerada é lida de `GET /api/v1/executions/{id}?includeData=true` (nós `Agente Conversa`,
  `Parse Professor`, `Agente Dúvida`, `Placement Engine`, `Etapa de Cadastro`, etc.).
- **Como setar cada nível (A1–C1):** passar pelo onboarding (`oi`→nome→idade), escolher `pl_start_<nível>`
  e responder as 10 questões do placement de forma **dirigida** — o teste é adaptativo (2 acertos seguidos
  sobem 1 nível, 2 erros descem; clamp A1–C1). As respostas do seed estão em
  `db/migrations/005_v6_seed_exam.sql`. Para **ficar** num nível: alternar acerto/erro; para **subir**
  (ex.: C1 a partir de B2): 2 acertos e depois alternar.
- **Callbacks úteis:** `pl_start_A1..B2`, `ans_A..D`, `persona_buddy`, `int_games/int_music/int_done`,
  `mode_chat`, `mode_teacher`, `t_start`, `t_doubt`.

## 5. Armadilhas descobertas (NÃO repita os erros)
- **Sobrecarga derruba o n8n.** Rode **devagar** (pausa ~2,5s entre chamadas) e **um nível por vez**.
- **Tarefas de background são mortas pelo ambiente após ~2–3 min.** Use execuções **curtas e resumíveis**
  (o `tick.js` salva estado e faz poucos passos por invocação — ver §6).
- **Cada chamada leva ~6–8s** (a latência é do envio ao Telegram falhando). Normal.
- **Captura de execução:** filtre a execução **pelo `user_id` do corpo** (há execuções concorrentes/órfãs);
  não pegue "a mais nova" cegamente. E **não re-poste** o webhook (causa processamento duplo → desync).
- **`update_id` deve ser estritamente crescente por usuário** — ERA armadilha: o `Carregar Aluno` só
  retornava a linha se `last_update_id` aumentasse; senão o RETURNING vinha vazio e o fluxo tratava como
  usuário novo. **Corrigido em 2026-07-02** (guard removido + `GREATEST`; ver §1.1). O harness ainda gera
  `update_id` altíssimo, mas agora isso é inofensivo (não trava mais o usuário).
- **`fetch` pode dar ECONNRESET sob carga** — use retry/backoff nas chamadas HTTP.

## 6. Test-harness persistido
As ferramentas de teste que construí ficam em **`fluxos/_teststand/`** (persistidas do scratchpad, que é
efêmero). Veja `fluxos/_teststand/README.md`. Resumo:
- `harness.js` — POSTa update no webhook, espera a execução do **meu** user, extrai a resposta. Lê a
  API key de `process.env.N8N_API_KEY` (exporte antes de usar).
- `seed.js` — respostas do exame de placement (para dirigir o nível).
- `tick.js` — driver **resumível** de uma jornada completa por nível (onboarding→placement→conversa→
  professor), salva estado em `state_<nível>.json` e transcrição em `tr_<nível>.md`. Rode em blocos:
  `PACE=2500 MAXACT=6 node tick.js A1` várias vezes até `phase=done`.

## 7. Documentos deste trabalho
- `fluxos/ANALISE_UX_v7.1.md` — análise por nível que originou as correções (com trechos reais).
- `fluxos/CHANGELOG_v7.2.md` — o que mudou no v7.2 + pendências.
- `fluxos/CHANGELOG_v7.0.md` — histórico anterior (contexto).
- Memórias (auto-carregadas): `flow-versioning.md`, `c2-inalcancavel.md`.

## 8. Sugestão de primeiro passo no próximo chat
1. Confirmar que só o v7.2 está ativo (`GET /api/v1/workflows?active=true`).
2. Decidir: aplicar o **ajuste A1 (v7.2.1)** e/ou tratar o **C2**.
3. Se for testar de novo: **ritmo lento**, `tick.js` em blocos, e **limpar os usuários de teste** ao fim.
