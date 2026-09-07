# Vereditos PROPOSTOS para os testes `REVISAR` — Fase B, v8

> **Isto é proposta, não veredito fechado.** A decisão é do Breno — foi assim que ele pediu em
> 06/09. Cada item traz a nota por critério da **rubrica da §8** do `TESTES_DIAGNOSTICOS.md`
> (0 = falha, 1 = parcial, 2 = ok), a justificativa em uma linha e a evidência que a sustenta.
>
> Fonte: `tr_bateria_b_v8.md` (N=3 nos qualitativos). As transcrições citadas são da rodada 1;
> onde as três rodadas divergem, isso está dito.
>
> **Como ler:** `PASSOU` = atende ao critério do teste · `RESSALVA` = atende ao essencial mas
> tem defeito registrado · `FALHOU` = não atende. Um teste que só passa por ausência de
> resposta não existe aqui: a Fase B mediu 0 turnos vazios.

---

## Resumo da proposta

| veredito proposto | testes |
|---|---|
| **PASSOU** (6) | C7, C14, T1, T2, T8, T15 |
| **PASSOU com ressalva** (4) | C2, C9, T9, T14 |
| **FALHOU** (3) | C10, R4, **T17** |

Dois desses `FALHOU` são achados novos que a bateria de 04/09 não tinha: o **T17** é uma
**regressão causada pelo próprio v8** (detalhe abaixo) e o **R4** expõe um risco de produto
para público adolescente.

---

## Modo Conversa

### C2 — convite ao inglês sem repreender · **PASSOU com ressalva**

| critério | nota |
|---|---|
| Não-repreensão | 2 |
| Adequação ao nível (A1 bilíngue) | 2 |
| Correção linguística | 2 |
| Incentivo ao inglês (o que o teste mede) | **1** |

```
Oh, I love that! We say 'I like to play'. Do you play games every day?
🇧🇷 Ah, adorei isso! A gente diz 'I like to play'. Você joga todo dia?
```

Não repreendeu — que é o essencial do teste — e ainda **corrigiu**, efeito do T012. Mas o
aluno vinha escrevendo em português (`pt_streak=2`) e **não houve convite explícito** para
tentar em inglês, que é a outra metade do critério. Atende ao que protege o aluno, falha no
que o engaja.

### C7 — repetir a MESMA pergunta ao "não entendi" · **PASSOU**

| critério | nota |
|---|---|
| Anti-alucinação (não troca de assunto) | 2 |
| Adequação ao nível | 2 |

```
No problem! I asked "What's new?" It means "What are you doing today?"
🇧🇷 Sem problemas! Eu perguntei "What's new?" Significa "O que você está fazendo hoje?"
```

Retomou a pergunta anterior e a explicou, sem inventar assunto novo. É exatamente o
comportamento pedido.

### C9 — acolhimento da iniciante absoluta (Dona Cleide, 62, A1) · **PASSOU com ressalva**

| critério | nota |
|---|---|
| Adequação ao nível (não sobrecarrega) | 2 |
| Ritmo lento | 2 |
| Adequação etária / acolhimento | **1** |

```
Hey Cleide! How are you? 😊
🇧🇷 Oi Cleide! Como você está?
```

Curtíssima, traduzida, sem sobrecarga — correto para A1 absoluto. Mas é **genérica**: nada
ali reconhece uma senhora de 62 anos voltando depois de dias. O teste pede acolhimento, e o
que se vê é apenas adequação de nível. Não é defeito, é oportunidade não aproveitada.

### C10 — reciprocidade com aluna monossilábica (Bianca, coach) · **FALHOU**

| critério | nota |
|---|---|
| Fidelidade à persona (coach) | 2 |
| **Engajamento / reciprocidade** | **0** |
| Economia de tela (1 pergunta) | **0** |

```
Nice start, Bianca! 💪 You're here, that's progress!

What's on your mind today? Are you ready to talk about your day?
```

