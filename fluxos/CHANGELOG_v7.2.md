# IAChat_Telegram_v7.2 — Changelog

> Base: v7.1 (id `zAjCM0ZcastWElOo`). v7.2 criado como workflow novo (id `H0Xfipr424xkejcd`).
> Motivação: correções de UX encontradas em **teste real por nível** (ver `ANALISE_UX_v7.1.md`).
> Todas as mudanças foram **validadas ao vivo** contra o modelo (Groq llama-3.3-70b) em A1, A2, B1, C1.
> Data: 2026-07-01.

## Correções aplicadas

### 1. [ALTO] Conversa agora sinaliza erros de concordância/countable/tempo verbal
Os prompts de Conversa (A1–C2) ganharam a regra **"ERROS QUE CONTAM"**: concordância sujeito-verbo
(`video games ARE`), contável/incontável (`the NUMBER of people`, não `amount of people`) e tempo verbal
errado no contexto (usar passado em narrativa passada) passam a exigir um **reparo explícito** — antes o
modelo apenas usava a forma certa na resposta sem apontar o erro.
**Validado:** B1 `games is`→*"Small fix: video games ARE"*; C1 `amount of people`→*"Small fix: the number
of people"*; A2 `we play... all day`→*"Quick tip: We played..., not we play"*.

### 2. [ALTO no A1] O próprio inglês do tutor deve estar sempre correto
Regra dura adicionada (A1 explicitamente; embutida nos demais): **"seu inglês deve estar SEMPRE correto;
NUNCA repita um erro do aluno na sua resposta"** (ex.: `I like play` → `I like playing`).
**Validado:** A1 `i like play video game` → *"We say I like playing video games"* (antes o tutor repetia
*"I like play video game too"*).
> Resíduo conhecido: no A1 o tutor ainda pode usar forma telegráfica nas **próprias perguntas**
> (*"You like play games?"*). Menor; candidato a ajuste futuro (forma de pergunta: *"Do you like...?"*).

### 3. [BAIXO] A1 — regra do "não entendi"
Ao reformular, manter o inglês **simples e correto** e **re-explicar a mesma ideia** (não trocar de pergunta).

### 4. [ALTO] Dúvida do Professor não erra mais o conceito
`dSys` reescrito: responder **exatamente** a dúvida (mesmo fora do tópico atual), **só afirmar regra de que
tem certeza**, e alerta anti-confusão (`-ed` = passado, para TODOS os sujeitos; não confundir com o `-s`
da 3ª pessoa). Temperatura do **Modelo Groq Dúvida 0.5 → 0.3** (mais factual).
**Validado:** A2 dúvida `-ed` → *"forma o passado simples: I walked, she played, he jumped"* (antes ensinava
**errado** que `-ed` era para he/she/it).

## Não alterado (validado como bom no v7.1)
Correção de erros gritantes (Quick tip/Small fix), trilha do Professor + streak 5, matching de respostas,
uso ativo dos interesses, formato bilíngue do A1, uma pergunta por turno.

## Pendências (não tratadas neste release)
- **C2 inalcançável**: placement só vai até C1 e é o único ponto que grava `level`; Prompt Conversa C2 e
  trilha C2 seguem como código morto. Decisão de produto (implementar caminho ou remover).
- **`TEST Ingress`/`TEST Shim`**: harness de teste aberto — remover antes do lançamento.
- **Resíduo A1** (forma das perguntas do tutor) — ver item 2.
- **Carga**: n8n é sensível a volume de execuções (caiu uma vez durante os testes); considerar limitar
  retries dos nós de envio / serialização por usuário se o bot crescer.
