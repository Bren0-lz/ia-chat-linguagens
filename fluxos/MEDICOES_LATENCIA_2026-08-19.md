# Medições de latência (L1) — 19/08/2026

O relatório de 13/07 reprovou o **L1** com a afirmação *"ultrapassa 8 segundos em determinadas
interações mais complexas"* — sem nenhum número, sem dizer qual interação e sem separar
processamento de entrega. Estas medições substituem a afirmação por dados.

Reprodução: `N8N_API_KEY=... node fluxos/_teststand/analisa_latencia.js 60`

---

## Como foi medido (e duas tentativas erradas antes)

**Instrumento final:** para cada execução gravada no n8n, soma-se o `executionTime` **por nó**,
classificando cada execução pela rota que o `Roteador Mestre` **registrou** — não pela ordem em
que o teste mandou as mensagens.

Duas versões anteriores deste instrumento davam resultado errado, e vale registrar porque o erro
é fácil de repetir:

1. **Duração total da execução (errado).** O harness usa `chat_id` sintético, então todo nó
   `Enviar *` falha no Telegram e o n8n faz retry — 3 tentativas, 1,5s entre elas. Isso injetava
   **~7 a 27s em qualquer turno**, inclusive nos que não chamam LLM nenhum. Medido assim, a rota
   `/menu` (puramente determinística) "levava" 8,56s. O `HANDOFF.md` §5 já registrava o artefato.
2. **Rotular o turno pela ordem de envio (errado).** Há corrida entre semear o `mode` no banco e o
   fluxo anterior ainda gravando estado, então a rota real diverge do rótulo — mensagens enviadas
   na fase "Professor" apareciam roteadas como `conversa`. Isso produziu a conclusão falsa de que
   "o 2º turno de conversa não chama o LLM"; a execução mostrava o contrário.

Por isso a rota vem do `Roteador Mestre`, que é a fonte da verdade.

---

## Resultado (60 execuções)

| Rota | n | média | desvio | p90 | máx | LLM | infra |
|---|---|---|---|---|---|---|---|
| `conversa` | 33 | **4,25s** | 1,84 | 6,20 | 10,86 | 3,85 | 0,40 |
| `professor:intro` (explicação) | 7 | 3,92s | 0,42 | 4,29 | 4,29 | 3,58 | 0,33 |
| `professor:doubt_msg` | 7 | 2,65s | 1,14 | 5,10 | 5,10 | 1,95 | 0,69 |
| `professor:start_quiz` | 3 | 1,86s | 0,42 | 2,20 | 2,20 | 1,44 | 0,42 |
| `menu` (sem LLM) | 6 | 0,23s | 0,34 | 0,91 | 0,91 | 0,00 | 0,23 |
| `professor:ask_doubt` (sem LLM) | 4 | 0,20s | 0,03 | 0,23 | 0,23 | 0,00 | 0,20 |

**Geral: média 3,23s · p90 5,87s · máx 10,86s · apenas 1 turno em 60 passou de 8s.**

### Nós mais caros

| Nó | média | n |
|---|---|---|
| `Agente Conversa` | 2,05s | 33 |
| `Modelo Groq Conversa` | 1,81s | 33 |
| `Agente Professor` | 1,50s | 10 |
| `Modelo Groq Professor` | 1,44s | 10 |
| `Agente Dúvida` | 1,21s | 7 |
| `Memória Dúvida` | 1,11s | 1 |
| `Carregar Aluno` | 0,40s | 1 |

A infraestrutura (código, Postgres, roteamento) custa **0,2 a 0,7s** por turno. Todo o resto é LLM.

---

## Conclusões

1. **O processamento não é o gargalo.** Com `openai/gpt-oss-120b`, a média por turno é 3,2s e o p90
   é 5,9s — dentro da faixa-alvo de 6–8s que o próprio relatório definiu como aceitável.
2. **A rota mais cara é a Conversa**, não a explicação do Professor. Isso contraria a suspeita
   registrada no `PLANO_CORRECOES_v7.5.md`, que apontava a explicação de ~2500 caracteres como
   candidata nº 1. A explicação custa 3,92s; a conversa, 4,25s — e a conversa tem o maior desvio
   (1,84), ou seja, é a que mais varia.
3. **As rotas determinísticas são praticamente instantâneas** (0,2s). Não há gordura de arquitetura
   a cortar no processamento.
4. *(Acrescentado após a medição com `chat_id` real:)* **a cauda de latência está na entrega ao
   Telegram, não no processamento** — um turno chegou a 26,3s com o LLM levando 2,3s. Ver a seção
   final.

## Limitações

- **Não mede a entrega ao Telegram.** O harness usa `chat_id` sintético, então o envio real nunca
  acontece. **Essa lacuna foi fechada depois** — ver "Medição com `chat_id` real" abaixo, que
  confirma a suspeita: a diferença em relação ao "6–8s" do relatório está na entrega, não no
  processamento.
