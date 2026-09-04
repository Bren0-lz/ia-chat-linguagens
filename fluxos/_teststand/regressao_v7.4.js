// Regressao offline dos nos de codigo do v7.4 (roda sem n8n, sem banco e sem LLM).
// Uso:  node fluxos/_teststand/regressao_v7.4.js [caminho/do/fluxo.json]
// Cobre os testes diagnosticos deterministicos: A6, B1, B2, B3, B6, C2, C5, C6, C10, C12,
// R6, S1, T5, T7, T10, T11, T12, T17 e PS2.
const fs = require('fs');
const path = require('path');
const FLOW = process.argv[2] || path.join(__dirname, '..', 'IAChat_Telegram_v7.4.json');
const flow = JSON.parse(fs.readFileSync(FLOW, 'utf8'));
const code = {};
for (const n of flow.nodes) if (n.parameters && n.parameters.jsCode) code[n.name] = n.parameters.jsCode;

function run(nodeName, ctx) {
  // ctx: { refs: {nodeName: json}, input: [json], item: json }
  const $ = (name) => ({ first: () => ({ json: ctx.refs[name] }), all: () => (ctx.refs[name] || []).map(j => ({ json: j })) });
  const $input = { item: { json: ctx.item }, all: () => (ctx.input || []).map(j => ({ json: j })) };
  const $json = ctx.item;
  const fn = new Function('$', '$input', '$json', code[nodeName] + '\n');
  return fn($, $input, $json).json;
}

// ---------- banco fake ----------
const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const exam = [];
let id = 1;
for (const L of LEVELS) for (let i = 0; i < 10; i++)
  exam.push({ id: id++, cefr_level: L, skill: 'grammar', qtype: i % 2 ? 'written' : 'mc',
    prompt: `${L} q${i}`, options: i % 2 ? null : ['am','is','are','be'], answer: i % 2 ? 'are' : 'is',
    explanation: 'exp' });

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }

// ============ PLACEMENT ============
console.log('\n== Placement ==');
function pl(sub, extra, ps) {
  const rm = Object.assign({ userId: 111, subroute: sub, placement_state: ps, profile: {}, text: '', callbackData: '' }, extra);
  return run('Placement Engine', { refs: { 'Roteador Mestre': rm }, input: exam, item: exam[0] });
}
let r = pl('start', { callbackData: 'pl_start_A2' }, null);
let ps = JSON.parse(r.sql.match(/placement_state='(.*?)'::jsonb/s)[1].replace(/''/g, "'"));
ok(ps.cur != null && ps.used.length === 1, 'B3: começa com 1 questão sorteada (seleção dinâmica)');

// erra tudo -> desce até A1 e completa 10
let cur = ps, turns = 0;
while (cur && cur.status === 'in_progress' && turns < 20) {
  const qw = exam.find(e => e.id === cur.cur);
  const wrongAns = (qw.qtype === 'mc') ? qw.options.find(o => o !== qw.answer) : 'zzz';
  const res = pl('answer', { text: wrongAns }, cur);
  turns++;
  const m = res.sql.match(/placement_state='(.*?)'::jsonb/s);
  if (!m) { cur = null; ok(/Seu nível estimado: A1/.test(res.gabarito), 'B1: piso A1 após errar tudo (' + turns + ' questões)'); break; }
  cur = JSON.parse(m[1].replace(/''/g, "'"));
}
ok(turns === 10, 'teste termina em 10 questões (foi ' + turns + ')');

// acerta tudo -> teto C1
cur = JSON.parse(pl('start', { callbackData: 'pl_start_A2' }, null).sql.match(/placement_state='(.*?)'::jsonb/s)[1].replace(/''/g, "'"));
turns = 0; let levels = [];
while (cur && turns < 20) {
  const qq = exam.find(e => e.id === cur.cur);
  const res = pl('answer', { text: qq.answer }, cur);
  turns++;
  const m = res.sql.match(/placement_state='(.*?)'::jsonb/s);
  if (!m) { ok(/Seu nível estimado: C2/.test(res.gabarito), 'B2/B7: acertando tudo chega a C2 (teto habilitado)'); break; }
  cur = JSON.parse(m[1].replace(/''/g, "'")); levels.push(cur.level);
}
ok(new Set(levels).size > 1, 'B3: nível oscila durante o teste (' + levels.join('>') + ')');
// dificuldade acompanha o nível: última questão sorteada deve ser de nível alto
console.log('  níveis das questões usadas:', cur ? '' : '');

