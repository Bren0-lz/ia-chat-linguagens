# Estado do loop

- **Tarefa atual:** T008
- **Última concluída:** T007
- **Tentativas na atual:** 0/3
- **Bloqueios:** nenhum — T006 destravado em 05/09

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
- 2026-09-05 T005b DONE. O `qSys` injeta o LANG INTEIRO: a clausula de explicacao em PT contaminou a geracao da questao e o B1 saiu com enunciado em portugues. So passou com "INTEIRAMENTE em ingles, enunciado e resposta". QUEM MEXER NO LANG RECONFERE A PERGUNTA AO VIVO, nao so a explicacao.
- 2026-09-05 DIVIDA CONFIRMADA: `bateria_completa_b.js:403` (T3) assere "nivel B2: portugues na explicacao == false" — agora contradiz o produto e vai dar falso vermelho na proxima bateria B. Reescrever para "explicacao PT / pergunta EN". Conferir junto a linha 257 e o cabecalho do `revalida_niveis.js`.
- 2026-09-05 VARIANCIA: em n=3 no C2 ao vivo, 2 explicacoes vieram em PT e 1 em ingles. Afeta a geracao ao vivo (fallback), nao os 60 pre-gerados, que saem pelo gerador. Medir com n maior se o C2 der problema.
- 2026-09-05 T005c tentativa 1 REPROVADA: o 0/60 era tautologico (a simulacao FORMA nunca escreve o enunciado, e a regra nova exige o enunciado) e o criterio e burlavel em 100/100 invertendo a ordem resposta-antes-da-fonte, que e a ordem natural da prosa didatica. Detectacao caiu 28 num eixo inteiro, nao subiu.
- 2026-09-05 T005c DONE (2 tentativas). Detector de vazamento: regra do par SIMETRICA na ordem, janela de 240 chars. Falso positivo na aula que ensina: 22/60 -> 0/60. Item resolvido: pego em 98/100 (direto) e 17/18 (invertido).
- 2026-09-05 LICAO: a tentativa 1 media a si mesma — a simulacao FORMA nunca escrevia o enunciado e a regra nova exigia o enunciado, entao o 0/60 era inalcancavel por construcao. Quem escreve a regra NAO deve escrever sozinho o texto que a mede.
- 2026-09-05 4 eixos que o detector NAO ve, declarados no codigo e impressos pelo gate: questao sem detector (36/136 practice, 29/60 exam), distancia >240 chars, remendo (palavra no meio), e lacuna copiada + resposta ao lado (81/82). A rede real do T006 e a revisao humana.
- 2026-09-05 A diretiva de registro do gerador vem do LANG do nivel (nao ha mais DIRETIVA_IDIOMA). Mexer no LANG obriga a REGERAR os 60, nao so revalidar.
- 2026-09-05 So 18 das 100 questoes com detector sao do tipo "par" (transformacao com frase entre aspas); as outras 82 sao de lacuna e vivem so da regra (a).
- 2026-09-05 T006 BLOCKED. 59 .md gerados em 16 passadas (retomada funcionou, nenhuma parada por token, nenhum .tmp orfao). 50 validam. 1 aviso, o conhecido (B1/02, mandado pelo TRACK).
- 2026-09-05 DEFEITO DE INSTRUMENTO: `medeIdioma` conta marcadores EN dentro das FRASES DE EXEMPLO em ingles, que o proprio prompt exige. Quanto mais alto o nivel, mais o bloco de exemplos domina — a metrica pune o que o produto pede. 6 arquivos a 42-52% com o texto comprovadamente em portugues.
- 2026-09-05 DEFEITO DE INSTRUMENTO 2: COBERTURA e ERRO_COMUM casam termos LITERAIS da descricao do TRACK, inclusive palavras que ali sao so cenario de exemplo (road, car, beautiful). Forca o gerador a copiar o exemplo do TRACK.
- 2026-09-05 C2/07 nao existe: 4 de 4 tentativas estouraram o MAX_CARACTERES de 3000 (3069-3463).
- 2026-09-05 DEFEITO REAL, nao de instrumento: 7 arquivos usam crase-backtick em vez de <b>. O prompt proibe markdown mas nem `confereCorpo` nem o validador pegam backtick isolado; no Telegram HTML aparece literal.
- 2026-09-05 DECIDIDO pelo Breno: MAX_CARACTERES sobe de 3000 para 3800 (o Telegram aceita 4096; a mediana hoje e ~2500). Destrava o C2/07.
- 2026-09-05 Confirmei o defeito do medeIdioma por medicao propria: em C1/03 so 23% das linhas sao prosa PT densa, o resto sao formulas em ingles que o prompt EXIGE. Consertar o que e medido, nao baixar o limiar de 55% (isso seria mover a trave).
- 2026-09-05 T006 tentativa 2 REPROVADA: das 4 checagens afrouxadas, 2 viraram carimbo. `medeIdioma` descarta LINHAS DE LISTA inteiras, entao uma aula toda em ingles com as frases em bullets e 3 linhas de portugues decorativo mede 100% PT e passa (o HEAD reprovava com 26%). `termosExigiveis` caiu de 958 para 660 termos: B2/4 ficou com ZERO (checagem inexistente ali) e A1/6 perdeu as contracoes, que sao a materia.
- 2026-09-05 A 5a mudanca (folga de palavra de funcao no GABARITO), feita fora de escopo, foi AUDITADA e e legitima: rebaixa exatamente 1 questao no banco inteiro, a que a motivou. Escopo triplamente travado. Manter.
- 2026-09-05 REGRA: commitar o conteudo gerado ANTES de qualquer conserto in loco. Sem baseline no git, conserto em arquivo gerado e inauditavel.
- 2026-09-05 T006 DONE (3 tentativas, 1 bloqueio). 60 explicacoes validas em conteudo/explicacoes/. REVISAO HUMANA DO BRENO PENDENTE — e ela a rede real, nao o gate.
- 2026-09-05 TETO DO INSTRUMENTO, medido: um .md gramaticalmente correto, sem repeticao, cobrindo os termos e com as 5 secoes, que NUNCA enuncia a regra, PASSA. Esta declarado no codigo. Julgar "ensina ou nao ensina" exige leitura humana.
- 2026-09-05 Escape conhecido do idioma: aula em ingles escrita inteira em sentencas de <=8 palavras mede 88% PT e passa. Alcancado pelo verifier, mas exige texto adversarial; nenhum LLM escreve assim espontaneamente.
- 2026-09-05 COBERTURA quase cega em C2/4 (1 termo) e C2/7 (2 termos): a descricao do TRACK desses topicos quase nao tem termo ensinavel fora dos exemplos. Culpa do TRACK, nao do validador.
- 2026-09-05 DIVIDA pre-existente: o validador quebra em arquivo CRLF ("data: 2026-09-05
"). Vai morder quem clonar no Windows com autocrlf=true.
- 2026-09-05 T007 DONE. `topic_explanations`, chave (cefr_level, topic_order) — NAO por titulo: "Presente simples" existe sob 3 niveis em practice_questions, entao (nivel, titulo) nao identifica topico.
- 2026-09-05 PARA O T008: o nivel vem de `teacher_state_new.level`, NAO de `$json.level` (este vem do Roteador e pode estar minusculo ou invalido enquanto o lvl normalizado caiu no fallback A1). Verificado no jsCode do Professor Engine.
- 2026-09-05 `seed_explicacoes.js` APAGA linha da tabela sem .md correspondente. O .md e a fonte da verdade; linha curada a mao no banco morre no proximo seed.
- 2026-09-05 CRLF resolvido com `.gitattributes` (`* text=auto eol=lf`). Sem ele, clone novo no Windows com autocrlf=true dava gate vermelho em repositorio limpo.
- 2026-09-05 Base limpa: `cleanup_test_users.js --apply` removeu os 9 alunos de teste; sobraram as 2 contas reais. Rodar isso ao fim de cada bloco com gate ao vivo.