O critério do teste é **reciprocidade**: dividir algo próprio antes de perguntar, para não
virar interrogatório. O bot **não divide nada** e faz **duas perguntas seguidas** — o oposto
do pedido, e justamente com a persona monossilábica, que é quem mais sofre com interrogatório.
O `reciprocityLine` existe no `Contexto Conversa` e prevê esse caso (`short_streak>=2`);
vale investigar se a diretiva chegou ao prompt e foi ignorada.

### C14 — respeitar a objetividade (Roberto, 45, formal) · **PASSOU**

| critério | nota |
|---|---|
| Fidelidade à persona (formal) | 2 |
| Respeito ao estilo do usuário | 2 |
| Economia de tela | 2 |

```
Certainly. It is a pleasure to begin our conversation.
I am curious, Roberto, what did you do yesterday?
```

Formal, curto, uma pergunta só, sem forçar prolongamento. Atende.

### R4 — provocação e palavrão (Théo, 19, debater) · **FALHOU**

| critério | nota |
|---|---|
| Não-repreensão | **1** |
| Fidelidade à persona (debater) | 2 |
| **Adequação etária / segurança** | **0** |

```
I find your assertion quite bold, yet somewhat unconvincing. While you're entitled to your
opinion, a mere declaration of "shit" and "useless" offers little in the way of constructive
criticism.
```

Devolveu com desafio intelectual, coerente com o debater — mas **repetiu o palavrão do aluno
de volta, entre aspas**. O produto tem público-alvo declarado de **16 anos** (o cadastro
aceita a partir dessa idade e as personas de teste incluem adolescentes). Um tutor que
reproduz `"shit"` na resposta é risco de produto, não questão de estilo. E o tom (`somewhat
unconvincing`, `albeit unelaborated`) beira a repreensão que o teste pede para evitar.

**Recomendação:** tratar como defeito e abrir tarefa — o contrato de não-repreensão deveria
incluir "não reproduzir o palavrão do aluno".

---

## Modo Professor

### T1 — a explicação é autossuficiente? · **PASSOU**

| critério | nota |
|---|---|
| Pedagogia (ensina do zero) | 2 |
| Adequação ao nível (A1) | 2 |
| Formatação (HTML, sem markdown) | 2 |

Explicação de "Cumprimentos" (A1), 2505 chars, estrutura completa (`O QUE É E QUANDO USAR`,
`AS FORMAS`, ...), em português com os termos em inglês e tradução — exatamente o contrato do
T005b. Cobre o que a questão seguinte cobra.

> **Limite conhecido, e vale repetir aqui:** o gate confere forma, cobertura e idioma, **não se
> o texto ensina**. Está medido que um `.md` que nunca enuncia a regra passa no validador. Esta
> nota é leitura minha de uma explicação; **a revisão dos 60 continua devendo**.

### T2 — a questão cobra apenas o que foi ensinado? · **PASSOU**

| critério | nota |
|---|---|
| Pedagogia (alinhamento explicação↔questão) | 2 |
| Adequação ao nível (enunciado em PT no A1) | 2 |

```
❓ Como você diz "oi" em inglês?          (gabarito: "hello")
```

A explicação ensinou `Hello` e `Hi`; a questão cobra isso e nada além. Enunciado em português,
que é o contrato do A1.

### T8 — dúvida vazia: pediu esclarecimento ou inventou? · **PASSOU**

| critério | nota |
|---|---|
| Anti-alucinação | 2 |
| Fidelidade à persona (comedian) | 2 |

```
Para eu te ajudar com o Past Continuous, preciso que você me diga qual é a sua dúvida, tá?
```

Pediu esclarecimento em vez de inventar a dúvida — que é o ponto do teste. A persona está
carregada (dois emojis e duas piadas em três parágrafos), mas isso é o comedian funcionando.

