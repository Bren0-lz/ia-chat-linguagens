// E013 — a escada de idioma vira rampa: a politica de IDIOMA dos seis niveis do evento.
// E014b — e a rede de seguranca SOB PEDIDO nos seis, com precedencia UNIVERSAL (secoes 7 a 9;
// a 9 monta o prompt REAL a partir do Contexto Conversa, nos estados normal, pt_streak=2 e "ok ok ok").
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

// ---------- 7. E014b — a rede de seguranca SOB PEDIDO, nos seis niveis ----------
// A E013 tirou a PROIBICAO de ajudar; tirar a proibicao nao instrui o comportamento. Aqui se
// exige a regra que o A1 ja tinha ("SE O ALUNO DISSER QUE NAO ENTENDEU: repita a MESMA ideia
// ... nao troque de assunto"), generalizada para os seis. O que decide se ela funciona:
//
//   - PRECEDENCIA UNIVERSAL (handoff §5.3: diretiva solta perde em silencio para diretiva
//     marcada como obrigatoria). O prompt montado tem varias regras que se declaram obrigatorias
//     ou prioritarias — IDIOMA e BREVIDADE ("regra dura"), AJUSTE DINAMICO, GESTO DE ASSINATURA,
//     GANCHO OBRIGATORIO, RECIPROCIDADE com PRECEDENCIA, ECONOMIA DE TELA. A E014 original tentou
//     NOMEA-LAS uma a uma e medir, por regex, que nenhuma ficasse de fora; bloqueou porque
//     reconhecer "qualquer diretiva concorrente em qualquer redacao" e linguagem natural. A E014b
//     (decisao do Breno, 16/09) troca a lista pela clausula universal, e este teste NAO tenta
//     reconhecer diretivas concorrentes: exige so a clausula. A redacao aceita e a declarada em
//     UNIVERSAL abaixo; o criterio real de que ela vence e o probe ao vivo
//     (`vivo_ajuda_sob_pedido_evento.js`).
//   - GATILHOS explicitos, num trecho proprio, e NAO-GATILHOS num trecho proprio: o AJUSTE
//     DINAMICO trata "ok", "ok", "ok" (short_streak>=3) como inseguranca; a rede nao pode
//     disparar por desinteresse. Por isso o trecho dos gatilhos nao pode citar "ok", "sim",
//     "yes" nem resposta curta/monossilabica, e o trecho NAO E GATILHO tem de excluí-los.
//   - RETOMADA do ingles no turno seguinte (senao a conversa vira portugues permanente).
//   - a CHECAGEM FINAL, que cobra "a regra de IDIOMA respeitada 100%", abre a excecao e repete a
//     universalidade (senao a checagem desfaz a regra na ultima linha do prompt).
// Por nivel: A1/A2/B1 (ja tem a linha 🇧🇷) reforcam em portugues e re-explicam mais simples;
// B2/C1/C2 respondem em portugues NAQUELE turno.
const UNIVERSAL = [
  [/vence\s+TODAS\s+as\s+demais\s+regras\s+deste\s+prompt/i, 'vence TODAS as demais regras deste prompt'],
  [/inclusive\s+as\s+marcadas\s+como\s+obrigat[óo]rias,\s*priorit[áa]rias/i, 'inclusive as marcadas como obrigatorias, prioritarias'],
  [/regra dura/i, 'inclusive "regra dura"'],
];
// o que NAO pode ser gatilho — fora do trecho NAO E GATILHO, nao pode aparecer na regra
const DESINTERESSE = /\bok\b|\bsim\b|\byes\b|respostas?\s+(?:curtas?|monoss[íi]l[áa]bicas?)|monoss[íi]l[áa]b|desinteress/i;

function trechos(b) {
  const iG = b.search(/GATILHOS\b/);
  const iN = b.search(/N[ÃA]O [ÉE] GATILHO/);
  const iC = b.search(/COM GATILHO/);
  if (iG < 0 || iN < 0 || iC < 0 || !(iG < iN && iN < iC)) return null;
  return { cabecalho: b.slice(0, iG), gatilhos: b.slice(iG, iN), nao: b.slice(iN, iC), acao: b.slice(iC) };
}

