// E013 AO VIVO — o que um aluno de cada nivel recebe no primeiro turno de Conversa, no fluxo
// do evento publicado.
//
// Existe porque o defeito que originou a E013 foi achado pelo Breno no bot real ("escolhi A2 e a
// primeira pergunta veio 100% em ingles") e NENHUM teste nosso o pegaria: a Fase B mede o A1
// como bilingue e mede B2/C1 para correcao de erro, mas ninguem media o primeiro turno de A2/B1.
// Gate verde nao cobre a rota que voce mudou (CLAUDE.md).
//
// Julga pelo que a execucao gravou (armadilha nº 3), pela saida do `Agente Conversa`:
//   A1, A2 -> tem de haver uma linha 🇧🇷, e ela tem de ser a ULTIMA linha
//   B1     -> tem de haver uma linha 🇧🇷 (so da pergunta final), e ser a ULTIMA
//   B2, C1 -> sem linha 🇧🇷 (ingles integral por padrao)
// e, em todos, a resposta nao pode vir vazia (armadilha nº 1).
//
// Escreve so em alunos de teste (faixa 990000000-999999999; `db/cleanup_test_users.js` apaga).
// Uso:  node fluxos/_teststand/vivo_idioma_niveis_evento.js
process.env.IACHAT_TEST_PATH = 'iachat-test-evento';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Client } = require('pg');
const { msg, digest, nodeOut } = require('./harness');

const NIVEIS = [
  { nivel: 'A1', linhaBR: true },
  { nivel: 'A2', linhaBR: true },
  { nivel: 'B1', linhaBR: true },
  { nivel: 'B2', linhaBR: false },
  { nivel: 'C1', linhaBR: false },
];
const BASE_UID = 990000000 + (Date.now() % 8000000);

let fails = 0;
function ok(cond, texto) { if (!cond) { fails++; console.log('  ✗ ' + texto); } else console.log('  ✓ ' + texto); }

async function db(fn) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
}
async function semear(uid, nivel) {
  const profile = { persona: 'buddy', interests: ['🎮 Games'], inferred_interests: [], level: nivel };
  await db((c) => c.query(
    'INSERT INTO students (user_id,name,age,mode,onboarding,level,profile,msg_count,last_update_id,streak_count,last_active)'
    + " VALUES ($1,$2,$3,'chat','done',$4,$5::jsonb,3,1,1,$6)"
    + " ON CONFLICT (user_id) DO UPDATE SET name=$2,age=$3,mode='chat',level=$4,profile=$5::jsonb,updated_at=now()",
    [uid, 'Marina', 21, nivel, JSON.stringify(profile), new Date()]
  ));
}

(async () => {
  for (let i = 0; i < NIVEIS.length; i++) {
    const { nivel, linhaBR } = NIVEIS[i];
    const uid = BASE_UID + i;
    await semear(uid, nivel);
    // Uma frase neutra e simples, que qualquer nivel entende: nao carrega erro nem pedido de ajuda,
    // entao o que se mede e a politica padrao do nivel, sem nenhuma regra de excecao em jogo.
    const exec = await msg(uid, 'hi! i like games');
    console.log('\n===== ' + nivel + ' =====');
    if (!exec) { ok(false, nivel + ': a mensagem nao gerou execucao'); continue; }
    const d = digest(exec);
    const rd = exec.data && exec.data.resultData && exec.data.resultData.runData;
    const ag = nodeOut(rd, 'Agente Conversa');
    const texto = String((ag && ag.output) || '').trim();
    console.log('exec ' + d.id + '\n' + (texto || '(VAZIO)'));

    ok(texto.length > 0, nivel + ': o aluno recebeu resposta (vazio nao e aprovacao)');
    const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
    const temBR = linhas.some((l) => l.indexOf('🇧🇷') === 0);
    const ultimaBR = linhas.length > 0 && linhas[linhas.length - 1].indexOf('🇧🇷') === 0;
    if (linhaBR) {
      ok(temBR, nivel + ': tem a linha 🇧🇷 de apoio em portugues');
      ok(ultimaBR, nivel + ': a linha 🇧🇷 e a ULTIMA linha (REGRA DE OURO)');
    } else {
      ok(!temBR, nivel + ': sem linha 🇧🇷 — ingles integral por padrao');
    }
  }
  console.log('\n' + (fails ? 'REPROVOU: ' + fails + ' falha(s)' : 'PASSOU: cada nivel recebe o ingles na medida combinada'));
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
