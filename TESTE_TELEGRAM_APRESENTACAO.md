# Roteiro de teste REAL no Telegram — véspera da apresentação

> Escrito em 22/09/2026 contra o fluxo **`IAChat_Telegram_evento`** (n8n `PCtzP8lk2qaqwZVd`, 107 nós),
> que é quem atende o Telegram desde 14/09. Tudo aqui é **você digitando no Telegram de verdade** —
> nenhum passo depende de script.
>
> Cada item tem **o que fazer**, **o que tem de aparecer** e um `[ ]` pra marcar.
> Onde o comportamento esperado for "leitura sua" (o LLM escreve o texto), está dito.
>
> Tempo total: **~50 min** se tudo passar. Blocos 1–4 são obrigatórios; 5–7 são de margem.

---

## Antes de começar

**Use duas contas de Telegram:**
- **conta de teste** → onde você roda este roteiro (vai levar `/resetfull` várias vezes);
- **conta da demo** → que você deixa pronta no fim (Bloco 7) e **não toca mais**.

`/resetfull` apaga nome, idade, nível, persona, interesses, XP e progresso da conta que digitou.
`/reset` só volta o onboarding (mantém perfil).

**Checagem de ambiente (1 min, já conferida hoje):**

| | como conferir | estado em 22/09 |
|---|---|---|
| Postgres | `docker ps` mostra `iachat-pg` Up | ✅ |
| n8n | `curl http://localhost:5678/healthz` → `{"status":"ok"}` | ✅ |
| ngrok | `curl http://localhost:4040/api/tunnels` devolve URL https | ✅ `unhealed-lacy-kaolinic.ngrok-free.dev` |
| fluxo certo no ar | n8n: `IAChat_Telegram_evento` **active**, `v7.4` **inactive** | ✅ |

> ⚠️ **A URL do ngrok muda a cada reinício do túnel.** Se ela mudar, o n8n precisa subir de novo com
> `WEBHOOK_URL`/`N8N_HOST` apontando pra nova — senão o bot fica mudo com tudo "ativo" (§7 do HANDOFF).
> **Desligue a suspensão da máquina antes de dormir hoje.**

**Se o bot ficar mudo no meio do roteiro:** volte ao v7.4 com
`node fluxos/_teststand/corta_para_evento.js --voltar` — mas saiba que o v7.4 **tem teste de
nivelamento de 10 questões**, o que muda a demo inteira. É plano C, não plano B.

---

## Bloco 1 — Onboarding do zero (~10 min)

O caminho que todo participante do evento vai percorrer. **É o bloco mais importante:** se algo
quebrar aqui, quebra pra todo mundo na primeira tela.

| # | Você manda | Tem de aparecer | |
|---|---|---|---|
| 1.1 | `/resetfull` | conta zerada; vem a saudação "Oi! 👋 Eu sou o **IAChat**…" terminando em "**qual é o seu nome?**" | `[ ]` |
| 1.2 | `oi` | recusa **com o motivo certo**: "Oi pra você também! 😊 Mas agora me diz só o seu **nome**…" — **não** pode aceitar "oi" como nome | `[ ]` |
| 1.3 | `/menu` | "Os comandos ficam pra depois 😉 Primeiro me diz o seu **nome**." (comando não escapa do cadastro) | `[ ]` |
| 1.4 | um emoji só, ex. `😀` | recusa pedindo nome escrito/só letras (não trava, não aceita) | `[ ]` |
| 1.5 | `meu nome é Breno` | "Prazer, **Breno**! Quantos anos você tem?" — tem de extrair só o nome, sem o "meu nome é" | `[ ]` |
| 1.6 | `abc` | "Só o número, por favor 😊" | `[ ]` |
| 1.7 | `9` | "Hmm, essa idade não parece certa 🤔 … (entre 16 e 80)." | `[ ]` |
| 1.8 | `28` | "Show! 🙌 Agora me conta:" + convite de nível + **seis botões** em 3 linhas: 🌱 A1 · 📖 A2 · 💬 B1 · 🚀 B2 · 🎯 C1 · 🏆 C2 | `[ ]` |
| 1.9 | — (só leia a tela 1.8) | o texto diz "**Não é prova** — vale a sua **percepção**" e **não promete teste de nivelamento**. Cita `/nivel` | `[ ]` |
| 1.10 | toca **📖 A2 — básico** | confirmação do nível (sem "Gabarito indisponível", sem questão nenhuma) e em seguida a tela de **personalidade** com 5 botões: 🐶 Buddy · 🔥 Coach · 😜 Comediante · 🎭 Debatedor · 🎩 Formal | `[ ]` |
| 1.11 | toca **😜 Comediante** | "🎭 Personalidade definida!" + explicação dos **dois modos** (💬 Conversa / 📚 Professor) + comandos úteis. **Não pode prometer "refazer o teste"** (E015) | `[ ]` |
| 1.12 | — | logo depois vem o **menu de interesses** com 10 temas + ✍️ Outro + ✅ Concluir | `[ ]` |
| 1.13 | toca 🎮 Games, depois 🎵 Música | o menu **se edita na hora** marcando os dois selecionados (não manda menu novo a cada toque) | `[ ]` |
| 1.14 | toca 🎮 Games de novo | desmarca (toggle funciona nas duas direções) | `[ ]` |
| 1.15 | toca ✍️ **Outro**, manda `culinária japonesa` | aceita o tema escrito e mostra na lista | `[ ]` |
| 1.16 | toca ✅ **Concluir** | confirmação dos interesses e o **menu de modos** (💬 Conversa · 📚 Professor · 🎭 Mudar personalidade · 🎨 Meus interesses) | `[ ]` |