- **Modelo diferente.** O relatório mediu com `llama-3.3-70b-versatile`, removido da conta Groq.
  Parte da melhora pode ser do modelo novo, e isso não é separável.
- **Ambiente local, um usuário por vez.** Nada aqui diz respeito a carga — o L2 continua aberto.
- `Memória Dúvida` aparece com 1,11s em **n = 1**. Amostra insuficiente para concluir; se se
  confirmar em amostra maior, é um alvo barato (a janela de contexto pode cair de 20 para 10).

---

## Medição com `chat_id` real (19/08, complemento)

A medição acima não inclui a entrega ao Telegram — o harness usa `chat_id` sintético e o envio
falha. Esta seção fecha a lacuna: mesmo fluxo, mesmo instrumento, mas mandando para uma conta
real, com o envio acontecendo de verdade. `_teststand/mede_latencia_real.js`.

| Repetição | menu (sem LLM) | conversa | do qual, envio |
|---|---|---|---|
| 1 | 1,67s | 3,91s | 1,52s |
| 2 | 0,85s | 2,79s | 1,38s |
| 3 | 0,85s | **26,32s** | **24,58s** |

**Mediana: 2,2s.** Cinco dos seis turnos ficaram entre 0,85s e 3,91s; um explodiu para 26,32s, e
**24,58s disso foi o envio**, com zero erro em qualquer nó. O processamento nesse turno foi normal
(LLM 2,34s).

A média (6,06s) e o desvio (9,99) são ditados pelo outlier e enganam — por isso a mediana.

### Decomposição do custo real

| Componente | Custo |
|---|---|
| LLM | 2,2 – 3,4s |
| Infra (código, Postgres, roteamento) | 0,1 – 0,65s |
| Envio ao Telegram, caso típico | ~1s |
| Envio ao Telegram, cauda observada | **24,6s** |

### O que isso resolve sobre o L1

O relatório afirmava *"ultrapassa 8 segundos em determinadas interações mais complexas"*, o que
sugere que o custo cresce com a complexidade. Os dados contradizem: **o turno que estourou não era
mais complexo que os outros** — era a mesma mensagem, no mesmo nível. A latência alta vem da
**variância na entrega ao Telegram**, não do processamento.

Isso também reconcilia os dois números que pareciam se contradizer: a medição por nó (3,23s) mede
processamento, a do relatório (>8s) mede percepção. As duas estavam certas, medindo coisas
diferentes.

**Implicação prática:** otimizar prompt ou trocar de modelo não ataca o problema real. O que melhora
a percepção é mascarar a espera com `sendChatAction: typing` antes da chamada ao LLM.

Isso já existia na rota de Conversa (nó `Typing Conversa`) e **não existia em nenhuma rota do
Professor**: explicação (3,92s), questão, dúvida e correção passavam pelo LLM sem nenhum sinal de
atividade. **Corrigido em 19/08** com o nó `Typing Professor`, ligado ao `Professor Engine` como
ramo paralelo sem saída, com `onError: continueRegularOutput` — uma falha no indicador nunca
derruba o turno. Verificado ao vivo: executa em 0,73s, sem erro, turno conclui normalmente.

**O que isso resolve e o que não resolve.** O indicador dura ~5s no Telegram, então cobre bem a
espera típica de 2–4s do Professor. Mas **não ataca a cauda**: no outlier de 26,3s ele expiraria
aos 5s e o aluno ficaria ~20s no vazio. Pior, o gargalo naquele turno foi a própria API do
Telegram, e não há razão para supor que a chamada de `sendChatAction`, que vai para a mesma API,
seria rápida naquele momento. **É polimento de percepção, não correção do L1.**

### Limitações desta medição

- **n = 6.** É pouco para caracterizar cauda: um evento em seis pode significar 15% de frequência
  ou azar isolado, e não há como distinguir. Um número confiável exigiria ~30 amostras — ou seja,
  30 mensagens reais no Telegram de alguém.
- Uma única conta, uma única sessão, uma única rede.
- O estado da conta usada foi salvo antes e restaurado ao final; o teste não deixou alteração.

## Próximo passo sugerido

~~Medir a latência percebida com `chat_id` real~~ — **feito**, ver seção acima.

Resta:

1. **Caracterizar a frequência do outlier de entrega** — n=6 é insuficiente; ~30 amostras dariam um
   número, ao custo de 30 mensagens reais no Telegram de alguém.
2. **Acrescentar `sendChatAction` nas rotas do Professor**, que hoje não têm nenhum. É um nó novo,
   não mexe em modelo nem em prompt, e ataca exatamente o que o aluno sente.
