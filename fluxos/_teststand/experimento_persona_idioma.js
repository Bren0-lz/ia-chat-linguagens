// EXPERIMENTO: a persona esta quebrando o contrato de idioma?
//
// Na Fase B, 4 dos 5 casos de Conversa violaram o formato bilingue -- e os
// tres com persona forte abriram com palavras do LEXICO DA PERSONA, que e
// escrito em portugues:
//   buddy 'legal, massa, adorei'  -> C2  "Que legal! I like games too"
//   coach 'bora, foco, progresso' -> C10 "Bora, Bianca! 💪"
//   formal                        -> C14 resposta 100% em portugues
// O personaLine declara a personalidade "a coisa MAIS visivel da sua resposta"
// e exige gesto de assinatura em TODA resposta. Persona e idioma colidem, e a
// persona ganha por estar marcada como prioritaria.
//
// Este script mede o contrato de IDIOMA, que e objetivo -- nao mede tom.
//   A1: todo o ingles primeiro, depois UMA linha 🇧🇷; nada de portugues antes.
//   A2: ingles, com no maximo UMA expressao traduzida entre parenteses.
//
// USO: N8N_API_KEY=... node fluxos/_teststand/experimento_persona_idioma.js --rotulo=baseline [--n=3]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Client } = require('pg');
const { msg, digest } = require('./harness');

const arg = (n, d) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '=' + d).split('=')[1];
const ROTULO = arg('rotulo', 'sem-rotulo');
const N = Number(arg('n', 3));
const SAIDA = './tr_experimento_persona.md';

let uid = 990000000 + (Date.now() % 9000000);
const novoUid = () => (uid += 3);

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function semear(u, p) {
  const profile = { persona: p.persona, interests: p.interests || [], inferred_interests: [], level: p.level };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,3,1,1,now())"
    + ' ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,level=$4,profile=$5::jsonb,updated_at=now()',
    [u, p.name, p.age, p.level, JSON.stringify(profile)]
  ));
}
const soConversa = (d) => {
  const m = String(d.reply || '').match(/\[CONVERSA\]\s*([\s\S]*)/);
  return m ? m[1].trim() : String(d.reply || '');
};
// mesmo detector de portugues da Fase B
function temPortugues(t) {
  const s = ' ' + String(t || '').toLowerCase() + ' ';
  return [' que ', ' nao ', ' não ', ' você ', ' voce ', ' com ', ' para ', ' mais ', ' isso ', ' seu ',
    ' sua ', ' muito ', ' bem ', ' tambem ', ' também ', ' legal ', ' bora ', ' certamente ', ' oi ',
    ' adorei ', ' foco ', ' massa '].some((w) => s.includes(w));
}

// A1: o bloco antes da linha 🇧🇷 tem que ser so ingles, e a 🇧🇷 e a ultima linha
function okA1(t) {
  const partes = String(t).split('🇧🇷');
  if (partes.length !== 2) return { ok: false, por: partes.length < 2 ? 'sem linha 🇧🇷' : 'mais de uma linha 🇧🇷' };
  if (temPortugues(partes[0])) return { ok: false, por: 'portugues no bloco em ingles' };
  if (partes[1].split('\n').filter((l) => l.trim()).length > 1) return { ok: false, por: 'texto depois da linha 🇧🇷' };
  return { ok: true, por: '' };
}
// A2: ingles com no maximo UMA expressao entre parenteses; sem frase solta em pt
function okA2(t) {
  const semPar = String(t).replace(/\([^)]*\)/g, ' ');
  if (/🇧🇷/.test(t)) return { ok: false, por: 'usou o formato do A1 (linha 🇧🇷)' };
  if (temPortugues(semPar)) return { ok: false, por: 'portugues fora dos parenteses' };
  if ((String(t).match(/\([^)]*\)/g) || []).length > 1) return { ok: false, por: 'mais de uma traducao entre parenteses' };
  if (!/\b(the|you|do|is|are|what|how|like|and)\b/i.test(semPar)) return { ok: false, por: 'sem ingles' };
  return { ok: true, por: '' };
}

const CENARIOS = [
  { id: 'C2  A1/buddy  (aluno escreve em pt)', p: { name: 'Lucas', age: 16, level: 'A1', persona: 'buddy', interests: ['🎮 Games'] }, txt: 'eu gosto muito de jogar videogame com meus amigos', chk: okA1 },
  { id: 'C9  A1/buddy  (1o contato, 62 anos)', p: { name: 'Cleide', age: 62, level: 'A1', persona: 'buddy', interests: ['culinária'] }, txt: 'oi', chk: okA1 },
  { id: 'C10 A2/coach', p: { name: 'Bianca', age: 16, level: 'A2', persona: 'coach', interests: [] }, txt: 'hi, i am here', chk: okA2 },
  { id: 'C14 A2/formal', p: { name: 'Roberto', age: 45, level: 'A2', persona: 'formal', interests: ['trabalho'] }, txt: 'ok', chk: okA2 },
];

(async () => {
  const linhas = [];
  const reg = (s) => { console.log(s); linhas.push(s); };
  reg('\n## ' + ROTULO + ' — ' + new Date().toISOString() + ' (N=' + N + ')\n');

  let totOk = 0, tot = 0;
  for (const c of CENARIOS) {
    const res = [];
    for (let i = 0; i < N; i++) {
      const u = novoUid(); await semear(u, c.p);
      const t = soConversa(digest(await msg(u, c.txt)));
      if (!t.trim()) { res.push({ ok: false, por: 'RESPOSTA VAZIA', t: '' }); continue; }
      const v = c.chk(t); res.push({ ok: v.ok, por: v.por, t });
    }
    const n = res.filter((r) => r.ok).length;
    totOk += n; tot += res.length;
    const motivos = [...new Set(res.filter((r) => !r.ok).map((r) => r.por))].join('; ');
    reg('- **' + c.id + '**: ' + n + '/' + res.length + (motivos ? ' — ' + motivos : ''));
    res.forEach((r, i) => linhas.push('\n  <sub>' + (i + 1) + ' ' + (r.ok ? 'ok' : 'X') + '</sub>\n```\n' + (r.t || '(vazia)') + '\n```'));
  }
  reg('\n**TOTAL: ' + totOk + '/' + tot + ' respeitaram o contrato de idioma**');
  fs.appendFileSync(SAIDA, linhas.join('\n') + '\n');
  console.log('\nanexado em ' + SAIDA);
})();
