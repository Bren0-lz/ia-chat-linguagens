# Relatório diagnóstico — IAChat v8

> **Duas rodadas neste documento.** A principal é a de **06–07/09/2026** sobre o
> `IAChat_Telegram_v8` (106 nós, n8n `PbwEf7L9xEXhJaCg`); a **§12 traz a rodada v8.1, de
> 10/09**, depois das correções T019–T023, T025 e T027.
> Compara com a rodada de **04/09/2026** sobre o **v7.4** (101 nós, `9MA0o1XJjD33BnKc`), que é
> o fluxo **em produção** atendendo o Telegram.
>
> Metodologia, personas e rubricas: `fluxos/TESTES_DIAGNOSTICOS.md`.
> Evidência bruta: `tr_bateria_a_v8.md`, `tr_bateria_b_v8.md`, `tr_jornada_v8.md`,
> `tr_revisar_v8.md`. Os arquivos sem sufixo (`tr_bateria_a.md`, `tr_bateria_b.md`,
> `tr_jornada.md`) são a evidência do v7.4 e **não foram tocados**.
>
> **Regra que atravessa o documento (§9 do roteiro):** todo veredito carrega a versão em que
> foi medido. Comparar status entre versões sem dizer qual engana.

---

## 1. Sumário executivo

**A bateria não é comparável ponto a ponto com a de 04/09 sem uma ressalva grande:** três
instrumentos que produziram os números do v7.4 estavam quebrados, e foram consertados antes
desta rodada. Parte do que aparece como diferença é **instrumento consertado**, não produto
mudado — e este relatório separa as duas coisas em toda tabela.

| | v7.4 (04/09) | v8 (06–07/09) |
|---|---|---|
| **Fase A** — determinísticos | 17 PASSOU | **17 PASSOU** |
| **Fase B** — dependentes de LLM | 16 PASSOU · 2 FALHOU · 11 REVISAR | 16 PASSOU · **2 FALHOU** · 11 REVISAR |
| N da Fase B | **1** (declarado "indicativo") | **3** nos qualitativos |
| Turnos vazios | não contados | **0** — os 2 da jornada eram cegueira do instrumento (T025) |

O placar agregado é quase idêntico, e isso **esconde as duas mudanças que importam**:

1. ✅ **C1 virou** — a correção no A1 saiu de `FALHOU` para `PASSOU 3/3`.
2. ⚠️ ~~**T3 caiu**~~ — **corrigido em 10/09: o T3 nunca esteve quebrado.** O detector julgava o
   texto inteiro, e o `Parse Professor` concatena ao enunciado um cabeçalho de interface
   (`▶️ Questões de "…". Acerte 5 seguidas…`) que é **português por desenho**. Com o detector
   julgando só o enunciado, o T3 dá **PASSOU 3/3** ao vivo. Detalhe na §4.3.

Aplicando a rubrica aos 11 `REVISAR` (§5), o placar real do v8 fica **22 PASSOU · 4 com
ressalva · 5 FALHOU**, e a distância até a meta "todos os diagnósticos positivos" é de
**5 defeitos** — dos quais **3 são achados desta rodada** e não tinham tarefa aberta.

---

## 2. O que mudou no produto entre as duas rodadas

| | mudança | tarefa |
|---|---|---|
| Nós | 101 → **106** | T001–T008 |
| Professor: abre-alas | o aluno recebe `📚 Tópico N/10` **1,16 s antes** da chamada ao modelo | T002 |
| Professor: explicação | 60 explicações **pré-geradas**, servidas do Postgres, com fallback | T006–T008 |
| Idioma da trilha | B1..C2 passaram a **explicar em português**; enunciado EN de B1 pra cima | T005b |
| Conversa A1 | o **exemplo de formato** do prompt passou a conter correção e interesse | T012 |

---

## 3. Metodologia — e o que mudou nela

