// TESTE — a bateria sobrevive a morte por memoria (T032).
//
// Em 10/09 o sistema matou o processo das baterias TRES vezes por falta de memoria: a
// Fase B ficou em N=1 e a jornada (36 turnos) nao deixou nada. O que doia nao era perder
// a rodada, era retomar: `resultados` so existia em memoria e a transcricao nascia de
// novo, entao o que ja tinha sido medido sumia do agregado. Armadilha no 24 ("nao
// executado" nao vira "passou") somada a no 22 (nome de transcricao que apaga evidencia).
//
// O que este teste exige:
//   1. cada resultado vai ao disco ASSIM QUE FECHA;
//   2. a retomada LE o parcial e o PRESERVA -- os N anteriores estao na evidencia final;
//   3. a retomada grava na MESMA transcricao interrompida (e nao numa nova, que e o que
//      o `caminhoLivre` da T031 faria com o TR resolvido no topo do modulo);
//   4. morte no meio de um append (linha truncada) nao leva junto as linhas boas;
//   5. rodada nova SEM `--continuar` nao destroi um parcial esquecido: arquiva;
//   6. `parcial.js` nao le relogio nem escolhe disco -- fs e agora INJETADOS (armadilha 12);
//   7. os tres chamadores (fase A, fase B, jornada) estao ligados no diario.
//
// Roda em diretorio TEMPORARIO: os `tr_*.md` da raiz sao evidencia nao regeneravel.
//
//   node fluxos/_teststand/testa_parcial_retomada.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const { transcricaoDe, caminhoLivre } = require('./alvo');
const { abrirDiario, caminhoParcialDe, lerEventos } = require('./parcial');

let fails = 0;
function ok(cond, nome, detalhe) {
  if (cond) console.log('  . ' + nome + (detalhe ? '  — ' + detalhe : ''));
  else { console.log('  X ' + nome + (detalhe ? '  — ' + detalhe : '')); fails++; }
}

console.log('\n== parcial que sobrevive a morte do processo ==\n');

const T0 = Date.UTC(2026, 8, 11, 13, 45, 0);
const T1 = Date.UTC(2026, 8, 11, 19, 5, 0); // mesmo dia: a retomada costuma ser logo depois

// Reproduz, fora do n8n, o que as baterias fazem no carregamento do modulo e no `reg()`.
// Um `abreRodada` = um PROCESSO. Deixar de chamar o resto = o processo foi morto.
function abreRodada(base, ingress, { continuar, agora }) {
  const canonico = transcricaoDe(base, ingress);
  const diario = abrirDiario({
    caminho: caminhoParcialDe(canonico), fs, agora, continuar,
    chave: (r) => r.id + '#' + r.rodada,
  });
  const TR = diario.transcricaoAnterior || caminhoLivre(canonico, fs.existsSync, agora);
  if (!continuar) fs.writeFileSync(TR, '# Bateria completa — Fase B — v8\n\n');
  diario.iniciar(TR);
  const resultados = diario.anteriores.slice();
  const reg = (id, okv, rodada) => {
    const r = { id, ok: okv, rodada };
    diario.registrar(r);
    const j = resultados.findIndex((x) => x.id === id && x.rodada === rodada);
    if (j >= 0) resultados[j] = r; else resultados.push(r);
    fs.appendFileSync(TR, '- **' + id + '** (rodada ' + rodada + '): ' + (okv ? 'PASSOU' : 'FALHOU') + '\n');
  };
  return { diario, TR, resultados, reg };
}

function numTmp(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iachat-parcial-'));
  const cwd0 = process.cwd();
  try { process.chdir(tmp); return fn(tmp); }
  finally { process.chdir(cwd0); fs.rmSync(tmp, { recursive: true, force: true }); }
}