**Critério do bloco:** nenhuma tela em branco, nenhum `*` ou `<b>` aparecendo literal, nenhuma
promessa de teste de nivelamento, e **nada travou esperando resposta**.

---

## Bloco 2 — Modo Conversa em A2 (~10 min)

Continue na mesma conta (A2, Comediante, interesses games/música/culinária japonesa).

| # | Você manda | Tem de aparecer | |
|---|---|---|---|
| 2.1 | toca **💬 Conversa** | confirmação curta do modo | `[ ]` |
| 2.2 | `hi` | resposta em **inglês curto** + **linha 🇧🇷 traduzindo a mensagem inteira**, no formato: linha em inglês, **linha em branco**, `🇧🇷: tradução` (E016) | `[ ]` |
| 2.3 | — (releia 2.2) | a tradução **não** veio colada no inglês nem na mesma linha. Se vier colada, é a E016 não pegando | `[ ]` |
| 2.4 | `i saw many childrens at the park` | **correção explícita**: `We say 'many children', not 'many childrens'`. Medido em 22/09: A1 6/6, A2 5/6, B1 5/6 (depois da T037). **Não use `i like play video games`** — gerúndio só é corrigido em A1 (4/6); em A2, B1, B2 e C1 dá 0/6 | `[ ]` |
| 2.5 | `i went to the park yesterday` | resposta puxa **algum interesse seu** (games/música/comida) ou faz pergunta de continuidade — não pode ser interrogatório seco | `[ ]` |
| 2.6 | `não entendi` | **ajuda sob pedido (E014b)**: o bot socorre **em português**, explicando o que perguntou — em qualquer nível, mesmo B2/C1 | `[ ]` |
| 2.7 | uma frase normal em inglês, ex. `i play guitar` | **volta ao inglês do nível** no turno seguinte (o socorro é de um turno só) | `[ ]` |
| 2.8 | `ok` | **não** pode virar socorro em português — "ok/sim/yes" não é gatilho de ajuda | `[ ]` |
| 2.9 | manda um **áudio** falando `hello, how are you` | transcreve e responde normalmente (Whisper/Groq). Se der erro de transcrição, a mensagem de erro tem de aparecer — não silêncio | `[ ]` |
| 2.10 | manda uma **foto** ou **sticker** | "Você pode escrever isso em palavras? 😊" | `[ ]` |

**Critério do bloco:** nenhuma resposta vazia (resposta vazia **não é aprovação** — armadilha nº 1),
tempo de resposta tolerável (alguns segundos), nada de markdown cru na tela.

---

## Bloco 3 — Escada de idioma por nível (~8 min)

Prova a E013: cada nível recebe uma quantidade diferente de português. É um dos pontos mais
vendáveis da demo — vale saber de cor.

