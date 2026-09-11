// TESTE — transcricao NUNCA sobrescreve evidencia (T031).
//
// Armadilha no 22 do handoff: nome de transcricao cravado apaga evidencia. O `alvo.js`
// resolveu metade -- ele separa por VERSAO (v7.4 x v8), nao por DATA. Duas rodadas no
// mesmo v8 ainda colidiam, e a jornada grava com writeFileSync (SOBRESCREVE). Em 10/09
// so nao perdemos o lado esquerdo da comparacao porque o processo morreu antes de gravar.
//
// O que este teste exige:
//   1. `caminhoLivre` decide com "existe?" e "agora" INJETADOS (armadilha no 12);
//   2. o segundo run da MESMA versao nao pisa no primeiro;
//   3. os nomes ja publicados continuam: v7.4 -> tr_bateria_a.md, v8 -> tr_bateria_a_v8.md;
//   4. os tres chamadores (fase A, fase B, jornada) passam pelo `caminhoLivre`;
//   5. o `alvo.js` continua PURO -- sem `fs`, sem relogio.
//
// Roda em diretorio TEMPORARIO: os `tr_*.md` da raiz sao evidencia nao regeneravel.
//
//   node fluxos/_teststand/testa_transcricao_sem_sobrescrita.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const { transcricaoDe, caminhoLivre } = require('./alvo');

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : ''));
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

console.log('\n== transcricao sem sobrescrita ==\n');

const T0 = Date.UTC(2026, 8, 11, 13, 45, 0); // 2026-09-11, em UTC
const T1 = Date.UTC(2026, 8, 12, 1, 0, 0);   // 2026-09-12

// ---- 1. logica pura, com o disco simulado -------------------------------------
{
  const disco = new Set();
  const existe = (p) => disco.has(p);

  const a = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-v8'), existe, T0);
  ok(a === './tr_bateria_a_v8.md', 'caminho livre -> nome publicado do v8', a);
  disco.add(a);

  const b = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-v8'), existe, T0);
  ok(b === './tr_bateria_a_v8_2026-09-11.md', '2a rodada do MESMO v8 ganha data', b);
  ok(b !== a, '2a rodada nao pisa na 1a', a + ' != ' + b);
  disco.add(b);

  const c = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-v8'), existe, T0);
  ok(c === './tr_bateria_a_v8_2026-09-11-2.md', '3a rodada no mesmo dia tem desempate', c);
  ok(c !== a && c !== b, '3a rodada nao pisa em nenhuma das duas', c);
  disco.add(c);

  const d = caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-v8'), existe, T1);
  ok(d === './tr_bateria_a_v8_2026-09-12.md', 'no dia seguinte a data muda', d);

  // o v7.4 ocupado nao arrasta o v8, e vice-versa
  const disco2 = new Set(['./tr_jornada.md']);
  const ev8 = caminhoLivre(transcricaoDe('tr_jornada', 'iachat-test-v8'), (p) => disco2.has(p), T0);
  ok(ev8 === './tr_jornada_v8.md', 'v7.4 ocupado nao empurra o v8 para nome datado', ev8);
  const ev74 = caminhoLivre(transcricaoDe('tr_jornada', 'iachat-test'), (p) => disco2.has(p), T0);
  ok(ev74 === './tr_jornada_2026-09-11.md', 'v7.4 ocupado ganha data e preserva 04/09', ev74);
}

// ---- 2. nomes historicos, com o caminho livre ---------------------------------
{
  const livre = () => false;
  ok(caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test'), livre, T0) === './tr_bateria_a.md',
     'v7.4 mantem tr_bateria_a.md');
  ok(caminhoLivre(transcricaoDe('tr_bateria_a', 'iachat-test-v8'), livre, T0) === './tr_bateria_a_v8.md',
     'v8 mantem tr_bateria_a_v8.md');
  ok(caminhoLivre(transcricaoDe('tr_bateria_b', 'iachat-test'), livre, T0) === './tr_bateria_b.md',
     'v7.4 mantem tr_bateria_b.md');
  ok(caminhoLivre(transcricaoDe('tr_jornada', 'iachat-test-v8'), livre, T0) === './tr_jornada_v8.md',
     'v8 mantem tr_jornada_v8.md');
}

// ---- 3. no disco de verdade, num diretorio TEMPORARIO -------------------------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iachat-tr-'));
  const cwd0 = process.cwd();
  try {
    process.chdir(tmp);
    const p1 = caminhoLivre(transcricaoDe('tr_jornada', 'iachat-test-v8'), fs.existsSync, T0);
    fs.writeFileSync(p1, 'RODADA 1');
    const p2 = caminhoLivre(transcricaoDe('tr_jornada', 'iachat-test-v8'), fs.existsSync, T0);
    fs.writeFileSync(p2, 'RODADA 2');
    ok(p1 !== p2, 'no disco real, a 2a rodada usa outro arquivo', p1 + ' != ' + p2);
    ok(fs.readFileSync(p1, 'utf8') === 'RODADA 1', 'a evidencia da 1a rodada sobreviveu');
    ok(fs.readFileSync(p2, 'utf8') === 'RODADA 2', 'a 2a rodada foi gravada');
    ok(fs.readdirSync('.').length === 2, 'dois arquivos no diretorio', fs.readdirSync('.').join(', '));
  } finally {
    process.chdir(cwd0);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- 4. os tres chamadores usam o caminho livre -------------------------------
{
  for (const arq of ['bateria_completa_a.js', 'bateria_completa_b.js', 'jornada_usuario.js']) {
    const src = fs.readFileSync(path.join(__dirname, arq), 'utf8');
    const cod = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    const m = cod.match(/const\s+TR\s*=\s*([^;]+);/);
    ok(!!m && /caminhoLivre\(/.test(m[1]) && /transcricaoDe\(/.test(m[1]) && /existsSync/.test(m[1]),
       arq + ': TR = caminhoLivre(transcricaoDe(...), existsSync, agora)',
       m ? m[1].trim().replace(/\s+/g, ' ') : 'TR nao encontrado');
  }
}

// ---- 5. a logica continua pura ------------------------------------------------
{
  const srcAlvo = fs.readFileSync(path.join(__dirname, 'alvo.js'), 'utf8');
  const cod = srcAlvo.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  ok(!/require\(['"]fs['"]\)/.test(cod), 'alvo.js nao importa fs');
  ok(!/Date\.now\(\)/.test(cod), 'alvo.js nao le o relogio');
  let lancou = false;
  try { caminhoLivre('./x.md', null, T0); } catch (e) { lancou = true; }
  ok(lancou, 'caminhoLivre exige o "existe" injetado');
}

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: nenhuma rodada sobrescreve a evidencia de outra\n');
process.exit(0);
