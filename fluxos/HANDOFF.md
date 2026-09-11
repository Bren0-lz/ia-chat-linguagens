# HANDOFF — IAChat

> **Estado em 10/09/2026.** Este é o **único** handoff do projeto: em vez de criar um arquivo
> datado por sessão, atualize este. A proliferação de handoffs datados foi justamente o que
> gerou documentos contraditórios em julho e agosto.
>
> Ele contém: **o que o projeto é e aonde deve chegar** (§1), **onde estamos** (§2), **o que se
> aprendeu sobre o produto** (§3–§5), **as armadilhas já pagas** (§6) e o ferramental (§7–§11).
>
> **§5 é a seção mais importante para quem chega agora.** Ela explica *por que* certas coisas
> melhoraram e outras regrediram — e o padrão que se repetiu tantas vezes que virou método.
>
> Roteiro dos testes: `TESTES_DIAGNOSTICOS.md`. Última medição completa:
> `RELATORIO_DIAGNOSTICO_v8.md` (+ PDF), com as três colunas v7.4 · v8 · v8.1.

---

## 1. O que é o IAChat, e aonde ele precisa chegar

### O produto

Um **tutor de inglês pessoal que vive dentro do Telegram**. O aluno conversa por texto ou áudio,
e o bot faz três coisas que uma escola faz e um app de flashcards não faz:

1. **Descobre o nível dele** com um teste adaptativo de 10 questões (A1 a C2).
2. **Conversa de verdade** sobre o que ele gosta, corrigindo os erros no caminho, com uma
   personalidade que ele escolhe.
3. **Ensina de forma estruturada** no modo Professor: uma trilha de 10 tópicos por nível, com
   explicação, exercícios e tira-dúvidas.

Não é um chatbot com um prompt. O estado do aluno — nível, personalidade, interesses, progresso
na trilha, sequência de dias — vive no Postgres e sobrevive a tudo. As decisões pedagógicas
(subir de nível, avançar tópico, aceitar uma resposta) são **código determinístico**; o LLM
escreve o texto, não decide o currículo. Essa separação é a espinha dorsal do projeto e não
deve ser diluída — e em 10/09 ela ganhou duas confirmações práticas (§5.4).

### A régua de qualidade

| | |
|---|---|
| **Ensina de verdade** | a explicação de um tópico tem de bastar para o aluno acertar as questões dele sozinho |
| **Corrige de verdade** | erro do aluno vira reparo explícito — hoje isso falha em **nível alto** (§4.1) |
| **Não parece um robô** | personalidade reconhecível, usa os interesses do aluno, e não trava esperando o modelo |

### Estágio

**Pré-lançamento.** 2 contas reais no banco. Não há migração a proteger: mudanças de schema, de
prompt e de comportamento são baratas **agora** e ficam caras depois.

---

## 2. Onde estamos — TL;DR

| | |
|---|---|
| **Fluxo do bot** | `IAChat_Telegram_v7.4` — n8n id `9MA0o1XJjD33BnKc`, **101 nós**, `active=true`. **CONGELADO** na tag git `v7.4-congelado`; é ele que atende o Telegram |
| **Fluxo de trabalho** | `IAChat_Telegram_v8` — n8n id `PbwEf7L9xEXhJaCg`, **107 nós**, `active=true` **em paralelo**. Só tráfego de teste: ingress `iachat-test-v8` e `Gatilho Telegram` desabilitado |
| **Arquivo de edição** | `fluxos/IAChat_Telegram_v8.json` — **nunca** o v7.4 |
| **Publicar** | `node fluxos/_teststand/publica_v8.js` (único caminho autorizado; alvo cravado, aborta se o arquivo puder roubar o bot) |
| **Loop** | `PLAN.md` + `STATE.md` + `/next`; agentes em `.claude/agents/`. Gate: `npm run gate` (~3 s, offline, **22 comandos**) |
| **Modelos** | `gemini-2.5-flash` (Conversa, Professor, Dúvida), `gemini-2.5-flash-lite` (Extrator, Validar Nome), `whisper-large-v3` na Groq (áudio) |
| **Banco** | Postgres `127.0.0.1:5433` (Docker `iachat-pg`), 14 migrations |

