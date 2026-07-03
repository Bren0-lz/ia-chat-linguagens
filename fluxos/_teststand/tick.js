// Resumable, paced driver. Each invocation performs up to MAXACT actions for one
// level, persists state to state_<level>.json, appends transcript to tr_<level>.md,
// and exits. Re-invoke until phase === 'done'.
const fs = require('fs');
const { msg, cb, digest } = require('./harness');
const { matchQuestion } = require('./seed');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const MAXACT = Number(process.env.MAXACT || 7);

const CONV = {
  A1: ['hello, i am lucas', 'i have 16 years', 'i like play video game', 'não entendi'],
  A2: ['hi! yesterday i go to my friend house', 'we play video games all day', 'i want be a pro player one day'],
  B1: ['hey! i think video games is good for the brain', "i've been play fortnite a lot this week", 'yesterday i didnt went to school because i was sick'],
  B2: ['If I would have known about the tournament, I would have signed up', 'Despite of the rain, we kept playing football outside', 'Competitive gaming is way more stressful than most people realize'],
  C1: ['Hardly I had started the ranked match when my internet crashed', 'The amount of people who take esports seriously is honestly staggering', "There's a fascinating debate about whether esports is a real sport"],
};
const DOUBT = {
  A1: 'nao entendi quando usa is e are', A2: 'quando eu uso ed no final do verbo?',
  B1: 'whats the difference between present perfect and past simple?',
  B2: 'when should i use the passive voice instead of active?',
  C1: 'could you clarify when inversion is preferable to a plain clause?',
};
const PROFPLAN = ['correct', 'wrong', 'correct'];

const level = (process.argv[2] || 'B1').toUpperCase();
const SF = './state_' + level + '.json';
const TR = './tr_' + level + '.md';

function load() {
  if (fs.existsSync(SF)) return JSON.parse(fs.readFileSync(SF, 'utf8'));
  const ti = LEVELS.indexOf(level);
  return { level, target: level, ti, userId: 993200000 + Math.floor(Math.random() * 800000),
    phase: 'onboard', obStep: 0, startPick: LEVELS[Math.min(ti, 3)],
    cur: Math.min(ti, 3), sOk: 0, sBad: 0, ans: 0, lastReply: '', finalLevel: null,
    finStep: 0, convIdx: 0, profStep: 0, profExpected: null };
}
function save(s) { fs.writeFileSync(SF, JSON.stringify(s, null, 1)); }
function rec(s) { fs.appendFileSync(TR, s + '\n'); }

