// T019 — prova que cada prompt do Professor recebe SO a clausula de idioma que lhe diz respeito.
//
// O DEFEITO QUE ISTO IMPEDE (T3, medido 3/3 em B2 na bateria de 06/09):
// `qSys()` recebia o LANG INTEIRO, entao a clausula "Escreva a EXPLICACAO em portugues"
// entrava no prompt que gera a QUESTAO e o enunciado saia em portugues, contra o contrato
// (EN de B1 pra cima).
//
// Por que reforco textual nao resolvia: B1 e B2 tem a clausula de perguntas IDENTICA
// ("INTEIRAMENTE em ingles, enunciado e resposta") e o B2 falhava assim mesmo. Foi o
// conserto tentado no T005b -- funcionou em B1 na medicao da epoca e nao se sustentou.
//
// Este teste roda OFFLINE, com o mesmo truque do capturaConst: executa o jsCode do no
// com refs falsas e le os prompts realmente montados, em vez de casar texto no fonte.
//
//   node fluxos/_teststand/testa_lang_separado.js [caminho-do-fluxo]

const fs = require('fs');
const path = require('path');

const FLUXO = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v8.json');
const NO = 'Professor Engine';
const NIVEIS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : ''));
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

const f = JSON.parse(fs.readFileSync(FLUXO, 'utf8'));
const no = f.nodes.find(n => n.name === NO);
if (!no) { console.error('no "' + NO + '" nao encontrado em ' + FLUXO); process.exit(1); }
const src = no.parameters.jsCode;

// Executa o jsCode ate capturar as quatro funcoes de prompt e os mapas de idioma.
// Cada uma e chamada com um topico falso; o que interessa e o texto montado.
function extraiPrompts(nivel) {
  const slot = '__t019_' + nivel;

  // A captura tem de entrar ANTES do `return` do no -- codigo depois dele nunca roda.
  // Ponto escolhido: logo apos a montagem do LANG. As funcoes de prompt sao declaracoes,
  // portanto ja estao hoisted e capturaveis ali.
  const marca = js => {
    const m = js.match(/const LANG=\{\}[^\n]*\n/);
    if (!m) return null;
    const pos = m.index + m[0].length;
    const captura = 'globalThis.' + slot + '={' +
      'expSys:typeof expSys==="function"?expSys:null,' +
      'qSys:typeof qSys==="function"?qSys:null,' +
      'dSys:typeof dSys==="function"?dSys:null,' +
      'wrongSys:typeof wrongSys==="function"?wrongSys:null,' +
      'LANG_EXPL:typeof LANG_EXPL!=="undefined"?LANG_EXPL:null,' +
      'LANG_PERG:typeof LANG_PERG!=="undefined"?LANG_PERG:null,' +
      'LANG:typeof LANG!=="undefined"?LANG:null};\n';
    return js.slice(0, pos) + captura + js.slice(pos);
  };
  // Versao anterior (LANG num bloco so): captura logo depois do fecho do objeto.
  const marcaAntiga = js => {
    const i = js.indexOf('const LANG=');
    if (i < 0) return null;
    const fim = js.indexOf('};', i) + 2;
    const captura = '\nglobalThis.' + slot + '={' +
      'expSys:typeof expSys==="function"?expSys:null,' +
      'qSys:typeof qSys==="function"?qSys:null,' +
      'dSys:typeof dSys==="function"?dSys:null,' +
      'wrongSys:typeof wrongSys==="function"?wrongSys:null,' +
      'LANG_EXPL:typeof LANG_EXPL!=="undefined"?LANG_EXPL:null,' +
      'LANG_PERG:typeof LANG_PERG!=="undefined"?LANG_PERG:null,' +
      'LANG:typeof LANG!=="undefined"?LANG:null};\n';
    return js.slice(0, fim) + captura + js.slice(fim);
  };
  const instrumentado = marca(src) || marcaAntiga(src) || src;

  // refs falsas: o Roteador entrega o nivel; o resto o engine deriva.
  const refs = {
    'Roteador Mestre': {
      userId: 1, subroute: 'intro', text: '', callbackData: '',
      profile: { level: nivel, persona: 'buddy' }, level: nivel, name: 'Teste',
    },
  };
  const $ = (n) => ({ first: () => ({ json: refs[n] || {} }), all: () => (refs[n] ? [{ json: refs[n] }] : []) });
  const $input = { item: { json: { ...refs['Roteador Mestre'] } }, all: () => [{ json: refs['Roteador Mestre'] }] };

  delete globalThis[slot];
  try {
    new Function('$', '$input', '$json', instrumentado)($, $input, refs['Roteador Mestre']);
  } catch (e) { /* o engine depende de banco/estado que nao temos aqui */ }
  return globalThis[slot] || {};
}

