// T022 — o bot pratica RECIPROCIDADE com o aluno monossilabico?
//
// O DEFEITO (C10, medido na bateria de 06/09 e confirmado por rubrica):
// com a aluna monossilabica (P2, coach, `short_streak>=2`), o bot respondeu
//
//   "Nice start, Bianca! 💪 You're here, that's progress!
//    What's on your mind today? Are you ready to talk about your day?"
//
// ...nada de si e DUAS perguntas. Virou interrogatorio -- o oposto exato do que a
// diretiva pede, e justamente com quem menos aguenta interrogatorio.
//
// NAO E DEFEITO DE INSTRUMENTO: o teste semeia `short_streak:2` e envia 'ok' (1
// palavra), entao `_monos` e verdadeiro e o `reciprocityLine` monossilabico CHEGA ao
// prompt. O modelo simplesmente o ignora.
//
// HIPOTESE (uma variavel), herdada do T012: instrucao perde para exemplo. No A1, trocar
// o exemplo de formato levou a correcao de 0/9 a 9/9 sem mudar uma unica diretiva. O
// `reciprocityLine` e instrucao pura.
//
// PROTOCOLO (handoff §8): baseline -> UMA linha -> medir -> reverter se nao melhorar.
//
//   IACHAT_TEST_PATH=iachat-test-v8 node fluxos/_teststand/experimento_reciprocidade.js --rotulo=baseline --n=6

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');
const { rotuloDe } = require('./alvo');

const ALVO = rotuloDe(process.env.IACHAT_TEST_PATH || 'iachat-test');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const N = Math.max(1, Number(arg('n', 6)));
const ROTULO = arg('rotulo', 'sem-rotulo');
const TR = './tr_experimento_reciprocidade.md';

let uid = 990000000 + (Date.now() % 9000000);
const novoUid = () => (uid += 3);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}

// Perfil P2 da bateria: Bianca, A2, coach, monossilabica. `short_streak:2` semeado + a
// mensagem de 1 palavra abaixo fazem o contador chegar a 3, e `_monos` fica verdadeiro.
async function semear(u) {
  const profile = {
    persona: 'coach', interests: [], inferred_interests: [], level: 'A2',
    conv: { short_streak: 2, pt_streak: 0, en_streak: 0 },
  };
  await db(c => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,'Bianca',16,'chat','done','A2',$2::jsonb,3,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET profile=$2::jsonb,updated_at=now()',
    [u, JSON.stringify(profile)]
  ));
}

const soConversa = (d) => {
  const m = String(d.reply || '').match(/\[CONVERSA\]\s*([\s\S]*)/);
  return m ? m[1].trim() : String(d.reply || '');
};
// so o bloco em ingles: a linha 🇧🇷 e traducao e duplicaria as contagens
const blocoIngles = (t) => String(t).split('🇧🇷')[0];

// --- DETECTOR ---
// Duas condicoes, exigidas JUNTAS, porque a diretiva pede as duas:
//   (a) dividir algo proprio e concreto (preferencia, mini-fato, opiniao);
//   (b) no maximo UMA pergunta -- duas ja e o interrogatorio que a diretiva proibe.
//
// LIMITE ASSUMIDO: "dividir algo proprio" e julgado por padrao lexical de auto-revelacao
// COM conteudo. Formulas vazias de cortesia ("I am fine", "I'm good, thanks") NAO contam:
// foi exatamente com elas que o baseline encheu a resposta sem dizer nada de si.
function divideAlgoProprio(texto) {
  const s = blocoIngles(texto);
  // cortesia vazia: descartada antes de procurar auto-revelacao
  const semCortesia = s.replace(/\bI(?:'m| am)\s+(fine|good|great|ok|okay|well|happy|excited)\b[^.!?]*/gi, '');
  return /\bI\s+(love|like|enjoy|prefer|play|watch|listen|read|think|believe|always|usually|never|find)\b/i.test(semCortesia)
    || /\bmy\s+(favorite|favourite|go-to)\b/i.test(semCortesia)
    || /\bfor\s+me\b/i.test(semCortesia)
    || /\bI(?:'m| am)\s+a\s+(big\s+)?fan\b/i.test(semCortesia);
}
const contaPerguntas = (texto) => (blocoIngles(texto).match(/\?/g) || []).length;

function veredito(texto) {
  const divide = divideAlgoProprio(texto);
  const perg = contaPerguntas(texto);
  return { ok: divide && perg <= 1, divide, perg };
}

(async () => {
  const linhas = [];
  const reg = s => { console.log(s); linhas.push(s); };

  reg('\n## ' + ROTULO + ' — ' + new Date().toISOString() + ' (N=' + N + ', alvo ' + ALVO + ')\n');

  const res = [];
  for (let i = 0; i < N; i++) {
    const u = novoUid();
    await semear(u);
    const d = digest(await msg(u, 'ok'));   // 1 palavra: mantem _monos verdadeiro
    const t = soConversa(d);
    if (!t.trim()) { res.push({ vazio: true }); continue; }  // vazio nunca vira aprovacao
    const v = veredito(t);
    res.push({ ...v, t });
  }

  const medidos = res.filter(r => !r.vazio);
  const acertos = medidos.filter(r => r.ok).length;
  const divide = medidos.filter(r => r.divide).length;
  const umaPerg = medidos.filter(r => r.perg <= 1).length;
  const vazios = res.length - medidos.length;

  reg('| criterio | resultado |');
  reg('|---|---|');
  reg('| **reciprocidade (divide E <=1 pergunta)** | **' + acertos + '/' + medidos.length + '** |');
  reg('| divide algo proprio | ' + divide + '/' + medidos.length + ' |');
  reg('| no maximo 1 pergunta | ' + umaPerg + '/' + medidos.length + ' |');
  reg('| turnos vazios (nao contados) | ' + vazios + ' |');
  reg('');
  reg('Transcricoes:');
  reg('');
  for (const r of medidos) {
    reg('- ' + (r.ok ? '**OK**' : 'falhou') + ' (divide=' + r.divide + ', perguntas=' + r.perg + ')');
    reg('');
    reg('```');
    reg(String(r.t).slice(0, 400));
    reg('```');
    reg('');
  }

  fs.appendFileSync(TR, linhas.join('\n') + '\n');
  console.log('\nanexado em ' + TR);
  console.log('Limpeza: node db/cleanup_test_users.js --apply');
  process.exit(medidos.length === 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
