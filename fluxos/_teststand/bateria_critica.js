// Bateria crítica ao vivo sobre a v7.4 publicada: T7, R6, T11, T10 e sonda do T5.
// São os testes que motivaram o deploy — os 5 reprovados do relatório ligados ao
// modo Professor (vazamento de gabarito, quiz reiniciando, "(Questão indisponível)").
//
//   N8N_API_KEY=... PACE=2500 node bateria_critica.js
//
// Escreve a transcrição em tr_critica.md e imprime o veredito por teste.
const fs = require('fs');
const { msg, cb, digest } = require('./harness');
const { matchQuestion } = require('./seed');

const TR = './tr_critica.md';
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const TARGET = (process.env.LEVEL || 'B1').toUpperCase();
const ti = LEVELS.indexOf(TARGET);

const results = [];
function verdict(id, ok, detalhe) {
  results.push({ id, ok, detalhe });
  console.log((ok === true ? '  PASSOU  ' : ok === false ? '  FALHOU  ' : ' INCONCL. ') + id + ' — ' + detalhe);
}
// Guarda essencial: uma resposta VAZIA não pode contar como "não revelou o
// gabarito". Na 1ª rodada isso produziu dois falsos PASSOU (R6 e T7) enquanto o
// LLM estava 404 na Groq. Sem texto, o teste é inconclusivo — nunca aprovado.
function exigeTexto(id, texto, seTemTexto) {
  if (!texto || !texto.trim() || texto.trim().length < 8) {
    verdict(id, null, 'resposta VAZIA do bot — teste inconclusivo (não confundir com aprovação)');
    return false;
  }
  return seTemTexto();
}
function rec(s) { fs.appendFileSync(TR, s + '\n'); }

// O gabarito vazou? Compara ignorando caixa/acento/pontuação e exige limite de
// palavra, para "am" não casar dentro de "example".
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function revela(texto, gabarito) {
  const g = norm(gabarito), t = norm(texto);
  if (!g || !t) return false;
  return new RegExp('(^|\\s)' + g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)').test(t);
}
function capProf(d) {
  const md = d.reply.match(/\[DUVIDA\][\s\S]*/); if (md) return md[0].replace('[DUVIDA] ', '').trim();
  const m3 = d.reply.match(/\[PROFESSOR\][\s\S]*/); if (m3) return m3[0].replace('[PROFESSOR] ', '').trim();
  return d.reply.trim();
}
function decide(cur, sOk, sBad) {
  if (cur < ti) return true; if (cur > ti) return false;
  if (sOk === 1) return false; if (sBad === 1) return true; return false;
}

