# Por que as personas colapsam no A1 — investigação por ablação (19/08/2026)

As personas se diferenciam bem em B1 (Jaccard 0,184) e A2 (0,217), e **falham só no A1**
(0,312). Este documento registra a busca pela causa: quatro hipóteses, três refutadas com
número, uma inconclusiva. **A causa não foi encontrada.**

Método de cada experimento: alterar **uma única linha** do `Prompt Conversa A1` no fluxo ao vivo,
medir com N = 3 (mesma mensagem, 5 personas idênticas variando só `profile.persona`, `chat_memory`
limpa por rodada) e **reverter**. Baseline: **0,312 ± 0,030**.

Reprodução: `NIVEL=A1 RUNS=3 node fluxos/_teststand/revalida_personas.js "<mensagem>"`

---

## Resultado

| # | Hipótese | Alteração | Resultado | Veredito |
|---|---|---|---|---|
| 1 | Teto de palavras | 18 → 30 | **0,373** | **refutada** — piorou |
| 2 | Pergunta fechada | "fechadas ou de escolha" → variadas | **0,312 ± 0,016** | **refutada** — efeito zero |
| 3 | Formato bilíngue | bilíngue → só inglês | **0,331 ± 0,069** | **refutada** |
| 4 | Vocabulário restrito | permite expressões e phrasal verbs comuns | **0,250 ± 0,132** (n=4) | **inconclusiva** — única com sinal |

### 1. Teto de palavras — refutada

Subir de 18 para 30 piorou (0,373) e dobrou o texto na tela (~35 → 46–60 palavras, porque o
formato A1 é bilíngue). Um controle posterior fechou a questão: **A1 com teto 30 produz 26,1
palavras em inglês e falha (0,373); A2 produz 26,6 palavras e passa (0,217)**. Mesmo comprimento,
resultado oposto — comprimento não é a variável.

### 2. Pergunta fechada — refutada

Uma análise offline das transcrições mostrava a pergunta final do A1 **3,5x mais repetida** que a
do B1 (0,362 vs 0,105): as cinco personas terminavam quase sempre com "Do you play games?". Parecia
a causa. Ao liberar a variação, o resultado foi **0,312 ± 0,016** — idêntico ao baseline.

**Lição metodológica:** a decomposição offline identificou *onde* a repetição se concentra, não
*por que* ela existe. Liberada a pergunta, o modelo convergiu em outro trecho e o total não se
moveu. Localizar a repetição não é localizar a causa.

### 3. Formato bilíngue — refutada

Removida a exigência de traduzir a mensagem inteira na linha 🇧🇷 (e a "REGRA DE OURO" que a
reforçava, para o isolamento ser limpo): **0,331 ± 0,069**. Sem ganho, e com o dobro do desvio.

### 4. Vocabulário restrito — inconclusiva (única hipótese com sinal)

Liberado o uso de expressões e phrasal verbs comuns. Dados acumulados em **três** tentativas de
coleta, todas com a mesma variante de prompt e o mesmo estímulo:

| Rodada | Jaccard | Tentativa |
|---|---|---|
| 1 | 0,220 | 1ª (N=3) |
| 2 | 0,157 | 1ª |
| 3 | 0,444 | 1ª |
| 4 | 0,178 | 3ª (N=8, interrompida) |

**n = 4 → média 0,250 ± 0,132** · baseline: 0,312 ± 0,030

A média fica abaixo do baseline e abaixo do limiar de aprovação (< 0,30), mas o desvio é **4x o do
baseline** e uma das quatro rodadas (0,444) foi pior que qualquer rodada de qualquer configuração
testada. Com n = 4 e essa dispersão, não é possível separar melhora real de sorte em três de quatro.

**Três tentativas de fechar, três interrompidas por infraestrutura:**

1. **N = 5 adicional (18/08)** — invalidada por rate limit: sem resposta do LLM, o script preenchia
   com a mesma string de erro para as 5 personas e o Jaccard ia a 1,000, o que *parece* colapso
   total de persona e é artefato. Números descartados. Desde então o script **aborta** nesse caso.
2. **N = 8 (19/08, 1ª)** — abortada na rodada 2 por falha de conexão do n8n com a Groq
   (`Connection error`), transitória: a máquina alcançava `api.groq.com` normalmente.
