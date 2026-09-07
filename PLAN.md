# Plano — IAChat v8

## Objetivo final

O modo Professor serve explicações **pré-geradas e revisadas** do banco, instantâneas, com
abre-alas determinístico; a validação de nome tem a camada 2 provada ao vivo; e a hipótese que
resta sobre o colapso do A1 (C1/C15) foi testada com medição. Tudo dentro de
`fluxos/IAChat_Telegram_v8.json`, com o `v7.4` intocado e no ar o tempo todo.

## Definição de pronto (global)

- `npm run gate` verde (offline) e `node fluxos/_teststand/gate_vivo_v8.js` verde (ao vivo)
- 60 explicações em `conteudo/explicacoes/`, validadas, no banco, e servidas pelo fluxo com fallback
- p90 da rota Professor medido e menor que os 17,8 s de hoje
- `git diff v7.4-congelado -- fluxos/IAChat_Telegram_v7.4.json` vazio

## Fora de escopo

- Livros WAYS → `.md` (conversão acontece por fora; volta ao plano quando os `.md` existirem)
- Painel `web/` · menu de comandos do Telegram — adiados por decisão
- Trocar o bot do v7.4 para o v8 — decisão do Breno, para depois
- `git push`

## Ambiente

O v8 roda ao vivo **como workflow separado**: `TEST Ingress` em `iachat-test-v8` e
`Gatilho Telegram` desabilitado, para não disputar o `webhookId` com o v7.4. O teststand o dirige
por `IACHAT_TEST_PATH=iachat-test-v8`.

---

## Tarefas

Status: `TODO` · `DOING` · `DONE` · `BLOCKED`

### T001 — v8 isolado, publicado como workflow novo e ativo
- **Escopo:** em `fluxos/IAChat_Telegram_v8.json`, `TEST Ingress.parameters.path` → `iachat-test-v8`
  e `Gatilho Telegram` com `disabled: true`; `fluxos/_teststand/harness.js` passa a ler
  `process.env.IACHAT_TEST_PATH` (default `iachat-test`); criar
  `fluxos/_teststand/gate_vivo_v8.js`, que manda **uma** mensagem pelo ingress do v8, exige que o
  `Roteador Mestre` tenha registrado a rota e que a resposta não seja vazia, e sai 0/1.
  Publicar o v8 como **workflow novo** no n8n (MCP `n8n_create_workflow`) e ativar.
  **Não tocar** no workflow `9MA0o1XJjD33BnKc`; conferir `active` dos dois no fim.
- **Gate:** `npm run gate && node fluxos/_teststand/gate_vivo_v8.js`
- **Depende de:** —
- **Status:** DONE — workflow `PbwEf7L9xEXhJaCg`, ativo em paralelo ao v7.4

### T002 — Professor: abre-alas determinístico
- **Escopo:** nó novo que envia `📚 Tópico N/10: <título>` **antes** de chamar o `Agente Professor`,
  com entrada em `connections`. Não reduz latência; mata a sensação de travamento.
- **Gate:** teste offline novo que extrai o nó e confere o texto para um estado dado e **reprova o
  v7.4** (onde o nó não existe) + `npm run gate` + `gate_vivo_v8.js`
- **Depende de:** T001
- **Status:** DONE — cabeçalho 1,16 s antes do modelo, medido ao vivo (exec 3483) — nós `Cabeçalho Tópico` + `Enviar Cabeçalho Tópico` no v8, publicados por `fluxos/_teststand/publica_v8.js`

### T003 — TRACK como fonte única e consultável
- **Escopo:** script que extrai os 6×10 tópicos do `jsCode` do `Professor Engine` para
  `conteudo/track.json`. Sem duplicar a verdade: `conteudo/valida_track.js` confere que o JSON é
  idêntico ao TRACK embutido no fluxo.
- **Gate:** `node conteudo/valida_track.js` + `npm run gate`
- **Depende de:** T001
- **Status:** DONE — 60 tópicos, fidelidade conferida por extração independente

### T004 — gerador de explicações (Gemini 2.5 Pro no Vertex)
- **Escopo:** `conteudo/gerar_explicacoes.js` — Service Account `mKfC2ANkOKHfbKal`, um `.md` por
  tópico em `conteudo/explicacoes/<NIVEL>/<NN>-<slug>.md` com frontmatter (nível, ordem, slug,
  título, modelo, data). Retomável (não regera o que existe) e com `--apenas A1/01` para piloto.