### "v8.1" é marco, não arquivo

Decidido em 10/09: **não criar `v8.1.json`**. O trabalho segue no `v8.json` e a tag `v8.1` nasce
quando a bateria fechar. O repositório já tem v7.0–v7.4 dividindo o mesmo `webhookId`, com o
aviso de que ativar uma derruba a outra; multiplicar arquivos recria esse problema.

### Placar da última bateria (10/09)

| | v7.4 (04/09) | v8 (06/09) | **v8.1 (10/09)** |
|---|---|---|---|
| **Fase A** (determinísticos) | 17 PASSOU | 17 PASSOU | **17 PASSOU** |
| **Fase B — PASSOU** | 16 | 16 | **17** |
| **Fase B — FALHOU** | 2 | 2 | **1** (C15) |
| **Fase B — REVISAR** | 11 | 11 | **11** |

> ⚠️ **A rodada v8.1 tem N=1 na maioria dos testes.** O sistema matou o processo **três vezes por
> falta de memória**; só T12/T13/T15/T16/T17 chegaram a N=3, e a **jornada não foi executada**.
> Vereditos N=1 são indicativos. Refazer com a máquina folgada antes de comparar com rigor.

### Estado que exige atenção agora

| | |
|---|---|
| 🔴 **Camada 2 da validação de nome não autentica** | `Validar Nome (IA)` recebe `Authorization failed` da Vertex, o `Veredito IA` cai no **fail-open** e **`asdfgh` vira nome de aluno, sem nada no log**. Provado em 4 execuções (`testa_nome_camada2_vivo.js`). Hipótese: a credencial `mKfC2ANkOKHfbKal` não tem `scopes` preenchido — os nós LangChain montam `cloud-platform` sozinhos, o `httpRequest` genérico usa o campo da credencial. **Decisão do Breno:** corrigir os scopes ou criar `googlePalmApi` com API key do AI Studio |
| ⚠️ **`DEV_COMMANDS = true`** | `/reset` e `/resetfull` funcionam **para qualquer usuário**. **DESLIGAR ANTES DO LANÇAMENTO** |
| ⚠️ **60 `.md` sem revisão humana** | o gate confere forma, cobertura e idioma — **não se o texto ensina**. Está medido: um arquivo que nunca enuncia a regra **passa** |

### Como retomar numa sessão nova

Todo o estado está em arquivo — a conversa não é necessária.

1. Leia `CLAUDE.md` e este documento (especialmente **§5** e **§6**).
2. Leia `STATE.md` (tarefa atual, ambiente, diário) e `PLAN.md`.
3. **Confira o ambiente de verdade**, não pela nota: portas 5433 e 5678 abertas e
   `node fluxos/_teststand/gate_vivo_v8.js` respondendo. `active: true` não prova que o webhook
   registrou, e nota de ambiente desatualizada já induziu bloqueio falso neste projeto.
4. Rode `npm run gate`. Vermelho em repositório limpo: pare e descubra por quê.
5. `/next` executa uma tarefa; três reprovações na mesma param o loop.

---

## 3. O que o produto ganhou (e o que custou)

Ordem cronológica, com o efeito **medido** de cada mudança.

