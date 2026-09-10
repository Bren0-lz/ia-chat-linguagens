// T024 — corrige erro FORA da lista, em nivel alto (B2 e C1)?
//
// A LACUNA QUE ISTO FECHA. A jornada de 07/09 mostrou o v8 NAO corrigindo
// "i like play video games" em C1, onde o v7.4 corrigiu a mesma entrada, no mesmo
// nivel e com a mesma persona. Era N=1 e o T012 so tocou o prompt do A1, entao a
// leitura provavel e variancia -- mas descobriu-se que NENHUM teste media isto:
//
//   - C1 e C15 medem o A1;
//   - o C3, que passa, usa "video games is fun" -- concordancia sujeito-verbo, que
//     ESTA na lista "ERROS QUE CONTAM" injetada em todos os prompts.
//
// Ou seja, a bateria nunca perguntou se o bot corrige um erro que a lista nao nomeia,
// num nivel alto. Este script pergunta.
//
// NAO conserta nada: mede e reporta a taxa. Se reprovar, vira defeito novo com
// tarefa propria -- consertar dentro da medicao contamina a medicao.
//
//   IACHAT_TEST_PATH=iachat-test-v8 node fluxos/_teststand/mede_correcao_nivel_alto.js [--n=6]

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');
const { rotuloDe } = require('./alvo');

const ALVO = rotuloDe(process.env.IACHAT_TEST_PATH || 'iachat-test');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const N = Math.max(1, Number(arg('n', 6)));
const TR = './tr_correcao_nivel_alto_' + ALVO.replace(/[^\w.-]+/g, '-') + '.md';

let uid = 990000000 + (Date.now() % 9000000);
const novoUid = () => (uid += 3);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function semear(u, nivel) {
  const profile = { persona: 'buddy', interests: ['🎮 Games'], inferred_interests: [], level: nivel };
  await db(c => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,'Lucas',24,'chat','done',$3,$2::jsonb,3,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET profile=$2::jsonb,level=$3,updated_at=now()',
    [u, JSON.stringify(profile), nivel]
  ));
}
const soConversa = (d) => {
  const m = String(d.reply || '').match(/\[CONVERSA\]\s*([\s\S]*)/);
  return m ? m[1].trim() : String(d.reply || '');
};

// Os PROBES. Cada um e um erro que a lista "ERROS QUE CONTAM" NAO nomeia.
// A lista cobre: concordancia sujeito-verbo, contavel/incontavel, tempo verbal,
// forma depois de modal/auxiliar, condicional e preposicao dependente.
const PROBES = [
  {
    id: 'gerundio-apos-like',
    entrada: 'i like play video games',
    // depois de "like" as duas formas sao corretas: "to play" e "playing"
    formaCerta: s => /\blike\s+to\s+play\b/i.test(s) || /\blike\s+playing\b/i.test(s),
    porque: 'e o erro exato que a jornada pegou em C1',
  },
  {
    id: 'artigo-com-incontavel',
    entrada: 'i need a advice about my english',
    formaCerta: s => /\ban\s+advice\b/i.test(s) || /\bsome\s+advice\b/i.test(s) || /\badvice\b(?!\s*s)/i.test(s) && /\ban?\b/i.test(s),
    porque: 'artigo indefinido com substantivo incontavel',
  },
  {
    id: 'plural-irregular',
    entrada: 'i saw many childrens at the park',
    formaCerta: s => /\bchildren\b/i.test(s) && !/\bchildrens\b/i.test(s),
    porque: 'plural irregular, nada a ver com concordancia sujeito-verbo',
  },
];

// MESMA REGUA do C1 e do controle estrito: marcador de reparo EM CONJUNCAO com a
// forma certa. O bot usar a forma correta na propria frase NAO conta como correcao
// -- foi essa frouxidao que saturou o detector do controle em 9/9 (T011).
function corrigiu(texto, probe) {
  const s = String(texto || '');
  const reparo = /\b(we say|say|it'?s|correct|instead|rather than|not)\b/i.test(s);
  return reparo && probe.formaCerta(s);
}

(async () => {
  const linhas = [];
  const reg = s => { console.log(s); linhas.push(s); };

  reg('# Correcao de erro FORA da lista, em nivel alto — ' + ALVO);
  reg('');
  reg('> Rodada: ' + new Date().toISOString() + ' · N=' + N + ' por probe e por nivel');
  reg('> Ingress: ' + (process.env.IACHAT_TEST_PATH || 'iachat-test') + '');
  reg('>');
  reg('> Regua ESTRITA (a mesma do C1): exige reparo explicito. O bot usar a forma');
  reg('> certa na propria frase nao conta — foi essa frouxidao que saturou o');
  reg('> detector do controle em 9/9 no T011.');
  reg('');

  const tabela = [];
  for (const nivel of ['B2', 'C1']) {
    for (const probe of PROBES) {
      let acertos = 0, vazios = 0;
      const amostras = [];
      for (let i = 0; i < N; i++) {
        const u = novoUid();
        await semear(u, nivel);
        const d = digest(await msg(u, probe.entrada));
        const t = soConversa(d);
        if (!t.trim()) { vazios++; continue; } // vazio NUNCA vira aprovacao
        const ok = corrigiu(t, probe);
        if (ok) acertos++;
        if (amostras.length < 2) amostras.push((ok ? '[corrigiu] ' : '[nao corrigiu] ') + t.replace(/\n/g, ' ').slice(0, 200));
      }
      const medidos = N - vazios;
      tabela.push({ nivel, probe: probe.id, acertos, medidos, vazios });
      reg('### ' + nivel + ' · ' + probe.id + ' — ' + acertos + '/' + medidos +
          (vazios ? ' (' + vazios + ' vazios, nao contados)' : ''));
      reg('');
      reg('entrada: `' + probe.entrada + '` — ' + probe.porque);
      reg('');
      for (const a of amostras) reg('    ' + a);
      reg('');
    }
  }

  reg('## Resumo');
  reg('');
  reg('| nivel | probe | corrigiu | vazios |');
  reg('|---|---|---|---|');
  for (const r of tabela) reg('| ' + r.nivel + ' | ' + r.probe + ' | **' + r.acertos + '/' + r.medidos + '** | ' + r.vazios + ' |');
  reg('');

  const total = tabela.reduce((a, r) => a + r.acertos, 0);
  const totalMed = tabela.reduce((a, r) => a + r.medidos, 0);
  const taxa = totalMed ? (total / totalMed) : 0;
  reg('**Taxa geral: ' + total + '/' + totalMed + ' (' + Math.round(taxa * 100) + '%)**');
  reg('');
  if (taxa < 0.5) {
    reg('> ⚠️ Abaixo de 50%: o bot **nao corrige de forma confiavel** erro fora da lista em');
    reg('> nivel alto. Isso e defeito de produto e merece tarefa propria — o T024 so mede.');
    reg('> Conversa com o §4 do handoff ("o A1 corrige mal, ponto") e o estende: talvez nao');
    reg('> seja so o A1, e talvez a variavel nao seja o nivel, e sim estar ou nao na lista.');
  } else {
    reg('> A correcao fora da lista se sustenta em nivel alto. O caso da jornada (N=1) era');
    reg('> variancia, como a leitura previa.');
  }

  fs.writeFileSync(TR, linhas.join('\n') + '\n');
  console.log('\ntranscricao: ' + TR);
  console.log('Limpeza: node db/cleanup_test_users.js --apply');
  // Este script MEDE; nao reprova o produto. Sai 1 so se nao conseguiu medir nada.
  process.exit(totalMed === 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