- **Gate:** dry-run sem rede lista os 60 caminhos corretos; geração real do piloto A1/01 passa no
  validador do T005
- **Depende de:** T003
- **Status:** DONE — piloto A1/01 gerado; auth por ADC, não pela Service Account

### T005 — validador de conteúdo
- **Escopo:** `conteudo/valida_explicacoes.js` — frontmatter completo, tamanho na faixa, cobre os
  pontos do TRACK daquele tópico, não vaza gabarito das questões do banco, idioma correto.
  **Idioma vem do fluxo, não de constante no validador:** o `LANG` do `Professor Engine` manda
  A1/A2 em português e B1/B2/C1/C2 em inglês. Derive a expectativa do fluxo, como o T003 faz com
  o TRACK — assim a decisão de produto muda num lugar só.
  Fechar também a bomba-relógio do T006 achada na verificação do T004: a gravação do gerador não
  é atômica e o guard de retomada é só `existsSync`, então um `.md` truncado por interrupção é
  pulado para sempre. Gravar por temporário + `rename`, e pular só o que passa no validador.
- **Gate:** aprova o piloto e **reprova** um `.md` sabotado (fixture no repositório)
- **Depende de:** T004
- **Status:** DONE — validador + gravação atômica + detector de vazamento por `track_topic`

### T005b — LANG: B1..C2 explicam em português
- **Escopo:** decisões do Breno em 05/09. No `LANG` do `Professor Engine` (v8), duas mudanças:
  1. **Explicação** de B1, B2, C1 e C2: de "INTEIRAMENTE em inglês, SEM português" para português,
     preservando o registro de cada nível (simples em B1, natural em B2, sofisticado em C1, nativo
     em C2).
  2. **Enunciado das perguntas** em português na faixa básica. A1 já está assim; o A2 hoje diz só
     "enunciado simples", sem idioma — tornar explícito. De B1 em diante o enunciado **segue em
     inglês**. A resposta curta continua em inglês em todos os seis níveis.

  Estado alvo:

  | | explicação | enunciado | resposta |
  |---|---|---|---|
  | A1, A2 | PT | **PT** | EN |
  | B1, B2, C1, C2 | **PT** | EN | EN |

  Republicar o v8.
  **Fechar junto a rede de proteção que falta:** a verificação do T005 mutou `idiomaPorNivel` para
  um mapa cravado e o `npm run gate` continuou **verde** — a implementação deriva do fluxo, mas o
  teste não pegaria uma regressão que voltasse a cravar. Acrescente o caso que reprova essa mutação.
  A asserção fixa em `testa_valida_explicacoes.js:82` vai quebrar com a troca; é por desenho.
- **Gate:** `npm run gate` + `node conteudo/valida_explicacoes.js` (que deriva o idioma do fluxo:
  depois da troca, um `.md` de B1 em inglês passa a reprovar e um em português passa a aprovar —
  mostre as duas saídas) + a mutação do idioma cravado passa a **reprovar** o gate +
  `publica_v8.js` + verificação ao vivo da rota do Professor num nível B1+
- **Depende de:** T005
- **Status:** DONE — 12/12 enunciados em EN e explicação em PT, medido ao vivo em 6 execuções

### T005c — calibrar o detector de vazamento antes de gerar os 60
- **Escopo:** a verificação do T005 simulou explicações que ensinam a matéria do próprio tópico e
  **22 de 60 reprovariam** por GABARITO — entre elas frases que qualquer aula boa escreveria
  (`had never seen`, `have been learning`, `never have I seen such chaos`, que é o exemplo canônico
  de inversão). O gatilho de resposta (≥3 palavras / ≥12 chars) é curto demais para separar
  "entregou o item" de "ensinou a matéria". Calibrar antes de gastar 60 gerações.
  É uma **previsão por simulação**, não medição de conteúdo real — confirme antes de mexer, e se a
  simulação não se sustentar, diga isso e feche a tarefa sem alterar o limiar.
  Registrar também o limite conhecido do outro lado: 35 das 136 questões não têm detector nenhum
  (resposta de uma palavra, enunciado sem lacuna).
  **Segundo item, vindo do T005b:** a `DIRETIVA_IDIOMA.pt` do `gerar_explicacoes.js` é a de A1
  ("sempre com o termo em inglês seguido da tradução"). Agora que B1..C2 também geram em português,
  ela achata o registro dos quatro níveis altos — um C2 não precisa de tradução a cada termo.
  Derivar o registro do `LANG` do nível, como o idioma já é derivado.