| bloco | o que mudou | ganho medido | custo medido |
|---|---|---|---|
| **Professor servido do banco** (T006–T008) | 60 explicações pré-geradas, servidas do Postgres com fallback | p90 **8,00 s → 0,98 s** (−88%) | **nenhum** — a perda de persona na explicação parecia custo, mas o Professor **não deve ter persona** (decisão de 10/09, §5.2) |
| **Abre-alas** (T002) | `📚 Tópico N/10` chega 1,16 s antes do modelo | mata a sensação de travamento | — |
| **Política de idioma** (T005b) | B1..C2 explicam em português; enunciado EN de B1 pra cima | contrato claro | contaminou a geração de questão em B1 (consertado lá) |
| **Exemplo de formato no A1** (T012) | uma linha no `Prompt Conversa A1` | correção **0/9 → 9/9** | variedade caiu: 7 das 9 correções eram a mesma frase |
| ~~Moldura de persona~~ (T021) | ~~abertura/fecho por persona~~ | — | **revertida em 10/09**: o Professor não tem persona, por decisão de produto |
| **Precedência da reciprocidade** (T022) | declarar que vence o gesto da persona | C10 **0/6 → 3/6** | — |
| **Gancho de interesses por código** (T023) | o código escolhe o tema da pergunta final | turno neutro **0/4 → 2/4** | nenhum no probe de cortesia |

**Revertidos por medição** (o protocolo funcionou): dar exemplo ao `reciprocityLine` (1/6, fraco)
e dar exemplo de formato a B1..C2 (gerúndio 0/12 antes e depois).

---

## 4. O que ainda não funciona

### 4.1 Correção de erro sintático em nível alto — **o mais importante**

Medido no T024, N=6 por célula:

| probe | B2 | C1 |
|---|---|---|
| `gerundio-apos-like` (`i like play video games`) | **0/6** | **0/6** |
| `artigo-com-incontavel` (`a advice`) | 0/6 | 2/6 |
| `plural-irregular` (`childrens`) | 4/6 | 6/6 |

**Duas explicações caíram de uma vez:**
- **Não é o nível** — B2 e C1 têm o mesmo padrão.
- **Não é a lista de ERROS QUE CONTAM** — `childrens` não está nela e é o mais corrigido.

O que a evidência mostra:

```
gerúndio (0/12):  "Oh, that's awesome! I love playing video games too."
plural (10/12):   "✔️ 'many children', not 'many childrens'"
```

No gerúndio o bot **usa a forma certa na própria frase sem corrigir o aluno** — literalmente o
que o prompt proíbe (*"não basta usar a forma certa na sua própria frase"*). Ele **absorve** o
erro na reformulação, e o aluno nunca fica sabendo que errou.

**Hipótese do exemplo: REFUTADA** (T027). O que a mata não é o número, é isto: o exemplo que o A1
ganhou no T012 é de **concordância** (`I likes music`), não de gerúndio — e o A1 corrige gerúndio
6/6; e o exemplo que se pôs no B2 era **justamente sobre gerúndio** e não moveu nada.

**A hipótese que sobra, não testada:** o **aperto do formato do A1** (bilíngue obrigatório com
tradução linha a linha + teto de 18 palavras) não deixa espaço para absorver o erro numa
reformulação fluida, e força o reparo explícito. Em B1+ há espaço para reformular natural.
**Cuidado:** testar isso mexe em C8 (teto de palavras) e no contrato de naturalidade — é mais de
uma variável se feito de uma vez.

### 4.2 Interesses no A1 (C15) — e o probe que mede o pior caso

O gancho determinístico do T023 **está no `systemMessage`** (confirmado no `runData`, exec 3992).
Mesmo assim o C15 dá 0/6. A sonda explicou:

| entrada | interesses citados |
|---|---|
| `"hello, how are you today"` (probe atual) | **0/4** |
| `"i went to the park yesterday"` | **2/4** |

O probe manda uma **pergunta social direta**, e o bot responde *"I am good, thanks! How are you?"*
— o que qualquer interlocutor faria. Em turno neutro o gancho funciona, chegando a puxar o
interesse **inferido** (`Did you play sports there? 🏀`).

**O que precisa mudar é o probe** (tarefa T028), não o gancho. E ao mudá-lo: publicar os dois
números lado a lado, **nunca substituir o histórico** — trocar régua no meio da comparação foi o
que saturou o controle no T011.

### 4.3 Outros, menores

