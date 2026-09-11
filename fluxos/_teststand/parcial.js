// DIARIO INCREMENTAL — o que ja foi medido sobrevive a morte do processo (T032).
//
// Por que existe: em 10/09 o sistema matou o processo das baterias TRES vezes por falta
// de memoria. A Fase B ficou em N=1 e a jornada nao rodou. O pior nao foi perder a rodada,
// foi o que acontecia ao retomar: os resultados viviam so em memoria (`resultados = []`)
// e a transcricao nascia de novo, entao o parcial sumia do agregado. Armadilha no 24
// ("nao executado" nao vira "passou") somada a no 22 (nome de transcricao que apaga
// evidencia).
//
// Como funciona: cada resultado e persistido ASSIM QUE FECHA, numa linha JSON do diario
// (append-only, uma linha por evento). A retomada LE esse diario e continua de onde parou,
// gravando na MESMA transcricao da rodada interrompida. A consolidacao continua no fim --
// o formato publicado da transcricao nao muda.
//
// O detalhe que a T031 obriga (e que inverteria o desenho se ignorado): o `TR` das baterias
// e resolvido UMA VEZ, no carregamento do modulo, e e ai que a data e decidida. Um processo
// NOVO veria a transcricao da rodada interrompida como "ocupada" e escolheria OUTRO caminho
// -- o oposto do que a retomada precisa. Por isso o diario e endereçado pelo caminho
// CANONICO (o que `transcricaoDe` devolve, sem data) e guarda dentro de si o caminho real
// da transcricao em curso.
//
// `fs` e `agora` sao INJETADOS (armadilha no 12): o modulo nao le relogio nem escolhe disco.

const path = require('path');
const { dataDe } = require('./alvo');

// ./tr_bateria_b_v8.md  ->  ./.parcial_tr_bateria_b_v8.jsonl
// Deriva do caminho CANONICO da transcricao (sem data): e o unico nome que um processo
// novo consegue recalcular igual ao do processo que morreu.
function caminhoParcialDe(transcricaoCanonica) {
  const dir = path.dirname(transcricaoCanonica);
  const base = path.basename(String(transcricaoCanonica)).replace(/\.md$/, '');
  const nome = '.parcial_' + base + '.jsonl';
  return dir === '.' || dir === '' ? './' + nome : path.join(dir, nome);
}

// Le o diario tolerando a ultima linha TRUNCADA: quem foi morto no meio de um append
// deixa lixo no fim, e perder as linhas boas por causa dele seria repetir o defeito.
function lerEventos(fs, caminho) {
  if (!fs.existsSync(caminho)) return [];
  let bruto = '';
  try { bruto = fs.readFileSync(caminho, 'utf8'); } catch (e) { return []; }
  const eventos = [];
  for (const linha of bruto.split('\n')) {
    const s = linha.trim();
    if (!s) continue;
    try { eventos.push(JSON.parse(s)); } catch (e) { /* linha truncada pela morte do processo */ }
  }
  return eventos;
}

// Parcial esquecido nao se apaga: renomeia-se. Se a pessoa retomar sem `--continuar`,
// o diario antigo vira `..._AAAA-MM-DD[-n].jsonl` em vez de virar zero.
function arquivar(fs, caminho, agora) {
  const semExt = caminho.replace(/\.jsonl$/, '');
  const dia = dataDe(agora);
  for (let n = 1; n <= 999; n++) {
    const c = semExt + '_' + dia + (n === 1 ? '' : '-' + n) + '.jsonl';
    if (!fs.existsSync(c)) { fs.renameSync(caminho, c); return c; }
  }
  throw new Error('arquivar: 999 parciais em ' + dia + ' para ' + caminho);
}

const CHAVE_PADRAO = (r) => String(r && r.id) + '#' + String((r && r.rodada) || '');

// Abre o diario da rodada.
//
//   caminho    onde o diario vive (use `caminhoParcialDe`)
//   fs         disco INJETADO
//   agora      relogio INJETADO (ms ou Date), so usado para nomear arquivo
//   continuar  true  -> le o parcial, devolve `anteriores` e a transcricao interrompida
//              false -> comeca do zero, ARQUIVANDO (nao apagando) um parcial esquecido
//   ativo      false -> so leitura; nada e escrito (para quem importa a bateria como modulo)
//   chave      identidade do resultado, para o reteste de um id substituir o anterior
//
// Devolve { anteriores, transcricaoAnterior, iniciar, registrar, concluir, caminho, arquivado }.
function abrirDiario(opcoes) {
  const o = opcoes || {};
  const fs = o.fs;
  if (!fs || typeof fs.appendFileSync !== 'function' || typeof fs.existsSync !== 'function') {
    throw new Error('abrirDiario: "fs" tem de ser injetado');
  }
  if (o.agora === undefined || o.agora === null) throw new Error('abrirDiario: "agora" tem de ser injetado');
  if (!o.caminho) throw new Error('abrirDiario: "caminho" e obrigatorio');
  const caminho = o.caminho;
  const ativo = o.ativo !== false;
  const continuar = !!o.continuar;
  const chave = typeof o.chave === 'function' ? o.chave : CHAVE_PADRAO;

  const eventos = lerEventos(fs, caminho);

  // Dedupe por chave, com o ultimo registro vencendo: retomar e remedir o mesmo id
  // nao pode gerar dois vereditos para ele no agregado.
  const anteriores = [];
  if (continuar) {
    const pos = new Map();
    for (const e of eventos) {
      if (!e || e.t !== 'reg' || !e.r) continue;
      const k = chave(e.r);
      if (pos.has(k)) anteriores[pos.get(k)] = e.r;
      else { pos.set(k, anteriores.length); anteriores.push(e.r); }
    }
  }

  let transcricaoAnterior = null;
  if (continuar) {
    for (const e of eventos) {
      if (e && e.t === 'inicio' && e.transcricao && fs.existsSync(e.transcricao)) {
        transcricaoAnterior = e.transcricao;
      }
    }
  }

  let arquivado = null;
  if (!continuar && eventos.length && ativo) arquivado = arquivar(fs, caminho, o.agora);

  function escreve(ev) {
    if (!ativo) return;
    fs.appendFileSync(caminho, JSON.stringify(ev) + '\n');
  }

  return {
    caminho,
    anteriores,
    transcricaoAnterior,
    arquivado,
    // Declara em que transcricao esta rodada esta gravando — e o que a proxima retomada le.
    iniciar(transcricao) { escreve({ t: 'inicio', transcricao: transcricao, em: new Date(o.agora).toISOString() }); },
    // Um resultado fechado. Chamado dentro do `reg()` das baterias, antes de qualquer
    // consolidacao: se o processo morrer no teste seguinte, este ja esta no disco.
    registrar(r) { escreve({ t: 'reg', r: r }); },
    // A rodada fechou e o agregado foi para a transcricao: o diario nao tem mais uso.
    // Enquanto ele EXISTE, existe rodada interrompida — e essa e a informacao.
    concluir() {
      if (!ativo) return;
      try { fs.unlinkSync(caminho); } catch (e) { /* ja nao existe */ }
    },
  };
}

module.exports = { abrirDiario, caminhoParcialDe, lerEventos };