// B6: texto que não é resposta
cur = JSON.parse(pl('start', { callbackData: 'pl_start_A2' }, null).sql.match(/placement_state='(.*?)'::jsonb/s)[1].replace(/''/g, "'"));
const qq0 = exam.find(e => e.id === cur.cur);
const b6 = pl('answer', { text: 'não sei, o que significa isso?' }, cur);
ok(/Não entendi isso como resposta/.test(b6.text) && !/placement_state=/.test(b6.sql), 'B6: mensagem fora de contexto não conta como resposta e reenvia a questão');

// ============ PROFESSOR ============
console.log('\n== Professor ==');
const practice = [{ cefr_level: 'A1', prompt: 'Complete: I ___ happy.', answer: 'am', qtype: 'written' }];
function prof(sub, extra, ts) {
  const rm = Object.assign({ userId: 222, name: 'Lucas', subroute: sub, teacher_state: ts, profile: { level: 'A1', persona: 'comedian' },
    level: 'A1', text: '', callbackData: '', streak_count: 5, first_today: true }, extra);
  return run('Professor Engine', { refs: { 'Roteador Mestre': rm }, input: practice, item: practice[0] });
}
function tsOf(res) { return res.teacher_state_new; }

let p1 = prof('intro', {}, null);
ok(p1.llmTask === 'explain' && /Comediante/.test(p1.systemMessage), 'T17: persona (Comediante) presente no prompt de explicação');
ok(/🔥 5 dias seguidos/.test(p1.feedback), 'C12: streak comemorado no 1º contato do dia (modo Professor)');

let p2 = prof('start_quiz', {}, tsOf(p1));
ok(p2.llmTask === 'question' && /FORMATO DE SAIDA/.test(p2.systemMessage), 'qSys com formato defensivo');

let ts2 = tsOf(p2); ts2.question = 'Complete: I ___ a student.'; ts2.answer = 'am'; ts2.q_answered = false; ts2.streak = 3;

// R6: pedir o gabarito durante a questão
let p3 = prof('check', { text: 'qual a resposta?' }, ts2);
ok(p3.llmTask === 'doubt' && !/"am"/.test(p3.systemMessage) && !p3.feedback, 'R6/T7: pedir gabarito vira dúvida e o prompt não recebe a resposta');
ok(tsOf(p3).streak === 3, 'R6: sequência preservada ao pedir ajuda');

// T11: voltar à questão
let p4 = prof('resume_q', {}, tsOf(p3));
ok(p4.send_kind === 'resume_q' && /Complete: I ___ a student/.test(p4.deterministicText) && tsOf(p4).streak === 3,
   'T11: volta para a MESMA questão sem reiniciar o quiz');

// T10: acertar marca q_answered
let p5 = prof('check', { text: 'am' }, tsOf(p4));
ok(tsOf(p5).q_answered === true, 'T10: acerto marca q_answered=true (libera a dúvida com gabarito)');
ok(tsOf(p5).streak === 4, 'streak incrementa no acerto');

// erro -> correção
let ts6 = tsOf(p5); ts6.question = 'Complete: She ___ happy.'; ts6.answer = 'is'; ts6.q_answered = false; ts6.phase = 'quiz';
let p6 = prof('check', { text: 'are' }, ts6);
ok(p6.send_kind === 'wrong' && /resposta certa era/.test(p6.feedback) && /Comediante/.test(p6.systemMessage), 'T12: erro mostra gabarito + explicação com persona');

// dúvida com questão pendente não recebe gabarito
let ts7 = Object.assign({}, tsOf(p2), { question: 'Complete: I ___ ok.', answer: 'am', q_answered: false });
let p7 = prof('doubt_msg', { text: 'não entendi' }, ts7);
ok(!/resposta correta é/.test(p7.systemMessage) && /NÃO SABE a resposta correta/.test(p7.systemMessage), 'T7: dSys sem gabarito enquanto a questão está aberta');
ok(p7.backCb === 't_resume' && /Voltar à questão/.test(p7.backLabel), 'T11: botão vira "Voltar à questão" quando há questão pendente');