| | |
|---|---|
| **C10 em 3/6** | melhorou de 0, não está resolvido |
| **R4 sem detector automático** | a cláusula de civilidade está publicada; a obediência **não foi provada** — ao vivo o teste ainda é leitura humana |
| **T9: markdown na dúvida** | a resposta usa `*` numa saída HTML; aparece literal no Telegram |

---

## 5. O que se aprendeu sobre método — leia antes de mexer

Esta seção existe porque o padrão abaixo se repetiu tantas vezes que deixou de ser coincidência.

### 5.1 Metade dos "defeitos" eram do instrumento

Na rodada de 06–10/09, **de seis defeitos reportados, apenas um sobreviveu**:

| reportado como | era |
|---|---|
| T3 — "enunciado de B2 em português" | o detector julgava o **cabeçalho da interface** junto do enunciado |
| `/menu` e `✅ Pronto` — "não enviam nada" | o texto mora na expressão de um nó Telegram, **invisível ao digest** |
| C15 — "interesses mortos" | o probe mede uma **abertura de cortesia**, o pior cenário possível |
| controle do A1 — "~2/3" | detector saturado: contava o bot que só **usa** a forma certa |
| T17 — "a persona sumiu do Professor" | comportamento **desejado** — o Professor não tem persona (§5.2) |

**Consequência prática:** antes de escrever "o produto está quebrado", leia o `runData` do nó, não
o agregado do instrumento. Custa minutos; publicar um defeito falso custa dias e envenena quem
ler depois.

### 5.2 Nem todo efeito colateral é um custo — pergunte ao produto antes de consertar

Servir a explicação do banco trouxe **−88% de latência** e, no mesmo movimento, fez `DEBATER` e
`BUDDY` produzirem a explicação **byte a byte idêntica**. Isso foi reportado como o "achado mais
caro" da bateria, virou o T17, ganhou uma tarefa (T021) e uma implementação.

**Estava errado.** Em 10/09 o Breno decidiu: **o Professor não tem persona; persona forte é do modo
Conversa.** A explicação da trilha é o texto revisado, e ser igual para todos é o comportamento
**desejado**. Ou seja: servir do banco foi ganho puro, sem contrapartida, e a moldura foi revertida.

**As duas lições, e a segunda é a que custou:**

1. Quando uma mudança tira o LLM do caminho, pergunte **o que mais ele estava fazendo ali** — a
   observação era correta e vale repetir.
2. **Observar uma mudança de comportamento não é o mesmo que ter encontrado um defeito.** Faltou
   perguntar "isto é desejável?" antes de classificar como regressão e gastar uma tarefa
   consertando. O teste T17 media uma expectativa que o produto nunca teve — hoje ele mede o
   contrário (`testa_explicacao_sem_persona.js`), e protege o corpo revisado de ser adulterado por
   aluno.

### 5.3 Diretiva solta perde para diretiva marcada como obrigatória

O `reciprocityLine` chegava ao prompt e era ignorado. A causa: o gesto de assinatura da persona é
marcado `obrigatório em TODA resposta`, dentro de um bloco que diz que a persona é *"a coisa MAIS
visível da sua resposta"*. Uma linha solta competindo com isso perde — em silêncio.

**Declarar a precedência levou C10 de 0/6 a 3/6.** Vale para qualquer regra nova de comportamento.

### 5.4 Determinismo ganhou duas vezes seguidas

- **Moldura de persona (T021):** tabela em vez de chamada de modelo — mesmo resultado visual,
  **zero** custo de latência, corpo revisado fora do alcance do modelo, e testável offline.
- **Gancho de interesses (T023):** o código escolhe o tema; o LLM só escreve.

É a espinha dorsal do §1 aplicada. Quando a decisão couber no código, **não peça ao modelo**.

### 5.5 Few-shot vence instrução — mas não é universal

O T012 provou: trocar o **exemplo de formato** do A1 levou a correção de 0/9 a 9/9, sem tocar em
diretiva nenhuma. **Suspeite de qualquer prompt com "Formato EXATO".**