Mesmo desenho de 04/09: **Fase A** determinística (17 testes, veredito binário) e **Fase B**
dependente de LLM (29 testes, com transcrição crua sob cada veredito). Somam-se a **jornada
contínua** (§6) e os **vereditos por rubrica** (§5).

### Três instrumentos foram consertados antes de medir — e sem isso a rodada seria inválida

| defeito | o que produzia | conserto |
|---|---|---|
| **Fase A saía `0` mesmo reprovando** | "verde" não significava nada: só saía ≠0 em erro fatal | sai **1** em reprovação, **2** em inconclusivo |
| **T3 contradizia o produto** | assertava "sem português na explicação de B2", premissa que o T005b derrubou → **falso vermelho** | contrato derivado do `LANG` **do fluxo**, não cravado |
| **Detector do controle saturado** | contava como acerto o bot que só *usa* a forma certa sem corrigir | régua estrita (exige reparo explícito) |

Cada conserto entrou com um teste que **reprova a versão anterior** — regra do projeto: teste
que não reprova o código velho não prova nada. Os três estão no `npm run gate`, que segue
offline (14 comandos, ~5 s).

### E dois defeitos de alvo, que teriam invalidado tudo

- **A Fase A mandava três requisições para produção.** `bateria_completa_a.js` cravava a URL em
  três pontos e ignorava o `IACHAT_TEST_PATH`: rodando "no v8", o R3 mandava uma foto e o S1
  uma requisição sem header **para o v7.4 que atende usuários reais**, e o relatório dizia v8.
  Em 04/09 ninguém viu porque o alvo pretendido *era* o v7.4 — a coincidência escondeu o
  defeito.
- **A Fase B e a jornada apagariam a evidência de 04/09.** As duas gravavam em caminho fixo
  (`tr_bateria_b.md`, `tr_jornada.md`), e a jornada com `writeFileSync`, que **sobrescreve**.
  Rodá-las no v8 teria destruído o lado esquerdo desta comparação ao produzir o direito.

Ambos consertados: o alvo e o nome da transcrição agora **derivam do ingress**
(`fluxos/_teststand/alvo.js`), com guardas no gate.

**Prova de alvo desta rodada:** 94 chamadas ao webhook na Fase A, **94/94** em
`iachat-test-v8`; 93 execuções consecutivas (3648–3740), **100% no workflow do v8**, zero no
v7.4 — auditado de forma independente, paginando a API.

---

## 4. Resultados

### 4.1 Fase A — determinísticos (17)

**17 PASSOU nas duas versões, exit 0.** Nenhum veredito mudou, e isso é o esperado: os 17 leem
estado no Postgres, código HTTP ou erro de nó — nenhum julga texto de LLM, idioma, rota do
Professor ou abre-alas, que é onde o v8 mexeu.

`A1 A2 A2b A3 A4 A6 A8 · B1 B3 B5 B6 · X1 X2 X3 · R2 R3 S1`

> **A diferença real está na régua, não no número.** No v7.4 este "17/17" saiu de um script que
> não sabia reprovar. Os três testes que hoje são medidos no v8 pela primeira vez (A6, R3, S1)
> antes exercitavam o fluxo em produção.

### 4.2 Fase B — dependentes de LLM (29), N=3 nos qualitativos

Teste a teste. **Só duas linhas mudaram.**

| teste | v7.4 (04/09, N=1) | v8 (06/09, N=3) | |
|---|---|---|---|
| **C1** — corrige `i like play games` (A1) | **FALHOU** | **PASSOU 3/3** | ✅ **melhorou** |
| **T3** — idioma da trilha (B2) | PASSOU | ~~FALHOU 3/3~~ → **PASSOU 3/3** | ⚠️ **era falso vermelho** — ver abaixo |
| A5, PS1, C16, C17, C12, T4, T14 | PASSOU | PASSOU | = |
| C3, C4, C7, R5, T6, T12, T13, T16 | PASSOU | PASSOU 3/3 | = |
| **C15** — usa interesses (A1) | FALHOU | **FALHOU 3/3** | = (segue aberto) |
| C2, C9, C10, C14, R4, T1, T2, T8, T9, T15, T17 | REVISAR | REVISAR | ver §5 |

