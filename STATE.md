# Estado do loop

- **Tarefa atual:** T002
- **Última concluída:** T001
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