// ============ PARSE PROFESSOR ============
console.log('\n== Parse Professor ==');
function parse(output, eng) {
  return run('Parse Professor', { refs: { 'Professor Engine': eng }, item: { output } });
}
const engQ = { llmTask: 'question', feedback: '', userId: 222, recent_q: [], practice_bank: practice };
const variantes = [
  ['P: Complete: I ___ happy.\nR: am', 'formato canônico'],
  ['**Pergunta:** Complete: I ___ happy.\n**Resposta:** am', 'markdown + rótulos por extenso'],
  ['Question: Complete: I ___ happy.\nAnswer: am', 'rótulos em inglês'],
  ['1. P - Complete: I ___ happy.\n2. R - am', 'numerado com travessão'],
  ['Claro! Aqui vai:\n\nP: Complete: I ___ happy.\nR: am', 'com preâmbulo'],
];
for (const [out, label] of variantes) {
  const res = parse(out, engQ);
  ok(res.pkind === 'question' && res.answer === 'am' && !/indispon/i.test(res.finalText), 'parser tolerante: ' + label);
}
const lixo = parse('Desculpe, não posso ajudar com isso.', engQ);
ok(lixo.pkind === 'question' && lixo.answer === 'am' && !/indispon/i.test(lixo.finalText),
   'T5: saída fora do formato cai no banco local, sem "(questão indisponível)"');
const semBanco = parse('...', Object.assign({}, engQ, { practice_bank: [] }));
ok(!/indispon/i.test(semBanco.finalText) && !semBanco.sqlAns, 'sem banco: mensagem amigável e NÃO grava gabarito vazio');
const vazio = parse('', Object.assign({}, engQ, { llmTask: 'explain' }));
ok(vazio.finalText.trim().length > 0, 'explicação vazia nunca vira mensagem em branco');

// ============ BANCO DE RESERVA (T5 nos niveis altos) ============
// O `Professor Engine` monta o banco com filtro ESTRITO por nivel. Se um nivel da TRACK ficar
// sem nenhuma questao, o fallback de "(questao indisponivel)" nao tem para onde cair justamente
// no nivel em que o LLM mais desvia do formato. Estes checks leem os seeds reais.
console.log('\n== Banco de reserva ==');

function sqlRows(file, table) {
  const src = fs.readFileSync(file, 'utf8');
  const at = src.indexOf('INSERT INTO ' + (table || 'practice_questions'));
  if (at < 0) return [];
  const body = src.slice(src.indexOf('VALUES', at) + 6);
  const rows = []; let depth = 0, cur = '', inq = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inq) {
      if (ch === "'") { if (body[i + 1] === "'") { cur += "''"; i++; continue; } inq = false; }
    } else if (ch === "'") inq = true;
    else if (ch === '(') { depth++; if (depth === 1) { cur = ''; } }   // descarta comentario entre tuplas
    else if (ch === ')') { depth--; if (depth === 0) { rows.push(cur + ch); cur = ''; continue; } }
    else if (ch === ';' && depth === 0) break;
    else if (depth === 0) continue;                                     // fora da tupla nao acumula
    cur += ch;
  }
  // Devolve campos crus. `quoted` distingue '' (string vazia) de NULL sem aspas — a diferenca
  // que faz a coluna JSONB `options` aceitar ou explodir no cast.
  return rows.map(r => {
    const f = []; let c = '', q = false, wasQuoted = false;
    for (let i = 1; i < r.length - 1; i++) {
      const ch = r[i];
      if (q) { if (ch === "'") { if (r[i + 1] === "'") { c += "'"; i++; continue; } q = false; continue; } }
      else if (ch === "'") { q = true; wasQuoted = true; continue; }
      else if (ch === ',') { f.push({ v: c.trim(), quoted: wasQuoted }); c = ''; wasQuoted = false; continue; }
      c += ch;
    }
    f.push({ v: c.trim(), quoted: wasQuoted });
    return f;
  }).filter(f => f.length >= 7); // descarta parenteses soltos de comentario
}
// practice_questions (theme, difficulty, cefr_level, qtype, prompt, options, answer, hint, explanation, track_topic)
const asPractice = f => ({ theme: f[0].v, cefr_level: f[2].v, qtype: f[3].v, prompt: f[4].v,
  options: f[5], answer: f[6].v, track_topic: f[9] ? f[9].v : null });
// exam_questions (cefr_level, skill, qtype, prompt, options, answer, explanation)
const asExam = f => ({ cefr_level: f[0].v, skill: f[1].v, qtype: f[2].v, prompt: f[3].v,
  options: f[4], answer: f[5].v });

