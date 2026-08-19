// PS3/PS4 — revalidação das personas com o modelo atual.
//
// O relatório deu rubrica 0 em "fidelidade à persona", mas aquela medição usou
// llama-3.3-70b-versatile, que a Groq removeu da conta. Este teste refaz a
// comparação com o modelo em produção hoje.
//
// Método: 5 alunos idênticos (mesmo nível, mesmos interesses, mesma idade),
// variando SÓ a persona, recebem a MESMA mensagem. Semeia direto no banco para
// não gastar 5 onboardings e para garantir que nada além da persona difere.
// Como saída de LLM não é determinística, RUNS repete a comparação e reporta
// média e desvio — exigência do próprio roteiro de testes.
//
//   N8N_API_KEY=... NIVEL=B1 RUNS=3 node revalida_personas.js ["mensagem"]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const PERSONAS = ['buddy', 'coach', 'comedian', 'debater', 'formal'];
const NIVEL = process.env.NIVEL || 'B1';
const RUNS = Number(process.env.RUNS || 1);
const TEXTO = process.argv[2] || 'i think video games is good for learning english, what do you think?';
const BASE_ID = 993900000;
const TR = './tr_personas_' + NIVEL + '.md';

// palavras de conteúdo, para medir sobreposição sem contar artigos/preposições
const STOP = new Set(('a o e de da do que you your i to the is are it in of and for with on my me that this what do does can'
  + ' um uma os as para com por em no na se sim nao').split(/\s+/));