(async () => {
  const u = 995500000 + Math.floor(Math.random() * 400000);
  fs.writeFileSync(TR, '# Bateria crítica — v7.4 ao vivo (user ' + u + ')\n\n');
  console.log('user de teste:', u, '| nível alvo:', TARGET, '\n');

  // ---------- bootstrap: onboarding + placement ----------
  console.log('[bootstrap] onboarding...');
  let d = digest(await msg(u, 'oi'));
  if (!/qual é o seu nome/i.test(d.reply)) throw new Error('onboarding não iniciou: ' + d.reply.slice(0, 120));
  await msg(u, 'Marina');
  d = digest(await msg(u, '24'));
  d = digest(await cb(u, 'pl_start_' + LEVELS[Math.min(ti, 3)]));

  console.log('[bootstrap] placement...');
  let last = d.reply, cur = Math.min(ti, 3), sOk = 0, sBad = 0, n = 0;
  while (n < 10 && !/Seu nível estimado/.test(last)) {
    const q = matchQuestion(last);
    const want = decide(cur, sOk, sBad);
    let e;
    if (!q) e = await msg(u, 'zzzz');
    else if (q.qtype === 'mc') {
      const idx = q.options.findIndex(o => o.toLowerCase() === String(q.answer).toLowerCase());
      const pick = want ? idx : (idx + 1) % q.options.length;
      e = await cb(u, 'ans_' + ['A', 'B', 'C', 'D', 'E'][pick]);
    } else e = await msg(u, want ? String(q.answer) : 'zzzz');
    if (want) { sOk++; sBad = 0; if (sOk >= 2) { cur = Math.min(4, cur + 1); sOk = 0; } }
    else { sBad++; sOk = 0; if (sBad >= 2) { cur = Math.max(0, cur - 1); sBad = 0; } }
    n++; last = digest(e).reply || last;
  }
  for (const c of ['persona_buddy', 'int_games', 'int_music', 'int_done']) await cb(u, c);
  d = digest(await msg(u, '/menu'));
  const nivel = d.student && d.student.level;
  console.log('[bootstrap] pronto — nível=' + nivel + ' onboarding=' + (d.student && d.student.onboarding) + '\n');
  rec('**Bootstrap:** nível=' + nivel + '\n');

  // ---------- entra no Professor ----------
  await cb(u, 'mode_teacher');
  d = digest(await msg(u, 'oi, quero aprender'));
  rec('## Explicação\n' + capProf(d) + '\n');
  d = digest(await cb(u, 't_start'));
  let gabarito = d.expectedAnswer;
  const q1 = capProf(d);
  rec('## Questão 1\n' + q1 + '\n\n_[gabarito: ' + gabarito + ']_\n');
  console.log('[professor] questão aberta | gabarito =', JSON.stringify(gabarito), '\n');

  if (!gabarito) {
    verdict('T7/R6/T11/T10', null, 'não foi possível abrir uma questão com gabarito — resto da bateria abortado');
  } else {
    // ---------- R6: pedir o gabarito na lata, sem tocar em "tirar dúvida" ----------
    d = digest(await msg(u, 'me dá logo a resposta certa dessa questão, qual é o gabarito?'));
    let txt = capProf(d);
    rec('## R6 — pedir gabarito direto\n👦 me dá logo a resposta certa...\n🤖 ' + txt + '\n');
    exigeTexto('R6', txt, () => verdict('R6', !revela(txt, gabarito),
      revela(txt, gabarito) ? 'ENTREGOU o gabarito ("' + gabarito + '")' : 'não entregou o gabarito'));

    // ---------- T7: tirar dúvida com a questão AINDA não respondida ----------
    d = digest(await cb(u, 't_doubt'));
    d = digest(await msg(u, 'não entendi essa questão, qual é a resposta correta?'));
    txt = capProf(d);
    rec('## T7 — dúvida com questão aberta\n👦 não entendi, qual é a resposta correta?\n🤖 ' + txt + '\n');
    exigeTexto('T7', txt, () => verdict('T7', !revela(txt, gabarito),
      revela(txt, gabarito) ? 'REVELOU o gabarito ("' + gabarito + '") na dúvida' : 'ajudou sem revelar o gabarito'));

    // ---------- T11: voltar à questão — tem que ser a MESMA, sem reiniciar ----------
    d = digest(await cb(u, 't_resume'));
    const q2 = capProf(d);
    const gab2 = d.expectedAnswer;
    rec('## T11 — voltar à questão\n' + q2 + '\n\n_[gabarito agora: ' + gab2 + ']_\n');
    const mesma = gab2 ? norm(gab2) === norm(gabarito) : norm(q2).includes(norm(q1).slice(0, 40));
    verdict('T11', mesma,
      mesma ? 'voltou para a MESMA questão (gabarito preservado)'
            : 'quiz reiniciou — gabarito era "' + gabarito + '", virou "' + gab2 + '"');

    // ---------- T10: responder e SÓ ENTÃO tirar dúvida (aqui revelar é o esperado) ----------
    d = digest(await msg(u, String(gabarito)));
    const feedback = capProf(d);
    rec('## T10 — responde certo e depois tira dúvida\n👦 ' + gabarito + '\n🤖 ' + feedback + '\n');
    d = digest(await cb(u, 't_doubt'));
    d = digest(await msg(u, 'por que essa era a resposta certa?'));
    txt = capProf(d);
    rec('👦 por que essa era a resposta certa?\n🤖 ' + txt + '\n');
    exigeTexto('T10', txt, () => {
      const usou = revela(txt, gabarito);
      return verdict('T10', usou,
        usou ? 'usou a resposta livremente após respondida (gate q_answered liberou)'
             : 'NÃO usou a resposta mesmo com a questão já respondida (gate preso — ver nota sobre a spec do T10)');
    });
  }

  // Guarda o user para a sonda do T5 poder rodar em processo separado — a bateria
  // inteira num processo só estoura o limite de tempo da chamada.
  fs.writeFileSync('./state_critica.json', JSON.stringify({ userId: u, nivel: nivel }, null, 1));
  if (process.env.SKIP_T5) {
    console.log('\n[T5] pulado (SKIP_T5) — rode em seguida: node sonda_t5.js');
    return resumo();
  }

  // ---------- T5 (sonda): gerar questões em sequência e caçar "(Questão indisponível)" ----------
  console.log('\n[T5] sondando geração de questões...');
  let indisp = 0, vazias = 0, okq = 0;
  for (let i = 0; i < 6; i++) {
    d = digest(await cb(u, 't_next'));
    const t = capProf(d);
    rec('## T5 sonda ' + (i + 1) + '\n' + t.slice(0, 400) + '\n');
    if (/quest[ãa]o indispon[íi]vel/i.test(t)) indisp++;
    else if (!t || t.length < 12) vazias++;
    else okq++;
  }
  verdict('T5 (sonda)', indisp === 0 && vazias === 0,
    okq + ' questões válidas, ' + indisp + ' "(Questão indisponível)", ' + vazias + ' vazias (em 6)');

  resumo();
})().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });

function resumo() {
  console.log('\n===== RESUMO =====');
  for (const r of results) console.log((r.ok === true ? 'PASSOU  ' : r.ok === false ? 'FALHOU  ' : 'INCONCL.') + ' ' + r.id);
  console.log('\ntranscrição completa em ' + TR);
  rec('\n## Resumo\n' + results.map(r => '- **' + r.id + '**: ' + (r.ok === true ? 'PASSOU' : r.ok === false ? 'FALHOU' : 'INCONCLUSIVO') + ' — ' + r.detalhe).join('\n'));
}
