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
const LEVELS = ['A1','A2','B1','B2','C1'];
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
  if (!m) { ok(/Seu nível estimado: C1/.test(res.gabarito), 'B2: teto C1 acertando tudo'); break; }
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
const devcmd = rot(base, { type: 'text', text: '/resetfull', updateId: 102, isCommand: true, command: '/resetfull' });
ok(devcmd.route === 'system_msg' && devcmd.subroute === 'unknown', 'S1: comando de dev desativado na versão de lançamento');
const resume = rot(base, { type: 'callback', callbackData: 't_resume', updateId: 103 });
ok(resume.subroute === 'resume_q', 'T11: callback t_resume roteia para resume_q');

console.log('\n' + (fails ? '❌ ' + fails + ' falha(s)' : '✅ todos os checks passaram'));
process.exit(fails ? 1 : 0);
