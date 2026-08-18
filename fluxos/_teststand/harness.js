// Harness to drive the IAChat n8n workflow via the TEST Ingress webhook and read
// the generated replies from execution data. No Telegram delivery is relied upon.
// Configure via env: N8N_API_KEY (obrigatório), N8N_URL (opcional, default localhost:5678).
const BASE = process.env.N8N_URL || 'http://localhost:5678';
const API = BASE + '/api/v1';
const KEY = process.env.N8N_API_KEY || '';
const WEBHOOK = BASE + '/webhook/iachat-test';
if (!KEY) { console.error('Defina N8N_API_KEY no ambiente (JWT da API do n8n).'); process.exit(1); }

// O TEST Ingress passou a exigir header auth na v7.4 (correção do S1: antes ele
// aceitava injeção de update sem autenticação nenhuma). O segredo mora no .env
// da raiz do repo, como IACHAT_TEST_SECRET.
const TEST_SECRET = process.env.IACHAT_TEST_SECRET || (() => {
  try {
    const envTxt = require('fs').readFileSync(require('path').join(__dirname, '..', '..', '.env'), 'utf8');
    const m = envTxt.match(/^IACHAT_TEST_SECRET=(.+)$/m);
    return m ? m[1].trim() : '';
  } catch (e) { return ''; }
})();
if (!TEST_SECRET) { console.error('IACHAT_TEST_SECRET ausente (.env da raiz ou variável de ambiente).'); process.exit(1); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function rfetch(url, opts, tries = 5) {
  let last;
  for (let k = 0; k < tries; k++) {
    try { return await fetch(url, opts); }
    catch (e) { last = e; await sleep(600 * (k + 1)); }
  }
  throw last;
}

async function jget(url) {
  for (let k = 0; k < 5; k++) {
    try {
      const r = await rfetch(url, { headers: { 'X-N8N-API-KEY': KEY } });
      if (!r.ok) { await sleep(600); continue; }
      return await r.json();
    } catch (e) { await sleep(800); }
  }
  return { data: [] };
}

async function lastExecId() {
  const j = await jget(API + '/executions?limit=1');
  return (j.data && j.data[0]) ? Number(j.data[0].id) : 0;
}

let _uidBase = Date.now() % 1000000000;
let _updSeq = Math.floor(Date.now() / 1000);
function nextUpd() { return ++_updSeq; }

async function postWebhook(update) {
  try {
    const r = await rfetch(WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-iachat-test': TEST_SECRET },
      body: JSON.stringify(update),
    });
    await r.text().catch(() => {});
    return r.status;
  } catch (e) { return 0; }
}

function hasRunData(exec) {
  return !!(exec && exec.data && exec.data.resultData && exec.data.resultData.runData
    && Object.keys(exec.data.resultData.runData).length > 1);
}

function execUser(exec) {
  try {
    const b = exec.data.resultData.runData['TEST Ingress'][0].data.main[0][0].json.body;
    if (b.message) return b.message.from.id;
    if (b.callback_query) return b.callback_query.from.id;
  } catch (e) {}
  return null;
}

// Robust: POST creates exactly one execution. Scan new executions and pick the one
// whose payload user id matches ours (immune to stale/concurrent executions).
const PACE = Number(process.env.PACE || 1500);
async function postUpdate(update, expectedUser) {
  if (PACE) await sleep(PACE); // gentle pacing to avoid overloading n8n
  const before = await lastExecId();
  await postWebhook(update); // rfetch retries transient connection failures internally
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    await sleep(700);
    const j = await jget(API + '/executions?limit=8');
    const cand = (j.data || []).filter(e => Number(e.id) > before && (e.status === 'success' || e.status === 'error'));
    for (const meta of cand.sort((a, b) => Number(a.id) - Number(b.id))) {
      if (seen.has(meta.id)) continue;
      const exec = await jget(API + '/executions/' + meta.id + '?includeData=true');
      seen.add(meta.id);
      if (!hasRunData(exec)) continue;
      if (expectedUser == null || execUser(exec) === expectedUser) return exec;
    }
  }
  return null;
}

