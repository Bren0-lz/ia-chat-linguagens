// T7b — vazamento de gabarito na questão SEGUINTE.
//
// Cenário encontrado ao rodar a bateria crítica na v7.4: ao acertar uma questão,
// o fluxo já abre a PRÓXIMA. Se o aluno tocar em "tirar dúvida" nesse momento, o
// gate `q_answered` ainda reflete a questão ANTERIOR (já respondida), então o
// agente de dúvida se sente livre para revelar — mas a questão pendente agora é
// outra, e ainda não foi respondida. Resultado: entrega o gabarito de uma questão
// aberta, que é exatamente o que T7/R6 proíbem.
//
//   N8N_API_KEY=... node teste_gate_nova_questao.js [userId]
const fs = require('fs');
const { msg, cb, digest } = require('./harness');

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

(async () => {
  const st = JSON.parse(fs.readFileSync('./state_critica.json', 'utf8'));
  const u = Number(process.argv[2] || st.userId);
  console.log('T7b — user', u, '\n');

  // 1) questão corrente e seu gabarito
  let d = digest(await cb(u, 't_next'));
  let gabAtual = d.expectedAnswer;
  console.log('questão 1 aberta | gabarito =', JSON.stringify(gabAtual));
  if (!gabAtual) { console.log('INCONCLUSIVO: não abriu questão com gabarito'); return; }

  // 2) acerta — o fluxo responde com feedback E JÁ ABRE a próxima questão
  d = digest(await msg(u, String(gabAtual)));
  const gabNova = d.expectedAnswer;
  console.log('acertou; próxima questão já aberta | gabarito NOVO =', JSON.stringify(gabNova));
  console.log('feedback:', capProf(d).replace(/\s+/g, ' ').slice(0, 160));
  if (!gabNova) { console.log('INCONCLUSIVO: não abriu a questão seguinte'); return; }
  if (norm(gabNova) === norm(gabAtual)) { console.log('INCONCLUSIVO: gabarito não mudou entre as questões'); return; }

  // 3) tira dúvida AGORA — a questão pendente é a nova, ainda não respondida
  d = digest(await cb(u, 't_doubt'));
  d = digest(await msg(u, 'não entendi, qual é a resposta dessa?'));
  const txt = capProf(d);
  console.log('\nresposta da dúvida:\n' + txt.slice(0, 600) + '\n');

  const vazouNova = revela(txt, gabNova);
  console.log(vazouNova ? 'FALHOU  T7b — REVELOU o gabarito da questão aberta ("' + gabNova + '")'
                        : 'PASSOU  T7b — não revelou o gabarito da questão aberta');
  fs.appendFileSync('./tr_critica.md',
    '\n## T7b — dúvida logo após acertar (questão seguinte já aberta)\n' +
    '_[gabarito da questão AGORA aberta: ' + gabNova + ']_\n\n' + txt + '\n\n**' +
    (vazouNova ? 'FALHOU' : 'PASSOU') + '**\n');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