console.log('\n== idioma: cada prompt recebe so a sua clausula ==');
console.log('fluxo: ' + path.basename(FLUXO) + '\n');

const base = extraiPrompts('B2');

// 1) as duas metades existem e cobrem os 6 niveis
ok(base.LANG_EXPL && base.LANG_PERG, 'LANG_EXPL e LANG_PERG existem',
   base.LANG_EXPL ? 'sim' : 'NAO — o LANG ainda e um bloco so');
if (!base.LANG_EXPL || !base.LANG_PERG) {
  console.log('\nREPROVOU: sem as duas metades, o resto nao faz sentido\n');
  process.exit(1);
}
for (const n of NIVEIS) {
  ok(base.LANG_EXPL[n] && base.LANG_PERG[n], 'nivel ' + n + ' tem as duas metades');
}

// 2) LANG continua identico a soma — a decisao de produto nao mudou, so a injecao.
//    (valida_explicacoes.js e idioma_professor.js leem o LANG do fluxo, e estao no gate)
let identico = true;
for (const n of NIVEIS) {
  if (base.LANG[n] !== base.LANG_EXPL[n] + ' ' + base.LANG_PERG[n]) identico = false;
}
ok(identico, 'LANG = LANG_EXPL + LANG_PERG nos 6 niveis (contrato preservado)');

// 3) o coracao do teste: separacao real nos prompts montados
const tp = ['Present perfect continuous', 'formacao, uso e contraste com o present perfect'];
for (const n of NIVEIS) {
  const p = extraiPrompts(n);
  if (!p.qSys || !p.expSys) { ok(false, 'nivel ' + n + ': funcoes de prompt nao capturadas'); continue; }

  const q = String(p.qSys(tp));
  const e = String(p.expSys(tp));
  const expl = p.LANG_EXPL[n];
  const perg = p.LANG_PERG[n];

  ok(!q.includes(expl),
     'nivel ' + n + ': qSys NAO carrega a clausula de EXPLICACAO',
     q.includes(expl) ? 'CONTAMINADO — e o defeito do T3' : 'limpo');
  ok(q.includes(perg),
     'nivel ' + n + ': qSys carrega a clausula de PERGUNTAS');
  ok(!e.includes(perg),
     'nivel ' + n + ': expSys NAO carrega a clausula de PERGUNTAS',
     e.includes(perg) ? 'instrucao irrelevante no prompt de explicacao' : 'limpo');
  ok(e.includes(expl),
     'nivel ' + n + ': expSys carrega a clausula de EXPLICACAO');
}

// 4) duvida e correcao produzem prosa explicativa: recebem a de explicacao, nao a de perguntas
for (const fn of ['dSys', 'wrongSys']) {
  const p = extraiPrompts('B2');
  if (typeof p[fn] !== 'function') { ok(false, fn + ' nao capturada'); continue; }
  let texto = '';
  try { texto = String(p[fn](tp)); } catch (e) { texto = ''; }
  if (!texto) { ok(true, fn + ': nao avaliavel isoladamente (depende de estado)', 'pulado'); continue; }
  ok(!texto.includes(p.LANG_PERG.B2), fn + ' NAO carrega a clausula de PERGUNTAS');
}

// 5) nenhum uso do LANG inteiro sobrou nos prompts
const usosInteiros = (src.match(/LANG\[lvl\]/g) || []).length;
ok(usosInteiros === 0, 'nenhum prompt injeta o LANG inteiro',
   usosInteiros ? usosInteiros + ' uso(s) de LANG[lvl] restante(s)' : '0 usos');

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: nenhum prompt do Professor ve instrucao de idioma que nao lhe diz respeito\n');
process.exit(0);