- **Gate:** a simulação que hoje reprova 22/60 passa a reprovar só o que é vazamento de verdade, com
  as fixtures das duas direções ainda verdes; `npm run gate` verde
- **Depende de:** T005b
- **Status:** DONE — falso positivo 22/60 → 0/60, regra simétrica na ordem, 4 eixos declarados

### T006 — gerar os 60 e revisar
- **Escopo:** rodar o gerador nos 60 tópicos, um commit por nível. Ponto de revisão humana: são
  `.md` em git, o Breno lê no diff.
- **Gate:** `node conteudo/valida_explicacoes.js` verde nos 60
- **Depende de:** T005c
- **Status:** DONE — 60 válidos; revisão humana do Breno pendente, e é ela a rede real

### T007 — migration e seed
- **Escopo:** `db/migrations/013_explicacoes_topico.sql` (nível, ordem, slug, título, corpo,
  `updated_at`, única em nível+ordem) e `conteudo/seed_explicacoes.js` populando a partir dos `.md`.
  Aplicar no Postgres local.
- **Gate:** script que lê as 60 linhas do banco e confere que batem com os `.md`
- **Depende de:** T006
- **Status:** DONE — `topic_explanations`, 60 linhas, chave (cefr_level, topic_order)

### T008 — o fluxo servindo do banco, com fallback
- **Escopo:** nó `Buscar Explicação` (Postgres) antes do `Agente Professor`. Com linha: envia
  direto. Sem linha: **cai na geração ao vivo de hoje** — o aluno nunca fica sem explicação.
  Consulta por `WHERE cefr_level=$1 AND topic_order=$2`. **O nível vem de
  `teacher_state_new.level`, NÃO de `$json.level`** — este último vem do Roteador e pode estar
  minúsculo ou inválido enquanto o `lvl` normalizado caiu no fallback A1. Verificado no `jsCode`.
- **Gate:** teste offline dos dois caminhos + `gate_vivo_v8.js` percorrendo um tópico com
  explicação no banco e outro sem
- **Depende de:** T007, T002
- **Status:** DONE — os dois caminhos medidos ao vivo, inclusive com o banco inacessível

### T009 — medir o ganho
- **Escopo:** latência da rota Professor no v8, antes e depois, pelas execuções gravadas
  (`analisa_latencia.js`); registrar em `MEDICOES_professor_v8.md`.
- **Gate:** o arquivo existe com n≥10 por condição e o p90 servido do banco é menor que o gerado
- **Depende de:** T008
- **Status:** DONE — p90 0,98 s contra 8,00 s; ganho de 7,02 s (88%)

### T010 — validação de nome, camada 2, ao vivo
- **Escopo:** `fluxos/_teststand/testa_nome_camada2_vivo.js` — manda `asdfgh` (deve recusar) e
  `Kaique` (deve aceitar) pelo ingress do v8 e lê o `Veredito IA`. Se a Service Account não
  autenticar nesse caminho, o relatório **diz isso**, em vez de deixar o fail-open mascarar.
- **Gate:** o script sai 0 com os dois casos corretos
- **Depende de:** T001
- **Status:** BLOCKED — instrumento pronto e confirmado ao vivo (execs 3586/3588/3590/3592); a camada 2 NAO autentica: `Validar Nome (IA)` recebe "Authorization failed / missing required authentication credential" da Vertex, o `Veredito IA` cai no fail-open e `asdfgh` vira nome de aluno. Decisao do Breno: corrigir `scopes` da credencial `mKfC2ANkOKHfbKal` ou criar `googlePalmApi` com API key do AI Studio

### T011 — baseline do A1 no v8
- **Escopo:** `experimento_a1.js` contra o v8, N=3, sem mexer em nada. Confirma que o v8 reproduz
  o baseline conhecido (0/9 correção, 0/9 interesses) antes de qualquer variante.
