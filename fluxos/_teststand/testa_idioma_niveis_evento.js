// E013 — a escada de idioma vira rampa: a politica de IDIOMA dos seis niveis do evento.
//
// O Breno testou o bot no ar, escolheu A2 e a primeira pergunta veio 100% em ingles.
// A causa esta na politica escrita nos prompts, nao no modelo desobedecendo. Este teste
// fixa a politica combinada em 14/09, nivel a nivel, no arquivo do EVENTO:
//
//   A1, A2 — ingles + UMA linha final comecando com 🇧🇷 que traduz a mensagem INTEIRA,
//            com a REGRA DE OURO ("a linha 🇧🇷 e SEMPRE a ULTIMA linha");
//   B1     — ingles + linha 🇧🇷 traduzindo APENAS a pergunta final (o aluno sempre sabe
//            o que responder), tambem com a REGRA DE OURO;
//   B2, C1, C2 — ingles integral, SEM linha de apoio por padrao;
//   os seis — NENHUMA proibicao de ajudar quando o aluno PEDE ("mesmo que ele peca",
//            "ou peca", "peca explicacao em portugues", "em nenhuma hipotese"). A rede de
//            seguranca sob pedido e a E014; a proibicao tem de sair agora, senao as duas
//            tarefas se contradizem.
//
// Como ele mede: EXECUTA o jsCode de cada no `Prompt Conversa <nivel>` com um item stub e
// julga o `systemMessage` montado — nao o codigo-fonte. Assim o que se mede e o texto que
// chega ao modelo (armadilha nº 13: o instrumento julgando a string errada).
//
// Roda offline: so le o JSON. Nao publica, nao ativa, nao toca em rede.
// Uso:  node fluxos/_teststand/testa_idioma_niveis_evento.js [caminho.json]
const fs = require('fs');
const path = require('path');

const ARQ = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_evento.json');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)'
                            : 'PASSOU: a politica de idioma dos seis niveis do evento e a escada combinada'));
  process.exit(fails ? 1 : 0);
}

const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COM_APOIO = ['A1', 'A2', 'B1'];          // levam a linha 🇧🇷 por padrao
const SEM_APOIO = ['B2', 'C1', 'C2'];          // ingles integral por padrao
const BANDEIRA = '🇧🇷';

// Proibicoes de ajudar SOB PEDIDO. Cada uma existe hoje em pelo menos um nivel:
//   "mesmo que ele peca"           — B1
//   "ou peca"                      — B2 ("...escreva em portugues ou peca")
//   "peca explicacao em portugues" — C1
//   "em nenhuma hipotese"          — C2
const PROIBE_SOB_PEDIDO = [
  /mesmo que\s+(?:ele\s+|o aluno\s+|voc[êe]\s+)?pe[çc]a/i,
  /nem que\s+(?:ele\s+|o aluno\s+)?pe[çc]a/i,
  /\bou\s+pe[çc]a\b/i,
  /pe[çc]a\s+(?:explica[çc][ãa]o|ajuda|tradu|para|pra|em portugu[êe]s)/i,
  /em nenhuma hip[óo]tese/i,
];

ok(fs.existsSync(ARQ), 'arquivo existe: ' + path.basename(ARQ));
if (fails) fim();
const f = JSON.parse(fs.readFileSync(ARQ, 'utf8'));

// ---------- monta o systemMessage de cada nivel, executando o no ----------
function montaPrompt(nivel) {
  const n = f.nodes.find(x => x.name === 'Prompt Conversa ' + nivel);
  if (!n || !n.parameters || !n.parameters.jsCode) return null;
  const item = { json: { name: 'Ana', chatInput: 'oi' } };
  const $input = { item: item, first: () => item, all: () => [item] };
  const fn = new Function('$input', n.parameters.jsCode);
  const out = fn($input);
  return (out && out.json && out.json.systemMessage) || null;
}

// A clausula de IDIOMA vai do rotulo IDIOMA ate a linha LINGUAGEM (que a segue nos seis).
function clausulaIdioma(sys) {
  const i = sys.indexOf('IDIOMA');
  if (i < 0) return null;
  const j = sys.indexOf('\nLINGUAGEM', i);
  return j < 0 ? sys.slice(i) : sys.slice(i, j);
}

const prompt = {};
for (const lv of NIVEIS) {
  const sys = montaPrompt(lv);
  ok(!!sys, lv + ': no "Prompt Conversa ' + lv + '" existe e monta systemMessage');
  prompt[lv] = sys || '';
}
if (fails) fim();

// ---------- 1. os seis tem clausula de IDIOMA explicita ----------
// C1 e o caso que motivou o assert: uma clausula que nao diz o que fazer com o portugues
// e buraco, nao liberdade.
const clausula = {};
for (const lv of NIVEIS) {
  const c = clausulaIdioma(prompt[lv]);
  ok(!!c, lv + ': tem clausula IDIOMA explicita');
  clausula[lv] = c || '';
  if (c) ok(/ingl[êe]s/i.test(c), lv + ': a clausula IDIOMA diz o que fazer com o ingles');
}