function julgaAjuda(sys, lv) {
  const p = [];
  const linhas = sys.split('\n');
  const blocos = linhas.filter(l => /AJUDA SOB PEDIDO/.test(l) && !/^CHECAGEM FINAL/.test(l));
  if (blocos.length !== 1) { p.push('tem exatamente UM bloco "AJUDA SOB PEDIDO" (achou ' + blocos.length + ')'); return p; }
  const b = blocos[0];
  if (!/OBRIGAT[ÓO]RIA/.test(b)) p.push('marcada como OBRIGATORIA');
  const t = trechos(b);
  if (!t) { p.push('trechos GATILHOS -> NAO E GATILHO -> COM GATILHO, nessa ordem'); return p; }
  for (const [re, nome] of UNIVERSAL) if (!re.test(t.cabecalho)) p.push('precedencia universal: ' + nome);
  const g = t.gatilhos;
  if (!/n[ãa]o entendi/i.test(g)) p.push('gatilho "nao entendi"');
  if (!/tradu[zç]/i.test(g) || !/significa/i.test(g)) p.push('gatilho de traducao ("traduz", "o que significa X")');
  if (!/em portugu[êe]s/i.test(g)) p.push('gatilho "em portugues"');
  if (!/travad/i.test(g)) p.push('gatilho "aluno claramente travado"');
  if (!/'h[ãa]\?'/i.test(g) || !/'what\?'/i.test(g)) p.push('gatilhos curtos de quem nao entendeu ("hã?", "what?") — a fronteira com o "ok"');
  const semNao = t.cabecalho + t.gatilhos + t.acao;
  const m = semNao.match(DESINTERESSE);
  if (m) p.push('fora do NAO E GATILHO a regra cita desinteresse/resposta curta ("' + m[0] + '")');
  if (!/\bok\b/i.test(t.nao) || !/\bsim\b/i.test(t.nao) || !/\byes\b/i.test(t.nao) || !/monoss[íi]l[áa]b/i.test(t.nao))
    p.push('NAO E GATILHO exclui "ok", "sim", "yes" e resposta monossilabica');
  if (!/n[ãa]o se aplica/i.test(t.nao)) p.push('NAO E GATILHO diz que a regra nao se aplica');
  if (!/turno seguinte/i.test(t.acao) || !/(volte|retome)\s[^.:]{0,40}ingl[êe]s/i.test(t.acao)) p.push('manda voltar ao ingles no turno seguinte');
  if (!/socorro daquele turno/i.test(t.acao)) p.push('o portugues e socorro daquele turno, nao o idioma da conversa');
  if (!/MESMA ideia/.test(t.acao) || !/n[ãa]o troque de assunto/i.test(t.acao)) p.push('generaliza o A1: MESMA ideia, sem trocar de assunto');
  if (lv && SEM_APOIO.indexOf(lv) >= 0 && !/ATENDA em portugu[êe]s NAQUELE turno/i.test(t.acao))
    p.push('B2/C1/C2: atende em portugues NAQUELE turno');
  if (lv && COM_APOIO.indexOf(lv) >= 0 && (!/refor[çc]e em portugu[êe]s/i.test(t.acao) || !/mais simples/i.test(t.acao)))
    p.push('A1/A2/B1: reforca em portugues e re-explica mais simples');
  const chk = linhas.find(l => /^CHECAGEM FINAL/.test(l)) || '';
  if (!/AJUDA SOB PEDIDO/.test(chk) || !/todas as demais regras deste prompt/i.test(chk))
    p.push('a CHECAGEM FINAL abre a excecao da AJUDA SOB PEDIDO repetindo a precedencia universal');
  return p;
}

for (const lv of NIVEIS) {
  const p = julgaAjuda(prompt[lv], lv);
  ok(p.length === 0, lv + ': AJUDA SOB PEDIDO com precedencia universal, gatilhos, nao-gatilhos e retomada do ingles' +
     (p.length ? ' (falta: ' + p.join(' ; ') + ')' : ''));
}
// O que o A1 tinha antes nao pode sobreviver ao lado da regra nova (duas regras = ambiguidade).
ok(!/SE O ALUNO DISSER QUE N[ÃA]O ENTENDEU/.test(prompt.A1),
   'A1: a regra antiga ("SE O ALUNO DISSER QUE NAO ENTENDEU") foi substituida pela generalizada, nao duplicada');

// A1: a REGRA DE OURO e a clausula bilingue (IDIOMA) ficam byte a byte iguais as do v8, que nunca
// recebeu a E014b. A regra nova entra ao lado, nao reescreve o formato que o T012 levou a 9/9.
{
  const V8 = path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
  const fv8 = JSON.parse(fs.readFileSync(V8, 'utf8'));
  const n8 = fv8.nodes.find(x => x.name === 'Prompt Conversa A1');
  const it = { json: { name: 'Ana', chatInput: 'oi' } };
  const sys8 = new Function('$input', n8.parameters.jsCode)({ item: it, first: () => it, all: () => [it] }).json.systemMessage;
  const linha = (s, re) => s.split('\n').filter(l => re.test(l));
  for (const [nome, re] of [['REGRA DE OURO', /^REGRA DE OURO/], ['clausula bilingue (IDIOMA)', /^IDIOMA/]]) {
    const a = linha(sys8, re), e = linha(prompt.A1, re);
    ok(a.length === 1 && e.length === 1 && a[0] === e[0], 'A1: ' + nome + ' identica byte a byte a do v8');
  }
}