const mig = path.join(__dirname, '..', '..', 'db', 'migrations');
const seed006 = sqlRows(path.join(mig, '006_v6_seed_practice.sql')).map(asPractice);
const seed009 = sqlRows(path.join(mig, '009_seed_practice_b2_c1_c2.sql')).map(asPractice);
const seed012 = sqlRows(path.join(mig, '012_seed_practice_a1_a2_b1.sql')).map(asPractice);
// A 009 faz `DELETE ... WHERE cefr_level IN ('B2','C1','C2')` antes de inserir (reexecucao segura),
// entao nesses niveis ela substitui o 006 em vez de somar.
// As linhas do 006 nascem sem `track_topic`: a tag vem dos UPDATE de backfill da 009.
// Sem aplicar esse backfill aqui, o teste mede algo diferente do que existe no banco.
const backfill = {};
for (const m of fs.readFileSync(path.join(mig, '009_seed_practice_b2_c1_c2.sql'), 'utf8')
     .matchAll(/UPDATE practice_questions SET track_topic = '((?:[^']|'')*)'\s+WHERE theme='([a-z_]+)'/g)) {
  backfill[m[2]] = m[1].replace(/''/g, "'");
}
for (const row of seed006) if (!row.track_topic && backfill[row.theme]) row.track_topic = backfill[row.theme];

const substituidos = ['B2', 'C1', 'C2'];
// A 012 nao remove nada do 006 (usa prefixo de tema proprio no DELETE), entao soma.
const bank = seed006.filter(b => !substituidos.includes(b.cefr_level)).concat(seed009, seed012);

// TRACK do `Professor Engine`, para conferir cobertura por topico de verdade.
const trackSrc = code['Professor Engine'];
const trackIni = trackSrc.indexOf('{', trackSrc.indexOf('const TRACK'));
let _d = 0, trackFim;
for (let p = trackIni; p < trackSrc.length; p++) {
  if (trackSrc[p] === '{') _d++;
  else if (trackSrc[p] === '}' && --_d === 0) { trackFim = p + 1; break; }
}
const TRACK = JSON.parse(trackSrc.slice(trackIni, trackFim));

// Espelha exatamente o filtro do `Professor Engine`.
const engineFilter = (b, lvl) => b && b.cefr_level === lvl && b.prompt && b.answer && String(b.answer).length <= 60;

for (const L of Object.keys(TRACK)) {
  const doNivel = bank.filter(b => engineFilter(b, L));
  ok(doNivel.length > 0, 'T5: nível ' + L + ' tem banco de reserva (' + doNivel.length + ' questões)');

  // Cobertura por topico: contar so os topicos DA PROPRIA trilha do nivel. Uma questao
  // marcada com topico de outro nivel serve como reserva do nivel, mas nunca casa por topico.
  const semCobertura = TRACK[L]
    .map(t => t[0])
    .filter(t => doNivel.filter(b => b.track_topic === t).length < 2);
  ok(semCobertura.length === 0,
     'T5: todo tópico da trilha ' + L + ' tem ≥2 questões' +
     (semCobertura.length ? ' — faltam ' + semCobertura.length + ': ' + semCobertura.slice(0, 3).join(', ') : ''));
}
ok(bank.every(b => String(b.answer).length <= 60),
   'nenhuma resposta do seed passa de 60 chars (o Engine descartaria em silêncio)');

// Preferencia por topico: com o topico corrente no banco, o fallback nao pode sortear outro.
const bankTopic = [
  { cefr_level: 'B2', prompt: 'Q do topico certo', answer: 'certo', track_topic: 'Voz passiva' },
  { cefr_level: 'B2', prompt: 'Q de outro topico', answer: 'errado', track_topic: 'Past perfect' },
  { cefr_level: 'B2', prompt: 'Q sem topico', answer: 'errado', track_topic: null },
];
const engTopic = { llmTask: 'question', feedback: '', userId: 222, recent_q: [], practice_bank: bankTopic, topicTitle: 'Voz passiva' };
let acertos = 0;
for (let i = 0; i < 25; i++) if (parse('saida fora do formato', engTopic).answer === 'certo') acertos++;
ok(acertos === 25, 'fallback prefere a questão do tópico corrente (' + acertos + '/25)');

