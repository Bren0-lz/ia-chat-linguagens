// E002 — no arquivo do EVENTO, escolher o nivel ja leva a personalidade.
//
// No v8 o callback `pl_start_X` so CALIBRA onde o teste adaptativo de 10 questoes comeca:
// o `Placement Engine` monta a primeira questao e abre uma linha em `placement_attempts`.
// No evento nao ha teste — o nivel que o aluno escolheu E o nivel dele. O ramo `start` passa
// a reproduzir o efeito do FIM do teste (level, profile.level, onboarding='pick_persona',
// placement_state=NULL) sem as questoes e sem tentativa registrada.
//
// Este teste roda o `Placement Engine` do arquivo indicado fora do n8n. Contra o
// `IAChat_Telegram_v8.json` ele tem de REPROVAR — e essa reprovacao que prova que o atalho
// existe no evento e so nele.
//
// Uso:  node fluxos/_teststand/testa_atalho_nivel_evento.js [caminho/do/fluxo.json]
const fs = require('fs');
const path = require('path');

const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_evento.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  x ' + msg); } else console.log('  ok ' + msg); }
function fim() {
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: o atalho de nivel do evento leva direto a personalidade'));
  process.exit(fails ? 1 : 0);
}

console.log('Fluxo sob teste: ' + path.basename(FLOW));
ok(!!code['Placement Engine'], 'o fluxo tem o no "Placement Engine"');
if (fails) fim();

// ---------- banco fake de questoes (o atalho nao deve usa-lo) ----------
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const exam = [];
let id = 1;
for (const L of LEVELS) for (let i = 0; i < 10; i++)
  exam.push({ id: id++, cefr_level: L, skill: 'grammar', qtype: i % 2 ? 'written' : 'mc',
    prompt: L + ' q' + i, options: i % 2 ? null : ['am', 'is', 'are', 'be'],
    answer: i % 2 ? 'are' : 'is', explanation: 'exp' });

function run(nodeName, ctx) {
  const $ = (name) => ({ first: () => ({ json: ctx.refs[name] }), all: () => (ctx.refs[name] || []).map(j => ({ json: j })) });
  const $input = { item: { json: ctx.item }, all: () => (ctx.input || []).map(j => ({ json: j })) };
  const fn = new Function('$', '$input', '$json', code[nodeName] + '\n');
  return fn($, $input, ctx.item).json;
}
function escolheNivel(callbackData, profile) {
  const rm = { userId: 990123456, subroute: 'start', placement_state: null,
    profile: profile || {}, text: '', callbackData: callbackData };
  return run('Placement Engine', { refs: { 'Roteador Mestre': rm }, input: exam, item: exam[0] });
}

// ---------- 1. o caso central: pl_start_B1 ----------
console.log('\n== pl_start_B1: o nivel escolhido vira o nivel do aluno ==');
const r = escolheNivel('pl_start_B1');
const sql = String(r.sql || '');
ok(/\blevel='B1'/.test(sql), "grava level='B1'");
ok(/onboarding='pick_persona'/.test(sql), "grava onboarding='pick_persona'");
ok(/placement_state=NULL/.test(sql), 'grava placement_state=NULL');
ok(!/placement_state='/.test(sql), 'nao salva estado de teste (nenhum placement_state=<json>)');
ok(!/INSERT INTO placement_attempts/i.test(sql), 'NAO insere em placement_attempts (nao houve tentativa)');
ok(/profile='[^']*"level":"B1"/.test(sql), "grava profile.level='B1'");

const visivel = String(r.text || '') + '\n' + String(r.gabarito || '');
ok(!/Quest[aã]o\s*\d+\s*\/\s*\d+/i.test(visivel), 'nenhuma questao no texto de saida');
ok(visivel.indexOf('(escreva sua resposta)') < 0, 'nao pede resposta escrita de questao');
ok(visivel.indexOf('Gabarito detalhado') < 0, 'nenhum gabarito de teste (nao houve teste)');
ok(visivel.trim().length > 0, 'a saida nao e vazia (armadilha no 1: vazio nao e aprovacao)');

