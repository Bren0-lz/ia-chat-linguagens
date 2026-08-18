// Sonda do T5: pede N questões seguidas e conta quantas voltam como
// "(Questão indisponível)" ou vazias. Reaproveita o usuário deixado pela
// bateria_critica.js em state_critica.json.
//   N8N_API_KEY=... N=6 node sonda_t5.js
const fs = require('fs');
const { cb, digest } = require('./harness');

const N = Number(process.env.N || 6);
const TR = './tr_critica.md';
const st = JSON.parse(fs.readFileSync('./state_critica.json', 'utf8'));

function capProf(d) {
  const m3 = d.reply.match(/\[PROFESSOR\][\s\S]*/); if (m3) return m3[0].replace('[PROFESSOR] ', '').trim();
  const m1 = d.reply.match(/\[prof\.det\][^\[]*/); if (m1) return m1[0].replace('[prof.det] ', '').trim();
  return d.reply.trim();
}

(async () => {
  console.log('sonda T5 — user', st.userId, '| nível', st.nivel, '|', N, 'questões\n');
  let indisp = 0, vazias = 0, ok = 0;
  for (let i = 0; i < N; i++) {
    const d = digest(await cb(st.userId, 't_next'));
    const t = capProf(d);
    const erros = (d.errs || []).filter(e => !/Enviar |Telegram/i.test(e));
    let tag;
    if (/quest[ãa]o indispon[íi]vel/i.test(t)) { indisp++; tag = 'INDISPONÍVEL'; }
    else if (!t || t.length < 12) { vazias++; tag = 'VAZIA'; }
    else { ok++; tag = 'ok'; }
    console.log(String(i + 1).padStart(2) + '. ' + tag + (erros.length ? ' | erros: ' + erros.join('; ') : '') + ' | ' + t.replace(/\s+/g, ' ').slice(0, 90));
    fs.appendFileSync(TR, '## T5 sonda ' + (i + 1) + ' — ' + tag + '\n' + t.slice(0, 400) + '\n\n');
  }
  const passou = indisp === 0 && vazias === 0;
  console.log('\n' + (passou ? 'PASSOU  ' : 'FALHOU  ') + 'T5 (sonda): ' + ok + ' válidas, ' + indisp + ' indisponíveis, ' + vazias + ' vazias (em ' + N + ')');
  fs.appendFileSync(TR, '\n- **T5 (sonda)**: ' + (passou ? 'PASSOU' : 'FALHOU') + ' — ' + ok + ' válidas, ' + indisp + ' indisponíveis, ' + vazias + ' vazias (em ' + N + ')\n');
})().catch(e => { console.error('erro', e.message); process.exit(1); });