- **Gate:** relatório gravado com N=3 e as duas taxas registradas
- **Depende de:** T001
- **Status:** DONE — v8 reproduz o baseline: correcao 0/9, interesses 0/9, 0 turnos perdidos em 27 (execs 3593-3619, todas no v8). O CONTROLE saturou em 9/9 por falso positivo do detector; regua estrita da 2/9

### T012 — hipótese do exemplo de formato (C1/C15)
- **Escopo:** a única hipótese que resta (handoff §4): a linha de IDIOMA do A1 traz um exemplo de
  formato sem correção nem interesse, e o modelo pode estar imitando a forma em vez de seguir as
  diretivas. **Uma variável:** trocar o exemplo por um que contenha correção e interesse.
  Protocolo §8: baseline → uma linha → medir → reverter se não melhorar.
- **Gate:** relatório comparando baseline e variante com N≥6, e o `git diff` do v8 mostrando a
  mudança adotada ou a reversão limpa
- **Depende de:** T011
- **Status:** DONE — HIPOTESE CONFIRMADA. Exemplo de formato trocado no `Prompt Conversa A1`: correcao 0/9 -> 9/9, controle estrito 2/9 -> 8/9. C15 continua 0/9. Mantida e publicada no v8

---

## Bloco 2 — Bateria diagnóstica no v8 (pedido do Breno em 06/09)

**Objetivo:** repetir a bateria diagnóstica no v8, do mesmo jeito que foi conduzida em 04/09
sobre o v7.4, e produzir um comparativo que mostre o que as atualizações melhoraram — em `.md`
para agentes e em PDF para o Breno. Meta declarada: chegar a **todos os diagnósticos positivos**
antes de abrir para usuários reais.

**Decisões do Breno (06/09):** Fase B com **N=3** nos qualitativos · escopo = as duas fases
**mais** a jornada contínua · nos `REVISAR`, o agente **propõe** veredito pela rubrica §8 e o
Breno confirma.

**Padrão a seguir** (de `fluxos/TESTES_DIAGNOSTICOS.md` e dos `tr_bateria_*.md` de 04/09):
uma linha por teste (`PASSOU`/`FALHOU`/`REVISAR`) com evidência curta; transcrição crua sob
cada teste de LLM; rubrica 0–2 da §8 nos qualitativos; e **todo veredito carrega a versão em
que foi medido** — comparar status entre versões sem dizer qual engana (§9).

### T013 — consertar os instrumentos antes de medir
- **Escopo:** três defeitos conhecidos que invalidariam a rodada:
  1. `bateria_completa_b.js` **T3** (linha ~403) assere "nível B2: português na explicação == false".
     Desde o T005b isso **contradiz o produto** e daria falso vermelho. Reescrever para
     "explicação PT / pergunta EN". Conferir junto a **linha 257** e o cabeçalho do
     `revalida_niveis.js`, que carregam a mesma premissa velha.
  2. `bateria_completa_a.js` **sai 0 mesmo reprovando** — só sai ≠0 em erro fatal. Enquanto isso
     não mudar, ela não serve como gate e "verde" não quer dizer nada.
  3. O detector do **controle** do `experimento_a1.js` saturou (achado do T011): conta como acerto
     o bot que só USA a forma certa sem corrigir. Aplicar a régua estrita, a mesma do C1.
     **Não** mexer nos detectores do C1 e do C15 — estão certos, e mudá-los quebraria a
     comparação com o baseline.
- **Gate:** para cada um dos três, um teste que **reprova a versão anterior**: (1) o T3 aprova
  explicação PT + pergunta EN e reprova o inverso; (2) a Fase A sai **≠0** com uma reprovação
  forçada e 0 sem ela; (3) o controle estrito rejeita `"Oh, I agree! Video games are fun."` e
  aceita `"We say 'video games ARE'"`. Mais `npm run gate` verde.
- **Depende de:** T012
- **Status:** DONE — tres instrumentos consertados, cada um com teste que reprova a versao anterior (reproduzido pelo verifier). Gate segue offline, 5,3 s, 14 comandos

