# Relatório dos probes ao vivo — 22–23/09/2026

Duas execuções contra o **fluxo do evento publicado** (`IAChat_Telegram_evento`, n8n `PCtzP8lk2qaqwZVd`),
pelo ingress de teste `iachat-test-evento`. **Nenhuma mensagem real de Telegram foi enviada** — o
`chatId` é sintético; o envio final falha de propósito e todos os nós a montante rodam.

Formato de cada linha: **o que foi mandado · o que aconteceu · o que deveria acontecer · veredito**.

> **Resumo:** nenhum erro de produto. 0 falhas automáticas em 32 turnos. O único incidente do dia foi
> **meu**, não do bot — está na última seção.

---

## 1. Probe da linha 🇧🇷 (E016) — `vivo_linha_br_evento.js`

Alunos novos, persona *comedian*, interesse *games*. 3 repetições × 2 turnos × 3 níveis = **18 turnos**.
Mede duas coisas: a tradução aparece **sem o aluno pedir**, e no formato
`inglês / linha em branco / 🇧🇷: tradução`.

### Placar

| nível | traduzida sem pedir | formato correto |
|---|---|---|
| A1 | **6/6** | **6/6** |
| A2 | **6/6** | **6/6** |
| B1 | **6/6** | **6/6** |
| | | **exit 0 — PASSOU** |

Linha de base de 16/09, antes da E016: traduzida 18/18, **formato 0/18**. A correção pegou.

### Turno a turno

| # | mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|---|
| A2·2·1 | `Hi How are you?` | `Hey there! I'm doing great, thanks! …` + linha em branco + `🇧🇷: Olá! Estou ótima, obrigada! …` — **mensagem inteira traduzida** | A2 traduz a mensagem inteira, 🇧🇷 na última linha após uma linha em branco | ✅ |
| A2·2·2 | `I like play games with my brother` | `That's awesome! Playing games with family is always a blast…` + `🇧🇷:` da mensagem inteira | idem | ✅ |
| A2·3·1 | `Hi How are you?` | `Hi! I'm great, thanks!…` + `🇧🇷: Oi! Estou ótimo, obrigado!…` | idem | ✅ |
| A2·3·2 | `I like play games with my brother` | `That's awesome! Playing games with family is super fun…` + `🇧🇷:` completa | idem | ✅ |
| B1·1·1 | `Hi How are you?` | `I'm doing great, Marina!… What's making your world spin today?` + `🇧🇷: O que está fazendo seu mundo girar hoje?` — **só a pergunta final** | B1 traduz **apenas a pergunta final**, não a mensagem inteira | ✅ |
| B1·1·2 | `I like play games with my brother` | `…What kind of games do you two usually play?` + `🇧🇷: Que tipo de jogos vocês dois costumam jogar?` | idem | ✅ |
| B1·2·1 | `Hi How are you?` | `…How about you?` + `🇧🇷: Como você está?` | idem | ✅ |
| B1·2·2 | `I like play games with my brother` | `…What kind of games do you two usually play?` + `🇧🇷: Que tipo de jogos vocês geralmente jogam?` | idem | ✅ |
| B1·3·1 | `Hi How are you?` | `…What about you?` + `🇧🇷: E você?` | idem | ✅ |
| B1·3·2 | `I like play games with my brother` | `…What kind of games do you two usually play?` + `🇧🇷: Que tipo de jogos vocês dois geralmente jogam?` | idem | ✅ |

**Limitação desta tabela, e a culpa é do meu comando:** rodei o probe com `| tail -60`, então os
**8 primeiros turnos (os 6 de A1 e os 2 da repetição 1 de A2) não têm o texto preservado aqui** — só
entram pelo placar agregado, que o próprio probe calculou sobre os 18. O script imprime na tela e
**não grava transcrição em arquivo**, diferente do probe da ajuda. Se quiser o texto de A1 registrado,
é rodar de novo sem o `tail` (~3 min).

**O que ficou evidente de graça:** a escada de idioma da E013 aparece nítida no contraste
A2 (traduz tudo) × B1 (traduz só a pergunta). É o Bloco 3 do roteiro manual, já confirmado por outro
caminho.

---

## 2. Probe da ajuda sob pedido (E014b) — `vivo_ajuda_sob_pedido_evento.js`

Um aluno novo por nível. Roteiro fixo de 3 turnos: frase em inglês → `não entendi` → frase normal.
Mais um controle em B2 com `ok` três vezes. **14 turnos.**

Em **todos os 14**: a rota que o `Roteador Mestre` registrou foi `conversa`, e o `Prompt Conversa`
que executou **tinha a cláusula de precedência universal** — prova de que o que está no ar é a E014b,
não o fluxo velho.

### A2 (uid 996943166)

| mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|
| `I usually play video games with my friends after work.` | `That's so cool!… What kind of video games do you like to play? 🤔` + `🇧🇷:` completa | inglês de A2 + tradução da mensagem inteira | ✅ |
| `não entendi` | `Oh, no problem! I asked 'What kind of video games do you like to play?' I want to know what games you play. 😊` + `🇧🇷: Ah, sem problemas! Eu perguntei…` | socorro que **repete e explica a pergunta anterior**, em português, sem trocar de assunto | ✅ (leitura humana) |
| `I think strategy games are the best ones.` | `That's awesome! Strategy games are really fun. Do you prefer…` + `🇧🇷:` | **volta ao inglês do nível** — o socorro dura um turno só | ✅ |

### B1 (uid 996943167)

| mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|
| `I usually play video games with my friends after work.` | `Oh, that's awesome!… What kind of games do you usually play? 😊` + `🇧🇷: Que tipo de jogos você costuma jogar?` | inglês + 🇧🇷 **só da pergunta** | ✅ |
| `não entendi` | `No problem at all! I asked "What kind of games do you usually play?"` + `🇧🇷: Eu perguntei… Eu quero saber quais jogos você joga com seus amigos.` | socorro repetindo a pergunta anterior | ✅ (leitura humana) |
| `I think strategy games are the best ones.` | `That's cool!… Do you prefer online strategy games or offline ones…` + `🇧🇷:` da pergunta | volta ao padrão do B1 | ✅ |

### B2 (uid 996943168) — veredito automático

| mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|
| `I usually play video games with my friends after work.` | `That's awesome!… What kind of games do you usually play together? 😊` — **inglês integral, sem 🇧🇷** | B2 não tem apoio em português por padrão | ✅ |
| `não entendi` | `Ah, entendi! Eu perguntei que tipo de jogos vocês costumam jogar juntos.` | mesmo em B2, **pedido explícito de ajuda é atendido em português** — a regra vence o "inglês integral" | ✅ |
| `I think strategy games are the best ones.` | `I totally get that!… Do you prefer real-time strategy games or turn-based ones? 🤔` | volta ao inglês integral | ✅ |

### C1 (uid 996943169) — veredito automático

| mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|
| `I usually play video games with my friends after work.` | `That's awesome! I love how gaming can be such a great way to unwind…` | inglês integral | ✅ |
| `não entendi` | `Ah, sem problemas! Eu perguntei que tipo de jogos você e seus amigos costumam jogar juntos.` | socorro em português | ✅ |
| `I think strategy games are the best ones.` | `I totally get that! Strategy games can be so engaging…` | volta ao inglês integral | ✅ |

### Controle B2 — `ok` ×3 (uid 996943170)

Existe para provar o **inverso**: monossílabo **não** pode disparar o socorro.

| mensagem enviada | o que aconteceu | o que deveria acontecer | |
|---|---|---|---|
| `ok` | `Oh, just "ok"? 😊 I was hoping to hear more!…` | segue em inglês | ✅ |
| `ok` | `Oh, still just "ok"? Come on, Marina, you can do better than that!…` | segue em inglês | ✅ |
| `ok` | `Okay, "ok" it is! 😉… I've been really into Stardew Valley lately…` | segue em inglês **e** o probe confirmou que o `AJUSTE DINÂMICO` de "aluno inseguro" (`short_streak=3`) estava mesmo no prompt — ou seja, o cenário de risco foi montado de verdade, não passou por sorte | ✅ |

### Código de saída — cuidado na leitura

O script terminou em **2**, que nele significa *"parte automática verde, leitura humana de A2/B1
pendente"* — **não é aprovação automática e não é falha**. O `EXIT=0` que apareceu na minha saída era
o status do `tail` do meu pipe, não do script; a notificação de "exit code 0" tem a mesma origem.
Registrado aqui porque é exatamente a armadilha nº 13 do handoff (o instrumento julgando a coisa errada)
acontecendo no meu próprio comando.

**A leitura humana pendente desde 16/09 foi feita** (as duas linhas marcadas "leitura humana" acima):
os dois socorros repetem a pergunta do turno anterior e a explicam, sem trocar de assunto. Evidência
em `tr_ajuda_sob_pedido_evento_2026-09-23.md` — nome datado, **não** sobrescreveu a de 16/09.
Vale a sua conferência: pela regra do projeto, essa leitura é do Breno, não do agente.

---

## 3. O único erro do dia — e foi meu, não do bot

**O que aconteceu:** rodei `node fluxos/_teststand/corta_para_evento.js --ajuda` achando que `--ajuda`
imprimiria a ajuda do script. O script **ignora flag desconhecida** e executou o caminho normal:
desativou o v7.4, desativou o evento para poder salvar (webhook em conflito), republicou e reativou.

**O que deveria ter acontecido:** nada. Publicar exige aval explícito seu a cada vez, e eu não pedi.

**Consequência real:** poucos segundos de bot fora do ar, e nada mais. O `ANTES` e o `DEPOIS` impressos
pelo próprio script são iguais (`evento active=true, gatilho LIGADO`; `v7.4 active=false`), a árvore
git estava limpa, e o que subiu foi o mesmo `main` que já estava publicado (E013→E016). Confirmado
depois pela API: `IAChat_Telegram_evento` ativo, 107 nós.

**O que fazer diferente:** `--ajuda`/`--help` não é um flag universal. Script que publica se lê com
`sed -n '1,40p'` antes de executar, nunca se sonda rodando.

---

## 4. Situação para a apresentação

| | |
|---|---|
| **E016** (formato da tradução) | ✅ verificada ao vivo hoje, 18/18 |
| **E014b** (ajuda sob pedido) | ✅ automática verde nos 4 níveis + controle; leitura humana de A2/B1 **feita**, aguardando sua conferência |
| **E013** (escada de idioma) | ✅ visível por tabela em A2 × B1 nas duas execuções |
| **Fluxo no ar é o novo** | ✅ provado em 14 turnos pela cláusula universal no prompt executado |
| **Onboarding, Professor, áudio, botões, comandos** | ❌ **não cobertos** — os probes só percorrem o modo Conversa. É o que o `TESTE_TELEGRAM_APRESENTACAO.md` cobre, e só o seu dedo no Telegram prova |

**Pendência de limpeza:** 5 alunos de teste no banco (`996943166`–`996943170`).
`node db/cleanup_test_users.js --apply` resolve — não rodei, é escrita no banco.
