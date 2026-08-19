// C13 — dry-run do nudge de retenção, SEM enviar mensagem.
//
// Executa a cadeia real do workflow `IAChat_Nudge_Retencao_v1` fora do n8n:
//   Selecionar Inativos  -> query real contra o Postgres
//   Montar Nudge         -> código real do nó
//   Marcar Enviado       -> UPDATE real
// O nó `Enviar Nudge` é DELIBERADAMENTE pulado — ele manda mensagem de verdade
// no Telegram, e essa parte precisa de aprovação humana.
//
// Semeia um usuário sintético elegível (onboarding concluído, inativo há N dias)
// porque a base real não tem ninguém que qualifique.
//
//   node dryrun_nudge.js [--limpar]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const FLUXO = path.join(__dirname, '..', 'IAChat_Nudge_Retencao_v1.json');
const UID = Number(process.env.UID || 800000777);   // fora da faixa do harness, para passar no filtro
const DIAS = Number(process.env.DIAS || 5);
const LIMPAR = process.argv.includes('--limpar');

const fluxo = JSON.parse(fs.readFileSync(FLUXO, 'utf8'));
const no = (nome) => fluxo.nodes.find(n => n.name === nome);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

(async () => {
  console.log('C13 — dry-run do nudge (SEM envio) | usuário sintético ' + UID + ', inativo há ' + DIAS + ' dias\n');

  if (LIMPAR) {
    const r = await db(c => c.query('DELETE FROM students WHERE user_id=$1', [UID]));
    console.log('usuário de teste removido (' + r.rowCount + ')');
    return;
  }

  // ---- 1. semeia alguém elegível ----
  await db(c => c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,'Cleide Teste',62,'chat','done','A1','{}'::jsonb,12,1,4, CURRENT_DATE - $2::int)"
    + " ON CONFLICT (user_id) DO UPDATE SET onboarding='done', profile='{}'::jsonb,"
    + ' streak_count=4, last_active = CURRENT_DATE - $2::int, updated_at=now()',
    [UID, DIAS]));
  console.log('1. usuário semeado\n');

  // ---- 2. Selecionar Inativos (query real do workflow) ----
  const query = String(no('Selecionar Inativos').parameters.query);
  const sel = await db(c => c.query(query));
  console.log('2. Selecionar Inativos -> ' + sel.rowCount + ' alvo(s)');
  if (!sel.rowCount) { console.log('   FALHOU: o usuário elegível não foi selecionado'); process.exit(1); }
  const alvo = sel.rows[0];
  console.log('   ' + alvo.user_id + ' | ' + alvo.name + ' | streak ' + alvo.streak + ' | parado há ' + alvo.dias_parado + ' dias\n');

  // ---- 3. Montar Nudge (código real do nó) ----
  const codigo = no('Montar Nudge').parameters.jsCode;
  const fn = new Function('$input', codigo);
  const montado = fn({ item: { json: alvo } }).json;
  console.log('3. Montar Nudge -> chatId ' + montado.chatId);
  console.log('   mensagem:');
  for (const l of String(montado.text).split('\n')) console.log('     ' + l);
  console.log('');

  // ---- 4. Enviar Nudge: PULADO de propósito ----
  console.log('4. Enviar Nudge -> PULADO (manda mensagem real no Telegram; exige aprovação)\n');

  // ---- 5. Marcar Enviado (UPDATE real) ----
  const upd = String(no('Marcar Enviado').parameters.query)
    .replace(/^=/, '')
    .replace(/\{\{[^}]*\}\}/, String(alvo.user_id));
  await db(c => c.query(upd));
  const depois = await db(c => c.query("SELECT profile->>'last_nudge' ln FROM students WHERE user_id=$1", [UID]));
  const ln = depois.rows[0] && depois.rows[0].ln;
  console.log('5. Marcar Enviado -> profile.last_nudge = ' + JSON.stringify(ln));

  // ---- 6. idempotência do dia: não deve selecionar de novo ----
  const sel2 = await db(c => c.query(query));
  const naoRepete = sel2.rows.every(r => Number(r.user_id) !== UID);
  console.log('6. reexecução no mesmo dia -> usuário ' + (naoRepete ? 'NÃO' : 'ainda') + ' selecionado'
    + (naoRepete ? ' (guarda de 1 nudge/dia funciona)' : ' — GUARDA FALHOU'));

  console.log('\n===== RESULTADO =====');
  const ok = ln && naoRepete;
  console.log(ok
    ? 'PASSOU  C13 (dry-run) — seleção, montagem, marcação e guarda diária funcionam. Falta só o envio real.'
    : 'FALHOU  C13 (dry-run)');
  console.log('\nlimpar o usuário de teste: node dryrun_nudge.js --limpar');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