**Estabilidade:** nenhum teste ficou `INSTÁVEL` (passar em 2 de 3 não conta como PASSOU, por
desenho). Todos os qualitativos deram o mesmo veredito nas três rodadas — inclusive os dois
`FALHOU`, o que os torna reprodutíveis, não ruído.

**Turnos vazios: 0.** Nenhum veredito foi obtido por ausência de resposta (armadilha nº 1).

### 4.3 O T3 não era regressão — era o detector julgando a string errada

Publiquei na primeira versão deste relatório que o **enunciado de B2 saía em português** e chamei
isso de regressão do v8. **Estava errado.** O enunciado real, lido do `runData` (exec 3930):

```
❓ Complete the sentence: I have been studying ___ two hours.
```

Inglês impecável. O que o detector via era o `finalText`, onde o `Parse Professor` **concatena o
cabeçalho da interface** ao enunciado:

```
▶️ Questões de "Present perfect continuous". Acerte 5 seguidas para liberar o próximo
tópico! (sequência atual: 0/5)

❓ Complete the sentence: I have been studying ___ two hours.
```

O cabeçalho é português **por desenho** — é interface, vale em todos os níveis, e nada tem a ver
com o contrato de idioma da trilha. O filtro do T3 removia as linhas rotuladas `[prof.feedback]`,
mas o mesmo texto reaparece sob `[PROFESSOR]`, e essa passava.

**É a armadilha nº 13 pela quarta vez neste projeto:** o instrumento julgando a string errada. E
foi introduzida pelo próprio conserto do T013 — antes dele o T3 nem olhava o enunciado.

Com `soEnunciado()` separando interface de conteúdo, o **T3 dá PASSOU 3/3 ao vivo**. As duas
direções estão no gate: enunciado em inglês com cabeçalho em português **aprova**; enunciado
realmente em português **reprova**; só cabeçalho, sem enunciado, dá **inconclusivo** — nunca
aprovação.

> **Consequência para o T019.** A separação do `LANG` (`LANG_EXPL` / `LANG_PERG`) foi feita para
> consertar um defeito que **não existia**. Ela continua sendo melhoria legítima — nenhum prompt
> deve receber instrução que não lhe diz respeito, e o `qSys` recebia a cláusula de explicação —
> mas seu mérito é higiene de prompt, **não** o conserto de uma regressão. Registrado aqui para
> não virar crédito falso.

---

## 5. Os `REVISAR`, com a rubrica aplicada

Vereditos **propostos** — a confirmação é do Breno. Detalhe, notas por critério e transcrições
em **`tr_revisar_v8.md`**.

| teste | proposta | por quê |
|---|---|---|
| C7, C14, T1, T2, T8, T15 | **PASSOU** | atendem ao critério do teste |
| C2 | ressalva | não repreendeu e ainda corrigiu, mas **não convidou ao inglês** |
| C9 | ressalva | adequado ao A1, porém **genérico** — não acolhe a aluna de 62 anos |
| T9 | ressalva | respondeu bem, mas **usa markdown** (`*`) numa saída HTML: aparece literal |
| T14 | ressalva | confere o *flag*, não se a resposta **aprofundou** |
| **C10** | **FALHOU** | zero reciprocidade e **duas perguntas** — virou interrogatório, com a aluna monossilábica |
| **R4** | **FALHOU** | **repetiu o palavrão do aluno** entre aspas; público começa aos 16 anos |
| **T17** | **FALHOU** | **a persona sumiu da explicação do Professor** (§7) |

---

## 6. Jornada contínua

Percorre o produto inteiro como um aluno novo, **sem semear estado**. Existe porque a bateria
semeia direto no banco para poupar cota e, com isso, **pula as transições do fluxo** — que foi
exatamente por onde os dois defeitos P0 de 04/09 passaram, com 45 testes verdes ao lado.