3. **N = 8 (19/08, 2ª)** — abortada na rodada 1 por rate limit de novo.

**Estado: não confirmada nem refutada.** Precisa de N ≥ 8 coletado sem interrupção — cerca de
6 minutos ininterruptos de cota disponível.

#### Um padrão que os dados sugerem, mas não provam

Nos três experimentos **refutados** o desvio ficou entre 0,016 e 0,069: o sistema respondia de forma
consistente, e consistentemente pouco diferenciada. Ao liberar o vocabulário o desvio salta para
0,132 — o comportamento muda de "consistentemente indiferenciado" para **instável**. É o que se
esperaria de uma restrição que era de fato limitante: removê-la abre a possibilidade de a persona
aparecer, sem garantir que apareça. Mas isso é leitura de padrão, não medição conclusiva, e não deve
ser reportado como causa estabelecida.

---

## Leitura geral

O achado mais sólido não é sobre qual restrição causa o colapso, e sim que **o formato do A1 quase
não importa**. Mexer no comprimento, na estrutura da pergunta e na duplicação bilíngue manteve o
resultado entre 0,31 e 0,37 em todas as configurações. O que muda o número é sair do A1: A2 dá
0,217 e B1 dá 0,184.

Dito de outro jeito: das quatro restrições que definem o A1, três foram removidas uma a uma sem que
o número se movesse. Isso torna improvável que exista uma causa única e simples — e é a razão de a
recomendação abaixo não ser "relaxe a restrição X".

(O contraste de desvio entre as hipóteses refutadas e a hipótese 4 está discutido na Seção 4.)

## Recomendação

Independente de como a hipótese 4 se resolver, o caminho de menor risco **não** é relaxar o A1. As
restrições do nível existem por razão pedagógica: o teto protege o iniciante de ser soterrado, o
bilíngue é o que torna a mensagem acessível a um A1 absoluto (a persona P6, Dona Cleide) e o
vocabulário mínimo é a definição do nível. Trocar qualquer uma delas por diferenciação de tom é
provavelmente troca ruim.

O caminho barato são **marcadores que não consomem vocabulário**: emoji, comprimento de frase,
ordem de reagir antes de perguntar. O `formal` já demonstra que funciona — ele se distingue das
outras quatro personas usando **0,0 emoji**, sem gastar uma palavra sequer. Vale desenhar um
marcador não-lexical por persona e medir com o mesmo instrumento.

Se nada disso resolver, a conclusão defensável para o artigo é que **persona forte e A1 estrito são
objetivos em tensão** — um limite do nível, não um defeito de implementação.

---

## Achado colateral: evidência direta do L2

O rate limit é **a evidência mais direta do L2** que o projeto tem. Ele interrompeu **duas** coletas distintas em dois dias, sempre com **um único usuário** de teste.
O relatório afirmava "não suporta muitos usuários por estarmos utilizando uma assinatura gratuita
do Groq" sem demonstração; aqui um único usuário, em uso sustentado por algumas horas, esgotou a
cota e o bot passou a responder vazio.

Comportamento observado na falha: o nó `Enviar Erro IA` disparou, ou seja o caminho de erro
amigável do **R7 funciona**. Mas o usuário recebe uma mensagem de erro, não conteúdo.

Implicação para o roteiro: o L2 não precisa de teste de carga com N usuários simultâneos para se
manifestar — **uso sustentado por um só usuário já basta** no plano gratuito. Isso é mais fácil de
reproduzir e deveria substituir o desenho atual do teste.

Implicação prática, e mais séria: a cota não sustenta nem o **desenvolvimento**. Fechar a hipótese 4
exige ~6 minutos ininterruptos de cota, e três tentativas falharam. Enquanto o projeto roda local,
o plano pago não serve para atender usuários (não há usuários) — serve para conseguir medir.

## Limitações

- Todos os números vêm de **um único estímulo** ("eu acho que video game ajuda a aprender ingles").
  Outros gatilhos podem separar as personas de outra forma.
- Jaccard mede sobreposição lexical, não percepção humana de personalidade.
- Modelo: `openai/gpt-oss-120b`. O modelo do relatório original não é mais executável.
- A hipótese 4 continua aberta e é a única com sinal.