// ---- 1. interrupcao e retomada: os N anteriores estao na evidencia final ------
numTmp(() => {
  // PROCESSO 1 — mede 3 e morre (nao chama concluir())
  const p1 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: false, agora: T0 });
  p1.reg('C1', true, 1);
  p1.reg('C3', false, 1);
  p1.reg('C10', true, 1);
  ok(p1.TR === './tr_bateria_b_v8.md', 'processo 1 abre o nome publicado do v8', p1.TR);
  ok(fs.existsSync(caminhoParcialDe('./tr_bateria_b_v8.md')),
     'o parcial existe no disco ANTES do fim da rodada');
  ok(lerEventos(fs, caminhoParcialDe('./tr_bateria_b_v8.md')).filter((e) => e.t === 'reg').length === 3,
     'os 3 resultados foram persistidos assim que fecharam');

  // PROCESSO 2 — retomada
  const p2 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: true, agora: T1 });
  ok(p2.TR === p1.TR, 'a retomada grava na MESMA transcricao interrompida', p2.TR + ' == ' + p1.TR);
  ok(p2.resultados.length === 3, 'a retomada LE os 3 anteriores em vez de zerar', 'n=' + p2.resultados.length);
  ok(p2.resultados.map((r) => r.id).join(',') === 'C1,C3,C10', 'com os mesmos ids e na ordem',
     p2.resultados.map((r) => r.id).join(','));
  ok(p2.resultados.find((r) => r.id === 'C3').ok === false, 'o veredito preservado nao vira aprovacao');

  p2.reg('T12', true, 1);
  p2.reg('T13', true, 1);

  // consolidacao do fim
  const total = p2.resultados;
  fs.appendFileSync(p2.TR, '\n**Resumo:** ' + total.length + ' testes\n');
  p2.diario.concluir();

  const evidencia = fs.readFileSync(p2.TR, 'utf8');
  for (const id of ['C1', 'C3', 'C10', 'T12', 'T13']) {
    ok(evidencia.includes('**' + id + '**'), id + ' esta na evidencia final');
  }
  ok(/\*\*Resumo:\*\* 5 testes/.test(evidencia), 'o agregado conta os 5 (3 de antes + 2 de depois)',
     (evidencia.match(/\*\*Resumo:\*\*.*/) || [''])[0]);
  ok(evidencia.indexOf('# Bateria completa') === 0, 'o cabecalho da rodada 1 sobreviveu a retomada');
  ok(fs.readdirSync('.').filter((f) => f.endsWith('.md')).length === 1,
     'uma transcricao so — a retomada nao abriu arquivo novo', fs.readdirSync('.').join(', '));
  ok(!fs.existsSync(caminhoParcialDe('./tr_bateria_b_v8.md')),
     'rodada consolidada: o parcial some (enquanto existe, ha rodada interrompida)');
});

// ---- 2. o defeito que isto conserta, reproduzido ------------------------------
// Sem `--continuar` o comportamento antigo volta: transcricao nova e zero resultados
// herdados. E o contraste que prova que o mecanismo faz alguma coisa.
numTmp(() => {
  const p1 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: false, agora: T0 });
  p1.reg('C1', true, 1);
  const p2 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: false, agora: T0 });
  ok(p2.TR !== p1.TR, 'rodada NOVA (sem --continuar) nao pisa na anterior', p1.TR + ' != ' + p2.TR);
  ok(p2.resultados.length === 0, 'rodada nova comeca zerada, como deve');
  ok(fs.readFileSync(p1.TR, 'utf8').includes('**C1**'), 'e a evidencia da rodada morta continua la');
  // ...e o parcial esquecido foi ARQUIVADO, nao apagado
  ok(typeof p2.diario.arquivado === 'string', 'o parcial esquecido foi arquivado', String(p2.diario.arquivado));
  ok(fs.existsSync(p2.diario.arquivado) &&
     lerEventos(fs, p2.diario.arquivado).some((e) => e.t === 'reg' && e.r.id === 'C1'),
     'o parcial arquivado ainda tem o resultado medido');
});

// ---- 3. morte no meio do append: a linha truncada nao leva as boas ------------
numTmp(() => {
  const p1 = abreRodada('tr_bateria_a', 'iachat-test-v8', { continuar: false, agora: T0 });
  p1.reg('A1', true, 1);
  p1.reg('A2', true, 1);
  const cam = caminhoParcialDe('./tr_bateria_a_v8.md');
  fs.appendFileSync(cam, '{"t":"reg","r":{"id":"A3","o'); // morto no meio da escrita
  const p2 = abreRodada('tr_bateria_a', 'iachat-test-v8', { continuar: true, agora: T1 });
  ok(p2.resultados.length === 2, 'as 2 linhas integras sobrevivem a linha truncada',
     'n=' + p2.resultados.length);
  ok(p2.TR === p1.TR, 'e a retomada ainda acha a transcricao interrompida', p2.TR);
});

// ---- 4. reteste do mesmo id substitui, nao duplica ----------------------------
numTmp(() => {
  const p1 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: false, agora: T0 });
  p1.reg('C1', false, 1);
  p1.reg('C1', true, 1);   // remedido na mesma rodada
  p1.reg('C1', false, 2);  // outra RODADA: e outro dado, nao um reteste
  const p2 = abreRodada('tr_bateria_b', 'iachat-test-v8', { continuar: true, agora: T1 });
  ok(p2.resultados.length === 2, 'reteste do mesmo id/rodada nao duplica no agregado',
     'n=' + p2.resultados.length);
  ok(p2.resultados.filter((r) => r.rodada === 1)[0].ok === true, 'o ultimo veredito vence');
  ok(p2.resultados.filter((r) => r.rodada === 2).length === 1, 'a rodada 2 conta separado');
});

