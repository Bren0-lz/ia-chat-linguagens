// X5 — desync de estado com execuções concorrentes do mesmo usuário.
//
// O X5 do roteiro ("mensagens fora de ordem, rápidas em sequência") foi EXCLUÍDO
// na execução de 13/07 por não ter sido compreendido. Mas o defeito é real: está
// no HANDOFF §5 e eu esbarrei nele em 19/08, quando a corrida entre gravar `mode`
// e o fluxo anterior escrevendo estado trocou as rotas de uma medição.
//
// DETECTOR: os toggles de interesse (`int_*`). O nó `Interests Engine` lê
// `profile.interests` para um array em JavaScript, faz push/splice e regrava o
// ARRAY INTEIRO com jsonb_set. É leitura-modificação-escrita: dois toggles
// simultâneos de interesses diferentes se sobrescrevem (last-write-wins).
//
// Por que NÃO usar msg_count: o nó `Incrementar Contador` faz `msg_count + 1`
// no proprio SQL, que e atomico no Postgres. Nao perde escrita nem sob corrida,
// entao nao detecta nada. (Primeira versao deste teste errava nisso.)
//
// Usa só rotas determinísticas — nenhuma chamada ao LLM, então não consome cota
// da Groq e o resultado não depende do modelo.
//
//   N8N_API_KEY=... node teste_concorrencia.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');

const BASE = process.env.N8N_URL || 'http://localhost:5678';
const WEBHOOK = BASE + '/webhook/iachat-test';
const CICLOS = Number(process.env.CICLOS || 3);
const UID = Number(process.env.UID || 993960001);
// 4 interesses distintos: se serializado, os 4 sobrevivem
const ALVOS = ['int_travel', 'int_games', 'int_music', 'int_sports'];
const ROTULOS = { int_travel: '✈️ Viagens', int_games: '🎮 Games', int_music: '🎵 Música', int_sports: '⚽ Esportes' };

const TEST_SECRET = process.env.IACHAT_TEST_SECRET || (() => {
  try {
    const t = require('fs').readFileSync(require('path').join(__dirname, '..', '..', '.env'), 'utf8');
    const m = t.match(/^IACHAT_TEST_SECRET=(.+)$/m); return m ? m[1].trim() : '';
  } catch (e) { return ''; }
})();

const sleep = ms => new Promise(r => setTimeout(r, ms));
let seq = Math.floor(Date.now() / 1000);

function callback(data) {
  const u = ++seq;
  return {
    update_id: u,
    callback_query: {
      id: String(u), from: { id: UID, is_bot: false, first_name: 'Race' },
      message: { message_id: u, chat: { id: UID, type: 'private' }, date: Math.floor(Date.now() / 1000), text: '(x)' },
      data,
    },
  };
}
async function post(update) {
  try {
    const r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-iachat-test': TEST_SECRET },
      body: JSON.stringify(update),
    });
    await r.text().catch(() => {});
    return r.status;
  } catch (e) { return 0; }
}
async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function semear() {
  await db(c => c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Race',24,'chat','done','B1','{}'::jsonb,0,1,1,CURRENT_DATE)"
    + " ON CONFLICT (user_id) DO UPDATE SET mode='chat', onboarding='done',"
    + " profile='{}'::jsonb, teacher_state=NULL, updated_at=now()", [UID]));
}
async function interesses() {
  const r = await db(c => c.query("SELECT COALESCE(profile->'interests','[]'::jsonb) AS i FROM students WHERE user_id=$1", [UID]));
  return r.rows[0] ? r.rows[0].i : [];
}

(async () => {
  if (!TEST_SECRET) { console.error('IACHAT_TEST_SECRET ausente'); process.exit(1); }
  console.log('X5 — concorrência por usuário | user ' + UID);
  console.log('detector: ' + ALVOS.length + ' toggles de interesse simultâneos (read-modify-write)');
  console.log('rotas determinísticas — nenhuma chamada ao LLM\n');

  let perdas = 0, esperado = 0;
  const detalhes = [];

  // ---- referência: os mesmos toggles em SEQUÊNCIA devem preservar os 4 ----
  await semear();
  // ESPAÇAMENTO: cada execução leva ~8s por causa do retry de envio ao Telegram
  // (chat_id sintético, ver HANDOFF §5). Com 2,5s o "controle" ainda ficava
  // sobreposto e perdia escritas — deixando de ser controle. 12s dá folga real.
  const ESPACO = Number(process.env.ESPACO || 12000);
  for (const a of ALVOS) { await post(callback(a)); await sleep(ESPACO); }
  await sleep(4000);
  const seqRes = await interesses();
  console.log('CONTROLE (sequencial, ' + (ESPACO/1000) + 's entre cada): ' + seqRes.length + '/' + ALVOS.length
    + ' preservados -> ' + JSON.stringify(seqRes));
  if (seqRes.length < ALVOS.length) {
    console.log('  ATENCAO: nem sequencialmente preservou. O teste nao isola concorrencia — investigar antes.');
  }
  console.log('');

  // ---- experimento: os mesmos toggles SIMULTÂNEOS ----
  for (let ciclo = 1; ciclo <= CICLOS; ciclo++) {
    await semear();
    const status = await Promise.all(ALVOS.map(a => post(callback(a))));
    await sleep(9000);
    const res = await interesses();
    const faltando = ALVOS.filter(a => !res.includes(ROTULOS[a])).map(a => a.replace('int_', ''));
    perdas += faltando.length;
    esperado += ALVOS.length;
    detalhes.push({ ciclo, sobreviveram: res.length, faltando });
    console.log('ciclo ' + ciclo + ' (simultâneo): ' + res.length + '/' + ALVOS.length
      + ' sobreviveram | HTTP ' + status.join(',')
      + (faltando.length ? ' | PERDIDOS: ' + faltando.join(', ') : ''));
  }

  const taxa = perdas / esperado;
  console.log('\n===== RESULTADO =====');
  console.log('toggles enviados: ' + esperado + ' | perdidos: ' + perdas + ' (' + (taxa * 100).toFixed(0) + '%)');
  console.log('\n' + (perdas === 0
    ? 'PASSOU  X5 — nenhuma escrita perdida sob concorrência'
    : 'FALHOU  X5 — ' + perdas + ' escrita(s) perdida(s) de ' + esperado + ': last-write-wins confirmado'));
})().catch(e => { console.error('erro', e.message); process.exit(1); });