function nodeOut(rd, name) {
  try { return rd[name][0].data.main[0][0].json; } catch (e) { return null; }
}

// Extract the human-facing reply + the loaded student state from an execution.
function digest(exec) {
  const rd = exec && exec.data && exec.data.resultData && exec.data.resultData.runData;
  if (!rd) return { ran: [], reply: '(no runData)', student: null, err: (exec && exec.data && exec.data.resultData && exec.data.resultData.error && exec.data.resultData.error.message) };
  const ran = Object.keys(rd);
  const student = nodeOut(rd, 'Carregar Aluno');
  // reply producers, in priority of "the last thing shown to the user"
  const parts = [];
  const push = (label, v) => { if (v && String(v).trim()) parts.push('[' + label + '] ' + String(v).trim()); };
  const cad = nodeOut(rd, 'Etapa de Cadastro'); if (cad) push('cadastro', cad.reply);
  const pl = nodeOut(rd, 'Placement Engine'); if (pl) { push('placement', pl.text); push('gabarito', pl.gabarito); push('placement', pl.resultText); }
  const conv = nodeOut(rd, 'Agente Conversa'); if (conv) push('CONVERSA', conv.output);
  const peng = nodeOut(rd, 'Professor Engine'); if (peng) { push('prof.feedback', peng.feedback); push('prof.det', peng.deterministicText); }
  const pp = nodeOut(rd, 'Parse Professor'); if (pp) push('PROFESSOR', pp.finalText);
  const duv = nodeOut(rd, 'Agente Dúvida'); if (duv) push('DUVIDA', duv.output);
  const expectedAnswer = (pp && pp.answer) || (peng && peng.teacher_state_new && peng.teacher_state_new.answer) || null;
  const pkind = pp && pp.pkind;
  const cfg = nodeOut(rd, 'Config Engine'); if (cfg) { push('config', cfg.reply); push('config', cfg.text); push('config', cfg.menuText); }
  const modo = nodeOut(rd, 'Etapa de Modo'); if (modo) { push('modo', modo.reply); push('modo', modo.text); }
  // node-level errors
  const errs = ran.filter(n => rd[n][0] && rd[n][0].error).map(n => n + ': ' + (rd[n][0].error.message || '').slice(0, 80));
  return { id: exec.id, ran, reply: parts.join('\n'), student, errs, expectedAnswer, pkind };
}

async function msg(userId, text) {
  const u = nextUpd();
  return postUpdate({ update_id: u, message: { message_id: u, from: { id: userId, is_bot: false, first_name: 'Teen', language_code: 'pt-br' }, chat: { id: userId, type: 'private' }, date: Math.floor(Date.now()/1000), text } }, userId);
}
async function cb(userId, data) {
  const u = nextUpd();
  return postUpdate({ update_id: u, callback_query: { id: String(u), from: { id: userId, is_bot: false, first_name: 'Teen' }, message: { message_id: u, chat: { id: userId, type: 'private' }, date: Math.floor(Date.now()/1000), text: '(x)' }, data } }, userId);
}

module.exports = { msg, cb, digest, nodeOut, jget, API, sleep, nextUpd };

// ---- smoke test when run directly ----
if (require.main === module) {
  (async () => {
    const uid = 990000000 + Math.floor(Math.random() * 900000);
    console.log('SMOKE test user', uid);
    let e = await msg(uid, 'oi');
    let d = digest(e);
    console.log('exec', d.id, '| ran', d.ran.length, 'nodes');
    console.log('student.onboarding =', d.student && d.student.onboarding, '| level =', d.student && d.student.level);
    console.log('REPLY:\n' + d.reply);
    if (d.errs && d.errs.length) console.log('NODE ERRORS:', d.errs);
  })().catch(e => { console.error('FATAL', e); process.exit(1); });
}