// ---------- 8. o julgamento nas duas direcoes (§5.6) ----------
const CHK_OK = "CHECAGEM FINAL antes de enviar: (2) a regra de IDIOMA do nível foi respeitada 100% — salvo se houve GATILHO da AJUDA SOB PEDIDO, que vence todas as demais regras deste prompt, inclusive esta checagem?";
const CHK_VELHA = 'CHECAGEM FINAL antes de enviar: (2) a regra de IDIOMA do nível foi respeitada 100%?';
const CHK_E014 = 'CHECAGEM FINAL antes de enviar: (2) a regra de IDIOMA do nível foi respeitada 100% (se o aluno pediu ajuda, vale a AJUDA SOB PEDIDO, que tem precedência)?';
const CAB_OK = "AJUDA SOB PEDIDO (regra OBRIGATÓRIA de PRECEDÊNCIA UNIVERSAL — vence TODAS as demais regras deste prompt, inclusive as marcadas como obrigatórias, prioritárias, com precedência ou 'regra dura', estejam antes ou depois desta): ";
const GAT_OK = "GATILHOS (só estes): o aluno diz que não entendeu ('não entendi', 'hã?', 'what?'), pede tradução ('traduz', 'o que significa X?'), pede para você falar em português, ou está claramente travado. ";
const NAO_OK = "NÃO É GATILHO: resposta curta, monossilábica ou desinteressada ('ok', 'sim', 'yes') — aí esta regra não se aplica. ";
const ACAO_OK = "COM GATILHO, ATENDA em português NAQUELE turno: repita a MESMA ideia anterior em português claro e simples. Não troque de assunto. No turno seguinte, retome o inglês integral do nível: o português é socorro daquele turno, não o idioma da conversa.";
const AJUDA_OK = CAB_OK + GAT_OK + NAO_OK + ACAO_OK;
const RUINS = {
  // a regra do A1 de antes da E014: solta, sem precedencia e sem retomada
  'regra solta do A1 (antes da E014)': "SE O ALUNO DISSER QUE NÃO ENTENDEU: repita a MESMA ideia anterior de um jeito ainda mais simples e em inglês CORRETO, com tradução — não troque de assunto nem faça uma pergunta nova diferente.\n" + CHK_VELHA,
  // a tentativa 3 da E014 (branch wip): precedencia NOMEADA, sem clausula universal
  'precedencia nomeada da E014 (sem universal)': AJUDA_OK.replace(CAB_OK, "AJUDA SOB PEDIDO (regra OBRIGATÓRIA — tem PRECEDÊNCIA sobre a cláusula de IDIOMA do nível, sobre o AJUSTE DINÂMICO, sobre a BREVIDADE, sobre a ECONOMIA DE TELA e sobre qualquer INCENTIVO AO INGLÊS): ") + '\n' + CHK_OK,
  'universal sem "inclusive as obrigatorias"': AJUDA_OK.replace(", inclusive as marcadas como obrigatórias, prioritárias, com precedência ou 'regra dura'", '') + '\n' + CHK_OK,
  'gatilho "ok" entre os gatilhos': AJUDA_OK.replace("ou está claramente travado", "responde só 'ok', ou está claramente travado") + '\n' + CHK_OK,
  'gatilho "resposta curta" entre os gatilhos': AJUDA_OK.replace("ou está claramente travado", "dá respostas curtas, ou está claramente travado") + '\n' + CHK_OK,
  'gatilho "yes" na acao': AJUDA_OK.replace('Não troque de assunto.', "Não troque de assunto, mesmo se ele disser 'yes'.") + '\n' + CHK_OK,
  'sem o trecho NAO E GATILHO': AJUDA_OK.replace(NAO_OK, '') + '\n' + CHK_OK,
  'NAO E GATILHO sem excluir "ok"': AJUDA_OK.replace("('ok', 'sim', 'yes')", "('sim', 'yes')") + '\n' + CHK_OK,
  'sem retomada do ingles': AJUDA_OK.replace(/ No turno seguinte, retome o inglês integral do nível: o português é socorro daquele turno, não o idioma da conversa\./, '') + '\n' + CHK_OK,
  'portugues permanente': AJUDA_OK.replace(/No turno seguinte, retome o inglês integral do nível: o português é socorro daquele turno, não o idioma da conversa\./, 'Daí em diante, continue em português.') + '\n' + CHK_OK,
  'checagem final ainda cobra IDIOMA 100% sem excecao': AJUDA_OK + '\n' + CHK_VELHA,
  'checagem final com a excecao da E014, sem universal': AJUDA_OK + '\n' + CHK_E014,
  'sem o gatilho de traducao': AJUDA_OK.replace(/, pede tradução \('traduz', 'o que significa X\?'\)/, '') + '\n' + CHK_OK,
  'sem o gatilho hã?': AJUDA_OK.replace(", 'hã?'", '') + '\n' + CHK_OK,
  'sem o gatilho what?': AJUDA_OK.replace(", 'what?'", '') + '\n' + CHK_OK,
  'sem o gatilho travado': AJUDA_OK.replace(', ou está claramente travado', '') + '\n' + CHK_OK,
};
for (const r of Object.keys(RUINS))
  ok(julgaAjuda(RUINS[r], 'B2').length > 0, 'julgamento E014b reprova o texto errado: ' + r);
{
  const p = julgaAjuda(AJUDA_OK + '\n' + CHK_OK, 'B2');
  ok(p.length === 0, 'julgamento E014b aprova o texto certo' + (p.length ? ' (falta: ' + p.join(' ; ') + ')' : ''));
}
// "simples", "símbolo", "yesterday", "okay-ish": nao sao desinteresse (sem falso positivo)
ok(!DESINTERESSE.test("em português claro e simples, yesterday, símbolo, bookkeeper"),
   'detector de desinteresse nao acusa "simples", "yesterday", "simbolo"');

