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
   a cortar: otimizar latência aqui significa mexer em modelo ou em prompt, não em nós.

## Limitações

- **Não mede a entrega ao Telegram.** O harness usa `chat_id` sintético, então o envio real nunca
  acontece. A latência que o usuário sente é `processamento + envio real`. O relatório mediu com
  entrega real; estas medições, não. Os dois números **não são diretamente comparáveis**, e essa é
  a razão mais provável da diferença em relação ao "6–8s" original.
- **Modelo diferente.** O relatório mediu com `llama-3.3-70b-versatile`, removido da conta Groq.
  Parte da melhora pode ser do modelo novo, e isso não é separável.
- **Ambiente local, um usuário por vez.** Nada aqui diz respeito a carga — o L2 continua aberto.
- `Memória Dúvida` aparece com 1,11s em **n = 1**. Amostra insuficiente para concluir; se se
  confirmar em amostra maior, é um alvo barato (a janela de contexto pode cair de 20 para 10).

## Próximo passo sugerido

Medir a **latência percebida** de ponta a ponta com um `chat_id` real, em uma conta de teste do
Telegram. É o único jeito de fechar o L1 com o mesmo instrumento que o relatório usou. Enquanto
isso, o dado defensável é: **o processamento custa ~3,2s e não justifica a reprovação do L1.**