function decide(cur, sOk, sBad, ti) {
  if (cur < ti) return true; if (cur > ti) return false;
  if (sOk === 1) return false; if (sBad === 1) return true; return false;
}
function capConv(d) { const m = d.reply.match(/\[CONVERSA\][\s\S]*/); return m ? m[0].replace('[CONVERSA] ', '') : ('(sem resposta de conversa) ' + d.reply.slice(0, 80)); }
function capProf(d) {
  const md = d.reply.match(/\[DUVIDA\][\s\S]*/); if (md) return md[0].replace('[DUVIDA] ', '').trim();
  const m3 = d.reply.match(/\[PROFESSOR\][\s\S]*/); if (m3) return m3[0].replace('[PROFESSOR] ', '').trim();
  const parts = [];
  const m1 = d.reply.match(/\[prof\.feedback\][^\[]*/); if (m1) parts.push(m1[0].replace('[prof.feedback] ', ''));
  const m2 = d.reply.match(/\[prof\.det\][^\[]*/); if (m2) parts.push(m2[0].replace('[prof.det] ', ''));
  return parts.join('\n').trim() || ('(sem texto) ' + d.reply.slice(0, 80));
}

(async () => {
  const s = load();
  if (s.phase === 'done') { console.log(level + ' already done'); return; }
  if (!fs.existsSync(TR)) rec('# Transcrição real — nível ' + level + '\n');
  let acts = 0;
  const u = s.userId;

  while (acts < MAXACT && s.phase !== 'done') {
    if (s.phase === 'onboard') {
      if (s.obStep === 0) { const d = digest(await msg(u, 'oi')); acts++; if (!/qual é o seu nome/i.test(d.reply)) { rec('_[falha onboard oi -> reset user]_'); s.userId += 777; s.obStep = 0; save(s); continue; } s.obStep = 1; }
      else if (s.obStep === 1) { const d = digest(await msg(u, 'Lucas')); acts++; if (!/quantos anos/i.test(d.reply)) { rec('_[falha onboard nome]_'); s.obStep = 0; s.userId += 777; save(s); continue; } s.obStep = 2; }
      else if (s.obStep === 2) { const d = digest(await msg(u, '16')); acts++; if (!/como você se sente/i.test(d.reply)) { rec('_[falha onboard idade]_'); s.obStep = 0; s.userId += 777; save(s); continue; } const d2 = digest(await cb(u, 'pl_start_' + s.startPick)); acts++; s.lastReply = d2.reply; s.phase = 'placement'; }
      save(s); continue;
    }
    if (s.phase === 'placement') {
      if (/Seu nível estimado/.test(s.lastReply) || s.ans >= 10) {
        const m = s.lastReply.match(/Seu nível estimado:\s*([A-C][12])/); if (m) s.finalLevel = m[1];
        s.phase = 'finish'; save(s); continue;
      }
      const q = matchQuestion(s.lastReply);
      const want = decide(s.cur, s.sOk, s.sBad, s.ti);
      let e;
      if (!q) e = await msg(u, 'zzzz');
      else if (q.qtype === 'mc') { const idx = q.options.findIndex(o => o.toLowerCase() === String(q.answer).toLowerCase()); const pick = want ? idx : (idx + 1) % q.options.length; e = await cb(u, 'ans_' + ['A', 'B', 'C', 'D', 'E'][pick]); }
      else e = await msg(u, want ? String(q.answer) : 'zzzz');
      acts++;
      if (want) { s.sOk++; s.sBad = 0; if (s.sOk >= 2) { s.cur = Math.min(4, s.cur + 1); s.sOk = 0; } }
      else { s.sBad++; s.sOk = 0; if (s.sBad >= 2) { s.cur = Math.max(0, s.cur - 1); s.sBad = 0; } }
      s.ans++; s.lastReply = digest(e).reply || s.lastReply; save(s); continue;
    }
    if (s.phase === 'finish') {
      const seq = ['persona_buddy', 'int_games', 'int_music', 'int_done'];
      if (s.finStep < seq.length) { await cb(u, seq[s.finStep]); acts++; s.finStep++; save(s); continue; }
      const d = digest(await msg(u, '/menu')); acts++;
      const st = d.student;
      if (st && st.onboarding === 'done') { rec('**Bootstrap:** nível=' + st.level + ' (alvo ' + level + ') onboarding=done mode=' + st.mode + '\n'); s.finalLevel = st.level; s.phase = 'conversa'; }
      else { rec('_[finish: onboarding=' + (st && st.onboarding) + ', reenvia int_done]_'); await cb(u, 'int_done'); acts++; }
      save(s); continue;
    }
    if (s.phase === 'conversa') {
      if (s.convIdx === 0) { await cb(u, 'mode_chat'); acts++; rec('## MODO CONVERSA (' + level + ')\n'); }
      if (s.convIdx >= CONV[level].length) { s.phase = 'professor'; save(s); continue; }
      const t = CONV[level][s.convIdx];
      const d = digest(await msg(u, t)); acts++;
      rec('👦 ' + t); rec('🤖 ' + capConv(d) + '\n');
      s.convIdx++; save(s); continue;
    }
    if (s.phase === 'professor') {
      // profStep: 0 mode_teacher, 1 intro msg, 2 t_start, 3..(3+plan-1) answers, then doubtprompt, doubtmsg, done
      const base = 3, nPlan = PROFPLAN.length;
      if (s.profStep === 0) { await cb(u, 'mode_teacher'); acts++; rec('## MODO PROFESSOR (' + level + ')\n'); s.profStep = 1; save(s); continue; }
      if (s.profStep === 1) { const d = digest(await msg(u, 'oi, quero aprender')); acts++; rec('**Explicação/intro:**\n' + capProf(d) + '\n'); s.profStep = 2; save(s); continue; }
      if (s.profStep === 2) { const d = digest(await cb(u, 't_start')); acts++; s.profExpected = d.expectedAnswer; rec('**Início do quiz:**\n' + capProf(d) + '\n_[resposta esperada: ' + s.profExpected + ']_\n'); s.profStep = 3; save(s); continue; }
      if (s.profStep >= base && s.profStep < base + nPlan) {
        const mode = PROFPLAN[s.profStep - base];
        const given = (mode === 'correct' && s.profExpected) ? String(s.profExpected) : 'purple monkey';
        const d = digest(await msg(u, given)); acts++;
        s.profExpected = d.expectedAnswer;
        rec('👦 (' + mode + ') "' + given + '"'); rec(capProf(d) + (s.profExpected ? '\n_[próx esperado: ' + s.profExpected + ']_' : '') + '\n');
        s.profStep++; save(s); continue;
      }
      if (s.profStep === base + nPlan) { const d = digest(await cb(u, 't_doubt')); acts++; rec('**[Aluno toca "Tirar dúvida"]**\n' + capProf(d)); s.profStep++; save(s); continue; }
      if (s.profStep === base + nPlan + 1) { const d = digest(await msg(u, DOUBT[level])); acts++; rec('👦 (dúvida) ' + DOUBT[level]); rec('🤖 ' + capProf(d) + '\n'); rec('### FIM ' + level); s.phase = 'done'; save(s); continue; }
    }
  }
  save(s);
  console.log(level + ' phase=' + s.phase + ' | acts=' + acts + ' | user=' + s.userId + ' | conv=' + s.convIdx + ' prof=' + s.profStep + ' ans=' + s.ans + ' finalLevel=' + s.finalLevel);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
