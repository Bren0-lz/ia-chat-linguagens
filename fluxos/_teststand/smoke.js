// smoke.js — rotina de testes fixa (regressão) do IAChat.
// Dirige uma jornada determinística (onboarding → placement → Professor) e faz
// asserções objetivas (PASS/FAIL). Roda em cima do harness já existente.
//
//   export N8N_API_KEY="<JWT>"           # ver README
//   PACE=2500 node smoke.js              # PACE alto = gentil com o n8n
//
// Parametrize o PERFIL nas 3 constantes abaixo e reexecute para cobrir outros perfis.
const { msg, cb, digest } = require('./harness');
const { matchQuestion, norm } = require('./seed');

// ---- PERFIL DE TESTE (mude estas 3 linhas para variar o perfil) ----
const AGE = '16';                 // idade (16..80). Ex.: '16', '24', '62'
const PERSONA = 'persona_buddy';  // persona_buddy|coach|comedian|debater|formal
const START = 'pl_start_A1';      // ponto de partida do placement: pl_start_A1..B2
// --------------------------------------------------------------------

const uid = 990000000 + Math.floor(Math.random() * 900000);
let fails = 0;
const ok = (id, cond, info = '') => { const p = !!cond; if (!p) fails++; console.log((p ? 'PASS' : 'FAIL') + '  ' + id + (info ? '  → ' + info : '')); };
const noErr = d => !(d.errs && d.errs.length);
const said = (d, re) => re.test(d.reply || '');

(async () => {
  console.log('SMOKE user', uid, '| perfil idade=' + AGE, PERSONA, START, '\n');
  let d;

  // --- ONBOARDING (validação) ---
  d = digest(await msg(uid, 'oi'));        ok('OB1 pede nome', noErr(d) && said(d, /nome/i));
  d = digest(await msg(uid, '1'));         ok('OB2 nome inválido rejeitado', noErr(d) && !(d.student && d.student.name));
  d = digest(await msg(uid, 'Lucas'));     ok('OB3 nome válido aceito', d.student && d.student.name && /idade|anos/i.test(d.reply || ''));
  d = digest(await msg(uid, '999'));       ok('OB4 idade 999 rejeitada', noErr(d) && !(d.student && Number(d.student.age) >= 16 && Number(d.student.age) <= 80));
  d = digest(await msg(uid, AGE));         ok('OB5 idade válida aceita', noErr(d));
  d = digest(await cb(uid, PERSONA));      ok('PS persona salva', d.student && d.student.profile && d.student.profile.persona === PERSONA.replace('persona_', ''));
  d = digest(await cb(uid, 'int_done'));   ok('IN interesses concluídos', noErr(d));

  // --- PLACEMENT (completa e grava nível A1..C1; nunca C2) ---
  d = digest(await cb(uid, START));        ok('PL início', noErr(d));
  for (let k = 0; k < 14; k++) {
    const row = matchQuestion(d.reply);
    if (!row) break;                        // não é mais uma questão → placement terminou
    if (row.options) { const i = row.options.findIndex(o => norm(o) === norm(row.answer)); d = digest(await cb(uid, 'ans_' + String.fromCharCode(65 + (i < 0 ? 0 : i)))); }
    else { d = digest(await msg(uid, row.answer)); }
  }
  ok('PL nível ∈ A1..C1 (C2 inalcançável)', d.student && /^(A1|A2|B1|B2|C1)$/.test(d.student.level || ''), 'level=' + (d.student && d.student.level));

  // --- MODO PROFESSOR ---
  await cb(uid, 'mode_teacher');
  d = digest(await msg(uid, 'vamos'));     ok('PR1 explicação inicial (500..4096 chars)', said(d, /PROFESSOR|prof\./) && (d.reply || '').length >= 500 && (d.reply || '').length <= 4200);

  d = digest(await cb(uid, 't_start'));    const ans1 = d.expectedAnswer; ok('PR2 questão gerada c/ gabarito salvo', !!ans1, 'answer=' + ans1);

  d = digest(await msg(uid, 'zzzqqq'));    ok('PR3 erro → explicação + resposta certa', d.pkind === 'wrong' && said(d, /certa/i) && (d.reply || '').length > 120);

  d = digest(await cb(uid, 't_next'));     const ans2 = d.expectedAnswer; ok('PR4 t_next gera próxima questão', !!ans2);

  await cb(uid, 't_doubt');
  d = digest(await msg(uid, 'não entendi'));
  ok('PR5 dúvida NÃO revela o gabarito pendente', ans2 && said(d, /DUVIDA/) && norm(d.reply).indexOf(norm(ans2)) < 0, 'gabarito=' + ans2);

  console.log('\n' + (fails ? fails + ' FALHA(S)' : 'TODOS OS TESTES PASSARAM'));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