Mas o T027 mostrou o limite: o mesmo truque em B1..C2 **não moveu nada**. Não generalize sem
medir.

### 5.6 Teste detector nas duas direções ANTES de medir

Os detectores do T024 tinham dois erros, pegos antes de gastar a rodada:
- aceitavam `"an advice"` — que é **errado** (incontável): contaria como acerto o bot ensinando errado;
- exigiam a **ausência** de `childrens`, rejeitando a correção bem-feita, que **cita** a forma
  errada (`"we say X, not Y"`) — o mesmo falso negativo que contaminou o C1 até 04/09.

Um detector que não reprova o comportamento errado **e** aprova o certo não mede nada.

### 5.7 Duas réguas independentes valem mais que uma medida três vezes

O C1 foi confirmado pelo detector do `experimento_a1` **e** pelo detector da bateria, que são
independentes. Isso é evidência muito mais forte que N=3 numa régua só.

### 5.8 O ceticismo que salvou o T012

Um salto de 0/9 para 9/9 numa linha é extraordinário e merecia suspeita: o exemplo novo contém
`We say 'I like music'`, e o detector procura reparo aceitando a palavra `say`. Se o bot decorasse
a frase, o detector marcaria acerto **sem correção real**.

**O teste que resolveu:** o probe do C15 **não tem erro**, e nenhuma das 9 saídas dali contém
`We say`. Se fosse imitação cega, a moldura apareceria onde não há o que corrigir. Reuse esse
desenho — procurar o comportamento onde ele **não deveria** aparecer.

---

## 6. Armadilhas já pagas — NÃO repetir

1. **Resposta vazia não é aprovação.** Testes de negativa passam trivialmente quando o bot não
   responde.
2. **Duração total não mede latência.** O `chat_id` sintético faz o envio falhar e o retry injeta
   7–27 s. Meça `executionTime` por nó e descarte os nós de envio.
3. **Não rotule o turno pela ordem de envio.** Classifique pelo que o `Roteador Mestre` registrou.
4. **Perda determinística não é corrida.**
5. **Detector de correção precisa cobrir a forma curta.** O teto de 18 palavras do A1 força
   `"We say 'are', not 'is'"`.
6. **`msg_count` não detecta corrida** — o incremento é atômico no SQL.
7. **Controle sequencial precisa de ≥12 s de espaçamento.**
8. **Localizar a repetição não é localizar a causa.**
9. **Sempre abrir a transcrição antes de reportar.** Todo falso resultado sobreviveu ao agregado e
   morreu na evidência bruta.
10. **ID alto não significa usuário de teste.** IDs reais do Telegram têm 10 dígitos.
11. **Base suja faz o teste medir resíduo.** Derive o ID do relógio, faixa `990000000–999999999`.
12. **Teste que sorteia a própria condição mede sorte.**
13. **O instrumento pode julgar a string errada.** ⚠️ **Já aconteceu QUATRO vezes** — ver nº 18.
14. **Resposta "vazia" pode ser cegueira do digest.** Texto de nó Telegram **estático** é invisível
    por construção — ver nº 19.
15. **Turno iniciado por CALLBACK precisa de ~35 s**, não os 12 s da nº 7.
16. **Nó aninhado contado duas vezes.** O `decompoe()` somava `executionTime` de sub-nós que rodam
    **dentro** da janela do agente. Inflava ~1,9× **só** os turnos com LLM — o braço de comparação.
    Corrigido por união de intervalos e baldes disjuntos, com regressão no gate. **Não reuse número
    de LLM anterior a 06/09 sem recalcular.** Duas lições de método vieram junto: *a API do n8n
    pagina* (não paginar produziu um "fato" errado publicado no handoff), e *conferência de sanidade
    tem de conferir o que é publicado*, não recalcular pelo mesmo caminho que produziu o número.