// ---------- 2. a saida cai no mesmo caminho que o FIM do teste usa ----------
console.log('\n== a vez passa para a personalidade, pelo caminho que ja existia ==');
const sw = flow.nodes.find(n => n.name === 'Envio Placement');
const regras = sw && sw.parameters && sw.parameters.rules ? sw.parameters.rules.values : [];
const chaves = regras.map(v => v.outputKey);
ok(chaves.indexOf(String(r.send_kind)) >= 0, 'send_kind "' + r.send_kind + '" e uma saida conhecida do "Envio Placement"');
ok(r.send_kind === 'gabarito', 'send_kind e o mesmo do fim do teste ("gabarito"), nao um ramo novo');

function alcanca(origem, destino) {
  const visto = new Set(); const fila = [origem];
  while (fila.length) {
    const n = fila.shift();
    if (n === destino) return true;
    if (visto.has(n)) continue; visto.add(n);
    const c = flow.connections[n];
    if (!c || !c.main) continue;
    for (const br of c.main) for (const x of (br || [])) fila.push(x.node);
  }
  return false;
}
const iSaida = chaves.indexOf(r.send_kind);
const conn = flow.connections['Envio Placement'];
const primeiro = (iSaida >= 0 && conn && conn.main && conn.main[iSaida] && conn.main[iSaida][0]) ? conn.main[iSaida][0].node : null;
ok(!!primeiro, 'a saida "' + r.send_kind + '" do "Envio Placement" esta ligada em connections');
ok(!!primeiro && alcanca(primeiro, 'Enviar Pergunta Persona'), 'a partir dela o fluxo alcanca "Enviar Pergunta Persona"');

// ---------- 3. as duas pontas da escala ----------
console.log('\n== as duas pontas da escala ==');
for (const L of ['A1', 'C2']) {
  const x = escolheNivel('pl_start_' + L);
  const s = String(x.sql || '');
  ok(new RegExp("\\blevel='" + L + "'").test(s), 'pl_start_' + L + ": grava level='" + L + "'");
  ok(new RegExp('profile=\'[^\']*"level":"' + L + '"').test(s), 'pl_start_' + L + ': grava profile.level');
  ok(/onboarding='pick_persona'/.test(s), 'pl_start_' + L + ": vai para 'pick_persona'");
  ok(!/INSERT INTO placement_attempts/i.test(s), 'pl_start_' + L + ': sem placement_attempts');
  ok(!/Quest[aã]o\s*\d+\s*\/\s*\d+/i.test(String(x.text || '') + String(x.gabarito || '')), 'pl_start_' + L + ': sem questao');
}

// ---------- 4. callback invalido cai num nivel padrao, nao grava lixo ----------
console.log('\n== callback invalido nao vira lixo no banco ==');
// Dois padroes herdados do v8, os dois niveis validos: suxifo invalido em `pl_start_*` cai em
// A1 (guarda do LEVELS); callback que nem comeca com `pl_start_` nunca sobrescreve o inicial A2.
const INVALIDOS = [
  ['pl_start_Z9', 'A1'],
  ['pl_start_', 'A1'],
  ["pl_start_B1'; DROP TABLE students;--", 'A1'],
  ['lixo', 'A2'],
  ['', 'A2'],
];
for (const par of INVALIDOS) {
  const cb = par[0], esperado = par[1];
  const x = escolheNivel(cb);
  const s = String(x.sql || '');
  const m = s.match(/\blevel='([^']*)'/);
  ok(!!m && LEVELS.indexOf(m[1]) >= 0, 'callback ' + JSON.stringify(cb) + ': nivel gravado esta em LEVELS (foi ' + (m ? m[1] : 'nenhum') + ')');
  ok(!!m && m[1] === esperado, 'callback ' + JSON.stringify(cb) + ': cai no padrao ' + esperado);
  ok(/onboarding='pick_persona'/.test(s), 'callback ' + JSON.stringify(cb) + ': segue para a persona mesmo assim');
  ok(!/DROP TABLE/i.test(s), 'callback ' + JSON.stringify(cb) + ': nada do callback cru vaza para o SQL');
}

fim();
