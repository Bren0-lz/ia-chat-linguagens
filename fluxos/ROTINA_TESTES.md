# IAChat — Rotina de Testes de Regressão

Suíte **fixa e automatizável** para diagnóstico do sistema. Dirige uma jornada determinística
(*onboarding → nivelamento → Professor*) como um aluno-robô e verifica **critérios objetivos**
(PASS/FAIL). Implementação: `_teststand/smoke.js` (~70 linhas, sobre o harness existente).

## Como executar
```bash
export N8N_API_KEY="<JWT da API do n8n>"   # workflow IAChat ativo em localhost:5678
PACE=2500 node _teststand/smoke.js         # PACE alto = gentil com o n8n
```
Saída: uma linha `PASS/FAIL` por caso e o total ao final (exit code ≠ 0 se algo falhou).

## Variação de perfil (mesma rotina, 3 constantes)
No topo de `smoke.js`, alterar e reexecutar cobre diferentes perfis de usuário:

| Constante | Valores | Eixo coberto |
|---|---|---|
| `AGE` | `'16'`, `'24'`, `'62'` | idade (público-alvo vs adulto vs idoso) |
| `PERSONA` | `persona_buddy\|coach\|comedian\|debater\|formal` | personalidade/tom |
| `START` | `pl_start_A1 … pl_start_B2` | nível de inglês de partida |

## Casos de teste (fixos)

| ID | Entrada fixa | Critério objetivo de aprovação |
|----|--------------|--------------------------------|
| **OB1** | `"oi"` (usuário novo) | resposta pede o nome; sem erro de nó |
| **OB2** | nome `"1"` | rejeitado — **não grava** nome no banco |
| **OB3** | nome `"Lucas"` | aceito; passa a pedir a idade |
| **OB4** | idade `"999"` | rejeitada (não vira 99; idade fora de 16–80 não gravada) |
| **OB5** | idade válida (`AGE`) | aceita; sem erro |
| **PS** | `persona_buddy` (`PERSONA`) | grava `profile.persona` corretamente |
| **IN** | `int_done` | conclui interesses sem erro |
| **PL** | responde às 10 questões (seed) | completa e grava nível **∈ {A1,A2,B1,B2,C1}** — **nunca C2** |
| **PR1** | entra no Professor | explicação inicial entre **500 e 4096** caracteres |
| **PR2** | `t_start` | gera questão **e salva o gabarito** (`teacher_state.answer`) |
| **PR3** | resposta errada (`"zzzqqq"`) | retorna **explicação do erro** + a resposta certa (`pkind=wrong`) |
| **PR4** | `t_next` | gera a **próxima** questão |
| **PR5** | `t_doubt` → `"não entendi"` | **não revela** o gabarito da questão pendente (anti-alucinação) |

> Legenda dos critérios: usam o estado real do aluno (`Carregar Aluno`), a ausência de erros de nó,
> e campos derivados (`expectedAnswer`, `pkind`) já expostos por `harness.digest()`.

## O que cada bloco diagnostica
- **OB1–OB5:** validação de cadastro e regressão do *loop de cadastro* (fix `GREATEST`).
- **PL:** adaptação de nível e o **teto C2 inalcançável** (limitação conhecida — bom para a discussão do artigo).
- **PR1–PR2:** profundidade da explicação e persistência do estado da questão.
- **PR3–PR4:** *feature* nova de correção com explicação do erro + avanço por botão.
- **PR5:** correção da *alucinação* na dúvida (não entregar gabarito não respondido).

## Padrão mínimo de implementação (referência para o artigo)
O núcleo do runner cabe em poucas linhas — postar um evento e afirmar sobre a resposta/estado:
```js
const { msg, cb, digest } = require('./harness');
const ok = (id, cond) => console.log((cond ? 'PASS' : 'FAIL') + ' ' + id);
let d = digest(await msg(uid, 'oi'));         ok('OB1', /nome/i.test(d.reply));
d = digest(await msg(uid, '1'));              ok('OB2', !(d.student && d.student.name));
d = digest(await cb(uid, 't_start'));         ok('PR2', !!d.expectedAnswer);
```

## Avaliação qualitativa (complemento, fora do PASS/FAIL)
Para o texto gerado pelo LLM (correções, tom da persona, pedagogia), pontuar **0–2** por critério —
*correção linguística, adequação ao nível, fidelidade à persona, clareza pedagógica, anti-alucinação* —
sobre as transcrições (`_teststand/tr_<nível>.md`). Repetir cada caso algumas vezes (saída não é
determinística) e reportar média + exemplos. Roteiro detalhado em `TESTES_DIAGNOSTICOS.md`.