// ---------- 9. o prompt REAL: Contexto Conversa -> Prompt Conversa <nivel> ----------
// As secoes 7 e 8 julgam o Prompt Conversa com um item stub, sem as linhas dinamicas. O que chega
// ao modelo inclui o que o `Contexto Conversa` injeta conforme o estado do aluno. Mede-se que a
// regra continua inteira nos estados em que as linhas concorrentes aparecem — e em particular no
// "ok", "ok", "ok" (short_streak=3), onde o AJUSTE DINAMICO chama o aluno de inseguro e a regra
// tem de dizer que isso NAO e gatilho. Nao se tenta reconhecer as linhas concorrentes (E014b).
const ctxNo = f.nodes.find(x => x.name === 'Contexto Conversa');
ok(!!(ctxNo && ctxNo.parameters && ctxNo.parameters.jsCode), 'no "Contexto Conversa" existe');
function montaReal(nivel, text, conv) {
  const item = { json: { name: 'Ana', text: text, streak_count: 1, first_today: false,
                         profile: { level: nivel, persona: 'buddy', interests: [], conv: conv } } };
  const $i = { item: item, first: () => item, all: () => [item] };
  const ctx = new Function('$input', ctxNo.parameters.jsCode)($i).json;
  const n = f.nodes.find(x => x.name === 'Prompt Conversa ' + nivel);
  const it2 = { json: ctx };
  const out = new Function('$input', n.parameters.jsCode)({ item: it2, first: () => it2, all: () => [it2] });
  return { sys: out.json.systemMessage, ctx: ctx };
}
const ESTADOS = [
  { rot: 'normal',             text: 'I like playing football on weekends', conv: { pt_streak: 0, short_streak: 0, en_streak: 0, turns: 1 } },
  { rot: 'pt_streak=2',        text: 'não entendi nada do que você disse',   conv: { pt_streak: 1, short_streak: 0, en_streak: 0, turns: 1 } },
  { rot: 'ok ok ok (short=3)', text: 'ok',                                   conv: { pt_streak: 0, short_streak: 2, en_streak: 0, turns: 1 } },
];
if (ctxNo) for (const lv of NIVEIS) for (const e of ESTADOS) {
  const r = montaReal(lv, e.text, e.conv);
  // o estado tem de ter sido produzido de fato, senao o assert abaixo nao mede nada
  if (e.rot !== 'normal')
    ok(!!r.ctx.moodLine && /inseguro/.test(r.ctx.moodLine) && r.sys.indexOf(r.ctx.moodLine) >= 0,
       lv + ' [' + e.rot + ']: o AJUSTE DINAMICO de aluno inseguro esta de fato no prompt montado');
  const pj = julgaAjuda(r.sys, lv);
  ok(pj.length === 0, lv + ' [' + e.rot + ']: AJUDA SOB PEDIDO completa no prompt montado' + (pj.length ? ' (falta: ' + pj.join(' ; ') + ')' : ''));
}

fim();