// Sem questao do topico corrente, amplia para o nivel inteiro em vez de falhar.
const engSemTopico = Object.assign({}, engTopic, { topicTitle: 'Tópico inexistente' });
const amplia = parse('saida fora do formato', engSemTopico);
ok(amplia.pkind === 'question' && !!amplia.answer, 'sem questão do tópico, amplia para o nível em vez de falhar');

// ============ INTEGRIDADE DOS SEEDS ============
// `options` e JSONB: '' nao e JSON valido e derruba a migration inteira no cast. Questao
// escrita precisa de NULL sem aspas. Em mc, o gabarito tem de ser exatamente uma das opcoes,
// senao a questao e ineditavelmente errada (nenhuma resposta do aluno bate).
console.log('\n== Integridade dos seeds ==');
const examSeeds = [].concat(
  sqlRows(path.join(mig, '005_v6_seed_exam.sql'), 'exam_questions').map(asExam),
  sqlRows(path.join(mig, '011_enable_c2_placement.sql'), 'exam_questions').map(asExam)
);
const practiceSeeds = seed006.concat(seed009);

for (const [nome, rows] of [['practice', practiceSeeds], ['exam', examSeeds]]) {
  const vazio = rows.filter(q => q.qtype === 'written' && q.options.quoted && q.options.v === '');
  ok(vazio.length === 0, nome + ": questão escrita usa NULL em options, nunca '' (" + rows.length + ' linhas)');

  const mcRuim = rows.filter(q => {
    if (q.qtype !== 'mc') return false;
    try { return !JSON.parse(q.options.v).includes(q.answer); } catch (e) { return true; }
  });
  ok(mcRuim.length === 0, nome + ': todo gabarito de múltipla escolha está entre as opções' +
     (mcRuim.length ? ' — ' + mcRuim[0].prompt : ''));
}

// C2 no nivelamento: sem estas questoes, LEVELS com 'C2' so faz pickNext cair na vizinhanca.
const c2exam = examSeeds.filter(q => q.cefr_level === 'C2').length;
ok(c2exam >= 10, 'B7: nivelamento tem questões C2 no banco de prova (' + c2exam + ')');
ok(/'C2'/.test(code['Placement Engine'].match(/const LEVELS=\[[^\]]*\]/)[0]),
   'B7: LEVELS do Placement Engine inclui C2 (banco e fluxo alinhados)');

// ============ CONTEXTO CONVERSA ============
console.log('\n== Conversa ==');
function ctx(profile, text, extra) {
  return run('Contexto Conversa', { item: Object.assign({ name: 'Théo', profile, text, level: profile.level, streak_count: 1 }, extra) });
}
const c1 = ctx({ level: 'C1', persona: 'debater', conv: { pt_streak: 2, short_streak: 0, en_streak: 0 } }, 'não entendi muito bem isso aí');
ok(!/mais de português|português de apoio/.test(c1.moodLine), 'C5: modo "inseguro" não manda usar português em C1');
ok(/NÃO passe a escrever em português/.test(c1.ptLine), 'C5: incentivo ao inglês em C1 mantém o idioma');
const a1 = ctx({ level: 'A1', persona: 'buddy', conv: { pt_streak: 2 } }, 'oi tudo bem');
ok(/DENTRO do bloco em inglês/.test(a1.correctionLine), 'C6: contrato de correção adaptado ao formato do A1');
ok(/contrato fixo, igual em todos os níveis/.test(c1.correctionLine) && /contrato fixo/.test(a1.correctionLine), 'C6: mesma política de correção em todos os níveis');
const inval = ctx({ level: 'B1', persona: 'hacker' }, 'hello there my friend');
ok(/Buddy/.test(inval.personaLine), 'PS2: persona inválida cai em Buddy');
const mono = ctx({ level: 'A2', persona: 'coach', conv: { short_streak: 2 } }, 'ok');
ok(/monossilábico/.test(mono.reciprocityLine), 'C10: reciprocidade específica para respostas monossilábicas');
const poluicao = ctx({ level: 'A1', persona: 'buddy', conv: { pt_streak: 3, turns: 2 } }, 'eu gosto de jogos');
ok(!(poluicao.ptLine && poluicao.spiceLine), 'C2: não empilha incentivo + variação no mesmo turno');
ok(/ECONOMIA DE TELA/.test(poluicao.cleanOutputLine), 'C2: diretiva de saída limpa presente');