function palavras(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}
function jaccard(a, b) {
  const A = new Set(palavras(a)), B = new Set(palavras(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const sd = a => a.length < 2 ? 0
  : Math.sqrt(a.map(v => Math.pow(v - mean(a), 2)).reduce((x, y) => x + y, 0) / (a.length - 1));

async function semear() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  for (let i = 0; i < PERSONAS.length; i++) {
    const uid = BASE_ID + i;
    const profile = JSON.stringify({ persona: PERSONAS[i], interests: ['games', 'music'], inferred_interests: [] });
    await c.query(
      'INSERT INTO students (user_id, name, age, mode, onboarding, level, profile, msg_count, last_update_id, streak_count, last_active)'
      + " VALUES ($1,'Marina',24,'chat','done',$2,$3::jsonb,5,1,1,CURRENT_DATE)"
      + " ON CONFLICT (user_id) DO UPDATE SET mode='chat', onboarding='done', level=$2,"
      + ' profile=$3::jsonb, teacher_state=NULL, updated_at=now()',
      [uid, NIVEL, profile]);
    // memória limpa: cada rodada precisa ser independente da anterior
    await c.query("DELETE FROM chat_memory WHERE split_part(session_id,':',1) = $1", [String(uid)]);
  }
  await c.end();
}

(async () => {
  console.log('nivel ' + NIVEL + ' | ' + RUNS + ' rodada(s) | 5 personas | mensagem identica\n');
  fs.writeFileSync(TR, '# PS3/PS4 — nivel ' + NIVEL + ' (' + RUNS + ' rodadas)\n\n**Mensagem:** "' + TEXTO + '"\n\n');

  const porRodada = [];
  const porPar = {};
  const marcadores = {};

  for (let r = 1; r <= RUNS; r++) {
    console.log('=== rodada ' + r + '/' + RUNS + ' ===');
    await semear();
    const out = {};
    for (let i = 0; i < PERSONAS.length; i++) {
      const p = PERSONAS[i];
      const d = digest(await msg(BASE_ID + i, TEXTO));
      const m = d.reply.match(/\[CONVERSA\][\s\S]*/);
      const txt = m ? m[0].replace('[CONVERSA] ', '').trim() : '(sem resposta) ' + (d.errs || []).join('; ');
      // GUARDA: se o LLM nao responde (rate limit da Groq, modelo 404), o texto
      // vira a MESMA string de erro para as 5 personas e o Jaccard vai a 1,000 —
      // que parece "colapso total de persona" e nao e. Isso corrompeu uma coleta
      // em 19/08. Aborta em vez de produzir numero falso.
      if (!m) {
        console.error('\nABORTADO: o bot nao respondeu (persona ' + p + ', rodada ' + r + ').');
        console.error('erros: ' + JSON.stringify(d.errs));
        console.error('Sem resposta do LLM o Jaccard e artefato, nao medicao.');
        process.exit(2);
      }
      out[p] = txt;
      // No A1 o formato é bilíngue: inglês + uma linha 🇧🇷 com a tradução.
      // O teto de palavras vale para a parte em inglês, então mede-se as duas
      // separadamente — subir o teto para ganhar persona não pode estourar o
      // C8/C9 (adequação ao iniciante absoluto) sem que a gente veja.
      const linhaPt = txt.split('\n').find(l => l.trim().startsWith('🇧🇷')) || '';
      const parteEn = txt.replace(linhaPt, '').trim();
      (marcadores[p] = marcadores[p] || []).push({
        palavras: txt.split(/\s+/).filter(Boolean).length,
        palavrasEn: parteEn.split(/\s+/).filter(Boolean).length,
        emoji: (txt.match(EMOJI) || []).length,
      });
      fs.appendFileSync(TR, '### rodada ' + r + ' — ' + p + '\n' + txt + '\n\n');
    }
    const vals = [];
    for (let i = 0; i < PERSONAS.length; i++)
      for (let j = i + 1; j < PERSONAS.length; j++) {
        const chave = PERSONAS[i] + ' x ' + PERSONAS[j];
        const v = jaccard(out[PERSONAS[i]], out[PERSONAS[j]]);
        vals.push(v);
        (porPar[chave] = porPar[chave] || []).push(v);
      }
    const md = mean(vals);
    porRodada.push(md);
    console.log('  media da rodada: ' + md.toFixed(3) + ' | pior par: ' + Math.max.apply(null, vals).toFixed(2) + '\n');
  }

  const m = mean(porRodada), s2 = sd(porRodada);
  const paresOrd = Object.keys(porPar)
    .map(k => ({ par: k, m: mean(porPar[k]), s: sd(porPar[k]) }))
    .sort((a, b) => b.m - a.m);
  const psOk = m < 0.30 && paresOrd[0].m < 0.45;

  console.log('===== PS4 — ' + NIVEL + ' =====');
  console.log('medias por rodada: ' + porRodada.map(v => v.toFixed(3)).join(', '));
  console.log('media geral: ' + m.toFixed(3) + ' (desvio ' + s2.toFixed(3) + ')');
  console.log('\npares (media +/- desvio):');
  for (const p of paresOrd) console.log('  ' + p.m.toFixed(2) + ' +/- ' + p.s.toFixed(2) + '  ' + p.par);
  console.log('\n' + (psOk ? 'PASSOU  ' : 'FALHOU  ') + 'PS4 (' + NIVEL + ') — media ' + m.toFixed(3) + ' +/- ' + s2.toFixed(3));

  console.log('\n===== PS3 — marcadores (media de ' + RUNS + ' rodadas) =====');
  for (const p of PERSONAS) {
    const arr = marcadores[p] || [];
    console.log('  ' + p.padEnd(9) + ' | ' + mean(arr.map(x => x.palavras)).toFixed(0).padStart(3)
      + ' palavras (' + mean(arr.map(x => x.palavrasEn)).toFixed(0).padStart(3) + ' em ingles) | '
      + mean(arr.map(x => x.emoji)).toFixed(1) + ' emoji');
  }
  const todasEn = PERSONAS.flatMap(p => (marcadores[p] || []).map(x => x.palavrasEn));
  console.log('  -> media geral em ingles: ' + mean(todasEn).toFixed(1) + ' palavras'
    + ' | maior resposta: ' + Math.max.apply(null, todasEn));

  fs.appendFileSync(TR, '\n## PS4 — ' + NIVEL + ', ' + RUNS + ' rodadas\n\n'
    + 'medias por rodada: ' + porRodada.map(v => v.toFixed(3)).join(', ') + '\n\n'
    + '**media ' + m.toFixed(3) + ' (desvio ' + s2.toFixed(3) + ') — ' + (psOk ? 'PASSOU' : 'FALHOU') + '**\n\n'
    + '| par | media | desvio |\n|---|---|---|\n'
    + paresOrd.map(p => '| ' + p.par + ' | ' + p.m.toFixed(2) + ' | ' + p.s.toFixed(2) + ' |').join('\n') + '\n');
  console.log('\ntranscricao: ' + TR);
})().catch(e => { console.error('erro', e.message); process.exit(1); });
