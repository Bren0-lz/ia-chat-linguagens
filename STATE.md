# Estado do loop

- **Tarefa atual:** T004
- **Última concluída:** T003
- **Tentativas na atual:** 0/3
- **Bloqueios:** nenhum

## Ambiente (checar antes de tarefas marcadas "Precisa de ambiente")

| | Estado em 05/09/2026 |
|---|---|
| Postgres `127.0.0.1:5433` | **NO AR** — container `iachat-pg`, porta aberta |
| n8n `localhost:5678` | **NO AR** (ngrok na 4040 também) |
| Fluxo ao vivo | `IAChat_Telegram_v7.4` ativo, id `9MA0o1XJjD33BnKc`, 101 nós — **não mexer** |
| Fluxo v8 no n8n | `PbwEf7L9xEXhJaCg`, **ativo** em paralelo ao v7.4; ingress `iachat-test-v8`, Gatilho Telegram desabilitado |

## Diário

<!-- Uma linha por evento. O implementer lê isto: registre descobertas que
     mudam tarefas futuras, não narrativa. -->
- 2026-09-05 Estrutura autodev instalada. Gate: `npm run gate` (~7 s, offline).
- 2026-09-05 `fluxos/IAChat_Telegram_v8.json` criado a partir do v7.4 (101 nós). Todo trabalho vai para ele.
- 2026-09-05 `v7.4.json` congelado na tag git `v7.4-congelado`; o gate reprova qualquer alteração nele.
- 2026-09-05 `testa_nome_camada1.js` passou a aceitar o caminho do fluxo por `argv[2]` (antes: absoluto, fixo no v7.4).
- 2026-09-05 Ambiente conferido: Postgres 5433, n8n 5678 e ngrok 4040 no ar; nenhum workflow v8 no n8n.
- 2026-09-05 Plano da v8 aprovado: T001–T012 no PLAN.md. Livros WAYS fora de escopo por ora (conversão por fora).
- 2026-09-05 T001 DONE. Gate ao vivo: `node fluxos/_teststand/gate_vivo_v8.js` (exit 0/1). Provado que reprova: 404, resposta vazia e rota ausente.
- 2026-09-05 O harness le `IACHAT_TEST_PATH` (default `iachat-test`). Setar a env **antes** do `require('./harness')` — o WEBHOOK e calculado em tempo de carga.
- 2026-09-05 Cada rodada do gate ao vivo cria um usuario 99xxxxxxx. Rodar `node db/cleanup_test_users.js --apply` ao fim de cada bloco.
- 2026-09-05 A tag `v7.4-congelado` aponta para 929f5d4, que ja inclui a mudanca do Vertex — e o arquivo bate byte a byte com o workflow vivo do bot. A base congelada nao e a de 18/08.
- 2026-09-05 T002 DONE. Republicar e obrigatorio: `node fluxos/_teststand/publica_v8.js` (alvo cravado no v8, aborta se o arquivo puder roubar o bot).
- 2026-09-05 `Professor Engine` agora publica `topicNum`/`topicTot` no `out` — T003/T008 consomem em vez de recalcular.
- 2026-09-05 Envio condicional sem no IF: o no devolve `[]` e o ramo morre. Criterio do abre-alas e `llmTask === 'explain'` (cobre explain e advance). Padrao reutilizavel no T008.
- 2026-09-05 `executionOrder: v1` ordena ramos por `y` no canvas (menor y roda primeiro), ignorando a ordem do `connections`. O teste do abre-alas amarra essa invariante — arrastar no no canvas quebra o gate em vez de degradar em silencio.
- 2026-09-05 DIVIDA: `gate_vivo_v8.js` so percorre o onboarding. O T008 mexe na rota do Professor e herdaria falso verde; promover a gate o script que semeia aluno + mode=teacher e le a ordem por `startTime`.
- 2026-09-05 COSMETICO: o aluno ve o topico duas vezes (header novo + feedback do engine). Enxugar num T-futuro.
- 2026-09-05 T003 DONE. `conteudo/track.json`: lista plana {nivel, ordem, slug, titulo, descricao}, 60 topicos. `extrai_track.js` exporta `extrai()`, `slugify()` e `DESTINO` — T004 reusa.
- 2026-09-05 Slugs prontos para arquivo: ASCII, unicos ate globalmente. `conteudo/explicacoes/A1/01-cumprimentos.md` ... `C2/10-precisao-e-parafrase.md`.
- 2026-09-05 QUEM EDITAR O TRACK no `Professor Engine` tem de rodar `node conteudo/extrai_track.js`, senao o `npm run gate` reprova (de proposito).
- 2026-09-05 `extrai_track.js` captura o valor do TRACK em runtime, nao o literal. Hoje da no mesmo (as outras ocorrencias sao leitura), e toda quebra de refactor testada aborta barulhento.
