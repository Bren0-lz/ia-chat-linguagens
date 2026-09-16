// AO VIVO — a linha traduzida 🇧🇷 dos niveis com apoio (A1, A2, B1) no fluxo do evento publicado.
//
// Relato do Breno (16/09, conta real, A1): o primeiro turno ("Hi How are you?") veio SO em ingles,
// sem traducao; a traducao so apareceu depois de ele dizer "não entendi" — e veio na MESMA linha do
// ingles. O formato pedido por ele:
//
//     mensagem em ingles...
//
//     🇧🇷: mensagem traduzida...
//
// Mede, por nivel, em alunos novos (persona comedian, interesses games — o cenario do relato):
//   (a) TRADUCAO PRESENTE: a resposta tem a linha 🇧🇷 sem o aluno pedir;
//   (b) FORMATO: bloco em ingles, UMA linha em branco, ultima linha comecando com "🇧🇷: ",
//       sem portugues no bloco de ingles.
// Julga o texto que o `Dividir Resposta` entrega ao Telegram (`messageText`, com HTML escapado
// desfeito), nao a saida crua do agente: e o que o aluno le (armadilha nº 13).
// Resposta vazia nunca e aprovacao (nº 1). Turnos do mesmo aluno espacados em >=12 s (nº 7).
// NAO e gate: exige n8n, Postgres, LLM e o evento publicado; e nao-deterministico.
//
// Uso:  node fluxos/_teststand/vivo_linha_br_evento.js [--n=3]
//       node fluxos/_teststand/vivo_linha_br_evento.js --autoteste
const BANDEIRA = '🇧🇷';
const PT_ACENTO = /[ãõçáéíóúâêôà]/i;
const PT_PALAVRAS = /\b(não|você|voce|que|isso|está|legal|jogo|jogos|gosta|também|como|para|com|uma|eu|seu|sua|oi|tudo|bem|legal)(?![a-zà-ÿ])/i;

// { traduzida: bool, formato: [falhas] }
function julgaLinhaBR(texto) {
  const t = String(texto || '').replace(/\r/g, '');
  if (!t.trim()) return { traduzida: false, formato: ['resposta VAZIA'] };
  const i = t.indexOf(BANDEIRA);
  if (i < 0) return { traduzida: false, formato: ['sem linha ' + BANDEIRA] };
  const f = [];
  if (t.indexOf(BANDEIRA, i + 1) >= 0) f.push('mais de uma ' + BANDEIRA);
  const en = t.slice(0, i), pt = t.slice(i);
  if (!/\S\n\n$/.test(en)) f.push('o ' + BANDEIRA + ' nao vem depois de UMA linha em branco');
  if (/\n\n\n$/.test(en)) f.push('mais de uma linha em branco antes de ' + BANDEIRA);
  if (!pt.startsWith(BANDEIRA + ': ')) f.push('a linha nao comeca com "' + BANDEIRA + ': "');
  if (pt.trim().indexOf('\n') >= 0) f.push('a traducao nao e a ULTIMA linha (ha texto depois dela)');
  if (!pt.slice(BANDEIRA.length).replace(/^:\s*/, '').trim()) f.push('traducao vazia');
  if (PT_ACENTO.test(en) || PT_PALAVRAS.test(en)) f.push('portugues no bloco de ingles');
  return { traduzida: true, formato: f };
}