// ============ ROTEADOR ============
console.log('\n== Roteador ==');
function rot(student, norm) {
  return run('Roteador Mestre', { refs: { 'Normalizar': norm }, item: student });
}
const base = { userId: 9, onboarding: 'done', mode: 'teacher', profile: {}, prev_update_id: 100, last_active: '2026-07-22', prev_active: '2026-07-21', teacher_state: { phase: 'quiz' } };
const dup = rot(base, { type: 'text', text: 'oi', updateId: 100, isCommand: false });
ok(dup.route === 'ignore', 'A6: update repetido é descartado');
const novo = rot(base, { type: 'text', text: 'oi', updateId: 101, isCommand: false });
ok(novo.route === 'professor' && novo.subroute === 'check' && novo.first_today === true, 'update novo segue o fluxo e marca first_today');
// S1 — comandos de desenvolvimento.
//
// `DEV_COMMANDS` liga /reset e /resetfull, que apagam a conta do aluno e NAO
// verificam quem digitou. Com a flag ligada, qualquer usuario pode se apagar.
//
// O guard tem dois modos de proposito. Desligada, ele EXIGE que /resetfull caia
// em "nao reconheco esse comando" -- e a garantia de lancamento. Ligada, ele nao
// reprova (o estado e deliberado), mas grita, para que a flag nao chegue ao
// lancamento por esquecimento. Um teste permanentemente vermelho vira ruido e
// para de ser lido; um aviso alto continua sendo informacao.
const DEV_ON = /const DEV_COMMANDS\s*=\s*true/.test(code['Roteador Mestre']);
const devcmd = rot(base, { type: 'text', text: '/resetfull', updateId: 102, isCommand: true, command: '/resetfull' });
if (DEV_ON) {
  console.log('  ⚠  S1: DEV_COMMANDS está LIGADA — /reset e /resetfull ativos para QUALQUER usuário.');
  console.log('     Estado deliberado (pedido em 04/09). DESLIGAR ANTES DO LANÇAMENTO.');
  ok(devcmd.route === 'onboarding' && devcmd.subroute === 'reset',
    'S1: com a flag ligada, /resetfull realmente executa o reset');
} else {
  ok(devcmd.route === 'system_msg' && devcmd.subroute === 'unknown',
    'S1: comando de dev desativado na versão de lançamento');
}
const resume = rot(base, { type: 'callback', callbackData: 't_resume', updateId: 103 });
ok(resume.subroute === 'resume_q', 'T11: callback t_resume roteia para resume_q');

// ============ SINTAXE DOS NÓS DE CÓDIGO ============
// Em 19/08 uma edição no `Interests Engine` removeu sem querer o `}` que fechava
// um bloco `else`. O nó subiu para produção com "Unexpected token 'else'" e a
// seleção de interesses parou de gravar por completo — só apareceu no teste ao
// vivo. Um parse de todos os nós de código custa milissegundos e fecha essa
// classe de erro antes do deploy.
console.log('\n== Sintaxe dos nós de código ==');
let nosCod = 0, quebrados = [];
for (const n of flow.nodes) {
  if (!(n.parameters && n.parameters.jsCode)) continue;
  nosCod++;
  try { new Function(n.parameters.jsCode); }
  catch (e) { quebrados.push(n.name + ': ' + e.message); }
}
ok(quebrados.length === 0, 'todos os ' + nosCod + ' nós de código têm sintaxe válida'
  + (quebrados.length ? ' — QUEBRADOS: ' + quebrados.join(' | ') : ''));

// ============ FILTRO ANTI-SPOILER (T7b/T7c) ============
// Medido ao vivo em 18/08/2026: com q_answered=false e o prompt proibindo
// explicitamente revelar, o modelo ainda escreveu o gabarito quando o aluno
// perguntou "por que essa era a resposta certa?". O filtro tira a garantia das
// mãos do LLM. Os textos abaixo são transcrições reais daquela execução.
console.log('\n== Filtro Anti-Spoiler ==');
function filtro(output, ts) {
  return run('Filtro Anti-Spoiler', {
    refs: { 'Professor Engine': { teacher_state_new: ts } },
    item: { output },
  });
}
const VAZOU = 'The verb has to show an action in progress. **Why it works:**\n- *He was driving* → the driving was happening over a period of time.\n- *when it started to snow* → the snow began suddenly.';

