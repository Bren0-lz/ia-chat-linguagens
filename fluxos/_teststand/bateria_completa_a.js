// BATERIA COMPLETA — Fase A: testes determinísticos.
//
// Revalida na v7.4 os testes que NÃO dependem de saída do LLM: validação de
// cadastro, motor de nivelamento, transversais de estado e robustez de entrada.
// Como não chamam o modelo (ou chamam pouco), não consomem cota da Groq e o
// resultado não varia entre execuções.
//
// Cobre: A1 A2 A3 A4 A6 A8 B1 B3 B5 B6 X1 X2 X3 R2 R3 S1
// (a Fase B cobre os que dependem do LLM)
//
//   N8N_API_KEY=... node bateria_completa_a.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, cb, digest } = require('./harness');
const { matchQuestion } = require('./seed');

const BASE = process.env.N8N_URL || 'http://localhost:5678';
const TR = './tr_bateria_a.md';
const TEST_SECRET = (() => {
  try {
    const t = fs.readFileSync(require('path').join(__dirname, '..', '..', '.env'), 'utf8');
    const m = t.match(/^IACHAT_TEST_SECRET=(.+)$/m); return m ? m[1].trim() : '';
  } catch (e) { return ''; }
})();

// ID base derivado do relogio: cada rodada ocupa uma faixa nova, entao o script
// nunca herda usuarios da rodada anterior. Com o ID fixo antigo (994100000) a
// segunda execucao media RESIDUO em vez do fluxo — e pior que falhar: o A1
// chegou a reportar nome/idade corretos vindos da rodada passada, um falso
// positivo escondido dentro de uma reprovacao.
// A faixa TEM de ficar em 990000000-999999999, que e a que db/cleanup_test_users.js
// apaga; sair dela deixaria usuario de teste permanente no banco. Por isso NAO se
// usa Date.now()%1e9 como no harness (daria ~575818000, fora da faixa).
const UID_BASE = 990000000 + (Date.now() % 9000000);
let uidSeq = UID_BASE;
const novoUid = () => ++uidSeq;
console.log("faixa de user_id desta rodada: " + (UID_BASE+1) + "+");
const resultados = [];

function reg(id, ok, detalhe) {
  resultados.push({ id, ok, detalhe });
  const tag = ok === true ? 'PASSOU  ' : ok === false ? 'FALHOU  ' : 'INCONCL.';
  console.log('  ' + tag + id + ' — ' + detalhe);
  fs.appendFileSync(TR, '- **' + id + '**: ' + (ok === true ? 'PASSOU' : ok === false ? 'FALHOU' : 'INCONCLUSIVO') + ' — ' + detalhe + '\n');
}
async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function estado(uid) {
  const r = await db(c => c.query('SELECT * FROM students WHERE user_id=$1', [uid]));
  return r.rows[0] || null;
}
async function semear(uid, campos) {
  const f = Object.assign({ name: 'Teste', age: 24, mode: 'chat', onboarding: 'done', level: 'B1' }, campos || {});
  await db(c => c.query(
    'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
    + " VALUES ($1,$2,$3,$4,$5,$6,'{}'::jsonb,3,1,1,CURRENT_DATE)"
    + ' ON CONFLICT (user_id) DO UPDATE SET name=$2, age=$3, mode=$4, onboarding=$5, level=$6, updated_at=now()',
    [uid, f.name, f.age, f.mode, f.onboarding, f.level]));
}