// ---------- 2. A1 e A2: linha 🇧🇷 traduzindo a mensagem inteira, declarada como a ULTIMA ----------
for (const lv of ['A1', 'A2']) {
  const c = clausula[lv], sys = prompt[lv];
  ok(c.indexOf(BANDEIRA) >= 0, lv + ': a clausula IDIOMA exige a linha ' + BANDEIRA);
  ok(/mensagem INTEIRA/i.test(c), lv + ': a linha ' + BANDEIRA + ' traduz a mensagem INTEIRA');
  // quebra de linha real OU o `\n` escrito, que e como o A1 (a fonte do padrao) faz
  ok(/Formato EXATO/i.test(c) && new RegExp('(\\n|\\\\n)' + BANDEIRA).test(c),
     lv + ': a clausula traz o exemplo de formato com a linha ' + BANDEIRA + ' em linha propria');
  // A REGRA DE OURO e o que faz a linha ser a ultima — copiada do A1 (reuso obrigatorio).
  ok(/REGRA DE OURO/.test(sys), lv + ': tem a REGRA DE OURO');
  const regra = sys.slice(sys.indexOf('REGRA DE OURO'));
  ok(regra.indexOf(BANDEIRA) >= 0 && /[ÚU]LTIMA linha/.test(regra),
     lv + ': a REGRA DE OURO declara a linha ' + BANDEIRA + ' como a ULTIMA linha da resposta');
}

// ---------- 3. B1: a linha 🇧🇷 traduz a PERGUNTA FINAL ----------
{
  const c = clausula.B1, sys = prompt.B1;
  ok(c.indexOf(BANDEIRA) >= 0, 'B1: a clausula IDIOMA exige a linha ' + BANDEIRA);
  ok(/pergunta final/i.test(c), 'B1: a linha ' + BANDEIRA + ' e da PERGUNTA FINAL');
  ok(/(APENAS|S[ÓO]|somente)\s+a\s+pergunta final/i.test(c),
     'B1: a traducao e APENAS da pergunta final (nao da mensagem inteira)');
  ok(!/mensagem INTEIRA/i.test(c), 'B1: nao traduz a mensagem inteira (isso e A1/A2)');
  ok(/Formato EXATO/i.test(c) && new RegExp('(\\n|\\\\n)' + BANDEIRA).test(c),
     'B1: a clausula traz o exemplo de formato com a linha ' + BANDEIRA + ' em linha propria');
  ok(/REGRA DE OURO/.test(sys), 'B1: tem a REGRA DE OURO');
  const regra = sys.slice(sys.indexOf('REGRA DE OURO'));
  ok(regra.indexOf(BANDEIRA) >= 0 && /[ÚU]LTIMA linha/.test(regra),
     'B1: a REGRA DE OURO declara a linha ' + BANDEIRA + ' como a ULTIMA linha da resposta');
}

// ---------- 4. B2, C1, C2: sem apoio por padrao ----------
for (const lv of SEM_APOIO) {
  ok(prompt[lv].indexOf(BANDEIRA) < 0, lv + ': nenhuma linha ' + BANDEIRA + ' por padrao no prompt inteiro');
  ok(/INTEIRAMENTE em ingl[êe]s/i.test(clausula[lv]), lv + ': a clausula manda responder INTEIRAMENTE em ingles');
  ok(!/REGRA DE OURO/.test(prompt[lv]), lv + ': sem a REGRA DE OURO da linha de apoio');
}

// ---------- 5. nenhum dos seis proibe ajudar SOB PEDIDO ----------
for (const lv of NIVEIS) {
  const achou = PROIBE_SOB_PEDIDO.filter(re => re.test(prompt[lv])).map(re => String(re));
  ok(achou.length === 0,
     lv + ': nenhuma proibicao de ajudar sob pedido' + (achou.length ? ' (achou: ' + achou.join(' , ') + ')' : ''));
}

// ---------- 6. o detector reprova o comportamento errado (as duas direcoes, §5.6) ----------
// Se as regras acima so soubessem aprovar, nao mediriam nada. Aqui elas sao aplicadas a
// textos sabidamente errados — os que estavam no arquivo ANTES da E013.
const VELHOS = {
  'B1 antes da E013': "IDIOMA (regra dura): responda INTEIRAMENTE em inglês, inclusive a abertura e a pergunta final — NUNCA comece, comente ou explique em português, mesmo que o aluno escreva em português, mesmo que ele peça, e mesmo que você esteja simplificando. NÃO traduza.",
  'B2 antes da E013': "IDIOMA (regra dura): responda INTEIRAMENTE em inglês, natural e fluido, inclusive a abertura — NUNCA comece, comente ou explique em português, mesmo que o aluno escreva em português ou peça. Sem tradução.",
  'C1 antes da E013': "IDIOMA (regra dura): responda INTEIRAMENTE em inglês sofisticado — NUNCA escreva uma palavra em português, mesmo que o aluno escreva em português, misture os dois idiomas, peça explicação em português ou pareça inseguro.",
  'C2 antes da E013': "IDIOMA (regra dura): responda INTEIRAMENTE em inglês de nativo culto, idiomático — NUNCA escreva em português, em nenhuma hipótese. Sem tradução.",
};
for (const rotulo of Object.keys(VELHOS))
  ok(PROIBE_SOB_PEDIDO.some(re => re.test(VELHOS[rotulo])),
     'detector reprova o texto errado: ' + rotulo);

// ...e aprova os novos, que continuam mandando o modelo nao sair do ingles por conta propria.
const NOVOS = [
  "IDIOMA (regra dura): responda INTEIRAMENTE em inglês, inclusive a abertura — não comece, comente nem explique em português por conta própria, mesmo que o aluno escreva em português. Sem linha de tradução por padrão.",
  "IDIOMA (A2, formato OBRIGATÓRIO): primeiro TODO o inglês; depois UMA única linha nova começando com 🇧🇷 que traduz a mensagem INTEIRA.",
];
for (let i = 0; i < NOVOS.length; i++)
  ok(!PROIBE_SOB_PEDIDO.some(re => re.test(NOVOS[i])),
     'detector aprova o texto certo #' + (i + 1) + ' (nao confunde "mesmo que escreva em portugues" com proibicao sob pedido)');

fim();