17. **Mudança de produto quebra fixture de teste.** A validação de nome passou a recusar `'Teste'`,
    e quatro testes reprovaram por causa do fixture.
18. **A nº 13 pela quarta vez — e introduzida por um CONSERTO.** O T013 fez o T3 passar a julgar o
    enunciado da questão; junto entrou o **cabeçalho de interface** que o `Parse Professor`
    concatena (`▶️ Questões de "…". Acerte 5 seguidas…`), português **por desenho**. Resultado:
    falso vermelho 3/3, publicado como "regressão do v8". **Quem amplia o que um teste julga tem de
    conferir o que entrou no escopo do julgamento.** Conserto: `soEnunciado()` no
    `idioma_professor.js`, com as três direções no gate.
19. **A nº 1 na direção contrária.** Ela adverte contra tratar resposta vazia como aprovação; o erro
    cometido foi tratar **silêncio do instrumento como fato sobre o produto** (`/menu` "mudo").
    Mesma confusão entre "não observei" e "não aconteceu". O `digest()` agora expõe
    `enviosTentados`.
20. **Erro de nó com `onError: continueRegularOutput` não fica em `runData[nó][0].error`** — viaja
    no `json.error` do **item de saída**. Instrumento que só olha `.error` fica cego, inclusive o
    `errs` do `digest()`.
21. **URL cravada manda teste para PRODUÇÃO.** A Fase A montava `BASE + '/webhook/iachat-test'` em
    três pontos, ignorando `IACHAT_TEST_PATH`: rodando "no v8", R3 e S1 batiam no **v7.4 que atende
    usuários reais**, com o relatório dizendo v8. Em 04/09 passou despercebido porque o alvo
    pretendido *era* o v7.4 — a coincidência escondeu o defeito. Guardado por
    `testa_alvo_bateria_a.js` no gate.
22. **Nome de transcrição cravado apaga evidência.** `bateria_completa_b.js` e `jornada_usuario.js`
    gravavam em caminho fixo, e a jornada com `writeFileSync` (**sobrescreve**). Rodá-las no v8
    teria destruído o lado esquerdo da comparação ao produzir o direito. Agora o nome **deriva do
    ingress** (`alvo.js`). **Limite conhecido:** ele distingue por *versão*, não por *data* — duas
    rodadas na mesma versão ainda colidem.
23. **Rótulo errado em evidência envenena igual a número errado.** O `jornada_usuario.js` cravava
    `"— v7.4"` no cabeçalho, e o `tr_jornada_v8.md` nasceu dizendo que media o v7.4.
24. **"Não executado" não vira "passou".** A jornada do v8.1 morreu aos 36 turnos e **não** foi
    contada como aprovada. É a nº 1 aplicada a processo interrompido.

---

## 7. Ambiente — o que quebra

### `WEBHOOK_URL` (o mais caro de todos)

Sem `WEBHOOK_URL` no ambiente do processo, o n8n oferece `http://localhost:5678/` ao Telegram, que
**recusa não-HTTPS**. A falha derruba a **ativação inteira** e leva junto o `TEST Ingress` — o
sintoma é 404 em *todos* os webhooks, com o workflow marcado `active: true`.

Subir assim, tudo na **mesma** janela:

```powershell
$env:WEBHOOK_URL="https://SUA-URL.ngrok-free.dev"
$env:N8N_PROTOCOL="https"
$env:N8N_HOST="SUA-URL.ngrok-free.dev"
npx n8n
```

URL corrente em `http://localhost:4040/api/tunnels`.

### Outros

- **Docker/Postgres:** quando o engine trava (comum após suspensão no Windows), o processo continua
  vivo, `docker ps` **pendura** e a 5433 fica fechada. Sintoma no fluxo: `Connection refused` em
  `::1:5433` no `Carregar Aluno`. Reinicie o Docker Desktop. **Não tente subir Docker sozinho** —
  é regra do `CLAUDE.md`.