const r1 = filtro(VAZOU, { q_answered: false, answer: 'was driving', question: 'He __ (drive) to work.' });
ok(!/was driving/i.test(r1.output), 'T7c: gabarito da questão ABERTA é mascarado');
ok(r1.antispoiler === true, 'T7c: filtro sinaliza que mascarou');
ok(/Segurei a resposta/.test(r1.output), 'T7c: acrescenta o empurrão pedagógico');
ok(/___/.test(r1.output), 'T7c: substitui por lacuna, não apaga a frase');

const r2 = filtro(VAZOU, { q_answered: true, answer: 'was driving', question: 'He __ (drive) to work.' });
ok(/was driving/i.test(r2.output) && r2.antispoiler === false,
  'T10: questão já respondida — o gabarito continua liberado');

const r3 = filtro('Use was/were + verbo-ING para ação em andamento.',
  { q_answered: false, answer: 'was driving', question: 'x' });
ok(r3.antispoiler === false && !/Segurei a resposta/.test(r3.output),
  'T7: resposta que já não revela passa intacta (sem falso positivo)');

const r4 = filtro('The word driving appears inside overdriving here.',
  { q_answered: false, answer: 'driving', question: 'x' });
ok(/overdriving/.test(r4.output), 'limite de palavra: não mutila ocorrência dentro de outra palavra');

const r5 = filtro('Resposta qualquer.', { q_answered: false, answer: '', question: '' });
ok(r5.antispoiler === false, 'sem gabarito no estado, o filtro não faz nada');

// ============ INTERESSES ============
//
// Regressao do defeito achado em 04/09 pela jornada de usuario: o ramo 'other'
// gerava `jsonb_set(..., '{int_await_ts}', 1788531542825::jsonb)`, e o Postgres
// NAO converte bigint para jsonb. O UPDATE inteiro falhava, entao nem `int_await`
// era gravado -- e a execucao abortava em `Salvar Interesses`, de modo que
// `Enviar Pedir Outro` nunca rodava: o aluno tocava em "Outro" e nao recebia NADA.
// No turno seguinte o guard do Roteador nao passava e o tema digitado era perdido.
//
// A bateria nao pegava porque C16/C17 semeiam `interests` direto no banco e so
// abrem o menu -- ninguem percorria other -> digitar -> salvar.
console.log('\n== Interesses ==');
function inter(sub, profile, extra) {
  return run('Interests Engine', {
    item: Object.assign({ userId: 42, subroute: sub, profile: profile || {}, onboarding: 'pick_interests' }, extra),
  });
}

const other = inter('other', { interests: ['🎮 Games'] });
ok(!/\d+::jsonb/.test(other.sql),
  'int_other: nao usa <numero>::jsonb (Postgres nao converte bigint para jsonb)');
ok(/to_jsonb\(\s*\d+/.test(other.sql) || /'\d+'::jsonb/.test(other.sql),
  'int_other: grava int_await_ts por to_jsonb (ou literal entre aspas)');
ok(/'\{int_await\}'\s*,\s*'true'::jsonb/.test(other.sql),
  'int_other: marca int_await=true no mesmo UPDATE');

// Encadeamento: o SQL do ramo 'other' precisa satisfazer o guard EXATO que o
// Roteador Mestre avalia para rotear o texto seguinte como add_custom.
const mTs = other.sql.match(/to_jsonb\(\s*(\d+)|'(\d+)'::jsonb/);
const tsGravado = mTs ? Number(mTs[1] || mTs[2]) : 0;
const guardPassa = tsGravado > 0 && (Date.now() - tsGravado) < 600000;
ok(guardPassa, 'int_other: o timestamp gravado satisfaz o guard de 10 min do Roteador');

const addCustom = rot(
  { userId: 42, onboarding: 'pick_interests', mode: 'chat',
    profile: { int_await: true, int_await_ts: tsGravado }, prev_update_id: 1, teacher_state: null },
  { type: 'text', text: 'skate', updateId: 2, isCommand: false });
ok(addCustom.route === 'interests' && addCustom.subroute === 'add_custom',
  'int_other -> texto seguinte roteia para add_custom (rota=' + addCustom.route + ':' + addCustom.subroute + ')');

const salvo = inter('add_custom', { interests: ['🎮 Games'], int_await: true }, { text: 'skate' });
ok(/skate/.test(salvo.sql), 'add_custom: o tema digitado entra no SQL de gravacao');

console.log('\n' + (fails ? '❌ ' + fails + ' falha(s)' : '✅ todos os checks passaram'));
process.exit(fails ? 1 : 0);
