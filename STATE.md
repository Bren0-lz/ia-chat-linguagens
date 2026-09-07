# Estado do loop

- **Tarefa atual:** T015 medido (falta verificar) · T016-T018 pendentes por limite de gasto
- **Última concluída:** T013 — instrumentos consertados antes de medir
- **Tentativas na atual:** 0/3
- **Bloqueios:** T010 aguarda decisao do Breno (credencial da camada 2). Nao bloqueia T011/T012. Ambiente: n8n e Postgres no ar, os dois workflows ativos, webhook do v8 conferido em 06/09.

## Ambiente (checar antes de tarefas marcadas "Precisa de ambiente")

| | Estado em 05/09/2026 |
|---|---|
| Postgres `127.0.0.1:5433` | **NO AR** — container `iachat-pg`, porta aberta |
| n8n `localhost:5678` | **NO AR** (resubido em 06/09; webhook do v8 conferido, nao so `active:true`) |
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
- 2026-09-05 T008 DONE. v8 com 106 nos: `Buscar Explicacao` (Postgres) -> `Rota Explicacao` (If) -> `Explicacao do Banco` (Code). Os dois caminhos saem pelo mesmo `Enviar Explicacao Prof`, via `$json.finalText`.
- 2026-09-05 Fallback provado nas DUAS formas: linha ausente E banco inacessivel (credencial isolada em porta morta, sem derrubar o container que o v7.4 usa). `alwaysOutputData:true` + `onError:continueRegularOutput`.
- 2026-09-05 `mode_teacher` NAO dispara a explicacao — so confirma o modo. E a MENSAGEM SEGUINTE que cai no subroute intro. Todo teste da rota Professor precisa dos dois turnos.
- 2026-09-05 O item carrega `explicacao_origem: 'banco'|'modelo'` — e por ele que o T009 separa as duas condicoes na medicao.
- 2026-09-05 O banco so serve em default/intro e em check->advance. Duvida, questao, correcao e resume_q continuam indo ao modelo (a consulta roda e e descartada — leitura indexada local).
- 2026-09-05 O `body` do banco NAO e escapado (o `Parse Professor` escapa a saida crua do modelo). Varredura dos 60: nenhuma tag invalida, nenhum & solto, maior body 3420 chars contra o teto de 4096 do Telegram. Se a fonte do corpo mudar, isso vira vetor de HTML invalido.
- 2026-09-06 T009 medido, verificacao PENDENTE: o n8n caiu durante a corrida (depois dos 24 turnos de explicacao). Os numeros estao coletados; falta o verifier, que precisa da API do n8n.
- 2026-09-06 `postUpdate` do harness NAO tem timeout global: com o n8n fora, cada turno leva ~100 min (5 tentativas x 5 retries dentro de 120 iteracoes de polling). Qualquer bateria longa trava em silencio. Vale um teto.
- 2026-09-06 O caminho de geracao ao vivo nao carimba `explicacao_origem` — so o do banco carimba. A medicao rotulou pelo runData. Carimbar 'modelo' no `Parse Professor` fecharia isso.
- 2026-09-06 T009 tentativa 1 REPROVADA por DEFEITO DE INSTRUMENTO, nao de medicao: `decompoe()` SOMA nos ANINHADOS. `Agente Professor` e `Modelo Vertex Professor` nao sao sequenciais — o sub-no roda DENTRO da janela do agente. Numero de LLM contado 2x.
- 2026-09-06 O viés atinge SO a condicao com LLM, entao inflava o ganho. Recalculado por uniao de intervalos: modelo p90 8,00 s (nao 12,80), ganho 7,02 s / 88% (nao 11,82 s / 92%). A condicao banco (0,98 s) esta correta — nao tem no de LLM.
- 2026-09-06 CONTAMINACAO MAIS AMPLA: `decompoe()` vem do `analisa_latencia.js`, o medidor do L1. TODA medicao de LLM ja feita neste repositorio carrega o mesmo vies — inclusive o L1 do handoff (media 4,83 s, p90 11,59 s) e possivelmente o p90 historico de 17,8 s do Professor.
- 2026-09-06 T009 tentativa 2 REPROVADA. (a) A alegacao "L1 irrecuperavel, execucoes apagadas" veio de chamada a API SEM PAGINAR — ha 1201 execucoes gravadas, a mais antiga a 2377 (24/08), 449 de 04/09 do v7.4 (ids 3022-3470), que e a populacao do L1. (b) A conferencia `estouro` e cega ao defeito que diz cobrir: reintroduzindo a soma, ela acusa 0 de 59.
- 2026-09-06 LICAO: `nextCursor` na resposta da API do n8n. Nao paginar produziu um "fato" publicado no handoff que estava errado — e que travaria o proximo leitor num numero estimado com o exato a dois minutos de distancia.
- 2026-09-06 Fator de inflacao medido sobre 122 turnos com LLM de 04/09: mediana 1,88x, media 1,84x. E o fator que e transferivel; os valores absolutos do L1 do handoff (media 4,83 s, p90 11,59 s, n=80) vem de populacao selecionada diferente e nao se substituem direto.
- 2026-09-06 T009 DONE (3 tentativas). Professor servido do banco: p90 0,98 s contra 8,00 s da geracao ao vivo, ganho de 7,02 s (88%), n=12 por condicao no MESMO v8.
- 2026-09-06 L1 RECUPERADO e recalculado: media 4,83 -> 2,55 s, p90 11,59 -> 6,16 s; `professor:intro` p90 17,81 -> 9,01 s. Os 80 turnos foram isolados na janela 3099-3178, a menos de 8 turnos de borda (9 janelas batem as 5 estatisticas, mas diferem so em turnos triviais sem LLM e todas dao os mesmos numeros).
- 2026-09-06 Os baldes do `decompoe()` viraram DISJUNTOS (precedencia LLM > infra > envio). `infra` encolheu ate 0,275 s e 19 dos 80 turnos do L1 mudaram >10 ms. A regua mudou de definicao — handoff §2 ja atualizado de "infra <=0,48 s" para "<=0,40 s".
- 2026-09-06 O alarme `estouroDe()` recebe os ESCALARES PUBLICADOS, nao recalcula pelo mesmo caminho que produziu o numero. Com o defeito reintroduzido acusa 29/59 — e as 30 silenciosas nao tem no de LLM, ou seja, 29 de 29 das afetadas.
- 2026-09-06 T010 BLOCKED. `testa_nome_camada2_vivo.js` criado e confirmado em 4 execucoes (3586/3588/3590/3592): `Validar Nome (IA)` devolve "Authorization failed - missing required authentication credential", `Veredito IA` cai em `reason=ia_indisponivel` (fail-open) e `asdfgh` E GRAVADO como nome do aluno. O `httpRequest` com `nodeCredentialType: googleApi` nao anexa token; hipotese: credencial `mKfC2ANkOKHfbKal` sem `scopes` preenchido (os nos LangChain Vertex montam `cloud-platform` sozinhos, o HTTP generico usa o campo da credencial). Decisao do Breno: corrigir os scopes ou criar `googlePalmApi` com API key do AI Studio.
- 2026-09-06 ARMADILHA NOVA: com `onError: continueRegularOutput`, o erro do no NAO fica em `runData[no][0].error` — viaja no `json.error` do ITEM DE SAIDA. Instrumento que so olha `.error` fica cego a esses nos, inclusive o `errs` do `digest()` do harness.
- 2026-09-06 FIXTURES da camada 2: `asdfgh` e `Kaique` caem em `ask_ai` na camada 1, entao exercitam mesmo a camada 2. `Rafael` NAO serve — esta na lista branca.
- 2026-09-06 Quando a credencial for corrigida, `testa_nome_camada2_vivo.js` vira a verificacao ao vivo da rota sem precisar de mudanca nenhuma.
- 2026-09-06 T011 DONE (verificada: 27/27 execucoes confirmadas no workflow do v8, transcricao a transcricao). O v8 reproduz o baseline do A1: correcao 0/9, interesses 0/9, 0 turnos vazios em 27. O bloco do Professor nao mexeu no A1 — o T012 pode usar este agregado como baseline do v8.
- 2026-09-06 ACHADO QUE MUDA O T012: o detector do CONTROLE do experimento_a1 e `/games are|are fun|.../i` e conta como acerto o bot que so USA a forma certa ("Oh, I agree! Video games are fun.") sem corrigir o aluno. Saturou em 9/9; com a regua estrita (reparo explicito) da 2/9. E o MESMO falso positivo ja consertado no detector do C1, sobrevivendo no do controle. O ~2/3 de 04/09 registrado no handoff §4 provavelmente contava concordancias: "o A1 corrige mal, ponto" fica MAIS forte, nao menos. QUEM USAR CONTROLE NO T012 TEM DE USAR A REGUA ESTRITA.
- 2026-09-06 DIVIDA DE INSTRUMENTO (herdada, nao introduzida): sobrou `|| /\bplaying\b/i` no `formaCerta` do detector do C1, contradizendo o comentario acima dele. Esta em AND com `reparo`, entao so afrouxa — 0/9 com detector frouxo e evidencia mais forte, nao mais fraca. Limpar quando alguem passar por ali.
- 2026-09-06 T012 DONE (verificada). HIPOTESE DO EXEMPLO DE FORMATO CONFIRMADA — a ultima aberta do handoff §4. Trocar UMA linha (o exemplo dentro de `IDIOMA (A1, formato OBRIGATORIO)` do `Prompt Conversa A1`) levou a correcao de 0/9 a 9/9 e o controle estrito de 2/9 a 8/9. Few-shot vencia instrucao: o exemplo antigo era uma resposta que nao corrigia nada, e o modelo imitava a forma. SUSPEITAR DO MESMO MECANISMO em qualquer prompt com "Formato EXATO".
- 2026-09-06 O 9/9 NAO e artefato, e o teste que provou isso vale reusar: o probe do C15 nao tem erro, e nenhuma das 9 saidas dali contem `We say`. Se fosse imitacao cega, a moldura apareceria onde nao ha o que corrigir. O modelo copiou a MOLDURA (`We say 'X'`) e preencheu X com o erro real do aluno.
- 2026-09-06 C15 CONTINUA MORTO: 0/9 mesmo com o exemplo novo citando um interesse. Detector conferido vivo (devolve true nas saidas do controle). Interesses no A1 sao problema separado e SEM HIPOTESE CANDIDATA — e a lacuna aberta que sobra do §4.
- 2026-09-06 RESSALVA A CARREGAR: o texto da variante ficou estereotipado — 7 das 9 correcoes sao a mesma frase palavra por palavra. Corrigiu, mas a variedade caiu. MEDIR ISSO no bloco da bateria antes de declarar ganho liquido.
- 2026-09-06 RESSALVA 2: o detector do C1 continua frouxo em principio (`\bsay\b` sozinho casa) e agora mede um comportamento que o proprio prompt ensina a formular. De hoje em diante ele e MENOS informativo — o conserto da regua no T013 fica mais urgente, nao menos.
- 2026-09-06 O `\n` do exemplo e literal: o jsCode guarda `\n`, entao o prompt manda o texto `\n` ao modelo, nao uma quebra de linha. Funciona, mas e acidente. Nao mexido (seria uma segunda variavel).
- 2026-09-06 Bloco 2 planejado (T013-T018): repetir a bateria diagnostica no v8 e comparar com o v7.4 de 04/09. Decisoes do Breno: Fase B com N=3 nos qualitativos, escopo = 2 fases + jornada continua, e nos REVISAR o agente propoe veredito pela rubrica §8 para o Breno confirmar.
- 2026-09-06 T013 DONE (verificada; o verifier reproduziu as tres reprovacoes em vez de acreditar no relatorio). Instrumentos consertados: T3 da Fase B deriva o contrato de idioma do `LANG` do fluxo (modulo novo `idioma_professor.js`), Fase A sai 1 em reprovacao e 2 em inconclusivo, detector do controle do experimento_a1 usa a regua estrita. Gate: 14 comandos, 5,3 s, offline (provado com net/http/fetch/dns envenenados).
- 2026-09-06 DIVIDA FANTASMA CORRIGIDA: o handoff registrava TRES lugares com a premissa velha de idioma (T3, linha ~257, cabecalho do revalida_niveis.js). So o T3 era real — os outros dois tratam do modo CONVERSA, onde B1+ segue "INTEIRAMENTE em ingles" e o T005b nao mexeu. O cabecalho do revalida_niveis.js ja explicitava a distincao antes da tarefa.
- 2026-09-06 ACHADO QUE MUDA O T014: `bateria_completa_a.js` crava `BASE + '/webhook/iachat-test'` em TRES lugares (193, 370, 379) e ignora o IACHAT_TEST_PATH. Rodar "no v8" mandaria R3 (foto) e S1 (requisicao sem header) para o V7.4 EM PRODUCAO, com o relatorio dizendo v8. Consertar antes de medir — entrou no escopo do T014.
- 2026-09-06 `testa_detector_controle.js` carrega dotenv transitivamente via experimento_a1.js: poe leitura de .env no caminho do gate. Inofensivo hoje, vale limpar.
- 2026-09-06 FRONTEIRA da regua estrita: a unica perda no corpus da variante e "Video games 'are' fun." (correcao so por aspas). Rejeicao conservadora e coerente, mas o 8/9 tem essa borda.
- 2026-09-06 T014 DONE (verificada; o verifier REFEZ a auditoria da API por conta propria: 93 execucoes consecutivas 3648-3740, 100% no v8, zero no v7.4). Fase A no v8: 17/17, exit 0. `tr_bateria_a_v8.md` criado; `tr_bateria_a.md` do v7.4 intocado.
- 2026-09-06 CONSERTO QUE VALE MAIS QUE A MEDICAO: a Fase A cravava a URL em 3 pontos e ignorava o IACHAT_TEST_PATH. R3 (foto) e S1 (requisicao sem header) iam para o V7.4 EM PRODUCAO com o relatorio dizendo v8. Em 04/09 passou despercebido porque o alvo pretendido ERA o v7.4 — a coincidencia escondeu o defeito.
- 2026-09-06 PADRAO NOVO: `fluxos/_teststand/alvo.js` deriva rotulo e nome de transcricao do ingress (v7.4 -> tr_X.md, v8 -> tr_X_v8.md). Evidencia antiga deixou de poder ser sobrescrita por acidente. `registra_urls.js` e o preload que prova para onde o fetch foi. REUSAR nos proximos.
- 2026-09-06 `testa_alvo_bateria_a.js` ligado ao `npm run gate` (script `gate:alvo`) — o guarda existia mas ninguem o rodava; regressao que voltasse a cravar URL passaria com gate verde.
- 2026-09-06 Nenhum dos 17 vereditos mudou entre v7.4 e v8, e isso e esperado: os 17 leem estado no Postgres, codigo HTTP ou erro de no — nenhum assere texto de LLM, idioma, rota Professor ou abre-alas.
- 2026-09-06 T015 MEDIDO (verificacao PENDENTE — o subagente caiu por LIMITE DE GASTO da conta, HTTP 429, depois de gravar o resumo final; a medicao esta inteira). Fase B no v8, N=3 nos qualitativos: 16 PASSOU, 2 FALHOU, 0 INSTAVEL, 11 REVISAR, 29 testes, 0 turnos vazios. `tr_bateria_b.md` do v7.4 INTOCADO.
- 2026-09-06 C1 VIROU: FALHOU no v7.4 (04/09) -> PASSOU 3/3 no v8. Confirma o T012 por uma SEGUNDA regua independente (o detector da bateria nao e o do experimento_a1). Duas reguas concordando vale mais que uma medida tres vezes.
- 2026-09-06 REGRESSAO NOVA ACHADA (T3, 3/3 consistente): o ENUNCIADO de B2 sai em PORTUGUES; o contrato manda EN de B1 pra cima. A explicacao esta certa (PT). O diario do T005b ja previa esse mecanismo — "o qSys injeta o LANG INTEIRO e a clausula de explicacao em PT contaminou a geracao da questao" — foi consertado para B1 e B2 FICOU PARA TRAS. Vira tarefa propria; NAO consertar dentro da bateria.
- 2026-09-06 O T3 so achou isso porque o T013 o consertou para derivar do fluxo. O instrumento antigo reprovava B2 pelo motivo ERRADO (exigia explicacao em EN) e teria dado falso vermelho mascarando o defeito real.
- 2026-09-06 C15 segue FALHOU 3/3 no v8: interesses no A1 nao se movem. Consistente com o T012 (0/9). Sem hipotese candidata.
- 2026-09-06 BLOQUEIO EXTERNO: limite de gasto mensal da conta atingido as ~23:39 (429). Reseta 23:50 America/Sao_Paulo. Nao e defeito do projeto. T016/T017/T018 ficam pendentes.
