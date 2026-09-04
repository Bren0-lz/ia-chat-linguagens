// C8 — o teto de ~18 palavras do A1 aguenta as linhas de engajamento?
//
// O roteiro marca o C8 como risco conhecido ("novas linhas de engajamento/persona
// estourarem o teto") e ele nunca teve automato. Aqui ele vira medicao objetiva:
// conta as palavras do BLOCO EM INGLES (a linha 🇧🇷 e traducao, nao conta para o
// teto) em N turnos, e reporta media, desvio, maximo e taxa de estouro.
//
// Nao e PASSOU/FALHOU de uma amostra: com N pequeno o que interessa e a
// distribuicao. Um estouro isolado num turno de 20 palavras nao e o mesmo
// problema que 40% dos turnos passando de 25.
//
//   node fluxos/_teststand/mede_c8_teto_a1.js            (N=6, persona buddy)
//   node fluxos/_teststand/mede_c8_teto_a1.js --n=10 --persona=coach

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const N = Number(arg('n', 6));
const PERSONA = arg('persona', 'buddy');
const TETO = 18;
const TR = './tr_c8_teto_a1.md';

// Turnos variados de proposito: o teto so aperta quando o bot tem MUITO a dizer
// (corrigir + reagir + perguntar + puxar interesse). Turnos faceis nao testam nada.
const TURNOS = [
  'i like play games',                  // erro -> correcao + reacao + pergunta
  'i no have money for the game',       // erro pesado
  'yesterday i go to my friend house',  // erro de tempo verbal
  'hi',                                 // monossilabico -> dispara reciprocidade
  'yes',                                // monossilabico de novo -> short_streak
  'i love basketball and skate a lot',  // interesses -> dispara interestsLine
  'what you like do?',
  'i am very tired today because i study english all night',
];

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect(); try { return await fn(c); } finally { await c.end(); }
}

// So o bloco em ingles conta para o teto: a linha 🇧🇷 e traducao obrigatoria.
function palavrasIngles(txt) {
  const semRotulo = String(txt || '').replace(/\[(CONVERSA|cadastro|placement)\]\s*/g, '');
  const bloco = semRotulo.split(/\n?🇧🇷/)[0];
  const limpo = bloco.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ').trim();
  return limpo ? limpo.split(/\s+/).filter(Boolean).length : 0;
}

(async () => {
  const uid = 990000000 + (Date.now() % 9000000);
  await db(c => c.query(
    `INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, xp, streak_count, badges)
     VALUES ($1,'Bia',16,'chat','done','A1',$2::jsonb,0,0,1,'[]')
     ON CONFLICT (user_id) DO UPDATE SET level='A1', onboarding='done', mode='chat', profile=EXCLUDED.profile`,
    [uid, JSON.stringify({ level: 'A1', persona: PERSONA, interests: ['🎮 Games', '⚽ Esportes'], notes: '' })]));

  const linhas = [];
  const w = (s) => { console.log(s); linhas.push(s); };
  w('# C8 — teto de palavras do A1 (bloco em ingles)\n');
  w('> persona `' + PERSONA + '`, aluno A1 `' + uid + '`, ' + new Date().toISOString());
  w('> Teto declarado no prompt: **' + TETO + ' palavras**. A linha 🇧🇷 nao conta.\n');

  const contagens = [];
  for (let i = 0; i < N; i++) {
    const t = TURNOS[i % TURNOS.length];
    const d = digest(await msg(uid, t));
    const saida = (d.reply || '').replace(/^\[CONVERSA\]\s*/, '');
    if (!saida.trim()) { w('- turno ' + (i + 1) + ': **INCONCLUSIVO** (LLM nao respondeu) — nao conta na estatistica'); continue; }
    const n = palavrasIngles(saida);
    contagens.push(n);
    w('- turno ' + (i + 1) + ' (`' + t + '`): **' + n + ' palavras**' + (n > TETO ? '  ← ESTOUROU' : ''));
    w('\n```\n' + saida.trim() + '\n```\n');
  }

  if (!contagens.length) { w('\n**Sem amostra util — o LLM nao respondeu em nenhum turno.**'); }
  else {
    const media = contagens.reduce((a, b) => a + b, 0) / contagens.length;
    const dp = contagens.length < 2 ? 0 : Math.sqrt(contagens.map(v => (v - media) ** 2).reduce((a, b) => a + b, 0) / (contagens.length - 1));
    const estouros = contagens.filter(n => n > TETO).length;
    w('\n---\n');
    w('**n=' + contagens.length + '** · media **' + media.toFixed(1) + '** ± ' + dp.toFixed(1) +
      ' · maximo **' + Math.max(...contagens) + '** · estouraram o teto: **' + estouros + '/' + contagens.length +
      '** (' + Math.round(100 * estouros / contagens.length) + '%)');
    w('\n_Indicativo: n pequeno. Serve para ver se o teto e respeitado na pratica, nao para afirmar a taxa exata._');
  }
  w('\n_limpar: `node db/cleanup_test_users.js --apply`_');
  fs.writeFileSync(TR, linhas.join('\n'));
  console.log('\ntranscricao em ' + TR);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