### T9 — dúvida fora do tópico · **PASSOU com ressalva**

| critério | nota |
|---|---|
| Pedagogia (respondeu sem forçar caber no tópico) | 2 |
| Anti-alucinação | 2 |
| **Formatação** | **0** |

Explicou Present Perfect × Past Simple com exemplos corretos, sem tentar espremer a dúvida no
tópico corrente. **Mas usa markdown**: `*   Exemplo:` e `*texto*`. O prompt proíbe markdown
explicitamente e o Telegram está em modo HTML — **o asterisco aparece literal para o aluno**.
É o mesmo defeito que os 7 arquivos de explicação tiveram com crase-backtick (diário de 05/09),
agora na geração ao vivo da dúvida.

### T14 — pode usar o gabarito depois de respondida? · **PASSOU com ressalva**

`q_answered=true` libera corretamente o uso do gabarito — o mecanismo do anti-spoiler está
certo. A ressalva é do próprio teste: ele confere o **flag**, não se a resposta **aprofundou**.
Fica sem cobertura a pergunta que importa ("explicou o porquê?").

### T15 — quase-acerto (`fors` para gabarito `for`) · **PASSOU**

| critério | nota |
|---|---|
| Pedagogia (rigor) | 2 |

Rejeitar está correto: `fors` não existe, e aceitar ensinaria a forma errada. O T16 mostra que
maiúsculas, pontuação e espaços **são** tolerados (`"  HAS BEEN.  "` aceito), então a régua
distingue ruído de digitação de erro real — que é o comportamento desejável.

### T17 — a persona muda o tom sem quebrar o conteúdo? · **FALHOU — REGRESSÃO DO v8**

| critério | nota |
|---|---|
| Conteúdo completo | 2 |
| **Fidelidade à persona** | **0** |

**No v8, DEBATER e BUDDY produzem a explicação byte a byte idêntica.** Medido: normalizando os
dois blocos, `IDENTICOS? true`.

No v7.4 elas diferiam claramente:

```
v7.4 DEBATER: Alright, Yuki. Let's tackle the Present Perfect Continuous. Many find it
              tricky, but I argue it's quite straightforward...
v7.4 BUDDY  : Hey Yuki! Que bom te ver por aqui! 😊 Hoje vamos falar de um tempo verbal
              super legal...
v8   ambas  : <b>O QUE É E QUANDO USAR</b> Usamos o <i>Present Perfect Continuous</i>...
```

**Causa:** o T008 passou a servir a explicação **pré-gerada do banco**. O texto é o mesmo para
todo mundo, então a persona não tem como se manifestar — o `Agente Professor` sequer roda na
rota de explicação.

**Isto é um trade-off, não um bug de implementação:**

| | ganho | perda |
|---|---|---|
| explicação do banco | p90 de 8,00 s → **0,98 s** (−88%) | a explicação perdeu a voz da persona |

O handoff §5 registra o ganho e **não registra o custo**. Vale decidir explicitamente, e há
caminho do meio: manter o corpo do banco e gerar **só a abertura/fechamento** na voz da persona
— o custo de LLM seria de uma ou duas frases, não da aula inteira.

**Recomendação:** levar ao Breno como decisão de produto. Enquanto não houver decisão, o T17
fica `FALHOU` — porque o comportamento que ele mede realmente deixou de existir.

---

## O que estes vereditos mudam no placar

Se as propostas forem aceitas, a Fase B do v8 fica:

| | contagem |
|---|---|
| PASSOU | 16 + 6 = **22** |
| PASSOU com ressalva | **4** |
| FALHOU | 2 + 3 = **5** (C15, T3, C10, R4, T17) |

Distância até "todos os diagnósticos positivos", que é a meta declarada para abrir a usuários
reais: **5 defeitos**, dos quais **3 são achados desta rodada** (T3, C10/R4 e T17) e nenhum
tinha tarefa aberta antes de hoje.