(async () => {
  fs.writeFileSync(TR, '# Bateria completa — Fase A (determinísticos) — v7.4\n\n');
  console.log('BATERIA COMPLETA — Fase A (determinísticos, sem consumo de cota)\n');

  // ============ A. ONBOARDING ============
  console.log('== Bateria A — Onboarding ==');

  // A1: caminho feliz
  {
    const u = novoUid();
    let d = digest(await msg(u, 'oi'));
    const pediuNome = /qual é o seu nome/i.test(d.reply);
    d = digest(await msg(u, 'Lucas'));
    const pediuIdade = /quantos anos/i.test(d.reply);
    d = digest(await msg(u, '16'));
    const st = await estado(u);
    reg('A1', pediuNome && pediuIdade && st && st.name === 'Lucas' && st.age === 16,
      'nome=' + (st && st.name) + ' idade=' + (st && st.age) + ' (sem loop)');
  }

  // A2: nomes inválidos
  {
    const u = novoUid();
    await msg(u, 'oi');
    const invalidos = ['A', '123', '@#'];
    let rejeitou = true, gravou = null;
    for (const nome of invalidos) {
      const d = digest(await msg(u, nome));
      if (!/nome/i.test(d.reply)) rejeitou = false;
      const st = await estado(u);
      if (st && st.name) gravou = st.name;
    }
    reg('A2', rejeitou && !gravou, 'rejeitou ' + JSON.stringify(invalidos) + '; name gravado: ' + JSON.stringify(gravou));
  }

  // A3: nomes legítimos com acento/hífen/apóstrofo
  {
    const ok = [];
    for (const nome of ['José-Maria', "D'Ávila", 'Ana Luíza']) {
      const u = novoUid();
      await msg(u, 'oi');
      const d = digest(await msg(u, nome));
      const st = await estado(u);
      ok.push({ nome, aceito: /quantos anos/i.test(d.reply) && st && st.name === nome });
    }
    reg('A3', ok.every(x => x.aceito), ok.map(x => x.nome + '=' + (x.aceito ? 'ok' : 'REJEITADO')).join(', '));
  }

  // A4: validação de idade
  {
    const u = novoUid();
    await msg(u, 'oi'); await msg(u, 'Teste');
    const casos = [];
    for (const idade of ['15', '81', '999', 'abc']) {
      const d = digest(await msg(u, idade));
      const st = await estado(u);
      casos.push({ entrada: idade, rejeitou: !st.age, aindaPede: /quantos anos|idade/i.test(d.reply) });
    }
    const d = digest(await msg(u, '16 anos'));
    const st = await estado(u);
    casos.push({ entrada: '16 anos', extraiu: st.age });
    reg('A4', casos.slice(0, 4).every(c => c.rejeitou) && st.age === 16,
      'rejeitou 15/81/999/abc; "16 anos" -> idade=' + st.age);
  }

  // A6: update repetido
  {
    const u = novoUid();
    await semear(u, {});
    const upd = Math.floor(Date.now() / 1000) + 5000;
    const pacote = { update_id: upd, message: { message_id: upd, from: { id: u, is_bot: false, first_name: 'T' }, chat: { id: u, type: 'private' }, date: 1, text: '/menu' } };
    const post = async () => {
      const r = await fetch(BASE + '/webhook/iachat-test', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-iachat-test': TEST_SECRET }, body: JSON.stringify(pacote),
      });
      await r.text().catch(() => {});
    };
    await post(); await new Promise(r => setTimeout(r, 6000));
    const st1 = await estado(u);
    await post(); await new Promise(r => setTimeout(r, 6000));
    const st2 = await estado(u);
    reg('A6', st2.onboarding === 'done' && st1.onboarding === 'done',
      'reenvio do mesmo update_id não recomeçou o cadastro (onboarding=' + st2.onboarding + ')');
  }

  // A8: comandos durante o nivelamento
  {
    const u = novoUid();
    await msg(u, 'oi'); await msg(u, 'Teste'); await msg(u, '20');
    await cb(u, 'pl_start_A1');
    const antes = await estado(u);
    const d = digest(await msg(u, '/menu'));
    const dep = await estado(u);
    const seguiuNoTeste = dep.onboarding === antes.onboarding;
    reg('A8', seguiuNoTeste, 'comando durante nivelamento manteve onboarding=' + dep.onboarding);
  }

  // ============ B. PLACEMENT ============
  console.log('\n== Bateria B — Nivelamento ==');

  async function jornadaPlacement(u, decidir) {
    await msg(u, 'oi'); await msg(u, 'Teste'); await msg(u, '20');
    let d = digest(await cb(u, 'pl_start_A1'));
    let last = d.reply, n = 0;
    const niveis = [];
    while (n < 12 && !/Seu nível estimado/.test(last)) {
      const q = matchQuestion(last);
      const acertar = decidir(n);
      let e;
      if (!q) e = await msg(u, 'zzzz');
      else if (q.qtype === 'mc') {
        const idx = q.options.findIndex(o => o.toLowerCase() === String(q.answer).toLowerCase());
        const pick = acertar ? idx : (idx + 1) % q.options.length;
        e = await cb(u, 'ans_' + ['A', 'B', 'C', 'D', 'E'][pick]);
      } else e = await msg(u, acertar ? String(q.answer) : 'zzzz');
      n++; last = digest(e).reply || last;
      const st = await estado(u);
      if (st && st.placement_state && st.placement_state.level) niveis.push(st.placement_state.level);
    }
    const m = last.match(/Seu nível estimado:\s*([A-C][12])/);
    return { final: m ? m[1] : null, perguntas: n, niveis, last };
  }

  // B1: piso
  {
    const u = novoUid();
    const r = await jornadaPlacement(u, () => false);
    reg('B1', r.final === 'A1', 'errando tudo -> nível ' + r.final + ' (' + r.perguntas + ' questões)');
  }

  // B3: oscilação
  {
    const u = novoUid();
    const r = await jornadaPlacement(u, (i) => i % 4 < 2);   // 2 certas, 2 erradas
    const distintos = [...new Set(r.niveis)];
    reg('B3', distintos.length > 1, 'níveis percorridos: ' + distintos.join('>') + ' -> final ' + r.final);
  }

  // B5: pausa e retomada
  {
    const u = novoUid();
    await msg(u, 'oi'); await msg(u, 'Teste'); await msg(u, '20');
    await cb(u, 'pl_start_A1');
    const antes = await estado(u);
    const idxAntes = antes.placement_state && antes.placement_state.idx;
    await msg(u, '/pausa');
    const pausado = await estado(u);
    const d = digest(await msg(u, '/continuar'));
    const dep = await estado(u);
    const idxDep = dep.placement_state && dep.placement_state.idx;
    reg('B5', pausado.placement_state && pausado.placement_state.status === 'paused' && idxAntes === idxDep,
      'status pausado=' + (pausado.placement_state && pausado.placement_state.status) + '; idx ' + idxAntes + ' -> ' + idxDep);
  }

  // B6: texto aleatório durante o teste
  {
    const u = novoUid();
    await msg(u, 'oi'); await msg(u, 'Teste'); await msg(u, '20');
    await cb(u, 'pl_start_A1');
    const antes = await estado(u);
    const d = digest(await msg(u, 'batata frita com queijo'));
    const dep = await estado(u);
    const idxA = antes.placement_state && antes.placement_state.idx;
    const idxD = dep.placement_state && dep.placement_state.idx;
    reg('B6', idxD === idxA, 'texto fora de contexto não avançou a questão (idx ' + idxA + ' -> ' + idxD + '); reenviou enunciado: ' + /❓|\?/.test(d.reply));
  }

  // ============ X. TRANSVERSAIS ============
  console.log('\n== Bateria D2 — Transversais ==');

  // X1: troca de modo
  {
    const u = novoUid();
    await semear(u, { mode: 'chat' });
    await cb(u, 'mode_teacher');
    const t = await estado(u);
    await cb(u, 'mode_chat');
    const c2 = await estado(u);
    reg('X1', t.mode === 'teacher' && c2.mode === 'chat' && c2.name === 'Teste',
      'chat->teacher->chat, nome preservado (' + c2.name + ')');
  }

  // X2: persistência entre sessões
  {
    const u = novoUid();
    await semear(u, { mode: 'teacher', level: 'B2' });
    await db(c => c.query("UPDATE students SET profile=jsonb_set(COALESCE(profile,'{}'::jsonb),'{interests}','[\"🎮 Games\"]'::jsonb), last_active=CURRENT_DATE-7 WHERE user_id=$1", [u]));
    const d = digest(await msg(u, '/menu'));
    const st = await estado(u);
    reg('X2', st.level === 'B2' && st.mode === 'teacher' && JSON.stringify(st.profile.interests) === '["🎮 Games"]',
      'após 7 dias: nível=' + st.level + ' modo=' + st.mode + ' interesses preservados');
  }

  // X3: caracteres HTML
  {
    const u = novoUid();
    await semear(u, {});
    const d = digest(await msg(u, '5 > 3 & 2 < 4 <b>teste</b>'));
    const erros = (d.errs || []).filter(e => !/Enviar|Telegram/i.test(e));
    reg('X3', erros.length === 0, 'entrada com & < > processada sem erro de nó' + (erros.length ? ': ' + erros.join(';') : ''));
  }

  // ============ R. ROBUSTEZ ============
  console.log('\n== Bateria D3 — Robustez ==');

  // R2: emoji / espaços
  {
    const u = novoUid();
    await semear(u, {});
    const casos = [];
    for (const t of ['😀😀😀', '   ']) {
      const d = digest(await msg(u, t));
      const erros = (d.errs || []).filter(e => !/Enviar|Telegram/i.test(e));
      casos.push({ t: JSON.stringify(t), ok: erros.length === 0, erros });
    }
    reg('R2', casos.every(c => c.ok), casos.map(c => c.t + '=' + (c.ok ? 'ok' : 'ERRO')).join(', '));
  }

  // R3: não-texto
  {
    const u = novoUid();
    await semear(u, {});
    const upd = Math.floor(Date.now() / 1000) + 9000;
    const foto = { update_id: upd, message: { message_id: upd, from: { id: u, is_bot: false, first_name: 'T' }, chat: { id: u, type: 'private' }, date: 1, photo: [{ file_id: 'x', width: 10, height: 10 }] } };
    const r = await fetch(BASE + '/webhook/iachat-test', { method: 'POST', headers: { 'content-type': 'application/json', 'x-iachat-test': TEST_SECRET }, body: JSON.stringify(foto) });
    await r.text().catch(() => {});
    await new Promise(x => setTimeout(x, 7000));
    const st = await estado(u);
    reg('R3', r.status === 200 && st !== null, 'foto aceita (HTTP ' + r.status + ') sem travar o fluxo');
  }

  // S1: ingress sem autenticação
  {
    const r = await fetch(BASE + '/webhook/iachat-test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    reg('S1', r.status === 403, 'chamada sem header -> HTTP ' + r.status + ' (esperado 403)');
  }

  // ============ RESUMO ============
  const p = resultados.filter(r => r.ok === true).length;
  const f = resultados.filter(r => r.ok === false).length;
  const i = resultados.filter(r => r.ok === null).length;
  console.log('\n===== FASE A: ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos =====');
  for (const r of resultados.filter(x => x.ok !== true)) console.log('  ATENÇÃO ' + r.id + ': ' + r.detalhe);
  fs.appendFileSync(TR, '\n**Resumo:** ' + p + ' passaram, ' + f + ' falharam, ' + i + ' inconclusivos\n');
  console.log('\ntranscrição: ' + TR);
})().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