### T014 — Fase A no v8 (17 determinísticos)
- **Escopo (AMPLIADO em 06/09, achado do T013):** ANTES de medir, consertar o alvo: `bateria_completa_a.js`
  monta a URL cravada em **tres lugares** (linhas 193, 370, 379: `BASE + '/webhook/iachat-test'`) em vez de
  usar o `IACHAT_TEST_PATH` do harness. Rodando "no v8", esses testes batem no **v7.4 que atende usuarios
  reais** — R3 mandaria uma foto e S1 uma requisicao sem header para producao, e o relatorio diria v8.
  Consertar e provar que o alvo passou a ser o v8. Depois disso, rodar `bateria_completa_a.js` contra o ingress do v8 e gravar `tr_bateria_a_v8.md`
  no formato de 04/09 (uma linha por teste, evidência curta, resumo no fim). Sem semear o que o
  teste deveria percorrer.
- **Gate:** relatório com os 17 vereditos e o **exit code real** registrado (já confiável depois
  do T013); toda execução comprovadamente no workflow do v8, não no v7.4.
- **Depende de:** T013
- **Status:** DONE — 17/17 no v8, exit 0, e 93/93 execucoes provadamente no workflow do v8 (auditoria refeita pelo verifier). Alvo consertado: 3 URLs cravadas iam para PRODUCAO

### T015 — Fase B no v8, com N=3
- **Escopo:** rodar `bateria_completa_b.js` contra o v8 com **N=3** nos testes qualitativos,
  gravando `tr_bateria_b_v8.md`: veredito por teste, **média e desvio** onde a rubrica se aplica,
  e a transcrição crua de cada rodada. Onde o teste for determinístico, N=1 basta — diga qual é
  qual. Vereditos seguem rotulados quanto ao N usado.
- **Gate:** os 29 testes com veredito, N declarado por teste, e as três rodadas presentes na
  evidência dos qualitativos. Nenhum turno vazio contado como aprovação (armadilha nº 1).
- **Depende de:** T013
- **Status:** MEDIDO, verificacao pendente — 29 testes com N=3 nos qualitativos: 16 PASSOU, 2 FALHOU (C15, T3), 11 REVISAR, 0 vazios. C1 VIROU (FALHOU no v7.4 -> PASSOU 3/3 no v8). T3 e REGRESSAO NOVA: enunciado de B2 em portugues

### T016 — jornada contínua no v8
- **Escopo:** `jornada_usuario.js` contra o v8, **sem semear estado**, gravando `tr_jornada_v8.md`.
  É a rota que percorre as transições do fluxo — foi ela que achou os dois P0 que 45 testes
  verdes não viram. Se achar defeito novo, **registrar, não consertar**: vira tarefa própria.
- **Gate:** transcrição completa gravada, com a jornada chegando ao fim ou o ponto exato de parada
  identificado.
- **Depende de:** T013
- **Status:** TODO

### T017 — vereditos propostos para os REVISAR
- **Escopo:** aplicar a **rubrica 0–2 da §8** a cada teste que saiu `REVISAR` no T015, propondo
  veredito com a nota por critério e a justificativa em uma linha. **Marcar como proposta**, não
  como veredito fechado: a confirmação é do Breno. Em 04/09 foram 11 casos.
- **Gate:** todo `REVISAR` do T015 tem nota por critério, veredito proposto e justificativa; nenhum
  fica sem proposta.
- **Depende de:** T015
- **Status:** TODO

### T018 — o comparativo: `.md` para agentes e PDF para o Breno
- **Escopo:** `RELATORIO_DIAGNOSTICO_v8.md` no padrão do `TESTES_DIAGNOSTICOS.md`, contendo:
  (a) tabela **v7.4 (04/09) × v8 (hoje)** teste a teste, com a coluna "medido em" que a §9 exige;
  (b) o que melhorou, o que regrediu e o que continua aberto, cada um com o número que sustenta;
  (c) distância até a meta "todos positivos", isto é, a lista do que falta para abrir a usuários
  reais; (d) as ameaças à validade — N, não-determinismo do LLM, e o que mudou entre as versões
  além do fluxo. Atualizar a **§9** do `TESTES_DIAGNOSTICOS.md` com a coluna do v8.
  Gerar o **PDF** a partir do `.md` (Chrome headless `--print-to-pdf`; não há pandoc nem
  puppeteer na máquina, e nada deve ser instalado para isso).
- **Gate:** o `.md` existe com a tabela comparativa completa (nenhum teste sem as duas colunas),
  o PDF existe e abre, e todo número citado no texto tem origem rastreável nos `tr_*_v8.md`.
- **Depende de:** T014, T015, T016, T017
- **Status:** TODO