| # | Você faz | Tem de aparecer | |
|---|---|---|---|
| 3.1 | `/nivel` → toca **🌱 A1** | reabre a escolha com o **mesmo convite** e os seis botões; troca o nível **preservando** persona, interesses e modo (confira com `/progresso` e `/config`) | `[ ]` |
| 3.2 | `hi, how are you` | **A1**: inglês bem curto + linha 🇧🇷 com a **mensagem inteira** traduzida | `[ ]` |
| 3.3 | `/nivel` → **💬 B1**, depois `what did you do last weekend` | **B1**: resposta em inglês com a linha 🇧🇷 **só da pergunta final** — não da mensagem inteira | `[ ]` |
| 3.4 | `/nivel` → **🚀 B2**, depois `i had a busy weekend` | **B2**: **inglês integral**, sem linha 🇧🇷 de apoio | `[ ]` |
| 3.5 | ainda em B2: `não entendi` | mesmo em B2, **pedido explícito de ajuda é atendido em português** (E014b vence a regra de inglês integral) | `[ ]` |
| 3.6 | `/nivel` → **🏆 C2**, manda uma frase | inglês integral, registro mais avançado | `[ ]` |

**Critério do bloco:** A1/A2 com 🇧🇷 da mensagem inteira · B1 só da pergunta · B2/C1/C2 sem 🇧🇷 padrão ·
**ajuda sob pedido funciona nos seis**.

---

## Bloco 4 — Modo Professor (~10 min)

Volte para **B1** (`/nivel` → 💬 B1) — é o nível com melhor material de trilha pra mostrar.

| # | Você faz | Tem de aparecer | |
|---|---|---|---|
| 4.1 | `/menu` → toca **📚 Professor** | só a **confirmação do modo**. Ele **não** dispara a explicação ainda — é esperado | `[ ]` |
| 4.2 | manda qualquer mensagem, ex. `vamos` | primeiro o **abre-alas** `📚 Tópico N/10` (chega ~1 s antes) e **depois** a explicação do tópico, com os botões **❓ Tirar dúvida** e **▶️ Começar questões** | `[ ]` |
| 4.3 | — (leia a explicação) | texto **sem `*`, `**` ou `_` literais** na tela, sem cabeçalho repetido, e a explicação **basta pra acertar as questões** (régua do §1) | `[ ]` |
| 4.4 | toca **❓ Tirar dúvida**, manda `o que é present perfect?` | resposta da dúvida **sem markdown cru** (T029/T033) e **sem entregar o gabarito** de questão pendente (anti-spoiler) | `[ ]` |
| 4.5 | toca **▶️ Começar questões** | a questão chega com o botão **❓ Tirar dúvida** | `[ ]` |
| 4.6 | responde **errado** de propósito | **correção explícita** + explicação do erro + botões **❓ Tirar dúvida** e **➡️ Próximo exercício** | `[ ]` |
| 4.7 | toca **➡️ Próximo exercício** | próxima questão, **tópico não reinicia** | `[ ]` |
| 4.8 | responde **certo** | feedback positivo e avanço; o contador de acertos sobe | `[ ]` |
| 4.9 | no meio de uma questão, manda `não sei` (texto qualquer) | ele pede a resposta de volta ou vira dúvida — **não pode ignorar** | `[ ]` |
| 4.10 | `/progresso` | mostra nível, sequência, XP e temas dominados — e os números **batem** com o que você acabou de fazer | `[ ]` |

---

## Bloco 5 — Comandos e bordas (~7 min)

Aqui mora o que dá errado quando um participante curioso sai do trilho.

| # | Você manda | Tem de aparecer | |
|---|---|---|---|
| 5.1 | `/help` | lista de comandos **sem** mencionar teste de nivelamento, `/pausa` ou `/continuar`; `/nivel` descrito como "escolher outro nível"; cita áudio 🎙️ | `[ ]` |
| 5.2 | `/menu` | menu de modos; **sem** promessa de refazer teste (E015) | `[ ]` |
| 5.3 | `/config` | menu de personalidade; trocar persona **mantém** nível e interesses | `[ ]` |
| 5.4 | `/interesses` | menu de interesses com os seus já marcados | `[ ]` |
| 5.5 | `/pausa` | "Não tem teste em andamento por aqui 😊 … ou /nivel pra escolher outro nível." — **uma linha, nunca silêncio** | `[ ]` |
| 5.6 | `/continuar` | mesma resposta de 5.5 | `[ ]` |
| 5.7 | `/bananas` | "Não reconheço esse comando 🤔" + lista curta | `[ ]` |
| 5.8 | `/parar` depois `/voltar` | desliga e religa os lembretes, com confirmação em cada um | `[ ]` |
| 5.9 | uma mensagem **muito longa** (cole 3 parágrafos) | responde sem travar e sem cortar no meio de uma tag HTML | `[ ]` |
| 5.10 | duas mensagens **em sequência rápida** | responde as duas, sem misturar nem repetir | `[ ]` |
| 5.11 | `/reset` (não o full) | volta ao onboarding **mantendo** o perfil; o fluxo recomeça pelo nome | `[ ]` |

