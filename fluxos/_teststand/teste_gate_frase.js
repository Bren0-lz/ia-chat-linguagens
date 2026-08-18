// T7c — mesma janela do T7b, mas com a frase que vazou na bateria:
// "por que essa era a resposta certa?". A hipótese é que o vazamento não depende
// do estado (q_answered) e sim de como o aluno formula a dúvida: perguntar "por
// que" faz o agente tratar como explicação pós-resposta e comentar a questão que
// está na tela — que é a NOVA, ainda aberta.
const fs = require('fs');
const { msg, cb, digest } = require('./harness');

const FRASE = process.env.FRASE || 'por que essa era a resposta certa?';

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function revela(texto, gabarito) {
  const g = norm(gabarito), t = norm(texto);
  if (!g || !t) return false;
  return new RegExp('(^|\\s)' + g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)').test(t);
}
function cap(d) {
  const m = d.reply.match(/\[DUVIDA\][\s\S]*/); if (m) return m[0].replace('[DUVIDA] ', '').trim();
  const p = d.reply.match(/\[PROFESSOR\][\s\S]*/); return p ? p[0].replace('[PROFESSOR] ', '').trim() : d.reply.trim();
}

(async () => {
  const st = JSON.parse(fs.readFileSync('./state_critica.json', 'utf8'));
  const u = Number(process.argv[2] || st.userId);
  console.log('T7c — user', u, '| frase:', JSON.stringify(FRASE), '\n');

  let d = digest(await cb(u, 't_next'));
  const g1 = d.expectedAnswer;
  console.log('questão A aberta | gabarito:', JSON.stringify(g1));
  if (!g1) { console.log('INCONCLUSIVO: sem questão'); return; }

  d = digest(await msg(u, String(g1)));
  const g2 = d.expectedAnswer;
  console.log('acertou -> questão B já aberta | gabarito:', JSON.stringify(g2));
  if (!g2 || norm(g2) === norm(g1)) { console.log('INCONCLUSIVO: questão B não abriu ou repetiu gabarito'); return; }

  d = digest(await cb(u, 't_doubt'));
  d = digest(await msg(u, FRASE));
  const t = cap(d);
  console.log('\nresposta da dúvida:\n' + t.slice(0, 700) + '\n');

  const vazouB = revela(t, g2);
  const citouA = revela(t, g1);
  console.log('vazou gabarito da questão ABERTA ("' + g2 + '")? ' + (vazouB ? 'SIM → FALHOU' : 'não → passou'));
  console.log('citou o gabarito ANTERIOR ("' + g1 + '")? ' + (citouA ? 'sim (legítimo: já respondida)' : 'não'));

  fs.appendFileSync('./tr_critica.md',
    '\n## T7c — dúvida "' + FRASE + '" com questão nova aberta\n' +
    '_[gabarito da questão aberta: ' + g2 + ' | anterior: ' + g1 + ']_\n\n' + t + '\n\n**' +
    (vazouB ? 'FALHOU — vazou o gabarito aberto' : 'PASSOU') + '**\n');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
