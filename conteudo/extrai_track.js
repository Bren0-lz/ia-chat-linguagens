// Extrai o TRACK (6 niveis x 10 topicos) de dentro do jsCode do no `Professor Engine`
// e grava `conteudo/track.json`. Fonte da verdade continua sendo o FLUXO: este arquivo
// e apenas uma projecao dele, conferida por `conteudo/valida_track.js`.
//
// Uso:  node conteudo/extrai_track.js [caminho/do/fluxo.json]
//
// Como a extracao funciona (e por que nao e regex): as descricoes contem aspas, ';',
// '->', parenteses e travessoes, entao casar o literal com regex e frageil. Em vez disso
// executamos o jsCode num contexto controlado, como o `regressao_v7.4.js` faz
// (`new Function('$','$input','$json', code)` com refs falsas), tendo antes reescrito
// `const TRACK=` para tambem publicar o valor num slot de captura. O resto do engine pode
// falhar a vontade: o que interessa ja foi capturado, e o erro e engolido.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FLUXO_PADRAO = path.join(RAIZ, 'fluxos', 'IAChat_Telegram_v8.json');
const DESTINO = path.join(__dirname, 'track.json');
const NO = 'Professor Engine';
const SLOT = '__TRACK_CAPTURADO__';

// Slug estavel para nome de arquivo: sem acento, minusculo, so [a-z0-9-].
// "Cores e animais" -> "cores-e-animais"; "Números" -> "numeros".
function slugify(titulo) {
  return String(titulo)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function lerJsCode(caminhoFluxo) {
  const fluxo = JSON.parse(fs.readFileSync(caminhoFluxo, 'utf8'));
  const no = (fluxo.nodes || []).find(n => n.name === NO);
  if (!no || !no.parameters || !no.parameters.jsCode) {
    throw new Error('no "' + NO + '" nao encontrado (ou sem jsCode) em ' + caminhoFluxo);
  }
  return no.parameters.jsCode;
}

// Captura o valor de uma `const NOME=` declarada no jsCode do no, executando o codigo
// instrumentado num contexto controlado. Serve para o TRACK e para o LANG (T005), que
// precisam vir do FLUXO e nao de uma copia envelhecida.
function capturaConst(nome, caminhoFluxo) {
  const code = lerJsCode(caminhoFluxo || FLUXO_PADRAO);
  const marca = 'const ' + nome + '=';
  const ocorrencias = code.split(marca).length - 1;
  if (ocorrencias !== 1) {
    throw new Error('esperava exatamente 1 "' + marca + '" no ' + NO + ', achei ' + ocorrencias);
  }
  const slot = SLOT + '_' + nome;
  const instrumentado = code.replace(marca, 'const ' + nome + '=globalThis.' + slot + '=');

  // refs falsas, no mesmo espirito do regressao_v7.4.js
  const refs = { 'Roteador Mestre': { userId: 1, subroute: 'start', profile: { level: 'A1' }, text: '', callbackData: '' } };
  const $ = (n) => ({ first: () => ({ json: refs[n] || {} }), all: () => (refs[n] ? [{ json: refs[n] }] : []) });
  const $input = { item: { json: {} }, all: () => [] };

  delete globalThis[slot];
  try {
    new Function('$', '$input', '$json', instrumentado + '\n')($, $input, {});
  } catch (e) {
    // esperado: o resto do engine depende de banco/estado que nao temos aqui.
  }
  const valor = globalThis[slot];
  delete globalThis[slot];
  if (!valor || typeof valor !== 'object') {
    throw new Error('a execucao do ' + NO + ' nao chegou a atribuir o ' + nome);
  }
  return valor;
}

// Devolve o objeto TRACK cru, exatamente como esta no fluxo: { NIVEL: [[titulo, descricao], ...] }
function extraiTrackCru(caminhoFluxo) {
  return capturaConst('TRACK', caminhoFluxo);
}

// Forma consumivel: lista plana ordenada por nivel e ordem 1..10.
// T004 gera um .md por topico (nivel/ordem/slug); T007 semeia com chave nivel+ordem.
function normaliza(trackCru) {
  const niveis = Object.keys(trackCru);
  const topicos = [];
  for (const nivel of niveis) {
    const lista = trackCru[nivel];
    if (!Array.isArray(lista)) throw new Error('nivel ' + nivel + ' nao e lista');
    lista.forEach((par, i) => {
      topicos.push({
        nivel: nivel,
        ordem: i + 1,
        slug: slugify(par[0]),
        titulo: String(par[0]),
        descricao: String(par[1])
      });
    });
  }
  return {
    _fonte: 'fluxos/IAChat_Telegram_v8.json :: no "' + NO + '" :: const TRACK',
    _aviso: 'NAO editar a mao. Gerado por conteudo/extrai_track.js; conferido por conteudo/valida_track.js.',
    niveis: niveis,
    total: topicos.length,
    topicos: topicos
  };
}

function extrai(caminhoFluxo) {
  return normaliza(extraiTrackCru(caminhoFluxo));
}

module.exports = { extrai, extraiTrackCru, capturaConst, normaliza, slugify, FLUXO_PADRAO, DESTINO, NO };

if (require.main === module) {
  const caminho = process.argv[2] || FLUXO_PADRAO;
  const dados = extrai(caminho);
  fs.writeFileSync(DESTINO, JSON.stringify(dados, null, 2) + '\n', 'utf8');
  console.log('fluxo: ' + path.basename(caminho));
  console.log('niveis: ' + dados.niveis.join(', '));
  console.log('topicos: ' + dados.total);
  console.log('gravado: ' + path.relative(RAIZ, DESTINO));
}