- **Memória:** em 10/09 o sistema **matou o processo três vezes** durante baterias longas. Sintoma:
  a tarefa some sem erro de teste. Rode a Fase B em blocos (`--only=...`) quando a máquina estiver
  apertada, e **preserve o parcial** antes de retomar — o script sobrescreve a transcrição.
- **Ativação via MCP que falha desativa o workflow.** Confira `active` depois de qualquer update.
- **Leitura de credenciais pela API pública está bloqueada** (405). Para achar o id, abra na
  interface do n8n — está na URL.

---

## 8. Convenções acertadas

- **Commits COM atribuição** (`Co-Authored-By`).
- **Não publicar nem ativar sem pedido explícito.** Vale para workflow, `git push` e qualquer coisa
  que mande mensagem real no Telegram. **A autorização vale para o bloco em que foi dada** — peça
  de novo no bloco seguinte.
- **Protocolo de experimento:** baseline com N≥6 → alterar **uma** linha → medir → **reverter** se
  não melhorar → conferir nas duas pontas com `git diff`. Nunca reverter com rodada em voo.
- **Nunca editar o fluxo com bateria rodando.**
- **Escrever o teste JUNTO com a correção**, e conferir que ele **reprova a versão anterior**.
  Teste que não reprova o código velho não prova nada — e **prove rodando** (`git stash`), não
  afirmando.
- **Validar sintaxe antes de publicar** (`node --check` ou `new Function`).
- **Editar o JSON por script Node**, nunca à mão. Nó novo precisa de entrada em `connections`.
- **Limpar usuários de teste ao fim:** `node db/cleanup_test_users.js --apply`.
- **Credenciais não passam pelo assistente.**
- **Ao commitar com medição em voo, commite arquivo por arquivo** — `git add -A` captura trabalho
  pela metade e mistura duas tarefas num commit.

---

## 9. Ferramental (`fluxos/_teststand/`)

| Script | Para quê |
|---|---|
| `harness.js` | base: POST no ingress + captura da execução + `digest()` (expõe `enviosTentados`) |
| `alvo.js` | **rótulo e nome de transcrição derivados do ingress** — impede sobrescrever evidência. Desde o T031, `caminhoLivre(alvo, existe, agora)` (disco e relógio injetados) data o arquivo quando o nome base já está ocupado |
| `parcial.js` | **T032** — diário incremental (JSONL append-only) que faz a bateria sobreviver à morte por memória: `--continuar` retoma na mesma transcrição; sem a flag, parcial esquecido é arquivado, não apagado |
| `registra_urls.js` | preload que grava toda URL de `fetch`: prova para onde o teste foi |
| `publica_v8.js` | **único** caminho autorizado de publicação; alvo cravado no v8 |
| `gate_vivo_v8.js` | gate ao vivo — uma mensagem pelo ingress (**só cobre onboarding**) |
| `bateria_completa_a.js` | Fase A — 17 determinísticos (sai 1 em reprovação, 2 em inconclusivo) |
| `bateria_completa_b.js` | Fase B — 29 dependentes do LLM (`--only=` para blocos) |
| `jornada_usuario.js` | jornada contínua, sem semear estado — achou os dois P0 |
| `idioma_professor.js` | contrato de idioma **derivado do `LANG` do fluxo** + `soEnunciado()` |
| `experimento_a1.js` | C1/C15 com baseline e variantes |
| `experimento_reciprocidade.js` | C10 com detector objetivo (divide algo próprio + ≤1 pergunta) |
| `mede_correcao_nivel_alto.js` | **T024** — correção de erro fora da lista em B2/C1 |
| `testa_nome_camada2_vivo.js` | camada 2 da validação de nome; distingue recusa de fail-open |
| `vivo_duvida_markdown.js` | **T029/T033** — a rota da dúvida no fluxo publicado: prova que `Formatar Dúvida` rodou (se não rodou, o v8 no ar é o velho) e que o texto chega sem markdown |
| `analisa_latencia.js` | L1 por rota (union de intervalos, baldes disjuntos) |
| `conteudo/md_para_pdf.js` | `.md` → HTML → Chrome headless. Sem pandoc, sem puppeteer, sem instalar nada |