---

## Bloco 6 — O que NÃO demonstrar (leia antes de subir no palco)

Defeitos conhecidos e medidos. Não são surpresa; são para você **não pisar** neles na demo.

| o quê | estado | como desviar |
|---|---|---|
| **Correção de gerúndio** (`i like play video games`) | **0/6** em A2, B1, B2 e C1; só o A1 corrige, e em 4/6 | demonstre correção com **`childrens`**, que funciona em A1, A2 e B1 |
| **Abertura social em A1** (`hello, how are you`) | o bot responde cortesia e **não** puxa interesses (C15) | abra a conversa com **fato**, não cumprimento: `i went to the park yesterday` |
| **Validação de nome, camada 2** | a Vertex devolve `Authorization failed` e cai em fail-open: **`asdfgh` vira nome** | não peça ao público pra "testar um nome inválido"; a camada 1 (o que o Bloco 1 cobre) segura oi/palavrão/comando |
| **`/reset` e `/resetfull` abertos a qualquer um** | decisão sua, fica ligado | só não anuncie os comandos no telão |
| **Ajuda sob pedido em A2/B1** | publicada e aprovada no prompt; o veredito automático do probe é **inconclusivo** — a leitura é humana | é o que o item 2.6 deste roteiro faz. Se a resposta socorrer em português, está certo |

---

## Bloco 7 — Ensaio da demo (~5 min) — faça na CONTA DA DEMO

Roteiro do que você vai mostrar no palco, no caminho mais seguro. Rode **uma vez inteiro** e depois
**não toque mais nessa conta**.

1. `/resetfull` → nome → idade → **📖 A2** → **😜 Comediante** → 🎮 Games + 🎵 Música → ✅ Concluir.
2. **💬 Conversa** → `i went to the park yesterday` → mostre a **linha 🇧🇷** e o interesse aparecendo.
3. `i saw many childrens at the park` → mostre a **correção explícita** (`We say 'many children'…`).
4. `não entendi` → mostre o **socorro em português** — e a frase seguinte voltando ao inglês.
5. `/nivel` → **🚀 B2** → uma frase → mostre o **inglês integral** (a escada de idioma).
6. `/nivel` → **💬 B1** → `/menu` → **📚 Professor** → `vamos` → mostre `📚 Tópico N/10`, a explicação,
   **▶️ Começar questões**, erre de propósito e mostre a **correção com explicação**.
7. `/progresso` para fechar.

**Deixe a conta parada em `/menu`** no fim do ensaio, pra começar a demo já dentro do fluxo.

**No dia:**
- [ ] Docker Desktop iniciado **antes** de tudo
- [ ] n8n subido na mesma janela com `WEBHOOK_URL`/`N8N_PROTOCOL`/`N8N_HOST`
- [ ] ngrok de pé e a URL **conferida** contra a do n8n
- [ ] suspensão da máquina **desligada**
- [ ] `/start` no bot confirmando que ele responde
- [ ] celular com bateria e Telegram já aberto na conversa

---

## Depois de rodar

- Anote nesta cópia o que falhou (`[x]` vira `FALHOU: …`) — evidência não se apaga nem se reescreve.
- Limpe as contas de teste do banco: `node db/cleanup_test_users.js --apply`
  (**não** rode isso depois do Bloco 7, ou apaga a conta da demo se ela estiver na faixa de teste).
- Se algo do Bloco 1 ou 3 falhar, **me chame antes de mexer** — mudança no fluxo na véspera exige
  republicar (`corta_para_evento.js`), e republicar tira o bot do ar por alguns segundos.