function autoteste() {
  let x = 0;
  const t = (c, m) => { if (!c) { x++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
  const CERTO = "I am good! Did you play a game today? 🎮\n\n🇧🇷: Eu estou bem! Você jogou algum jogo hoje? 🎮";
  const CERTO_2L = "Nice! We say 'I play'.\nWhat game did you play?\n\n🇧🇷: Legal! A gente diz 'I play'. Que jogo você jogou?";
  t(julgaLinhaBR(CERTO).traduzida && julgaLinhaBR(CERTO).formato.length === 0, 'aprova o formato pedido');
  t(julgaLinhaBR(CERTO_2L).formato.length === 0, 'aprova ingles em duas linhas + linha em branco + 🇧🇷:');
  // as tres saidas reais de 16/09 (execs 4584, 4585, 4587)
  const R1 = "I am good! 😄 I am ready for some fun. Did you play a game today? 😜";
  const R2 = "No problem! I asked if you played a game today. Did you play a game today? 🇧🇷 Sem problemas! Eu perguntei se você jogou algum jogo hoje. Você jogou algum jogo hoje?";
  t(!julgaLinhaBR(R1).traduzida, 'real 4584: sem traducao -> traduzida=false');
  t(julgaLinhaBR(R2).traduzida && julgaLinhaBR(R2).formato.length > 0, 'real 4585: traducao na mesma linha -> reprova o formato');
  t(julgaLinhaBR("Hi!\n🇧🇷 Oi!").formato.length > 0, 'formato antigo (quebra simples, sem dois-pontos) reprova');
  t(julgaLinhaBR("Hi!\n\n🇧🇷 Oi!").formato.length > 0, 'sem dois-pontos reprova');
  t(julgaLinhaBR("Hi!\n🇧🇷: Oi!").formato.length > 0, 'sem linha em branco reprova');
  t(julgaLinhaBR("Hi!\n\n\n🇧🇷: Oi!").formato.length > 0, 'duas linhas em branco reprova');
  t(julgaLinhaBR("Hi!\n\n🇧🇷: Oi!\nWhat about you?").formato.length > 0, 'texto depois da traducao reprova');
  t(julgaLinhaBR("Oi, tudo bem? Hi!\n\n🇧🇷: Oi!").formato.length > 0, 'portugues no bloco de ingles reprova');
  t(julgaLinhaBR("Hi!\n\n🇧🇷: ").formato.length > 0, 'traducao vazia reprova');
  t(!julgaLinhaBR('').traduzida, 'vazio nao e traduzido');
  console.log('\n' + (x ? 'AUTOTESTE REPROVOU: ' + x : 'AUTOTESTE PASSOU'));
  process.exit(x ? 1 : 0);
}
if (process.argv.includes('--autoteste')) autoteste();

process.env.IACHAT_TEST_PATH = 'iachat-test-evento';
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env'), quiet: true });
const { Client } = require('pg');
const { msg, nodeOut, sleep } = require('./harness');

const N = Number((process.argv.find(a => a.startsWith('--n=')) || '--n=3').slice(4));
const ESPACO_MS = 13000;
const BASE_UID = 990000000 + (Date.now() % 8000000);
const TURNOS = ['Hi How are you?', 'I like play games with my brother'];
const unesc = (s) => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function semear(uid, nivel) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const profile = { persona: 'comedian', interests: ['🎮 Games'], inferred_interests: [], level: nivel };
    await c.query(
      'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
      + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,0,1,1,$6)"
      + " ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,mode='chat',level=$4,profile=$5::jsonb,updated_at=now()",
      [uid, 'Marina', 20, nivel, JSON.stringify(profile), new Date()]);
  } finally { await c.end(); }
}

(async () => {
  let fails = 0, k = 0;
  const placar = {};
  for (const nivel of ['A1', 'A2', 'B1']) {
    placar[nivel] = { total: 0, traduzida: 0, formato: 0, vazias: 0 };
    for (let r = 0; r < N; r++) {
      const uid = BASE_UID + (k++);
      await semear(uid, nivel);
      for (let j = 0; j < TURNOS.length; j++) {
        if (j > 0) await sleep(ESPACO_MS);
        const exec = await msg(uid, TURNOS[j]);
        const rd = exec && exec.data && exec.data.resultData && exec.data.resultData.runData;
        const rot = rd && nodeOut(rd, 'Roteador Mestre');
        const dv = rd && rd['Dividir Resposta'] && rd['Dividir Resposta'][0].data.main[0].map(i => i.json.messageText);
        const texto = unesc((dv || []).join('\n'));
        const P = placar[nivel];
        P.total++;
        console.log('\n--- ' + nivel + ' rep ' + (r + 1) + ' turno ' + (j + 1) + ' · exec ' + (exec && exec.id) + ' · rota ' + (rot && rot.route) + ' · aluno: ' + JSON.stringify(TURNOS[j]));
        console.log(texto || '(VAZIO)');
        if (!rot || rot.route !== 'conversa' || !texto.trim()) { P.vazias++; fails++; console.log('  ✗ turno sem resposta de conversa (nao conta como aprovado)'); continue; }
        const j2 = julgaLinhaBR(texto);
        if (j2.traduzida) P.traduzida++; else { fails++; console.log('  ✗ SEM TRADUCAO'); }
        if (j2.traduzida && j2.formato.length === 0) P.formato++;
        else if (j2.traduzida) { fails++; console.log('  ✗ formato: ' + j2.formato.join(' ; ')); }
      }
    }
  }
  console.log('\nPLACAR (traduzida sem pedir · formato "EN / linha em branco / 🇧🇷: PT")');
  for (const [nv, P] of Object.entries(placar)) console.log('  ' + nv + ': traduzida ' + P.traduzida + '/' + P.total + ' · formato ' + P.formato + '/' + P.total + (P.vazias ? ' · sem resposta ' + P.vazias : ''));
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' turno(s)' : 'PASSOU: todas as respostas traduzidas e no formato'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