**No `npm run gate`** (offline, ~3 s medidos em 11/09, **22 comandos**): `regressao_v7.4` ·
`testa_cadastro_nome` · `testa_nome_camada1` · `testa_abre_alas_professor` ·
`testa_explicacao_do_banco` · `testa_decompoe_latencia` · `testa_alvo_bateria_a` ·
`testa_alvo_jornada` · `testa_transcricao_sem_sobrescrita` · `testa_parcial_retomada` ·
`testa_lang_separado` · `testa_civilidade` · `testa_explicacao_sem_persona` ·
`testa_markdown_saida` · `testa_topico_uma_vez` · `valida_track` · `valida_explicacoes` · `testa_valida_explicacoes` ·
`simula_vazamento` · `testa_idioma_professor` · `testa_saida_fase_a` · `testa_detector_controle` ·
e o `git diff --quiet` do congelado.

---

## 10. Como reproduzir

### Testar sem Telegram real

`POST http://localhost:5678/webhook/iachat-test-v8` com um update do Telegram no corpo. **Exige o
header `x-iachat-test`** com o valor de `IACHAT_TEST_SECRET` — sem ele o n8n responde 403 (teste S1).

**`IACHAT_TEST_PATH` tem de ser setado ANTES do `require('./harness')`** — o WEBHOOK é calculado
em tempo de carga, e o default é `iachat-test`, que é **o bot no ar**.

O fluxo processa e tenta enviar ao Telegram; com `chatId` sintético o envio falha (400), mas todos
os nós a montante rodam. **Filtre a execução pelo `user_id` do corpo**, nunca "a mais nova".

### Callbacks úteis

`pl_start_A1` … `pl_start_B2` · `ans_A` … `ans_D` · `pl_pause` / `pl_resume` ·
`persona_buddy` / `persona_coach` / `persona_comedian` / `persona_debater` / `persona_formal` ·
`int_open` / `int_games` / `int_music` / `int_other` / `int_done` ·
`mode_chat` / `mode_teacher` · `t_start` / `t_doubt` / `t_next` / `t_resume` · `cfg_open`

**`mode_teacher` NÃO dispara a explicação** — só confirma o modo. É a mensagem seguinte que cai no
subroute intro. Todo teste da rota Professor precisa dos dois turnos.

---

## 11. Evidência preservada

Não apague, não são regeneráveis:

- `RELATORIO_DIAGNOSTICO_v8.md` (+ PDF) — comparativo v7.4 · v8 · v8.1
- `tr_bateria_a.md` / `tr_bateria_b.md` / `tr_jornada.md` — **v7.4**
- `tr_bateria_a_v8.md` / `tr_bateria_b_v8.md` / `tr_jornada_v8.md` — **v8**
- `tr_bateria_a_v81.md` / `tr_bateria_b_v81.md` — **v8.1**
- `tr_revisar_v8.md` — vereditos por rubrica, com nota por critério
- `tr_experimento_a1.md` / `tr_experimento_reciprocidade.md` / `tr_correcao_nivel_alto_v8.md`
- `MEDICOES_*.md`, `documentos/transcricoes/`, `CHANGELOG_v7.*.md`

### Descoberta metodológica que vale manter

Em 13/07 três testes foram excluídos por dificuldade de execução. Dois foram recuperados em 19/08 e
**os dois acharam defeito na primeira execução**. Em 04/09 a lição voltou: **a bateria inteira
estava verde e um usuário comum achou dois defeitos P0 em dez minutos**, porque nenhum teste
percorria as transições do fluxo. E em 10/09 ela voltou de novo: **o T024 — um teste que não
existia — achou 0/12 num erro que a bateria inteira dava por coberto.**

**Teste descartado é dívida, não escopo resolvido. E lacuna de cobertura é defeito invisível.**