// ---- 5. a transcricao da jornada sai do processo linha a linha ----------------
numTmp(() => {
  const canonico = transcricaoDe('tr_jornada', 'iachat-test-v8');
  const d = abrirDiario({ caminho: caminhoParcialDe(canonico), fs, agora: T0, continuar: false });
  const TR = d.transcricaoAnterior || caminhoLivre(canonico, fs.existsSync, T0);
  fs.writeFileSync(TR, '');
  d.iniciar(TR);
  const log = (s) => fs.appendFileSync(TR, s + '\n');
  log('   EU > oi');
  log('   BOT| Hello!');
  // morte aqui, no turno 3
  ok(fs.readFileSync(TR, 'utf8').includes('BOT| Hello!'),
     'os turnos ja vistos estao no disco antes do fim da jornada');
  const d2 = abrirDiario({ caminho: caminhoParcialDe(canonico), fs, agora: T1, continuar: true });
  ok(d2.transcricaoAnterior === TR, 'a jornada retomada anexa a mesma transcricao', String(d2.transcricaoAnterior));
});

// ---- 6. nada de relogio nem disco proprio dentro da logica --------------------
{
  const src = fs.readFileSync(path.join(__dirname, 'parcial.js'), 'utf8');
  const cod = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  ok(!/Date\.now\(\)/.test(cod), 'parcial.js nao le o relogio');
  ok(!/Math\.random/.test(cod), 'parcial.js nao sorteia nada');
  ok(!/require\(['"]fs['"]\)/.test(cod), 'parcial.js nao importa fs — o disco entra injetado');
  let semFs = false, semAgora = false;
  try { abrirDiario({ caminho: './x.jsonl', agora: T0 }); } catch (e) { semFs = true; }
  try { abrirDiario({ caminho: './x.jsonl', fs }); } catch (e) { semAgora = true; }
  ok(semFs, 'abrirDiario exige o fs injetado');
  ok(semAgora, 'abrirDiario exige o agora injetado');
  ok(caminhoParcialDe('./tr_bateria_b_v8.md') === './.parcial_tr_bateria_b_v8.jsonl',
     'o parcial e endereçado pelo nome CANONICO, sem data', caminhoParcialDe('./tr_bateria_b_v8.md'));
}

// ---- 7. os tres chamadores estao ligados no diario ---------------------------
{
  const semComentario = (arq) => fs.readFileSync(path.join(__dirname, arq), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

  for (const arq of ['bateria_completa_a.js', 'bateria_completa_b.js', 'jornada_usuario.js']) {
    const cod = semComentario(arq);
    ok(/require\('\.\/parcial'\)/.test(cod), arq + ': importa o diario parcial');
    ok(/abrirDiario\(\{[\s\S]{0,400}?ativo:/.test(cod),
       arq + ': abre o diario declarando se pode escrever (modulo nao toca evidencia)');
    const m = cod.match(/const\s+TR\s*=\s*([^;]+);/);
    ok(!!m && /DIARIO\.transcricaoAnterior\s*\|\|/.test(m[1]),
       arq + ': na retomada o TR e a transcricao interrompida',
       m ? m[1].trim().replace(/\s+/g, ' ').slice(0, 90) : 'TR nao encontrado');
    ok(/--continuar/.test(cod), arq + ': aceita --continuar');
  }

  for (const arq of ['bateria_completa_a.js', 'bateria_completa_b.js']) {
    const cod = semComentario(arq);
    const reg = cod.slice(cod.indexOf('function reg('), cod.indexOf('function reg(') + 500);
    ok(/DIARIO\.registrar\(/.test(reg), arq + ': o reg() persiste o resultado na hora');
    ok(/const resultados = DIARIO\.anteriores\.slice\(\)/.test(cod),
       arq + ': resultados comeca com o que a rodada interrompida mediu');
    ok(/DIARIO\.concluir\(\)/.test(cod), arq + ': so fecha o parcial quando a rodada inteira termina');
  }

  const jor = semComentario('jornada_usuario.js');
  ok(/function log\(s\)[^\n]*appendFileSync\(TR/.test(jor),
     'jornada: cada linha vai ao disco quando e impressa');
  ok(!/writeFileSync\(TR,\s*linhas\.join/.test(jor),
     'jornada: nao existe mais o "grava tudo so no fim" (o que morria com o processo)');
}

console.log('');
if (fails) { console.log('REPROVOU: ' + fails + ' assercao(oes)\n'); process.exit(1); }
console.log('PASSOU: o que ja foi medido sobrevive a morte do processo\n');
process.exit(0);