**A jornada do v8 completou** (`tr_jornada_v8.md`, 375 linhas): onboarding → nivelamento
(**C1** em 11 turnos) → persona **Coach** → interesses (`🎮 Games` + `skate`, incluindo o
"✍️ Outro") → Conversa → Professor → questões → pedido de gabarito → resposta errada. A
comparação é limpa: o v7.4 percorreu **o mesmo caminho, no mesmo nível (C1) e com a mesma
persona (Coach)**.

### 6.1 O que melhorou

| | v7.4 | v8 |
|---|---|---|
| Turnos sem nada enviado ao aluno | **4** | **2** |
| Interesse personalizado ("✍️ Outro" → `skate`) | corrigido em 04/09 | funciona |
| Anti-spoiler no `qual é a resposta?` | não vazou | **não vazou** (gabarito era `would have gone`) |

O bot respondeu ao pedido de gabarito ensinando a estrutura da Third Conditional e devolvendo
a pergunta, sem entregar a resposta — que é o comportamento desejado.

### 6.2 Dois turnos aparecem vazios, e são os mesmos de 04/09

`[botão] ✅ Pronto` (fim do menu de interesses) e **`/menu`** aparecem sem nada enviado ao
aluno. Não é regressão — o v7.4 tem os dois.

> ✅ **CORRIGIDO em 10/09 — não era defeito de produto.** A primeira redação desta seção afirmou
> que o bot ficava mudo, e estava **errada**.
>
> **Evidência (T025):** na execução **3907**, o `Roteador Mestre` registrou `route: "menu"` e o
> nó **`Enviar Menu` executou**, falhando com `Bad request - please check your parameters` — que
> é o erro do `chat_id` sintético que **todo** nó de envio dá no teststand. O bot **tentou
> enviar**; num chat real a mensagem chega.
>
> **Por que o instrumento não via:** o texto do menu mora na **expressão do próprio nó
> Telegram**, então não é publicado em nó de código nenhum que o `digest()` leia — e, como o
> envio falha com `chat_id` falso, nem o `runData` guarda a mensagem. Silêncio em todo lugar
> onde o instrumento olha.
>
> **Foi a armadilha nº 1 na direção contrária:** ela adverte contra tratar resposta vazia como
> aprovação; aqui eu tratei o silêncio do instrumento como **fato sobre o produto**. Ambas são a
> mesma confusão entre "não observei" e "não aconteceu".
>
> **Conserto:** o `digest()` passou a expor `enviosTentados` (nós de envio que rodaram no turno),
> e a jornada agora distingue *"nenhum nó de envio rodou"* de *"o envio rolou, o texto é que não
> é capturável"*. **Turnos vazios reais nesta rodada: 0.**

### 6.3 O sinal mais incômodo desta rodada

Mesma entrada, mesmo nível, mesma persona, e resultado oposto:

```
v7.4 → ✔️ 'I like to play' or 'I like playing' is more natural, Mariana. That's fantastic!...
v8   → That's fantastic, Mariana! Gamers often pick up English super fast because of all the
       in-game dialogue and stories. Which games are you into right now? 🎮⚡
```

**O v8 não corrigiu `i like play video games` em C1.**

> ⚠️ **Isto é um sinal, não uma conclusão.** A jornada roda **N=1**, e o projeto já pagou caro
> por tratar N=1 como evidência. O T012 alterou **apenas** o `Prompt Conversa A1` — não tocou
> em C1 —, então a explicação mais provável é **variância do modelo**, não regressão causada.

Mas ele aponta para algo que a bateria **não cobre**: o C1/C15 mediram correção **no A1**, e o
C3 (que passa) usa `people are`, um erro **da lista** de ERROS QUE CONTAM. `i like play` **não
está na lista**. Ou seja, não há teste medindo correção de erro **fora da lista em nível alto** —
e é exatamente aí que este turno falhou.

