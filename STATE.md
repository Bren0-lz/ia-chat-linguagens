# Estado do loop

- **Tarefa atual:** T005b
- **Última concluída:** T005
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
- 2026-09-05 T004 DONE. Auth do Vertex fora do n8n: ADC via `gcloud auth print-access-token`, projeto `agent-hackton` (o store de credenciais do n8n nao e legivel pela API, 405). No Windows, Node >=20 recusa spawn direto de .cmd — chamar via `cmd.exe /c`.
- 2026-09-05 DECISAO DE PRODUTO PENDENTE: o `LANG` do `Professor Engine` manda A1/A2 em portugues e B1/B2/C1/C2 **em ingles**. Confirmado nos dois fluxos. 40 das 60 explicacoes sairao em ingles. Levado ao Breno; ate decidir, o gerador espelha o fluxo.
- 2026-09-05 BOMBA-RELOGIO do T006: `gerar_explicacoes.js` grava com writeFileSync direto (nao atomico) e a retomada e so `existsSync`. Um .md truncado por Ctrl-C e pulado para sempre. Fechar no T005.
- 2026-09-05 DECIDIDO pelo Breno: B1..C2 passam a explicar em PORTUGUES. Muda so a clausula de explicacao do LANG; as PERGUNTAS seguem em ingles com resposta curta, como em A1/A2. Virou T005b, aplicar depois do T005 e antes do T006.
- 2026-09-05 T005 tentativa 1 devolvida: pulou o item "nao vaza gabarito" alegando banco fora, mas o iachat-pg esta up ha 10h e a 5433 aberta. Conferir o ambiente antes de declarar bloqueio.
- 2026-09-05 DECIDIDO: enunciado das perguntas em portugues em A1 e A2 (o A2 era ambiguo, fica explicito); B1..C2 mantem enunciado em ingles. Resposta curta em ingles nos seis niveis. Entra no T005b.
- 2026-09-05 T005 DONE (2 tentativas). `practice_questions.track_topic` = titulo do topico do TRACK; 136/136 preenchidas, 60/60 topicos cobertos. E a chave que T007/T008 devem usar para casar explicacao e questao.
- 2026-09-05 LIMITE ACEITO: o validador confere forma e cobertura lexical, NAO se o texto ensina. Lixo semantico que bate os contadores passa. A revisao humana do T006 e obrigatoria, nao opcional.
- 2026-09-05 10 pares (cefr_level, track_topic) contradizem o nivel que o TRACK da ao topico. O T007 vai esbarrar nisso ao modelar a tabela.
- 2026-09-05 3 questoes practice (B1/2, B1/8, B2/1) sao redundantes com a descricao do TRACK: o material e obrigado a ensinar o que elas cobram. Viram AVISO, nao reprovacao. Decisao de produto pendente.
- 2026-09-05 `conteudo/questoes.json` e retrato versionado do banco; `node conteudo/extrai_questoes.js --conferir` prova que batem (precisa do Postgres, fica fora do gate).