Isso conversa diretamente com o diagnóstico do handoff §4 ("a questão não é quais erros estão
na lista — é que o A1 corrige mal, ponto") e o **estende**: talvez não seja só o A1.

**Recomendação:** medir correção de erro fora da lista em B2/C1 com N≥6, no mesmo protocolo do
T011/T012. Se confirmar, a hipótese do exemplo de formato — que resolveu o A1 com uma linha —
provavelmente se aplica aos outros níveis, que **não têm** exemplo de formato no prompt.

---

## 7. ~~O achado mais caro~~ — não era defeito

> ✅ **CORRIGIDO em 10/09, por decisão de produto do Breno: o modo Professor NÃO tem persona.**
> Persona forte é do modo **Conversa**. A explicação da trilha é o texto revisado e ser igual para
> todos os alunos é o comportamento **desejado**.

Esta seção reportava, como o achado mais caro da bateria, que servir a explicação do banco havia
"matado a persona" no Professor — `DEBATER` e `BUDDY` produzindo texto byte a byte idêntico. A
observação era correta; **a classificação como defeito não era.**

Consequências:

- **Servir do banco foi ganho puro:** p90 de **8,00 s → 0,98 s (−88%)**, **sem contrapartida**. A
  tabela de trade-off que estava aqui não descreve nada real.
- O **T17** deixa de ser defeito. O teste foi **invertido**: agora exige que a explicação seja
  **igual** entre personas (`testa_explicacao_sem_persona.js`, no gate), protegendo o corpo
  revisado de ser adulterado aluno a aluno — que é o risco de verdade.
- A **moldura de persona** (T021), implementada para "consertar" isto, foi **revertida** e o v8
  republicado sem ela.

**A lição de método, que é o que sobra:** observar uma mudança de comportamento não é o mesmo que
encontrar um defeito. Faltou perguntar *"isto é desejável?"* antes de classificar como regressão —
e uma tarefa inteira foi gasta consertando uma expectativa que o produto nunca teve.

## 8. Latência

> ⚠️ **Todo número de LLM medido antes de 06/09 está inflado ~1,9×.** O `decompoe()` somava nós
> aninhados: o `Modelo Vertex X` roda **dentro** da janela do `Agente X` e era contado duas
> vezes. O viés atingia **só** os turnos com nó de modelo — ou seja, exatamente o braço de
> comparação. Corrigido em 06/09 (soma por união de intervalos, baldes disjuntos, com regressão
> no gate). **Os valores abaixo são os recalculados**; não reuse número antigo de nenhum
> documento anterior sem recalcular.

| | v7.4 (recalculado) | v8 |
|---|---|---|
| L1 — média por turno | **2,55 s** (era 4,83 s no instrumento velho) | — |
| L1 — p90 | **6,16 s** (era 11,59 s) | — |
| `professor:intro` — p90 | **9,01 s** (era 17,81 s) | **0,98 s** servido do banco |

O ganho do Professor é real e medido (**7,02 s, 88%**, n=12 por condição no mesmo v8), mas a
motivação original do bloco estava inflada em ~1,9×: **o "17,8 s" nunca existiu.**

---

## 9. O que falta para "todos os diagnósticos positivos"

Meta declarada: abrir para usuários reais só quando a bateria estiver limpa. **Faltam 4** — dos 6 itens originais, **dois caíram por serem defeito de instrumento, não de produto** (T3 na §4.3, `/menu` na T025).

| # | defeito | teste | estado |
|---|---|---|---|
| ~~1~~ | ~~Enunciado de B2 em português~~ | T3 | ✅ **NÃO era defeito** — detector julgava o cabeçalho de interface junto do enunciado (§4.3). PASSOU 3/3 ao vivo com o detector corrigido |
| ~~2~~ | ~~Persona sumiu da explicação~~ | T17 | ✅ **não era defeito** — o Professor não tem persona (§7) |
| 3 | **Bot repete o palavrão do aluno** | R4 | 🔴 achado novo · risco para público de 16 anos |
| 4 | **Sem reciprocidade com aluno monossilábico** | C10 | 🔴 achado novo · o `reciprocityLine` existe e prevê o caso — investigar se chegou ao prompt |
| 5 | **Interesses mortos no A1** | C15 | ⚠️ conhecido · 0/9 no T012, 0/3 aqui, **sem hipótese candidata** |
| ~~6~~ | ~~`/menu` e `✅ Pronto` aparecem vazios~~ | jornada §6.2 | ✅ **NÃO era defeito** — resolvido na T025: exec 3907 mostra a rota registrada e o `Enviar Menu` executado. Era cegueira do instrumento, já consertada |

**E um sinal a investigar antes de virar item:** a jornada mostrou o v8 **não corrigindo** um
erro fora da lista em C1, onde o v7.4 corrigiu (§6.3). É N=1 e provavelmente variância — mas
não existe teste medindo correção de erro **fora da lista em nível alto**, e essa é uma lacuna
real da bateria, não do produto.

### Fora da bateria, mas bloqueiam o lançamento

| | |
|---|---|
| **Camada 2 da validação de nome não autentica** | `Validar Nome (IA)` recebe `Authorization failed` da Vertex, o veredito cai no fail-open e **`asdfgh` vira nome de aluno**, sem nada no log. Decisão do Breno: corrigir os `scopes` da credencial `mKfC2ANkOKHfbKal` ou criar `googlePalmApi` |
| **`DEV_COMMANDS = true`** | `/reset` e `/resetfull` funcionam **para qualquer usuário** |
| **Os 60 `.md` sem revisão humana** | o gate confere forma, cobertura e idioma — **não se o texto ensina**. Está medido que um arquivo que nunca enuncia a regra passa |
| **7 testes sem automação** | `A7 B2 C8 L2 R7 S2 S3` — teste descartado é dívida |

---

## 10. Ameaças à validade

- **N=3 detecta quebra, não sustenta estatística fina.** Os dois `FALHOU` foram consistentes
  3/3, o que os torna reprodutíveis; mas um teste "PASSOU 3/3" ainda pode falhar no 4º turno.
- **A rubrica é leitura minha, não do avaliador humano.** Os vereditos da §5 são **propostas**,
  e a nota de "ensina de verdade" (T1) sofre do mesmo limite do gate: eu li uma explicação, não
  as 60.
- **A comparação atravessa mudanças de instrumento.** Três consertos e dois defeitos de alvo
  separam as duas rodadas. Onde o número mudou por instrumento, está dito.
- **Não é possível separar "o v8 corrigiu" de "o modelo mudou"** em nenhum teste de LLM — mas
  aqui os modelos são os mesmos das duas rodadas (Gemini 2.5 flash/flash-lite desde 03/09), o
  que é uma ameaça a menos que em agosto.
- **A régua da Fase A mudou de definição:** o "17/17" do v7.4 veio de um script incapaz de
  reprovar.
- **Um efeito colateral medido do T012:** das 9 correções da variante, **7 eram a mesma frase
  palavra por palavra**. A correção melhorou; a **variedade caiu**. Vale medir antes de chamar
  de ganho líquido.

---

## 11. Reprodutibilidade

```powershell
# ambiente: Postgres 5433 (Docker iachat-pg) + n8n 5678 com WEBHOOK_URL do ngrok
npm run gate                                    # offline, ~5 s, 14 comandos

$env:IACHAT_TEST_PATH="iachat-test-v8"
node fluxos/_teststand/bateria_completa_a.js    # Fase A  (~45 min)
node fluxos/_teststand/bateria_completa_b.js    # Fase B, N=3
node fluxos/_teststand/jornada_usuario.js       # jornada contínua
node db/cleanup_test_users.js --apply           # limpeza obrigatória ao fim

node conteudo/md_para_pdf.js RELATORIO_DIAGNOSTICO_v8.md
```

- **Modelos:** `gemini-2.5-flash` (Conversa, Professor, Dúvida), `gemini-2.5-flash-lite`
  (Extrator, Validar Nome), `whisper-large-v3` na Groq (áudio).
- **IDs de teste** na faixa `990000000–999999999`, derivados do relógio; base limpa ao fim
  (restam as 2 contas reais).
- **Sem a env `IACHAT_TEST_PATH`, tudo aponta para o v7.4 — que é o bot no ar.**

---

## 12. Rodada v8.1 — 10/09/2026

Depois de T019–T023, T025 e T027, a bateria foi repetida no mesmo v8 publicado.

> ⚠️ **Leia o N antes de comparar.** A Fase B foi **interrompida duas vezes por falta de memória
> do sistema** (o processo foi morto, não houve falha de teste) e retomada em blocos. Resultado:
> **só 5 testes chegaram a N=3** (T12, T13, T15, T16, T17). Os demais ficaram em **N=1** — sete
> deles são N=1 por desenho (determinísticos), os outros **por limitação de ambiente**. Onde está
> N=1 sem ser por desenho, o veredito é **indicativo**: detecta quebra grosseira, não sustenta
> comparação fina com a rodada de 06/09, que teve N=3.

### 12.1 Placar

| | v7.4 (04/09) | v8 (06/09) | **v8.1 (10/09)** |
|---|---|---|---|
| **Fase A** | 17 PASSOU | 17 PASSOU | **17 PASSOU** |
| **Fase B — PASSOU** | 16 | 16 | **17** |
| **Fase B — FALHOU** | 2 (C1, C15) | 2 (C15, T3) | **1 (C15)** |
| **Fase B — REVISAR** | 11 | 11 | **11** |

### 12.2 O que mudou de veredito

| teste | v8 (06/09) | v8.1 | |
|---|---|---|---|
| **T3** — idioma da trilha | FALHOU 3/3 | **PASSOU** | ✅ conserto de **instrumento** (§4.3), não de produto |
| **T17** — persona no Professor | FALHOU (rubrica) | **não era defeito** | ✅ decisão de produto (§7): o Professor não tem persona |
| **C15** — interesses no A1 | FALHOU | FALHOU | ⚠️ o probe mede o pior caso (T028) |

### 12.3 ~~T17~~ — encerrado por decisão de produto

A moldura chegou a funcionar ao vivo (`DEBATER` e `BUDDY` com aberturas distintas e corpo
idêntico), mas foi **revertida em 10/09**: o Professor não tem persona. Ver §7.

### 12.4 O que a v8.1 mexeu no produto

| tarefa | efeito medido |
|---|---|
| ~~T021~~ — moldura de persona | **revertida** — o Professor não tem persona (§7) |
| **T022** — precedência da reciprocidade | C10 de **0/6 → 3/6**; "divide algo próprio" 0/6 → 4/6 |
| **T023** — gancho de interesses por código | turno neutro **2/4** (era 0/4); no probe de cortesia segue 0 |
| **T020** — civilidade | publicado; **falta o detector automático** — R4 ainda é leitura humana |
| **T019** — `LANG` separado | higiene de prompt; T12/T13 seguem 3/3, nada regrediu |
| ~~T027~~ — exemplo em B1..C2 | **refutado e revertido**: gerúndio 0/12 antes e depois |

### 12.5 O achado que continua aberto

O **T024** mediu correção de erro **fora da lista** em nível alto: **12/36 (33%)**, e o padrão
importa mais que a taxa:

| probe | B2 | C1 |
|---|---|---|
| `gerundio-apos-like` | 0/6 | 0/6 |
| `artigo-com-incontavel` | 0/6 | 2/6 |
| `plural-irregular` | 4/6 | 6/6 |

**Não é o nível** (B2 e C1 iguais) e **não é a lista** (`childrens` não está nela e é o mais
corrigido). O que se vê é o bot **absorvendo** o erro sintático numa reformulação natural —
`"Oh, that's awesome! I love playing video games too."` — em vez de corrigir, que é o que o
prompt proíbe explicitamente.

A hipótese do exemplo (T027) foi **refutada**. A que sobra, não testada: o **aperto do formato do
A1** (bilíngue obrigatório + teto de 18 palavras) não deixa espaço para absorver o erro, e força o
reparo explícito. Testá-la mexe em C8 e no contrato de naturalidade — é mais de uma variável se
feito de uma vez.

### 12.5b A jornada contínua NÃO foi executada nesta rodada

Tentada e **interrompida pelo sistema por falta de memória**, aos 36 turnos, ainda no
nivelamento. O processo foi morto — não houve falha de teste, e a jornada grava a transcrição
só no fim, então a evidência de 07/09 (`tr_jornada_v8.md`) permaneceu intacta.

**Não conte a jornada como aprovada nesta rodada.** "Não executado" não é "passou" — é a mesma
regra que a armadilha nº 1 aplica a resposta vazia. O que ela verificou em 07/09 (transições reais
do fluxo, sem semear estado) continua valendo para o v8, mas **não cobre** as mudanças de
T019–T023.

Fica pendente: rodar a jornada no v8.1 quando a máquina tiver folga de memória.

### 12.6 Distância até "todos positivos"

| # | item | estado |
|---|---|---|
| 1 | **Correção de erro sintático em nível alto** | 🔴 aberto · 0/12 no gerúndio (T024) |
| 2 | **C15 / probe de interesses** | ⚠️ o gancho funciona em turno neutro; **o probe** é que precisa mudar (T028) |
| 3 | **C10 em 3/6** | ⚠️ melhorou de 0, não está resolvido |
| 4 | **R4 sem detector automático** | ⚠️ cláusula publicada, obediência não provada |

Fora da bateria e dependendo do Breno: **credencial do Vertex** (lixo digitado ainda vira nome de
aluno), **`DEV_COMMANDS = true`**, e a **revisão humana dos 60 `.md`**.

### 12.7 Vereditos, teste a teste

| teste | v8.1 | N |
|---|---|---|
| C1 | PASSOU | 1 ⚠️ |
| C2 | REVISAR | 1 ⚠️ |
| C3 | PASSOU | 1 ⚠️ |
| C4 | PASSOU | 1 ⚠️ |
| C7 | PASSOU | 1 ⚠️ |
| C9 | REVISAR | 1 ⚠️ |
| C10 | REVISAR | 1 ⚠️ |
| C14 | REVISAR | 1 ⚠️ |
| C15 | FALHOU | 1 ⚠️ |
| R4 | REVISAR | 1 ⚠️ |
| R5 | PASSOU | 1 ⚠️ |
| T1 | REVISAR | 1 ⚠️ |
| T2 | REVISAR | 1 ⚠️ |
| T3 | PASSOU | 1 ⚠️ |
| T6 | PASSOU | 1 ⚠️ |
| T8 | REVISAR | 1 ⚠️ |
| T9 | REVISAR | 1 ⚠️ |
| T12 | PASSOU | 3 |
| T13 | PASSOU | 3 |
| T15 | REVISAR | 3 |
| T16 | PASSOU | 3 |
| T17 | REVISAR | 3 |
| A5 | PASSOU | 1 (por desenho) |
| PS1 | PASSOU | 1 (por desenho) |
| C16 | PASSOU | 1 (por desenho) |
| C17 | PASSOU | 1 (por desenho) |
| C12 | PASSOU | 1 (por desenho) |
| T4 | PASSOU | 1 (por desenho) |
| T14 | PASSOU | 1 (por desenho) |

⚠️ = N=1 por interrupção do ambiente, não por desenho: veredito **indicativo**.
